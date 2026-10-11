<p align="center">
  <img src="https://img.shields.io/badge/AbroadCost-Country%20budget%20planner-0B3D2E?style=for-the-badge" alt="AbroadCost"/>
</p>

<h1 align="center">AbroadCost</h1>

<p align="center">
  <strong>Country budget planner for 195 countries.</strong><br/>
  Monthly living costs, travel budgets, salaries, and economy / job-rate insights — free for everyone in the browser.
</p>

<p align="center">
  <a href="https://arnold-rg.github.io/AbroadCost/"><img src="https://img.shields.io/badge/Live_site-Open_now-C9A27A?style=for-the-badge&logo=github" alt="Live site"/></a>
  <a href="https://github.com/Arnold-RG/AbroadCost"><img src="https://img.shields.io/badge/Repo-Public-0A0908?style=for-the-badge&logo=github" alt="Public repo"/></a>
  <a href="https://github.com/Arnold-RG/AbroadCost/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Source--available-444?style=for-the-badge" alt="License"/></a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/actions/workflow/status/Arnold-RG/AbroadCost/deploy-pages.yml?label=Pages%20deploy&style=flat-square" alt="CI"/>
  <img src="https://img.shields.io/badge/Coverage-195%20countries-0B3D2E?style=flat-square" alt="Countries"/>
  <img src="https://img.shields.io/badge/Maintainer-Arnova%20Group-1F6F4A?style=flat-square" alt="Arnova Group"/>
</p>

---

## Live access

| | |
|---|---|
| **Public website** | https://arnold-rg.github.io/AbroadCost/ |
| **Source code** | https://github.com/Arnold-RG/AbroadCost |
| **Audience** | Anyone with a browser — no login, no install |

Open the live link in Chrome, Edge, Firefox, Safari, or any modern mobile browser. The site is static, public, and fully usable without an account.

---

## What AbroadCost does

| Mode | Purpose |
|------|---------|
| **Monthly living** | Household living budget by country, lifestyle, and family size — with typical gross & net salary ranges |
| **Traveling budget** | Stay cost estimate (lodging, food, transport, admin, flights) for a trip purpose and duration |
| **Economy & jobs** | GDP, growth, **living rate** (salary vs living budget), **general job** obtainability, and peer charts |

All 195 countries use UN M49-style continental regions: Africa, Americas, Asia, Europe, Oceania.

---

## Product rules

1. **Planning tool, not financial advice** — figures are modeled estimates for comparison and relocation planning.
2. **Living rate** uses typical **take-home (net) salary** against a decent living budget (COL floor applied so low-PPP markets are not understated).
3. **General job** rate reflects unemployment pressure, growth, and a mild underemployment drag from very low pay — not a career-specialty market score.
4. **Salaries** remain visible as separate gross / net bands; living rate is a single column derived from salary coverage.

---

## Repository layout

```text
index.html          App shell (tabs, forms, charts, table)
relo.css            Theme + layout (light / dark)
relo.js             Calculators, charts, economy rates
world_data.js       195-country dataset (COL, GDP, wages, FX metadata)
docs/               Methodology, data sources, contribution guide details
tool/               Accuracy verification and COL refresh scripts
.github/workflows/  GitHub Pages deploy
```

---

## Data & methodology (summary)

| Field | Primary basis |
|-------|----------------|
| GDP, growth, unemployment | World Bank WDI (latest available year in dataset) |
| Cost of living index | World Bank PPP ÷ official FX price level, with outlier clamps for dual-FX / hyperinflation cases |
| Gross / net salaries | ILO / OECD / national schedule proxies converted to USD / month |
| Regions | UN M49 geographic continents (5 regions) |
| Living budget model | Fixed USD basket × COL × lifestyle × household factors |

Deep detail: [docs/DATA_AND_METHODOLOGY.md](docs/DATA_AND_METHODOLOGY.md)

Accuracy scripts:

```bash
python tool/verify_accuracy.py
python tool/verify_accuracy_deep.py
```

---

## Run locally

No build step. From this folder:

```bash
python -m http.server 5500
```

Then open http://localhost:5500 in your system browser.

---

## Tech stack

- Static HTML / CSS / vanilla JavaScript (no framework lock-in)
- Client-side charts (canvas)
- GitHub Pages for global public hosting
- Optional Python tools for dataset verification (stdlib only)

---

## Maintainer

**Arnova Group** — public contributor and copyright holder for AbroadCost.

- GitHub organization / account: [Arnold-RG](https://github.com/Arnold-RG)
- Company: Arnova Group

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

Source-available under [LICENSE](LICENSE). The live website is free for public use. Commercial rebranding or redistribution requires written permission from Arnova Group.
