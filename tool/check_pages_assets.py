# -*- coding: utf-8 -*-
"""Fail when a built Pages site links to a local file that is not in the artifact.

Scans HTML and SVG for href, src, poster, and srcset, CSS for url(), and JS for
quoted relative asset paths. External URLs, data URIs, fragments, and directory
links are ignored. Query strings are stripped before the file is checked.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

SCAN_SUFFIXES = {".html", ".css", ".svg", ".js"}
ASSET_SUFFIXES = {
    ".css", ".js", ".mjs", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
    ".ico", ".woff", ".woff2", ".ttf", ".otf", ".json", ".webmanifest",
    ".xml", ".txt", ".pdf", ".mp3", ".mp4", ".webm",
}
ATTR_RE = re.compile(
    r"""(?:href|src|poster)\s*=\s*(['"])(.*?)\1""",
    re.IGNORECASE | re.DOTALL,
)
SRCSET_RE = re.compile(
    r"""srcset\s*=\s*(['"])(.*?)\1""",
    re.IGNORECASE | re.DOTALL,
)
STYLE_BLOCK_RE = re.compile(r"<style\b[^>]*>(.*?)</style>", re.IGNORECASE | re.DOTALL)
STYLE_ATTR_RE = re.compile(
    r"""\bstyle\s*=\s*(['"])(.*?)\1""",
    re.IGNORECASE | re.DOTALL,
)
JS_STRING_RE = re.compile(r"""(?<!\\)(['"])(.*?)\1""", re.DOTALL)
SKIP_PREFIXES = (
    "http:",
    "https:",
    "//",
    "data:",
    "mailto:",
    "tel:",
    "javascript:",
    "blob:",
    "about:",
)


def strip_comments(text: str, suffix: str) -> str:
    if suffix == ".html":
        return re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)
    if suffix in {".css", ".js"}:
        return re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    return text


def css_urls(text: str):
    lower = text.lower()
    i = 0
    while True:
        start = lower.find("url(", i)
        if start < 0:
            return
        k = start + 4
        while k < len(text) and text[k].isspace():
            k += 1
        if k >= len(text):
            return
        if text[k] in "\"'":
            quote = text[k]
            k += 1
            end = text.find(quote, k)
            if end < 0:
                return
            yield text[k:end].strip()
            i = end + 1
            continue
        end = text.find(")", k)
        if end < 0:
            return
        yield text[k:end].strip()
        i = end + 1


def markup_refs(text: str):
    for match in ATTR_RE.finditer(text):
        yield match.group(2).strip()
    for match in SRCSET_RE.finditer(text):
        for part in match.group(2).split(","):
            token = part.strip().split()
            if token:
                yield token[0]
    for match in STYLE_BLOCK_RE.finditer(text):
        yield from css_urls(match.group(1))
    for match in STYLE_ATTR_RE.finditer(text):
        yield from css_urls(match.group(2))


def js_asset_refs(text: str):
    """Quoted relative paths only. Ignores new URL(...) and prose."""
    for match in JS_STRING_RE.finditer(text):
        raw = match.group(2).strip()
        if not raw or any(ch.isspace() for ch in raw):
            continue
        path = local_path(raw)
        if path is None or ("/" not in path and not path.startswith(".")):
            continue
        if Path(path).suffix.lower() not in ASSET_SUFFIXES:
            continue
        yield raw


def references(text: str, suffix: str):
    if suffix in {".html", ".svg"}:
        yield from markup_refs(text)
    elif suffix == ".css":
        yield from css_urls(text)
    elif suffix == ".js":
        yield from js_asset_refs(text)


def local_path(ref: str) -> str | None:
    if not ref or ref.startswith("#"):
        return None
    lowered = ref.lower()
    if lowered.startswith(SKIP_PREFIXES):
        return None
    path = unquote(urlsplit(ref).path)
    if not path or path.endswith("/"):
        return None
    return path


def resolve(site: Path, page: Path, path: str) -> Path:
    if path.startswith("/"):
        return (site / path.lstrip("/")).resolve()
    return (page.parent / path).resolve()


def main(argv: list[str]) -> int:
    site = Path(argv[1] if len(argv) > 1 else "_site").resolve()
    if not site.is_dir():
        print(f"missing site directory: {site}", file=sys.stderr)
        return 1

    pages = [p for p in site.rglob("*") if p.is_file() and p.suffix.lower() in SCAN_SUFFIXES]
    missing: list[str] = []
    checked = 0
    for page in pages:
        suffix = page.suffix.lower()
        text = strip_comments(page.read_text(encoding="utf-8", errors="replace"), suffix)
        seen: set[str] = set()
        for ref in references(text, suffix):
            path = local_path(ref)
            if path is None or path in seen:
                continue
            seen.add(path)
            target = resolve(site, page, path)
            checked += 1
            try:
                target.relative_to(site)
            except ValueError:
                missing.append(f"{page.relative_to(site)} -> {ref} (escapes site root)")
                continue
            if not target.is_file():
                missing.append(f"{page.relative_to(site)} -> {ref}")

    if missing:
        print("Missing locally referenced assets:", file=sys.stderr)
        for line in missing:
            print(f"  {line}", file=sys.stderr)
        return 1

    print(f"OK: {checked} local asset references in {len(pages)} files exist under {site}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
