import json
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

PIPELINE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PIPELINE_DIR))

from app import ReleaseStore, run_validator  # noqa: E402


VALID_MANIFEST = {
    "id": "EVT_WINTER_2026",
    "name": "Winter Rift 2026",
    "slug": "winter-rift-2026",
    "startsAt": "2026-12-03T18:00",
    "endsAt": "2027-01-08T04:00",
    "itemCount": 30,
    "missionCount": 5,
    "rewardCount": 30,
    "bundleCount": 3,
    "locales": ["pt-BR", "en-US", "es-MX"],
    "broken": False,
}


class PipelineTests(unittest.TestCase):
    def test_cpp_validator_accepts_valid_manifest(self):
        report = run_validator(VALID_MANIFEST)
        self.assertTrue(report["valid"])
        self.assertEqual(report["checkedRules"], 24)
        self.assertIn("c++20", report["engine"])

    def test_cpp_validator_blocks_invalid_manifest(self):
        manifest = {**VALID_MANIFEST, "slug": "", "broken": True, "locales": ["en-US"]}
        report = run_validator(manifest)
        self.assertFalse(report["valid"])
        self.assertGreaterEqual(len(report["errors"]), 2)
        self.assertEqual(len(report["warnings"]), 2)

    def test_sqlite_store_persists_release(self):
        with tempfile.TemporaryDirectory() as directory:
            store = ReleaseStore(Path(directory) / "test.db")
            release = {
                "id": "rel_test", "version": "v1.1.0", "event_id": "EVT_TEST",
                "event_name": "Test", "state": "Staging", "commit_hash": "abcdef0",
                "artifact_count": 1, "created_at": "2026-01-01T00:00:00Z",
                "rolled_back_from": None,
            }
            store.save(release, VALID_MANIFEST)
            self.assertEqual(store.list()[0]["id"], "rel_test")


if __name__ == "__main__":
    unittest.main()
