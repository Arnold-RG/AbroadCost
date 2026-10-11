# -*- coding: utf-8 -*-
"""Expanded accuracy audit: coverage, COL vs WB price level, GDP/growth/unemp drift."""
from __future__ import annotations

import json
import re
import urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JS = ROOT / "world_data.js"

SAMPLE = [
    "RW", "KE", "NG", "ZA", "EG", "GH", "ET", "TZ", "UG",
    "US", "IN", "BR", "MX", "TR", "FR", "AU", "PL", "VN", "PH", "ID",
    "DE", "JP", "CN", "GB", "CA",
]


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
            try:
                return float(v)
            except ValueError:
                return v

        name_m = re.search(r'name:"([^"]+)"', body)
        region_m = re.search(r'region:"([^"]+)"', body)
        sy = re.search(r'salaryYear:"([^"]+)"', body)
        ss = re.search(r'salarySource:"([^"]+)"', body)
        out[code] = {
            "name": name_m.group(1) if name_m else code,
            "region": region_m.group(1) if region_m else None,
            "col": num("col"),
            "gdp": num("gdp"),
            "growth": num("growth"),
            "jobs": num("jobs"),
            "unemp": num("unemp"),
            "grossAvg": num("grossAvg"),
            "netAvg": num("netAvg"),
            "taxPct": num("taxPct"),
            "salaryYear": sy.group(1) if sy else None,
            "salarySource": ss.group(1) if ss else None,
        }
    return out


def fetch_wb(indicator: str, codes: list[str]) -> dict:
    best = {}
    for i in range(0, len(codes), 12):
        chunk = codes[i : i + 12]
        joined = ";".join(chunk)
        url = (
            f"https://api.worldbank.org/v2/country/{joined}/indicator/{indicator}"
            f"?format=json&date=2018:2025&per_page=2000"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "AbroadCost-Verify/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                payload = json.load(resp)
        except Exception as e:
            print(f"  WB fetch fail {indicator} chunk {chunk[:3]}…: {e}")
            continue
        if not isinstance(payload, list) or len(payload) < 2 or not payload[1]:
            continue
        for row in payload[1]:
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
    issues = []

    print(f"Loaded {len(countries)} countries")
    print("Regions:", dict(Counter(c["region"] for c in countries.values())))

    if "None" in text:
        issues.append("CRITICAL: Python None still in world_data.js")

    missing_gdp = [c for c, v in countries.items() if v["gdp"] is None]
    missing_gross = [c for c, v in countries.items() if v["grossAvg"] is None]
    if missing_gdp:
        issues.append(f"missing GDP: {len(missing_gdp)} e.g. {missing_gdp[:10]}")
    if missing_gross:
        issues.append(f"missing gross: {len(missing_gross)} e.g. {missing_gross[:10]}")

    for code, c in countries.items():
        if c["jobs"] is not None and c["unemp"] is not None:
            expect = round(max(0, min(100, 100 - c["unemp"])))
            if abs(expect - c["jobs"]) > 1:
                issues.append(f"jobs≠100-unemp {code}: jobs={c['jobs']} unemp={c['unemp']}")
        if c["grossAvg"] and c["netAvg"] and c["netAvg"] > c["grossAvg"] * 1.02:
            issues.append(f"net>gross {code}")

    stale = [
        (c, v["salaryYear"], v["name"], v["grossAvg"])
        for c, v in countries.items()
        if v["salaryYear"] and v["salaryYear"] < "2020"
    ]
    print(f"\nStale salary years <2020: {len(stale)}")
    for row in sorted(stale)[:20]:
        print(" ", row)

    africa_col = sorted(
        (v["col"], c, v["name"])
        for c, v in countries.items()
        if v["region"] == "Africa" and v["col"] is not None
    )
    print("\nAfrica COL lowest:", africa_col[:8])
    print("Africa COL highest:", africa_col[-5:])

    codes = [c for c in SAMPLE if c in countries]
    print("\nFetching World Bank for", len(codes), "countries…")
    plr = fetch_wb("PA.NUS.PPPC.RF", codes)
    gdp = fetch_wb("NY.GDP.MKTP.CD", codes)
    growth = fetch_wb("NY.GDP.MKTP.KD.ZG", codes)
    unemp = fetch_wb("SL.UEM.TOTL.ZS", codes)

    print("\n=== COL vs WB price level ratio ===")
    for code in codes:
        c = countries[code]
        if code not in plr or c["col"] is None:
            continue
        wb, y = plr[code]
        ratio = c["col"] / wb if wb else None
        flag = "!!" if ratio and (ratio < 0.55 or ratio > 1.45) else "ok"
        print(f"  {flag} {code}: col={c['col']} WB_PLR={wb:.3f} ({y}) file/WB={ratio:.2f}")
        if ratio and (ratio < 0.55 or ratio > 1.45):
            issues.append(
                f"COL drift {code}: file={c['col']} WB_PLR={wb:.3f} ({y}) ratio={ratio:.2f}"
            )

    print("\n=== GDP / growth / unemp ===")
    for code in codes:
        c = countries[code]
        if code in gdp and c["gdp"] is not None:
            wb = gdp[code][0] / 1e9
            drift = abs(c["gdp"] - wb) / max(wb, 1)
            flag = "!!" if drift > 0.12 else "ok"
            print(f"  {flag} GDP {code}: file={c['gdp']} WB={wb:.1f} ({gdp[code][1]})")
            if drift > 0.12:
                issues.append(f"GDP drift {code}: file={c['gdp']} WB={wb:.1f}")
        if code in growth and c["growth"] is not None:
            wb = growth[code][0]
            drift = abs(c["growth"] - wb)
            flag = "!!" if drift > 2.0 else "ok"
            print(f"  {flag} GRW {code}: file={c['growth']} WB={wb:.2f} ({growth[code][1]})")
            if drift > 2.0:
                issues.append(f"Growth drift {code}: file={c['growth']} WB={wb:.2f}")
        if code in unemp and c["unemp"] is not None:
            wb = unemp[code][0]
            drift = abs(c["unemp"] - wb)
            flag = "!!" if drift > 1.5 else "ok"
            print(f"  {flag} UNE {code}: file={c['unemp']} WB={wb:.2f} ({unemp[code][1]})")
            if drift > 1.5:
                issues.append(f"Unemp drift {code}: file={c['unemp']} WB={wb:.2f}")

    # Suggested COL corrections from WB PLR (clip to sensible band)
    print("\n=== Suggested COL fixes (file far from WB PLR) ===")
    for code in codes:
        c = countries[code]
        if code not in plr or c["col"] is None:
            continue
        wb = plr[code][0]
        ratio = c["col"] / wb
        if ratio < 0.55 or ratio > 1.45:
            suggested = round(max(0.12, min(1.8, wb)), 3)
            print(f"  {code}: {c['col']} -> {suggested} (WB {wb:.3f})")

    print(f"\n=== Issues ({len(issues)}) ===")
    for i in issues:
        print(" -", i)
    if not issues:
        print(" No issues.")


if __name__ == "__main__":
    main()
