# -*- coding: utf-8 -*-
"""Clamp distorted COL (hyperinflation FX) and fix clear salary outliers."""
from __future__ import annotations

import re
from pathlib import Path

JS = Path(__file__).resolve().parents[1] / "world_data.js"

# Official FX / PPP can explode for parallel-rate economies.
# Cap these to realistic traveler/expat COL vs USA.
COL_OVERRIDE = {
    "IR": 0.28,   # Iran street COL << official PLR
    "SD": 0.32,   # Sudan
    "SS": 0.30,   # South Sudan (sparse data)
    "ZW": 0.35,   # Zimbabwe FX noise
    "VE": 0.35,   # if present
    "CU": 0.45,   # Cuba dual currency distortion
    "SY": 0.30,
    "KP": 0.35,
    # Still stuck on old 0.15 floor (no WB PPP/FX hit)
    "UG": 0.28,
    "ZM": 0.30,
    "MW": 0.26,
    "MG": 0.28,
    "ML": 0.28,
    "LS": 0.32,
    "LR": 0.28,
    "VU": 0.82,   # Pacific island import COL — not 0.15
}

# Liberia ILO mean looks like a bad unit / tiny formal sample (~$1532/mo).
# Use a West Africa peer-scaled band (~$80–150/mo formal avg USD).
SALARY_OVERRIDE = {
    "LR": {
        "grossLow": 55.0,
        "grossAvg": 95.0,
        "grossHigh": 160.0,
        "netLow": 48.0,
        "netAvg": 82.0,
        "netHigh": 138.0,
        "taxPct": 14.0,
        "salarySource": "peer_scaled_WA_formal",
        "salaryYear": "2024",
    },
}


def main():
    text = JS.read_text(encoding="utf-8")
    changed = 0

    for code, col in COL_OVERRIDE.items():
        pat = rf'(\{{code:"{code}",[^}}]*?)col:[0-9.]+'
        new_text, n = re.subn(pat, rf"\1col:{col}", text, count=1)
        if n:
            print(f"COL {code} -> {col}")
            text = new_text
            changed += 1

    for code, fields in SALARY_OVERRIDE.items():
        m = re.search(rf'\{{code:"{code}",[^}}]+\}}', text)
        if not m:
            continue
        block = m.group(0)
        new_block = block
        for k, v in fields.items():
            if isinstance(v, str):
                new_block, n = re.subn(rf'{k}:"[^"]*"', f'{k}:"{v}"', new_block, count=1)
                if not n:
                    # insert before closing
                    new_block = new_block[:-1] + f',{k}:"{v}"' + "}"
            else:
                new_block, n = re.subn(rf"{k}:[^,}}]+", f"{k}:{v}", new_block, count=1)
                if not n:
                    new_block = new_block[:-1] + f",{k}:{v}" + "}"
        text = text[: m.start()] + new_block + text[m.end() :]
        print(f"Salary override {code}: {fields}")
        changed += 1

    # Ensure US remains the COL baseline
    text, n = re.subn(r'(\{code:"US",[^}]*?)col:[0-9.]+', r"\1col:1.0", text, count=1)
    if n:
        print("US col forced to 1.0")
        changed += 1

    JS.write_text(text, encoding="utf-8")
    print(f"Done, edits={changed}")


if __name__ == "__main__":
    main()
