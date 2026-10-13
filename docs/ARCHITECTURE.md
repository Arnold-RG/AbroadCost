# AbroadCost — architecture

**Maintainer:** Arnova Group

## Overview

AbroadCost is a **static single-page application**. There is no required backend for end users. Country data ships as `world_data.js`; all calculators and charts run in the browser.

```text
Browser
  └─ index.html
       ├─ relo.css          (light/dark theme, layout, self-hosted type)
       ├─ fonts/            (Cormorant Garamond and Outfit, latin woff2)
       ├─ world_data.js     (COUNTRIES, currencies metadata)
       └─ relo.js           (UI wiring + models + charts)
```

Public files also include `favicon.svg`, `og.png`, `robots.txt`, `sitemap.xml`, and `404.html`. The Pages workflow copies them into the site root. Paths stay relative, so the same files work locally and at `https://arnold-rg.github.io/AbroadCost/`.

## Modules in `relo.js`

| Concern | Responsibility |
|---------|----------------|
| Money / FX helpers | Format amounts; optional live FX for display currencies |
| Monthly living | Household × lifestyle × COL basket |
| Travel stay | Duration, purpose, visa, papers, flights |
| Economy rates | `jobRates()` → living rate + general job |
| Charts | Canvas rank bars, regional GDP share, grouped salary |
| Theme | `localStorage` key `abroadcost-theme` |
| Country fields | Searchable comboboxes over the 195-country list |

## Deployment

GitHub Actions workflow `.github/workflows/deploy-pages.yml`:

1. Checkout `main`
2. Copy site assets into `_site/`
3. Upload Pages artifact
4. Deploy to GitHub Pages environment

Public URL pattern: `https://arnold-rg.github.io/AbroadCost/`

## Security posture

- No user accounts or cookies required beyond optional theme preference in `localStorage`
- No secrets in the repository
- Cursor / IDE agent directories are gitignored and must never be committed
- Third-party FX APIs (if used) are read-only from the client for display conversion

## Extending the dataset

1. Update `world_data.js` records  
2. Run verification tools under `tool/`  
3. Document source + year in `salarySource` / `*Year` fields  
4. Push to `main` — Pages redeploys automatically  
