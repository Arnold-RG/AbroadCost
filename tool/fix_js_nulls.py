# -*- coding: utf-8 -*-
"""Convert accidental Python None literals in world_data.js to JS null."""
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "world_data.js"
text = p.read_text(encoding="utf-8")
fixed = text.replace(":None", ":null").replace(",None,", ",null,")
if fixed != text:
    p.write_text(fixed, encoding="utf-8")
    print("Fixed Python None -> JS null in world_data.js")
else:
    print("No Python None literals found")
