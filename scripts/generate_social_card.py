#!/usr/bin/env python3
"""Generate a 1200×630 Open Graph card from the current public status."""
from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
import math
import sys

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
STATUS = ROOT / "data" / "status.json"
DEFAULT_OUTPUT = ROOT / "assets" / "og" / "og-card.png"
RELEASE = datetime.fromisoformat("2026-04-29T03:00:00+00:00")


def font_path(bold: bool = True) -> str:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return candidate
    raise FileNotFoundError("No suitable system font found")


def gradient(size, c1, c2):
    w, h = size
    im = Image.new("RGB", size)
    px = im.load()
    for y in range(h):
        for x in range(w):
            t = x / w * 0.55 + y / h * 0.45
            px[x, y] = tuple(int(c1[i] * (1 - t) + c2[i] * t) for i in range(3))
    return im


def draw_mark(im, center, radius, thick=8):
    d = ImageDraw.Draw(im, "RGBA")
    cx, cy = center
    d.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), outline=(161, 139, 255, 175), width=thick)
    d.arc((cx - radius * .72, cy - radius * .72, cx + radius * .72, cy + radius * .72), 25, 285, fill=(86, 233, 255, 220), width=max(3, thick // 2))
    for ang in (18, 143, 263):
        a = math.radians(ang)
        x = cx + math.cos(a) * radius
        y = cy + math.sin(a) * radius
        d.ellipse((x - 6, y - 6, x + 6, y + 6), fill=(255, 103, 166, 230))


def generate(output: Path) -> None:
    status = json.loads(STATUS.read_text(encoding="utf-8"))
    event = status.get("confirmed_event") or {}
    if status.get("state") == "RUSSIAN_VOICE_RELEASED" and event.get("detected_at"):
        end = datetime.fromisoformat(event["detected_at"].replace("Z", "+00:00"))
    else:
        end = datetime.now(timezone.utc)
    days = max(0, int((end - RELEASE).total_seconds() // 86400))

    state_line = {
        "NO_RUSSIAN_VOICE": "РУССКАЯ ОЗВУЧКА: НЕ АНОНСИРОВАНА",
        "POSSIBLE_MENTION": "НАЙДЕНО ВОЗМОЖНОЕ УПОМИНАНИЕ",
        "CONFIRMED_ANNOUNCEMENT": "РУССКАЯ ОЗВУЧКА АНОНСИРОВАНА",
        "RUSSIAN_VOICE_RELEASED": "РУССКАЯ ОЗВУЧКА ДОСТУПНА",
        "UNKNOWN": "СТАТУС ТРЕБУЕТ ПОВТОРНОЙ ПРОВЕРКИ",
    }.get(status.get("state"), "СТАТУС ТРЕБУЕТ ПРОВЕРКИ")
    accent = {
        "NO_RUSSIAN_VOICE": (255, 99, 127),
        "POSSIBLE_MENTION": (255, 214, 107),
        "CONFIRMED_ANNOUNCEMENT": (107, 166, 255),
        "RUSSIAN_VOICE_RELEASED": (93, 240, 184),
        "UNKNOWN": (156, 165, 195),
    }.get(status.get("state"), (156, 165, 195))

    W, H = 1200, 630
    im = gradient((W, H), (6, 8, 17), (29, 22, 59)).convert("RGBA")
    for x, y, r, c in [(180, 100, 250, (94, 60, 220, 95)), (1050, 520, 280, (18, 126, 167, 70)), (820, 80, 160, (255, 76, 155, 38))]:
        glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        gd.ellipse((x-r, y-r, x+r, y+r), fill=c)
        glow = glow.filter(ImageFilter.GaussianBlur(r * .38))
        im = Image.alpha_composite(im, glow)
    d = ImageDraw.Draw(im, "RGBA")
    for x in range(0, W, 50):
        d.line((x, 0, x, H), fill=(255, 255, 255, 9), width=1)
    for y in range(0, H, 50):
        d.line((0, y, W, y), fill=(255, 255, 255, 9), width=1)
    d.rounded_rectangle((55, 55, W-55, H-55), radius=34, fill=(11, 15, 30, 198), outline=(166, 145, 255, 55), width=2)
    draw_mark(im, (970, 196), 98, 7)

    small = ImageFont.truetype(font_path(True), 22)
    title = ImageFont.truetype(font_path(True), 60)
    number = ImageFont.truetype(font_path(True), 94)
    sub = ImageFont.truetype(font_path(False), 26)
    d.text((105, 98), "NTE · RUSSIAN VOICE WATCH", font=small, fill=(177, 157, 255, 255))
    d.text((105, 154), "Сколько времени NTE", font=title, fill=(246, 247, 255, 255))
    d.text((105, 224), "без русской озвучки?", font=title, fill=(103, 225, 255, 255))
    d.text((105, 318), str(days), font=number, fill=(246, 247, 255, 255))
    day_word = "ДЕНЬ" if days % 10 == 1 and days % 100 != 11 else "ДНЕЙ"
    d.text((105 + d.textlength(str(days), font=number) + 22, 367), day_word, font=small, fill=(163, 171, 201, 255))
    d.rounded_rectangle((105, 455, 700, 515), radius=16, fill=(*accent, 24), outline=(*accent, 95), width=2)
    d.text((128, 472), state_line, font=small, fill=(*accent, 255))
    d.text((105, 548), "Автопроверка официальных источников · История · PWA", font=sub, fill=(163, 171, 201, 255))
    output.parent.mkdir(parents=True, exist_ok=True)
    im.convert("RGB").save(output, quality=94, optimize=True)


if __name__ == "__main__":
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUTPUT
    generate(out)
    print(f"Generated {out}")
