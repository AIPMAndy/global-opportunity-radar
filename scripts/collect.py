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
CACHE = ROOT / "data" / "last-success.json"
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
USER_AGENT = "GlobalOpportunityRadar/2.1 (open-source dashboard)"

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
    for key, indicator in INDICATORS.items():
        start = max(2000, NOW.year - (10 if key == "gdp" else 5))
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
    try:
        previous = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.is_file() else {}
        if not isinstance(previous, dict):
            previous = {}
    except (ValueError, OSError):
        previous = {}
    out = {
        "schema": 2,
        "collected_at": NOW.isoformat().replace("+00:00", "Z"),
        "countries": COUNTRIES,
        "indicators": INDICATORS,
        "metrics": {code: {} for code in COUNTRIES},
        "history": {code: [] for code in COUNTRIES},
        "cache": {"restored_sources": [], "previous_snapshot_at": previous.get("collected_at")},
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
                        if key == "gdp" and date.isdecimal():
                            out["history"][code].append({
                                "year": int(date), "value": value
                            })
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
    # Preserve the last successful observation only when a whole source fails.
    # A source that succeeds but reports a missing value stays missing.
    for name, (_, _, kind) in tasks.items():
        if out["sources"].get(name, {}).get("ok") or not previous:
            continue
        previous_sources = previous.get("sources") or {}
        if name not in previous_sources:
            continue
        if kind == "worldbank":
            key = name.removeprefix("worldbank_")
            for code in COUNTRIES:
                old = (previous.get("metrics") or {}).get(code, {}).get(key)
                if isinstance(old, dict) and old.get("value") is not None:
                    out["metrics"][code][key] = old
            if key == "gdp":
                for code in COUNTRIES:
                    prior_points = (previous.get("history") or {}).get(code, [])
                    if isinstance(prior_points, list):
                        out["history"][code] = prior_points[:]
        elif kind in ("github", "hackernews", "openalex"):
            old = previous.get(kind)
            if old is not None:
                out[kind] = old
        source = out["sources"][name]
        source["cached"] = True
        source["cached_from"] = previous_sources.get(name, {}).get("cached_from") or previous.get("collected_at")
        out["cache"]["restored_sources"].append(name)

    for code, points in out["history"].items():
        # Store each actual observation once; never interpolate missing years.
        unique = {point["year"]: point for point in points}
        out["history"][code] = [unique[year] for year in sorted(unique)]
    out["coverage"] = {
        key: sum(key in metrics for metrics in out["metrics"].values())
        for key in INDICATORS
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n",
                      encoding="utf-8")
    print("Snapshot:", OUTPUT)
    print("Providers:", {k: v["ok"] for k, v in out["sources"].items()})
    print("Economies with GDP:", sum("gdp" in x for x in out["metrics"].values()))

if __name__ == "__main__":
    main()
