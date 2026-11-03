#!/usr/bin/env python3
"""Refresh a source-labelled public-data snapshot. No fabricated numbers."""
import datetime as dt
import json
import os
import pathlib
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "data" / "snapshot.json"
COUNTRIES = "USA VNM CHN HKG SGP TWN JPN KOR IND IDN MYS THA PHL AUS NZL DEU GBR FRA NLD CHE ARE SAU BRA MEX CAN".split()
INDICATORS = {
    "gdp": "NY.GDP.MKTP.KD.ZG",
    "inflation": "FP.CPI.TOTL.ZG",
    "unemployment": "SL.UEM.TOTL.ZS",
    "fdi": "BX.KLT.DINV.WD.GD.ZS",
    "income": "NY.GDP.PCAP.CD",
}
AGENT = "GlobalOpportunityRadar/1.0 (open-source research project)"
TODAY = dt.datetime.now(dt.timezone.utc)

def get_json(url, token=None):
    headers = {"User-Agent": AGENT, "Accept": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    request = urllib.request.Request(url, headers=headers)
    last = None
    for attempt in range(2):
        try:
            with urllib.request.urlopen(request, timeout=22) as response:
                return json.load(response)
        except Exception as exc:
            last = exc
            if attempt == 0:
                time.sleep(1)
    raise RuntimeError(str(last))

def main():
    out = {
        "schema": 1,
        "collected_at": TODAY.isoformat().replace("+00:00", "Z"),
        "countries": COUNTRIES,
        "indicators": INDICATORS,
        "metrics": {country: {} for country in COUNTRIES},
        "sources": {},
        "github": None,
        "hackernews": None,
        "openalex": None,
    }
    countries = ";".join(COUNTRIES)
    for short, code in INDICATORS.items():
        url = ("https://api.worldbank.org/v2/country/" + countries +
               "/indicator/" + code + "?format=json&date=2021:" +
               str(TODAY.year) + "&per_page=1000")
        try:
            response = get_json(url)
            records = response[1] if isinstance(response, list) and len(response) > 1 else []
            if not isinstance(records, list):
                raise ValueError("Unexpected World Bank schema")
            for record in records:
                iso = record.get("countryiso3code")
                value = record.get("value")
                if iso not in out["metrics"] or value is None:
                    continue
                existing = out["metrics"][iso].get(short)
                year = record.get("date")
                if not existing or str(year) > str(existing["year"]):
                    out["metrics"][iso][short] = {"value": value, "year": year, "indicator": code}
            out["sources"]["worldbank_" + short] = {"ok": True, "url": url}
        except Exception as exc:
            out["sources"]["worldbank_" + short] = {"ok": False, "error": str(exc)[:180], "url": url}

    date = (TODAY - dt.timedelta(days=30)).date().isoformat()
    github_url = "https://api.github.com/search/repositories?" + urllib.parse.urlencode({
        "q": "topic:ai-agents created:>=" + date,
        "sort": "stars", "order": "desc", "per_page": 6
    })
    try:
        response = get_json(github_url, os.environ.get("GITHUB_TOKEN"))
        out["github"] = {
            "matched": response.get("total_count"),
            "window_start": date,
            "items": [
                {"name": item.get("full_name"), "url": item.get("html_url"),
                 "stars": item.get("stargazers_count"), "description": item.get("description")}
                for item in response.get("items", [])[:6]
            ],
        }
        out["sources"]["github"] = {"ok": True, "url": github_url}
    except Exception as exc:
        out["sources"]["github"] = {"ok": False, "error": str(exc)[:180], "url": github_url}

    hn_url = "https://hn.algolia.com/api/v1/search_by_date?tags=show_hn&query=AI&hitsPerPage=8"
    try:
        response = get_json(hn_url)
        out["hackernews"] = {
            "items": [
                {"title": item.get("title"),
                 "url": item.get("url") or ("https://news.ycombinator.com/item?id=" + str(item.get("objectID"))),
                 "date": item.get("created_at"), "points": item.get("points")}
                for item in response.get("hits", [])
            ]
        }
        out["sources"]["hackernews"] = {"ok": True, "url": hn_url}
    except Exception as exc:
        out["sources"]["hackernews"] = {"ok": False, "error": str(exc)[:180], "url": hn_url}

    # OpenAlex result is explicitly a keyword search, not a measure of AI breakthroughs.
    month_start = TODAY.replace(day=1).date() - dt.timedelta(days=1)
    first = month_start.replace(day=1).isoformat()
    last = month_start.isoformat()
    oa_url = "https://api.openalex.org/works?" + urllib.parse.urlencode({
        "search": "artificial intelligence",
        "filter": "from_publication_date:" + first + ",to_publication_date:" + last,
        "per-page": 1,
    })
    try:
        if os.environ.get("OPENALEX_API_KEY"):
            oa_url += "&api_key=" + urllib.parse.quote(os.environ["OPENALEX_API_KEY"])
        response = get_json(oa_url)
        out["openalex"] = {
            "search_term": "artificial intelligence",
            "period": first + "/" + last,
            "matched_works": response.get("meta", {}).get("count"),
            "definition": "OpenAlex indexed works matching keyword search; not all AI research",
        }
        out["sources"]["openalex"] = {"ok": True, "url": oa_url.split("&api_key=")[0]}
    except Exception as exc:
        out["sources"]["openalex"] = {"ok": False, "error": str(exc)[:180], "url": oa_url.split("&api_key=")[0]}

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Wrote", OUTPUT, "sources:", {k: v["ok"] for k, v in out["sources"].items()})

if __name__ == "__main__":
    main()
