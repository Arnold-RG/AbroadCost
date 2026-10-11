# Security Policy

**Maintainer:** Arnova Group

## Supported surface

AbroadCost is a public static website. There is no authenticated API in this repository.

## Reporting a vulnerability

If you discover a security issue (for example XSS in client scripts, or accidental secret exposure in git history), please open a **private** security advisory on GitHub when available, or contact Arnova Group via https://github.com/Arnold-RG.

Please do **not** open a public issue that includes exploit details until a fix is released.

## Secrets policy

- Never commit `.env`, credentials, API keys, or local agent configuration
- Cursor / IDE agent directories must remain out of the repository
