# ReloLedger — architecture

**Maintainer:** Arnova Group

## Overview

ReloLedger is a **static single-page application**. There is no required backend for end users. Country data ships as `world_data.js`; all calculators and charts run in the browser.

```text
Browser
  └─ index.html
       ├─ relo.css          (light/dark theme, layout)
       ├─ world_data.js     (COUNTRIES, currencies metadata)
       └─ relo.js           (UI wiring + models + charts)
```

## Modules in `relo.js`

| Concern | Responsibility |
|---------|----------------|
| Money / FX helpers | Format amounts; optional live FX for display currencies |
| Monthly living | Household × lifestyle × COL basket |
| Travel stay | Duration, purpose, visa, papers, flights |
| Economy rates | `jobRates()` → living rate + general job |
| Charts | Canvas bar / donut / grouped salary |
| Theme | `localStorage` key `relo-theme` |

## Deployment

GitHub Actions workflow `.github/workflows/deploy-pages.yml`:

1. Checkout `main`
2. Copy site assets into `_site/`
3. Upload Pages artifact
4. Deploy to GitHub Pages environment

Public URL pattern: `https://arnold-rg.github.io/ReloLedger/`

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
