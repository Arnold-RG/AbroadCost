# Contributing to ReloLedger

Thank you for helping improve ReloLedger. This project is maintained by **Arnova Group**.

## How to contribute

1. Fork https://github.com/Arnold-RG/ReloLedger
2. Create a focused branch (`fix/living-rate-label`, `docs/methodology`, …)
3. Make changes with clear commits
4. Open a pull request describing **why** the change matters

## Contribution areas

| Area | Notes |
|------|--------|
| UI / UX | Keep the first viewport and economy panels readable; prefer clarity over decoration |
| Calculators | Preserve living-rate and general-job formulas unless you document the change |
| Country data | Prefer World Bank / ILO / OECD-backed updates; run `tool/verify_accuracy.py` |
| Documentation | Expand methodology with sources and year stamps |

## Coding guidelines

- Keep the site **static** (no required build for end users)
- Do not commit secrets, API keys, or local agent configs
- Do not add Cursor agent folders (`.cursor/`, agent transcripts, etc.)
- Attribute work to **Arnova Group** in docs and copyright notices — not to AI tooling vendors

## Local checks

```bash
python -m http.server 5500
python tool/verify_accuracy.py
```

## Code of conduct (short)

Be respectful. Assume good intent. Prefer evidence over opinion when changing country data.
