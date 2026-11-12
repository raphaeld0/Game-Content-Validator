#!/usr/bin/env python3
"""Build missing local artifacts and start the integrated Python server."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXECUTABLE = ROOT / "validator-engine" / "bin" / (
    "game-content-validator.exe" if os.name == "nt" else "game-content-validator"
)


def run(command: list[str]) -> None:
    subprocess.run(command, cwd=ROOT, check=True)


if not EXECUTABLE.exists():
    run([sys.executable, "scripts/setup_local.py"])
if not (ROOT / "dist" / "client" / "index.html").exists():
    run(["npm.cmd" if os.name == "nt" else "npm", "run", "build:client"])

os.execv(sys.executable, [sys.executable, str(ROOT / "release-pipeline" / "app.py"), *sys.argv[1:]])
