#!/usr/bin/env python3
"""Build a clean static Pages artifact in ./dist."""
from pathlib import Path
import shutil

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
print(f"Built {DIST}")
