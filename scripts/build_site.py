#!/usr/bin/env python3
"""Build a clean static Pages artifact in ./dist."""
from pathlib import Path
import shutil

from cache_fingerprint import (
    render_service_worker,
    static_cache_fingerprint,
    version_static_asset_urls,
)
from generate_social_card import generate_status_card, generate_appeal_card

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()

files = [
    "index.html", "appeal.html", "404.html", "manifest.webmanifest", "sw.js",
    "robots.txt", "sitemap.xml", ".nojekyll",
]
for name in files:
    shutil.copy2(ROOT / name, DIST / name)

shutil.copytree(ROOT / "assets", DIST / "assets")
generate_status_card(DIST / "assets" / "og" / "og-card.png")
generate_appeal_card(DIST / "assets" / "og" / "appeal-card.png")
(DIST / "data").mkdir()
for name in ["status.json", "evidence.json", "history.json", "sources.json"]:
    shutil.copy2(ROOT / "data" / name, DIST / "data" / name)

fingerprint = static_cache_fingerprint(ROOT)
service_worker = DIST / "sw.js"
service_worker.write_text(
    render_service_worker(service_worker.read_text(encoding="utf-8"), ROOT),
    encoding="utf-8",
    newline="",
)

versioned_text_files = [
    DIST / "index.html",
    DIST / "appeal.html",
    DIST / "404.html",
    DIST / "manifest.webmanifest",
    DIST / "sw.js",
    *(DIST / "assets").rglob("*.css"),
    *(DIST / "assets").rglob("*.js"),
]
for path in versioned_text_files:
    path.write_text(
        version_static_asset_urls(path.read_text(encoding="utf-8"), fingerprint),
        encoding="utf-8",
        newline="",
    )
print(f"Built {DIST}")
