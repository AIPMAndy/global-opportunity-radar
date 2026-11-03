#!/usr/bin/env python3
"""Global Opportunity Radar: refresh source-attributed public signals.

All economic figures retain their official statistical year. API errors are
reported as missing data; the site deploys even if every provider is offline.
Only Python standard-library modules are required.
"""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen
import json
import os

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "data" / "snapshot.json"
COUNTRIES = "USA VNM CHN HKG SGP TWN JPN KOR IND IDN MYS THA PHL AUS NZL DEU GBR FRA NLD CHE ARE SAU BRA MEX CAN".split()
INDICATORS = {
    "gdp": "NY.GDP.MKTP.KD.ZG",
    "inflation": "FP.CPI.TOTL.ZG",
    "unemployment": "SL.UEM.TOTL.ZS",
    "fdi": "BX.KLT.DINV.WD.GD.ZS",
    "income": "NY.GDP.PCAP.CD",
}
NOW = datetime.now(timezone.utc)
TIMEOUT = float(os.environ.get("RADAR_HTTP_TIMEOUT", "12"))
USER_AGENT = "GlobalOpportunityRadar/2.0 (open-source dashboard)"

def get_json(url: str, token: str | None = None) -> object:
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    request = Request(url, headers=headers)
    with urlopen(request, timeout=TIMEOUT) as response:
        return json.load(response)

def build_tasks() -> dict[str, tuple[str, str | None, str]]:
    tasks = {}
    country_codes = ";".join(COUNTRIES)
    start = max(2021, NOW.year - 5)
    for key, indicator in INDICATORS.items():
        url = ("https://api.worldbank.org/v2/country/" + country_codes +
               "/indicator/" + indicator + "?format=json&date=" +
               str(start) + ":" + str(NOW.year) + "&per_page=1000")
        tasks["worldbank_" + key] = (url, None, "worldbank")
    since = (NOW - timedelta(days=30)).date().isoformat()
    github = "https://api.github.com/search/repositories?" + urlencode({
        "q": "topic:ai-agents created:>=" + since,
        "sort": "stars", "order": "desc", "per_page": 8,
    })
    tasks["github"] = (github, os.environ.get("GITHUB_TOKEN"), "github")
    tasks["hackernews"] = ("https://hn.algolia.com/api/v1/search_by_date?"
                           "tags=show_hn&query=AI&hitsPerPage=8", None, "hackernews")
    previous_month_end = NOW.date().replace(day=1) - timedelta(days=1)
    first = previous_month_end.replace(day=1).isoformat()
    last = previous_month_end.isoformat()
    oa_url = "https://api.openalex.org/works?" + urlencode({
        "search": "artificial intelligence",
        "filter": "from_publication_date:" + first + ",to_publication_date:" + last,
        "per-page": 1,
    })
    key = os.environ.get("OPENALEX_API_KEY")
    if key:
        oa_url += "&api_key=" + quote(key)
    tasks["openalex"] = (oa_url, None, "openalex")
    return tasks

def main() -> None:
    out = {
        "schema": 2,
        "collected_at": NOW.isoformat().replace("+00:00", "Z"),
        "countries": COUNTRIES,
        "indicators": INDICATORS,
        "metrics": {code: {} for code in COUNTRIES},
        "sources": {},
        "github": None,
        "hackernews": None,
        "openalex": None,
    }
    tasks = build_tasks()
    # Independent requests: one stalled provider must not block other sources.
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {
            pool.submit(get_json, url, token): name
            for name, (url, token, kind) in tasks.items()
        }
        for future in as_completed(futures):
            name = futures[future]
            url, _, kind = tasks[name]
            # Never publish an API key in the snapshot.
            public_url = url.split("&api_key=")[0]
            try:
                data = future.result()
                if kind == "worldbank":
                    rows = data[1] if isinstance(data, list) and len(data) > 1 else None
                    if not isinstance(rows, list):
                        raise ValueError("World Bank returned an unexpected schema")
                    key = name.removeprefix("worldbank_")
                    for row in rows:
                        code, value = row.get("countryiso3code"), row.get("value")
                        if code not in out["metrics"] or value is None:
                            continue
                        date = str(row.get("date", ""))
                        previous = out["metrics"][code].get(key)
                        if not previous or date > str(previous["year"]):
                            out["metrics"][code][key] = {
                                "value": value, "year": date,
                                "indicator": INDICATORS[key]
                            }
                elif kind == "github":
                    if not isinstance(data, dict):
                        raise ValueError("Invalid GitHub response")
                    out["github"] = {
                        "matched": data.get("total_count"),
                        "window_start": (NOW-timedelta(days=30)).date().isoformat(),
                        "items": [{
                            "name": x.get("full_name"), "url": x.get("html_url"),
                            "stars": x.get("stargazers_count"),
                            "description": x.get("description")
                        } for x in data.get("items", [])[:8]]
                    }
                elif kind == "hackernews":
                    if not isinstance(data, dict):
                        raise ValueError("Invalid Hacker News response")
                    out["hackernews"] = {"items": [{
                        "title": x.get("title"),
                        "url": x.get("url") or
                            "https://news.ycombinator.com/item?id=" + str(x.get("objectID")),
                        "date": x.get("created_at"), "points": x.get("points"),
                    } for x in data.get("hits", [])[:8]]}
                elif kind == "openalex":
                    if not isinstance(data, dict):
                        raise ValueError("Invalid OpenAlex response")
                    previous_end = NOW.date().replace(day=1) - timedelta(days=1)
                    first = previous_end.replace(day=1).isoformat()
                    out["openalex"] = {
                        "search_term": "artificial intelligence",
                        "period": first + "/" + previous_end.isoformat(),
                        "matched_works": data.get("meta", {}).get("count"),
                        "definition": "Keyword search of indexed works, not all AI research."
                    }
                out["sources"][name] = {"ok": True, "url": public_url}
            except Exception as exc:
                out["sources"][name] = {
                    "ok": False, "url": public_url, "error": str(exc)[:160]
                }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n",
                      encoding="utf-8")
    print("Snapshot:", OUTPUT)
    print("Providers:", {k: v["ok"] for k, v in out["sources"].items()})
    print("Economies with GDP:", sum("gdp" in x for x in out["metrics"].values()))

if __name__ == "__main__":
    main()
