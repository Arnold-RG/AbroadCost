# -*- coding: utf-8 -*-
"""Fix country regions in world_data.js using UN M49 geographic regions (5 continents)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JS = ROOT / "world_data.js"

# UN M49 / standard continental assignment used for AbroadCost filters.
# Western Asia stays Asia; Russia = Europe; Cyprus = Asia; Egypt = Africa; Turkey = Asia.
REGION_BY_ISO2 = {
    # Africa
    "DZ": "Africa", "AO": "Africa", "BJ": "Africa", "BW": "Africa", "BF": "Africa",
    "BI": "Africa", "CV": "Africa", "CM": "Africa", "CF": "Africa", "TD": "Africa",
    "KM": "Africa", "CG": "Africa", "CD": "Africa", "CI": "Africa", "DJ": "Africa",
    "EG": "Africa", "GQ": "Africa", "ER": "Africa", "SZ": "Africa", "ET": "Africa",
    "GA": "Africa", "GM": "Africa", "GH": "Africa", "GN": "Africa", "GW": "Africa",
    "KE": "Africa", "LS": "Africa", "LR": "Africa", "LY": "Africa", "MG": "Africa",
    "MW": "Africa", "ML": "Africa", "MR": "Africa", "MU": "Africa", "MA": "Africa",
    "MZ": "Africa", "NA": "Africa", "NE": "Africa", "NG": "Africa", "RW": "Africa",
    "ST": "Africa", "SN": "Africa", "SC": "Africa", "SL": "Africa", "SO": "Africa",
    "ZA": "Africa", "SS": "Africa", "SD": "Africa", "TZ": "Africa", "TG": "Africa",
    "TN": "Africa", "UG": "Africa", "ZM": "Africa", "ZW": "Africa",
    # Americas
    "AG": "Americas", "AR": "Americas", "BS": "Americas", "BB": "Americas", "BZ": "Americas",
    "BO": "Americas", "BR": "Americas", "CA": "Americas", "CL": "Americas", "CO": "Americas",
    "CR": "Americas", "CU": "Americas", "DM": "Americas", "DO": "Americas", "EC": "Americas",
    "SV": "Americas", "GD": "Americas", "GT": "Americas", "GY": "Americas", "HT": "Americas",
    "HN": "Americas", "JM": "Americas", "MX": "Americas", "NI": "Americas", "PA": "Americas",
    "PY": "Americas", "PE": "Americas", "KN": "Americas", "LC": "Americas", "VC": "Americas",
    "SR": "Americas", "TT": "Americas", "US": "Americas", "UY": "Americas", "VE": "Americas",
    # Asia (incl. Western Asia / Middle East / Caucasus / Central Asia)
    "AF": "Asia", "AM": "Asia", "AZ": "Asia", "BH": "Asia", "BD": "Asia", "BT": "Asia",
    "BN": "Asia", "KH": "Asia", "CN": "Asia", "CY": "Asia", "GE": "Asia", "IN": "Asia",
    "ID": "Asia", "IR": "Asia", "IQ": "Asia", "IL": "Asia", "JP": "Asia", "JO": "Asia",
    "KZ": "Asia", "KW": "Asia", "KG": "Asia", "LA": "Asia", "LB": "Asia", "MY": "Asia",
    "MV": "Asia", "MN": "Asia", "MM": "Asia", "NP": "Asia", "KP": "Asia", "OM": "Asia",
    "PK": "Asia", "PS": "Asia", "PH": "Asia", "QA": "Asia", "SA": "Asia", "SG": "Asia",
    "KR": "Asia", "LK": "Asia", "SY": "Asia", "TW": "Asia", "TJ": "Asia", "TH": "Asia",
    "TL": "Asia", "TR": "Asia", "TM": "Asia", "AE": "Asia", "UZ": "Asia", "VN": "Asia",
    "YE": "Asia",
    # Europe (incl. Russia, Iceland; not Cyprus/Turkey by UN M49)
    "AL": "Europe", "AD": "Europe", "AT": "Europe", "BY": "Europe", "BE": "Europe",
    "BA": "Europe", "BG": "Europe", "HR": "Europe", "CZ": "Europe", "DK": "Europe",
    "EE": "Europe", "FI": "Europe", "FR": "Europe", "DE": "Europe", "GR": "Europe",
    "HU": "Europe", "IS": "Europe", "IE": "Europe", "IT": "Europe", "XK": "Europe",
    "LV": "Europe", "LI": "Europe", "LT": "Europe", "LU": "Europe", "MT": "Europe",
    "MD": "Europe", "MC": "Europe", "ME": "Europe", "NL": "Europe", "MK": "Europe",
    "NO": "Europe", "PL": "Europe", "PT": "Europe", "RO": "Europe", "RU": "Europe",
    "SM": "Europe", "RS": "Europe", "SK": "Europe", "SI": "Europe", "ES": "Europe",
    "SE": "Europe", "CH": "Europe", "UA": "Europe", "GB": "Europe", "VA": "Europe",
    # Oceania
    "AU": "Oceania", "FJ": "Oceania", "KI": "Oceania", "MH": "Oceania", "FM": "Oceania",
    "NR": "Oceania", "NZ": "Oceania", "PW": "Oceania", "PG": "Oceania", "WS": "Oceania",
    "SB": "Oceania", "TO": "Oceania", "TV": "Oceania", "VU": "Oceania",
}


def main():
    text = JS.read_text(encoding="utf-8")
    changed = []

    def repl(m):
        code, name, region = m.group(1), m.group(2), m.group(3)
        want = REGION_BY_ISO2.get(code)
        if want and want != region:
            changed.append(f"{code} {name}: {region} -> {want}")
            return f'code:"{code}",name:"{name}",region:"{want}"'
        return m.group(0)

    new = re.sub(
        r'code:"([A-Z]{2})",name:"([^"]+)",region:"([^"]+)"',
        repl,
        text,
    )
    # Also fix any remaining Python None
    new = new.replace(":None", ":null")
    JS.write_text(new, encoding="utf-8")
    print(f"Updated {len(changed)} regions")
    for line in changed:
        print(" ", line)
    missing = []
    for m in re.finditer(r'code:"([A-Z]{2})",name:"([^"]+)"', text):
        if m.group(1) not in REGION_BY_ISO2:
            missing.append(f"{m.group(1)} {m.group(2)}")
    if missing:
        print("No map entry for:", ", ".join(missing[:30]))


if __name__ == "__main__":
    main()
