# Security Policy

**Maintainer:** Arnova Group  
**Product:** AbroadCost (static GitHub Pages app)

## Supported surface

AbroadCost is a public static website. There is no authenticated API and no server-side session store in this repository. Country and FX data ship as static JavaScript (`world_data.js`). An optional, unauthenticated FX refresh may call `https://api.frankfurter.app` from the browser; failures fall back to bundled rates.

## Reporting a vulnerability

If you discover a security issue (for example XSS in client scripts, open redirect, or accidental secret exposure in git history), please open a **private** security advisory on GitHub when available, or contact Arnova Group via https://github.com/Arnold-RG.

Please do **not** open a public issue that includes exploit details until a fix is released.

## Client hardening (this release)

- Country names, currency labels, and table cells are rendered with `textContent` / DOM APIs — not `innerHTML`
- `referrer` meta: `strict-origin-when-cross-origin`
- External links use `rel="noopener noreferrer"`
- CSP meta restricts `default-src` to `'self'`, allows Frankfurter for `connect-src`, and sets `base-uri` / `frame-ancestors` to `none`
- Form inputs use `maxlength` and numeric clamps; planner state is URL/query only (no private sync)

## Secrets policy

- Never commit `.env`, credentials, API keys, PEM files, or local agent configuration
- Cursor / IDE agent directories must remain out of the repository (see `.gitignore`)
- No third-party analytics or tracking pixels are required for the planner to run
