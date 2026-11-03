"""Offline smoke tests: no external data source is contacted."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SOURCE = Path(__file__).resolve().parents[1] / "scripts" / "collect.py"
SPEC = importlib.util.spec_from_file_location("radar_collect", SOURCE)
collect = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(collect)


class CollectionTests(unittest.TestCase):
    def test_gdp_history_requests_ten_years(self):
        urls = collect.build_tasks()
        year = collect.NOW.year
        self.assertIn("date=" + str(year - 10) + ":" + str(year), urls["worldbank_gdp"][0])
        self.assertIn("date=" + str(year - 5) + ":" + str(year), urls["worldbank_income"][0])

    def test_source_attributed_history_and_missing_values(self):
        current = str(collect.NOW.year - 1)
        previous = str(collect.NOW.year - 2)

        def fake_json(url, token=None):
            if "NY.GDP.MKTP.KD.ZG" in url:
                return [{}, [
                    {"countryiso3code": "USA", "date": previous, "value": 1.2},
                    {"countryiso3code": "USA", "date": current, "value": 2.1},
                    {"countryiso3code": "USA", "date": str(collect.NOW.year), "value": None},
                    {"countryiso3code": "VNM", "date": current, "value": -0.4},
                ]]
            if "api.worldbank.org" in url:
                return [{}, []]
            if "api.github.com" in url:
                return {"total_count": 7, "items": []}
            if "hn.algolia.com" in url:
                return {"hits": []}
            return {"meta": {"count": 9}}

        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "snapshot.json"
            with patch.object(collect, "get_json", side_effect=fake_json), patch.object(collect, "OUTPUT", output):
                collect.main()
            data = json.loads(output.read_text(encoding="utf-8"))
        self.assertEqual(data["schema"], 2)
        self.assertEqual(data["coverage"]["gdp"], 2)
        self.assertEqual(data["metrics"]["USA"]["gdp"]["year"], current)
        self.assertEqual(len(data["history"]["USA"]), 2)
        self.assertEqual(data["history"]["VNM"][0]["value"], -0.4)
        self.assertEqual(data["metrics"]["CAN"], {})
        self.assertIn("worldbank_gdp", data["sources"])
        self.assertNotIn("api_key=", data["sources"]["openalex"]["url"])

    def test_all_providers_failed_still_produces_transparent_snapshot(self):
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "snapshot.json"
            with patch.object(collect, "get_json", side_effect=RuntimeError("unavailable")), patch.object(collect, "OUTPUT", output):
                collect.main()
            data = json.loads(output.read_text(encoding="utf-8"))
        self.assertEqual(data["coverage"]["gdp"], 0)
        self.assertEqual(data["history"]["USA"], [])
        self.assertEqual(len(data["sources"]), 8)
        self.assertTrue(all(not x["ok"] for x in data["sources"].values()))


if __name__ == "__main__":
    unittest.main()
