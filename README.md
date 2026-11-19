# AbroadCost — Relocation Cost Explorer

**Cost-of-living and relocation planning** · [GitHub repository](https://github.com/Arnold-RG/AbroadCost) · [Live website](https://arnold-rg.github.io/AbroadCost/)

## What this project does

Browser-based relocation and cost comparison information service supported by static datasets and JavaScript. Source freshness, currency assumptions and transparent calculation methodology are central to user trust.

**Primary stack:** HTML, CSS, JavaScript and data assets.

> **Project verification:** This README describes observed source structure and release expectations. Not every feature, dependency or target device has been certified. Consult actual CI results and source before making public claims.

## Repository architecture

| File or directory | Purpose |
| --- | --- |
| `index.html` | Primary user interface |
| `relo.css` | Styles and responsive layout |
| `relo.js` | Browser interaction and calculations |
| `world_data.js` | Client-consumed world data |
| `tool/` | Supporting tools |
| `docs/` | Reference documentation |
| `assets/` | Design assets |

## Local development

Install Git and the required language runtime. Use a clean environment and review configuration files for secrets before starting network services.

```sh
python -m http.server 8000
# Open http://localhost:8000
```

**Environment note:** The project can be served statically for local review; changing datasets must follow a reproducible validation process.

## User experience and core requirements

- Clearly label currencies, dates, regional assumptions and sample estimates.
- Show how budget figures are calculated and avoid presenting forecasts as guarantees.
- Support readable tables/charts and touch controls on small screens.

Build for real customer journeys: clear navigation, accessible controls, responsive layouts, truthful claims, human-readable errors and meaningful loading/empty states.

## Security, data and privacy

- Validate or sanitize user-entered text and values before rendering.
- Preserve privacy by default; don't transmit personal finances or travel history without a clear user action.
- Review the origins/licensing of data, fonts, photos and third-party scripts.

Review secrets, trust boundaries, external services and permission handling. Use scoped credentials, a private disclosure channel (see `SECURITY.md` if present), and secure dependency updates.

## Quality and operations

| Area | Release acceptance criterion |
| --- | --- |
| Implementation | Maintainable code, clear ownership, documented configuration |
| Testing | Actual unit/integration checks or a documented repeatable smoke test |
| Security | Input and dependency checks, least privilege and no exposed credentials |
| Accessibility | Keyboard, contrast, touch and responsive testing for user-facing screens |
| CI/CD | Reproducible builds, protected release jobs, owner-approved publication |
| Reliability | Error monitoring; backups/recovery for persisted data; rollback plan |

**These are intended gates, not an assertion of passing tests.** Kubernetes is unnecessary for purely static pages; reassess it only where multi-service infrastructure warrants the complexity.

## Next engineering milestones

1. Add numerical regression tests for budget calculations.
2. Document data update cadence and provenance.
3. Test mobile layouts, accessibility and performance.

## Contributions and release policy

Use reviewable branches and pull requests. Don't add unlicensed visual assets, mock client testimonials, private customer data or unverified integrations. Owners approve public releases; note remaining limitations in the release report.
