# -*- coding: utf-8 -*-
"""Refresh world_data.js col from World Bank PPP / FX price level."""
from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JS = ROOT / "world_data.js"


def fetch_wb(indicator: str, codes: list[str]) -> dict:
    best = {}
    for i in range(0, len(codes), 15):
        chunk = codes[i : i + 15]
        joined = ";".join(chunk)
        url = (
            f"https://api.worldbank.org/v2/country/{joined}/indicator/{indicator}"
            f"?format=json&date=2015:2025&per_page=2000"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "AbroadCost-COL/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                payload = json.load(resp)
        except Exception as e:
            print(f"fail {indicator} {chunk[0]}…: {e}")
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
    codes = re.findall(r'code:"([A-Z]{2})"', text)
    codes = list(dict.fromkeys(codes))
    print(f"Countries: {len(codes)}")

    print("Fetching PPP conversion factors…")
    ppp = fetch_wb("PA.NUS.PPP", codes)
    print("Fetching official FX rates…")
    fx = fetch_wb("PA.NUS.FCRF", codes)
    print(f"PPP hits={len(ppp)} FX hits={len(fx)}")

    # US baseline: PLR_US should be ~1
    us_ppp, us_fx = None, None
    if "US" in ppp and "US" in fx and fx["US"][0]:
        us_ppp, us_fx = ppp["US"][0], fx["US"][0]
        us_plr = us_ppp / us_fx
        print(f"US PLR baseline: {us_plr:.4f} (PPP={us_ppp}, FX={us_fx})")
    else:
        us_plr = 1.0
        print("US baseline missing; using 1.0")

    updates = {}
    for code in codes:
        if code not in ppp or code not in fx:
            continue
        ppp_v, y1 = ppp[code]
        fx_v, y2 = fx[code]
        if not fx_v:
            continue
        plr = (ppp_v / fx_v) / us_plr
        # Clip to planning band; keep tiny microstates from going absurd
        col = round(max(0.14, min(1.85, plr)), 3)
        updates[code] = (col, y1 if y1 >= y2 else y2)

    print(f"Computed COL for {len(updates)} countries")
    for code in ("RW", "KE", "US", "DE", "IN", "NG", "ET", "JP", "GB"):
        if code in updates:
            m = re.search(rf'\{{code:"{code}",[^}}]*col:([0-9.]+)', text)
            old = m.group(1) if m else "?"
            print(f"  {code}: {old} -> {updates[code][0]} ({updates[code][1]})")

    def repl(m):
        code = m.group(1)
        prefix = m.group(0)
        if code not in updates:
            return prefix
        new_col = updates[code][0]
        return re.sub(r"col:[0-9.]+", f"col:{new_col}", prefix, count=1)

    new_text, n = re.subn(
        r'\{code:"([A-Z]{2})",[^}]*?col:[0-9.]+',
        repl,
        text,
    )
    # Actually re.subn with function - count how many changed
    changed = 0
    for code, (col, _) in updates.items():
        pat = rf'(\{{code:"{code}",[^}}]*?)col:[0-9.]+'
        new_text2, c = re.subn(pat, rf"\1col:{col}", new_text, count=1)
        if c:
            changed += 1
            new_text = new_text2

    JS.write_text(new_text, encoding="utf-8")
    print(f"Updated col for {changed} countries in world_data.js")

    # Also bump colYear where present
    # leave as-is; years already on records


if __name__ == "__main__":
    main()
