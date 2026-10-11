# -*- coding: utf-8 -*-
"""Deep accuracy checks on world_data.js against known public ballparks."""
from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JS = ROOT / "world_data.js"

# Expected UN M49 region
REGION = {
    "RW": "Africa", "KE": "Africa", "ZA": "Africa", "EG": "Africa", "NG": "Africa",
    "US": "Americas", "CA": "Americas", "BR": "Americas", "MX": "Americas",
    "CN": "Asia", "IN": "Asia", "JP": "Asia", "TR": "Asia", "CY": "Asia", "SA": "Asia",
    "DE": "Europe", "FR": "Europe", "GB": "Europe", "RU": "Europe",
    "AU": "Oceania", "NZ": "Oceania",
}

# Rough expected bands (USD) for sanity — not exact quotes
# GDP bn, unemp %, monthly gross wage USD (ILO-ish), COL vs USA ~0-2
EXPECT = {
    "US": {"gdp_min": 20000, "gdp_max": 35000, "unemp_max": 8, "gross_min": 3000, "col_min": 0.9},
    "DE": {"gdp_min": 3500, "gdp_max": 6000, "unemp_max": 8, "gross_min": 2500, "col_min": 0.7},
    "RW": {"gdp_min": 8, "gdp_max": 30, "unemp_min": 5, "gross_max": 250, "col_max": 0.35},
    "KE": {"gdp_min": 80, "gdp_max": 200, "gross_max": 500, "col_max": 0.45},
    "IN": {"gdp_min": 2500, "gdp_max": 5000, "gross_max": 600, "col_max": 0.4},
    "JP": {"gdp_min": 3500, "gdp_max": 5500, "gross_min": 2000, "col_min": 0.55},
    "CN": {"gdp_min": 12000, "gdp_max": 22000, "col_max": 0.7},
}


def parse_countries(text: str) -> dict:
    out = {}
    for m in re.finditer(r"\{code:\"([A-Z]{2})\",([^}]+)\}", text):
        code = m.group(1)
        body = m.group(2)
        def num(key):
            mm = re.search(rf"{key}:([^,]+)", body)
            if not mm:
                return None
            v = mm.group(1).strip()
            if v in ("null", "None"):
                return None
            if v.startswith('"'):
                return v.strip('"')
            try:
                return float(v)
            except ValueError:
                return v
        out[code] = {
            "name": re.search(r'name:"([^"]+)"', "name:" + body.split("name:")[-1] if "name:" in ("x," + body) else "").group(1)
            if re.search(r'name:"([^"]+)"', "{" + body)
            else None,
            "region": num("region") if False else re.search(r'region:"([^"]+)"', body).group(1),
            "col": num("col"),
            "gdp": num("gdp"),
            "growth": num("growth"),
            "jobs": num("jobs"),
            "unemp": num("unemp"),
            "grossAvg": num("grossAvg"),
            "netAvg": num("netAvg"),
            "taxPct": num("taxPct"),
            "salarySource": re.search(r'salarySource:"([^"]+)"', body).group(1)
            if re.search(r'salarySource:"([^"]+)"', body)
            else None,
        }
        nm = re.search(r'name:"([^"]+)"', body)
        out[code]["name"] = nm.group(1) if nm else code
    return out


def fetch_wb(indicator: str, codes: list[str]) -> dict:
    """iso2 -> latest value"""
    joined = ";".join(codes)
    url = (
        f"https://api.worldbank.org/v2/country/{joined}/indicator/{indicator}"
        f"?format=json&date=2018:2025&per_page=2000"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "ReloLedger-Verify/1.0"})
    with urllib.request.urlopen(req, timeout=90) as resp:
        payload = json.load(resp)
    best = {}
    for row in payload[1] or []:
        iso2 = (row.get("country") or {}).get("id")
        if not iso2 or row.get("value") is None:
            continue
        year = str(row.get("date") or "")
        prev = best.get(iso2)
        if prev is None or year > prev[1]:
            best[iso2] = (float(row["value"]), year)
    return best


def main():
    text = JS.read_text(encoding="utf-8")
    countries = parse_countries(text)
    print(f"Loaded {len(countries)} countries from world_data.js\n")

    issues = []

    # Structure
    if "None" in text:
        issues.append("CRITICAL: Python None still in world_data.js")
    for code, exp in REGION.items():
        c = countries.get(code)
        if not c:
            issues.append(f"MISSING country {code}")
            continue
        if c["region"] != exp:
            issues.append(f"REGION {code} {c['name']}: have {c['region']}, want {exp}")

    # Sanity bands
    for code, band in EXPECT.items():
        c = countries.get(code)
        if not c:
            continue
        if "gdp_min" in band and c["gdp"] is not None and c["gdp"] < band["gdp_min"]:
            issues.append(f"GDP low {code}: {c['gdp']} < {band['gdp_min']}")
        if "gdp_max" in band and c["gdp"] is not None and c["gdp"] > band["gdp_max"]:
            issues.append(f"GDP high {code}: {c['gdp']} > {band['gdp_max']}")
        if "unemp_max" in band and c["unemp"] is not None and c["unemp"] > band["unemp_max"]:
            issues.append(f"Unemp high {code}: {c['unemp']}")
        if "unemp_min" in band and c["unemp"] is not None and c["unemp"] < band["unemp_min"]:
            issues.append(f"Unemp suspiciously low {code}: {c['unemp']}")
        if "gross_min" in band and c["grossAvg"] is not None and c["grossAvg"] < band["gross_min"]:
            issues.append(f"Gross low {code}: {c['grossAvg']}")
        if "gross_max" in band and c["grossAvg"] is not None and c["grossAvg"] > band["gross_max"]:
            issues.append(f"Gross high {code}: {c['grossAvg']}")
        if "col_min" in band and c["col"] is not None and c["col"] < band["col_min"]:
            issues.append(f"COL low {code}: {c['col']}")
        if "col_max" in band and c["col"] is not None and c["col"] > band["col_max"]:
            issues.append(f"COL high {code}: {c['col']}")

    # Internal consistency: jobs ≈ 100 - unemp
    for code, c in countries.items():
        if c["jobs"] is not None and c["unemp"] is not None:
            expect = round(max(0, min(100, 100 - c["unemp"])))
            if abs(expect - c["jobs"]) > 1:
                issues.append(f"jobs≠100-unemp {code}: jobs={c['jobs']} unemp={c['unemp']} expect={expect}")
        if c["grossAvg"] is not None and c["netAvg"] is not None and c["taxPct"] is not None:
            if c["netAvg"] > c["grossAvg"] * 1.02:
                issues.append(f"net>gross {code}: {c['netAvg']} > {c['grossAvg']}")

    # Live WB cross-check for key countries
    codes = list(EXPECT.keys())
    print("Fetching World Bank live cross-check…")
    try:
        gdp = fetch_wb("NY.GDP.MKTP.CD", codes)
        unemp = fetch_wb("SL.UEM.TOTL.ZS", codes)
        for code in codes:
            c = countries[code]
            if code in gdp:
                wb_bn = gdp[code][0] / 1e9
                if c["gdp"] is not None and abs(c["gdp"] - wb_bn) / max(wb_bn, 1) > 0.15:
                    issues.append(
                        f"GDP drift {code}: file={c['gdp']} WB={wb_bn:.1f} ({gdp[code][1]})"
                    )
                else:
                    print(f"  GDP OK {code}: file={c['gdp']} WB={wb_bn:.1f} ({gdp[code][1]})")
            if code in unemp and c["unemp"] is not None:
                if abs(c["unemp"] - unemp[code][0]) > 1.5:
                    issues.append(
                        f"Unemp drift {code}: file={c['unemp']} WB={unemp[code][0]:.2f} ({unemp[code][1]})"
                    )
                else:
                    print(f"  Unemp OK {code}: file={c['unemp']} WB={unemp[code][0]:.2f}")
    except Exception as e:
        issues.append(f"WB fetch failed: {e}")

    # Print Rwanda deep dive
    rw = countries["RW"]
    print("\n=== Rwanda deep dive ===")
    for k, v in rw.items():
        print(f"  {k}: {v}")
    living = 2800 * max(rw["col"] or 0.35, 0.42) * 1.25
    print(f"  decent living budget USD: {living:.0f}")
    if rw["grossAvg"]:
        print(f"  gross/living: {rw['grossAvg']/living:.2f}x")
    if rw["netAvg"]:
        print(f"  net/living: {rw['netAvg']/living:.2f}x")

    print(f"\n=== Issues ({len(issues)}) ===")
    for i in issues[:60]:
        print(" -", i)
    if not issues:
        print(" No structural issues found in checks.")


if __name__ == "__main__":
    main()
