#!/usr/bin/env python3
"""Local Python release pipeline and HTTP API."""

from __future__ import annotations

import argparse
from contextlib import closing
import hashlib
import json
import mimetypes
import os
import secrets
import sqlite3
import subprocess
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist" / "client"
DATA_DIR = ROOT / "release-pipeline" / "data"
DATABASE = DATA_DIR / "pipeline.db"
EXECUTABLE = ROOT / "validator-engine" / "bin" / (
    "game-content-validator.exe" if os.name == "nt" else "game-content-validator"
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def make_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(8)}"


def run_validator(manifest: dict) -> dict:
    if not EXECUTABLE.exists():
        raise RuntimeError("C++ validator is not compiled. Run: npm run local:setup")
    process = subprocess.run(
        [str(EXECUTABLE)],
        input=json.dumps(manifest),
        text=True,
        encoding="utf-8",
        capture_output=True,
        timeout=10,
        check=False,
    )
    if process.returncode != 0:
        raise RuntimeError(process.stderr.strip() or "The C++ validator failed.")
    report = json.loads(process.stdout)
    report["requestId"] = make_id("val")
    return report


class ReleaseStore:
    def __init__(self, database: Path = DATABASE) -> None:
        database.parent.mkdir(parents=True, exist_ok=True)
        self.database = database
        self.initialize()

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database)
        connection.row_factory = sqlite3.Row
        return connection

    def initialize(self) -> None:
        with closing(self.connect()) as connection, connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS releases (
                    id TEXT PRIMARY KEY,
                    version TEXT NOT NULL,
                    event_id TEXT NOT NULL,
                    event_name TEXT NOT NULL,
                    state TEXT NOT NULL,
                    commit_hash TEXT NOT NULL,
                    artifact_count INTEGER NOT NULL,
                    manifest_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    rolled_back_from TEXT
                )
                """
            )

    def list(self) -> list[dict]:
        with closing(self.connect()) as connection, connection:
            rows = connection.execute(
                "SELECT * FROM releases ORDER BY created_at DESC LIMIT 50"
            ).fetchall()
        return [dict(row) for row in rows]

    def get(self, release_id: str) -> dict | None:
        with closing(self.connect()) as connection, connection:
            row = connection.execute(
                "SELECT * FROM releases WHERE id = ?", (release_id,)
            ).fetchone()
        return dict(row) if row else None

    def save(self, release: dict, manifest: dict) -> None:
        with closing(self.connect()) as connection, connection:
            connection.execute(
                """
                INSERT INTO releases (
                    id, version, event_id, event_name, state, commit_hash,
                    artifact_count, manifest_json, created_at, rolled_back_from
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    release["id"], release["version"], release["event_id"],
                    release["event_name"], release["state"], release["commit_hash"],
                    release["artifact_count"], json.dumps(manifest),
                    release["created_at"], release.get("rolled_back_from"),
                ),
            )


class PipelineHandler(BaseHTTPRequestHandler):
    server_version = "GameContentPipeline/1.0"

    @property
    def store(self) -> ReleaseStore:
        return self.server.store  # type: ignore[attr-defined]

    def log_message(self, format_string: str, *args: object) -> None:
        print(f"[api] {self.address_string()} - {format_string % args}")

    def send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > 1_000_000:
            raise ValueError("A JSON manifest is required.")
        payload = json.loads(self.rfile.read(length).decode("utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("The request body must be a JSON object.")
        return payload

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path == "/api/health":
            self.send_json({
                "status": "ok",
                "service": "python-release-pipeline",
                "version": "1.0.0",
                "validator": "c++20",
                "storage": "sqlite",
            })
            return
        if path == "/api/releases":
            self.send_json({"releases": self.store.list()})
            return
        if path.startswith("/api/"):
            self.send_json({"error": "API route not found."}, 404)
            return
        self.serve_static(path)

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        try:
            if path == "/api/validate":
                self.send_json(run_validator(self.read_json()))
                return
            if path == "/api/releases":
                manifest = self.read_json()
                validation = run_validator(manifest)
                if not validation["valid"]:
                    self.send_json({"error": "Validation failed.", "validation": validation}, 422)
                    return
                releases = self.store.list()
                version_number = sum(1 for item in releases if item["state"] != "Rollback") + 1
                digest = hashlib.sha1(json.dumps(manifest, sort_keys=True).encode()).hexdigest()[:7]
                release = {
                    "id": make_id("rel"),
                    "version": f"v1.{version_number}.0",
                    "event_id": str(manifest.get("id", "UNKNOWN")),
                    "event_name": str(manifest.get("name", "Unnamed event")),
                    "state": "Staging",
                    "commit_hash": digest,
                    "artifact_count": sum(int(manifest.get(key, 0)) for key in (
                        "itemCount", "missionCount", "rewardCount", "bundleCount"
                    )),
                    "created_at": utc_now(),
                    "rolled_back_from": None,
                }
                self.store.save(release, manifest)
                self.send_json({"release": release, "validation": validation}, 201)
                return

            prefix, suffix = "/api/releases/", "/rollback"
            if path.startswith(prefix) and path.endswith(suffix):
                release_id = path[len(prefix):-len(suffix)]
                source = self.store.get(release_id)
                if not source:
                    self.send_json({"error": "Release not found."}, 404)
                    return
                release = {
                    "id": make_id("rel"),
                    "version": f"{source['version']}-rollback",
                    "event_id": source["event_id"],
                    "event_name": source["event_name"],
                    "state": "Rollback",
                    "commit_hash": secrets.token_hex(4)[:7],
                    "artifact_count": source["artifact_count"],
                    "created_at": utc_now(),
                    "rolled_back_from": source["id"],
                }
                manifest = json.loads(source["manifest_json"])
                self.store.save(release, manifest)
                self.send_json({"release": release}, 201)
                return
            self.send_json({"error": "API route not found."}, 404)
        except (ValueError, json.JSONDecodeError) as error:
            self.send_json({"error": str(error)}, 400)
        except RuntimeError as error:
            self.send_json({"error": str(error)}, 503)
        except Exception as error:  # pragma: no cover - last-resort HTTP boundary
            self.send_json({"error": "Internal server error.", "detail": str(error)}, 500)

    def serve_static(self, requested_path: str) -> None:
        relative = unquote(requested_path).lstrip("/") or "index.html"
        candidate = (DIST / relative).resolve()
        try:
            candidate.relative_to(DIST.resolve())
        except ValueError:
            self.send_error(403)
            return
        if not candidate.is_file():
            candidate = DIST / "index.html"
        if not candidate.is_file():
            self.send_json({"error": "Frontend is not built. Run: npm run local:setup"}, 503)
            return
        body = candidate.read_bytes()
        content_type = mimetypes.guess_type(candidate.name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8" if content_type.startswith("text/") else content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache" if candidate.name == "index.html" else "public, max-age=31536000")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)


def serve(host: str, port: int, database: Path = DATABASE) -> None:
    server = ThreadingHTTPServer((host, port), PipelineHandler)
    server.store = ReleaseStore(database)  # type: ignore[attr-defined]
    print("\nGame Content Pipeline is running locally")
    print(f"  App:       http://{host}:{port}")
    print(f"  API:       http://{host}:{port}/api/health")
    print(f"  Validator: {EXECUTABLE}")
    print(f"  Database:  {database}\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping local pipeline...")
    finally:
        server.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the local Game Content Pipeline")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--database", type=Path, default=DATABASE)
    arguments = parser.parse_args()
    serve(arguments.host, arguments.port, arguments.database)
