# AbroadCost — data & methodology

**Maintainer:** Arnova Group  
**Coverage:** 195 countries  
**Purpose:** Transparent planning estimates for living, travel, salaries, and job-market pressure

---

## 1. Country universe & regions

Countries follow a practical ISO-style 195-country set used by AbroadCost.

**Regions** use UN M49 geographic continents (not World Bank lending regions):

- Africa  
- Americas  
- Asia  
- Europe  
- Oceania  

Examples: Cyprus → Asia; Russia → Europe; Egypt → Africa; Turkey → Asia.

---

## 2. Macroeconomy fields

| Field | Meaning | Typical source |
|-------|---------|----------------|
| `gdp` | Nominal GDP, USD billions | World Bank `NY.GDP.MKTP.CD` |
| `growth` | Real GDP growth % | World Bank `NY.GDP.MKTP.KD.ZG` |
| `unemp` | Unemployment rate % | World Bank / ILO modeled estimates `SL.UEM.TOTL.ZS` |
| `jobs` | Convenience score ≈ `100 − unemp` (clamped 0–100) | Derived |
| `pop` | Population | World Bank population series |
| `*Year` | Observation year stamp on the record | Dataset metadata |

Verification scripts cross-check a sample of countries against live World Bank API responses.

---

## 3. Cost of living (`col`)

`col` is an index **relative to the United States ≈ 1.0**.

### Preferred construction

\[
\mathrm{col} \approx \frac{\mathrm{PPP\ conversion\ factor}}{\mathrm{official\ FX\ (LCU/USD)}}
\]

Using World Bank:

- `PA.NUS.PPP` — PPP conversion factor  
- `PA.NUS.FCRF` — official exchange rate  

Values are clipped to a planning band (about `0.14`–`1.85`).

### Outlier handling

Official FX can diverge from street/parallel rates (hyperinflation, dual currency). AbroadCost clamps or overrides distorted cases (examples historically include Iran, Sudan, Zimbabwe) so travel and living budgets stay usable for planners.

Sparse / missing PPP-FX hits may use peer-informed overrides (e.g. selected East Africa or Pacific island cases).

---

## 4. Salaries (gross / net)

| Field | Meaning |
|-------|---------|
| `grossLow` / `grossAvg` / `grossHigh` | Monthly gross USD band |
| `netLow` / `netAvg` / `netHigh` | Monthly net USD band |
| `taxPct` | Approximate effective tax + social wedge used for net |
| `salarySource` | Provenance tag (ILO / OECD / national schedule / peer-scaled) |
| `salaryYear` | Wage observation year |

Wages are **indicative formal-sector averages**, not guarantees for every worker. Informal markets and high inequality mean local outcomes can differ widely.

---

## 5. Living budget model

Base monthly USD basket (USA ≈ 1.0 COL), then scaled by destination `col`, lifestyle multiplier, and household size:

| Category | Base USD / month (USA) |
|----------|-------------------------|
| Housing | 1400 |
| Food | 520 |
| Transport | 280 |
| Utilities | 220 |
| Healthcare | 180 |
| Other | 200 |

**Living rate** (economy tab) compares typical **net salary** (fallback: gross) to a *decent* living budget:

- COL effective floor ≈ `max(col, 0.42)` so very cheap PPP markets are not understated for a relocating planner  
- Lifestyle factor ≈ `1.25` for the “decent living” benchmark  
- Score maps coverage ratio to a 5–96 display scale (about `1.0×` budget ≈ mid-50s)

---

## 6. General job rate

Displayed as **Obtaining a general job %**. Blend of:

1. Hiring ease from unemployment (primary)  
2. Growth score (job creation / expansion)  
3. Mild underemployment drag from very low absolute pay  

This is **not** a career-specialist scarcity index and **not** a substitute for immigration or labor-law advice.

---

## 7. Travel budget model

Stay estimates combine daily shares of the monthly basket (lodging / food / transport / local), arrival buffer, purpose multiplier, visa / admin fees, and flight heuristics by same-region vs intercontinental travel.

Visa fee tables cover selected destinations; others use generic defaults.

---

## 8. Accuracy workflow

```bash
python tool/verify_accuracy.py       # structure + WB sample
python tool/verify_accuracy_deep.py  # broader sample + coverage gaps
python tool/fix_col_from_wb.py     # refresh COL from PPP/FX
python tool/fix_col_outliers.py    # clamp known FX distortions
```

Known intentional gaps: a few territories without World Bank GDP/wage series (e.g. some microstates) remain `null` rather than fabricated.

---

## 9. Disclaimer

AbroadCost is a **planning and education tool**. Macro series, wages, and COL indices change; local prices, taxes, and hiring conditions vary by city and sector. Always verify critical decisions with official statistics and professional advice.

---

## 10. Monthly living & travel budgets (AbroadCost v2)

- **Monthly living**: mid-tier USA basket (housing, food, transport, utilities, healthcare, other) scaled by destination COL (WB PPP/FX price level).
- **Travel stay**: mid-range hotel / meal / local daily USD rates scaled by destination COL and party size.
- **Flights**: great-circle distance between capital coordinates, with regional fallbacks; premium and round-trip multipliers applied.
- **Visas**: published fee ballparks for major destinations; regional defaults otherwise.
