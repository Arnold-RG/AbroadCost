# -*- coding: utf-8 -*-
"""Refresh COL from World Bank PPP/FX and attach capital coordinates for flight costing."""
from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JS = ROOT / "website" / "world_data.js"

# Approximate capital / primary city coordinates (lat, lon) for great-circle flights.
CAPITALS = {
    "AF": (34.53, 69.17), "AL": (41.33, 19.82), "DZ": (36.75, 3.06), "AD": (42.51, 1.52),
    "AO": (-8.84, 13.23), "AG": (17.12, -61.85), "AR": (-34.60, -58.38), "AM": (40.18, 44.51),
    "AU": (-35.28, 149.13), "AT": (48.21, 16.37), "AZ": (40.41, 49.87), "BS": (25.05, -77.35),
    "BH": (26.23, 50.59), "BD": (23.81, 90.41), "BB": (13.10, -59.62), "BY": (53.90, 27.57),
    "BE": (50.85, 4.35), "BZ": (17.25, -88.77), "BJ": (6.50, 2.63), "BT": (27.47, 89.64),
    "BO": (-16.50, -68.15), "BA": (43.86, 18.41), "BW": (-24.65, 25.91), "BR": (-15.79, -47.88),
    "BN": (4.90, 114.94), "BG": (42.70, 23.32), "BF": (12.37, -1.52), "BI": (-3.38, 29.36),
    "CV": (14.92, -23.51), "KH": (11.56, 104.92), "CM": (3.85, 11.50), "CA": (45.42, -75.70),
    "CF": (4.39, 18.56), "TD": (12.13, 15.05), "CL": (-33.45, -70.67), "CN": (39.90, 116.40),
    "CO": (4.71, -74.07), "KM": (-11.70, 43.26), "CG": (-4.27, 15.28), "CD": (-4.33, 15.31),
    "CR": (9.93, -84.08), "CI": (6.83, -5.28), "HR": (45.81, 15.98), "CU": (23.13, -82.38),
    "CY": (35.17, 33.36), "CZ": (50.08, 14.44), "DK": (55.68, 12.57), "DJ": (11.59, 43.15),
    "DM": (15.30, -61.39), "DO": (18.49, -69.93), "EC": (-0.18, -78.47), "EG": (30.04, 31.24),
    "SV": (13.69, -89.19), "GQ": (3.75, 8.78), "ER": (15.33, 38.93), "EE": (59.44, 24.75),
    "SZ": (-26.31, 31.14), "ET": (9.03, 38.74), "FJ": (-18.14, 178.44), "FI": (60.17, 24.94),
    "FR": (48.86, 2.35), "GA": (0.39, 9.45), "GM": (13.45, -16.58), "GE": (41.72, 44.79),
    "DE": (52.52, 13.41), "GH": (5.56, -0.19), "GR": (37.98, 23.73), "GD": (12.05, -61.75),
    "GT": (14.63, -90.51), "GN": (9.51, -13.71), "GW": (11.86, -15.60), "GY": (6.80, -58.16),
    "HT": (18.54, -72.34), "HN": (14.07, -87.19), "HU": (47.50, 19.04), "IS": (64.15, -21.94),
    "IN": (28.61, 77.21), "ID": (-6.21, 106.85), "IR": (35.69, 51.39), "IQ": (33.31, 44.37),
    "IE": (53.35, -6.26), "IL": (31.77, 35.21), "IT": (41.90, 12.50), "JM": (18.00, -76.79),
    "JP": (35.68, 139.69), "JO": (31.95, 35.91), "KZ": (51.17, 71.43), "KE": (-1.29, 36.82),
    "KI": (1.33, 172.98), "KP": (39.02, 125.75), "KR": (37.57, 126.98), "KW": (29.38, 47.99),
    "KG": (42.87, 74.59), "LA": (17.98, 102.63), "LV": (56.95, 24.11), "LB": (33.89, 35.50),
    "LS": (-29.32, 27.48), "LR": (6.30, -10.80), "LY": (32.89, 13.19), "LI": (47.14, 9.52),
    "LT": (54.69, 25.28), "LU": (49.61, 6.13), "MG": (-18.91, 47.52), "MW": (-13.96, 33.79),
    "MY": (3.14, 101.69), "MV": (4.18, 73.51), "ML": (12.64, -8.00), "MT": (35.90, 14.51),
    "MH": (7.09, 171.38), "MR": (18.07, -15.96), "MU": (-20.16, 57.50), "MX": (19.43, -99.13),
    "FM": (6.92, 158.16), "MD": (47.01, 28.86), "MC": (43.74, 7.42), "MN": (47.92, 106.91),
    "ME": (42.44, 19.26), "MA": (34.02, -6.83), "MZ": (-25.97, 32.57), "MM": (19.76, 96.08),
    "NA": (-22.56, 17.08), "NR": (-0.55, 166.92), "NP": (27.72, 85.32), "NL": (52.37, 4.90),
    "NZ": (-41.29, 174.78), "NI": (12.14, -86.25), "NE": (13.51, 2.11), "NG": (9.06, 7.49),
    "MK": (41.997, 21.43), "NO": (59.91, 10.75), "OM": (23.59, 58.38), "PK": (33.69, 73.04),
    "PW": (7.50, 134.62), "PA": (8.98, -79.52), "PG": (-9.44, 147.18), "PY": (-25.26, -57.58),
    "PE": (-12.05, -77.04), "PH": (14.60, 120.98), "PL": (52.23, 21.01), "PT": (38.72, -9.14),
    "QA": (25.29, 51.53), "RO": (44.43, 26.10), "RU": (55.76, 37.62), "RW": (-1.94, 30.06),
    "KN": (17.30, -62.72), "LC": (14.01, -60.99), "VC": (13.16, -61.23), "WS": (-13.83, -171.77),
    "SM": (43.94, 12.45), "ST": (0.34, 6.73), "SA": (24.71, 46.68), "SN": (14.72, -17.47),
    "RS": (44.82, 20.46), "SC": (-4.62, 55.45), "SL": (8.48, -13.23), "SG": (1.35, 103.82),
    "SK": (48.15, 17.11), "SI": (46.05, 14.51), "SB": (-9.43, 159.95), "SO": (2.05, 45.32),
    "ZA": (-25.75, 28.19), "SS": (4.86, 31.58), "ES": (40.42, -3.70), "LK": (6.93, 79.85),
    "SD": (15.50, 32.56), "SR": (5.85, -55.20), "SE": (59.33, 18.07), "CH": (46.95, 7.45),
    "SY": (33.51, 36.29), "TJ": (38.56, 68.77), "TZ": (-6.16, 35.75), "TH": (13.76, 100.50),
    "TL": (-8.56, 125.57), "TG": (6.13, 1.22), "TO": (-21.13, -175.20), "TT": (10.66, -61.52),
    "TN": (36.81, 10.18), "TR": (39.93, 32.86), "TM": (37.95, 58.38), "TV": (-8.52, 179.20),
    "UG": (0.35, 32.58), "UA": (50.45, 30.52), "AE": (24.45, 54.38), "GB": (51.51, -0.13),
    "US": (38.91, -77.04), "UY": (-34.90, -56.19), "UZ": (41.30, 69.24), "VU": (-17.73, 168.33),
    "VA": (41.90, 12.45), "VE": (10.48, -66.90), "VN": (21.03, 105.85), "YE": (15.37, 44.21),
    "ZM": (-15.42, 28.29), "ZW": (-17.83, 31.05),
}

COL_OVERRIDE = {
    "IR": 0.28, "SD": 0.32, "SS": 0.30, "ZW": 0.35, "VE": 0.35, "CU": 0.45,
    "SY": 0.30, "KP": 0.35, "UG": 0.28, "ZM": 0.30, "MW": 0.26, "MG": 0.28,
    "ML": 0.28, "LS": 0.32, "LR": 0.28, "VU": 0.82, "NG": 0.22, "EG": 0.24,
}


def fetch_wb(indicator: str, codes: list[str]) -> dict:
    best = {}
    for i in range(0, len(codes), 12):
        chunk = codes[i : i + 12]
        url = (
            f"https://api.worldbank.org/v2/country/{';'.join(chunk)}/indicator/{indicator}"
            f"?format=json&date=2015:2025&per_page=2000"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "AbroadCost-Budget/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                payload = json.load(resp)
        except Exception as e:
            print("fail", indicator, chunk[0], e)
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
    codes = list(dict.fromkeys(re.findall(r'code:"([A-Z]{2})"', text)))
    print("countries", len(codes))

    print("Fetching PPP + FX…")
    ppp = fetch_wb("PA.NUS.PPP", codes)
    fx = fetch_wb("PA.NUS.FCRF", codes)
    print(f"PPP={len(ppp)} FX={len(fx)}")

    col_map = {}
    for code in codes:
        if code in COL_OVERRIDE:
            col_map[code] = (COL_OVERRIDE[code], "override")
            continue
        if code not in ppp or code not in fx or not fx[code][0]:
            continue
        plr = ppp[code][0] / fx[code][0]
        col = round(max(0.14, min(1.85, plr)), 3)
        col_map[code] = (col, ppp[code][1])

    # Force US baseline
    col_map["US"] = (1.0, "baseline")

    updated = 0
    for code in codes:
        block_m = re.search(rf'\{{code:"{code}",[^}}]+\}}', text)
        if not block_m:
            continue
        block = block_m.group(0)
        new_block = block

        if code in col_map:
            col, _ = col_map[code]
            new_block, n = re.subn(r"col:[0-9.]+", f"col:{col}", new_block, count=1)
            if n:
                updated += 1

        if code in CAPITALS:
            lat, lon = CAPITALS[code]
            if re.search(r"\blat:", new_block):
                new_block = re.sub(r"lat:-?[0-9.]+", f"lat:{lat}", new_block, count=1)
                new_block = re.sub(r"lon:-?[0-9.]+", f"lon:{lon}", new_block, count=1)
            else:
                new_block = new_block[:-1] + f",lat:{lat},lon:{lon}" + "}"

        if new_block != block:
            text = text[: block_m.start()] + new_block + text[block_m.end() :]

    # Refresh data-source note
    text = re.sub(
        r'window\.RELO_DATA_SOURCE = \{[^;]+;',
        'window.RELO_DATA_SOURCE = {"provider": "World Bank Open Data (WDI)", '
        '"indicators": {"gdp": "NY.GDP.MKTP.CD", "growth": "NY.GDP.MKTP.KD.ZG", '
        '"unemp": "SL.UEM.TOTL.ZS", "ppp": "PA.NUS.PPP", "fx": "PA.NUS.FCRF", "pop": "SP.POP.TOTL"}, '
        '"note": "COL = PPP conversion factor / official FX (price level vs USD), with clamps for dual-FX outliers. '
        "Capital lat/lon enable great-circle flight costing. Monthly & travel budgets scale a mid-tier USD basket by COL. "
        'GDP/growth/unemployment from WDI.", "fetched": "2026-10-11", "budgetModel": "AbroadCost-v2"};',
        text,
        count=1,
    )

    JS.write_text(text, encoding="utf-8")
    print(f"Updated COL for {updated} countries; capitals attached where known")
    for code in ("US", "RW", "KE", "DE", "IN", "JP", "NG", "GB", "AU"):
        if code in col_map:
            print(f"  {code}: col={col_map[code][0]} ({col_map[code][1]})")


if __name__ == "__main__":
    main()
