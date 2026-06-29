#!/usr/bin/env python3
"""Generate 1200×630 Open Graph cards with Telegram-safe margins."""
from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
import math
import sys
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
STATUS = ROOT / "data" / "status.json"
DEFAULT_OUTPUT = ROOT / "assets" / "og" / "og-card.png"
APPEAL_OUTPUT = ROOT / "assets" / "og" / "appeal-card.png"
RELEASE = datetime.fromisoformat("2026-04-29T03:00:00+00:00")

W, H = 1200, 630
SAFE = 86
CARD = (58, 58, W - 58, H - 58)


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


def f(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(font_path(bold), size)


def gradient(size, c1, c2):
    w, h = size
    im = Image.new("RGB", size)
    px = im.load()
    for y in range(h):
        for x in range(w):
            t = x / w * 0.55 + y / h * 0.45
            px[x, y] = tuple(int(c1[i] * (1 - t) + c2[i] * t) for i in range(3))
    return im


def draw_background() -> Image.Image:
    im = gradient((W, H), (6, 8, 17), (29, 22, 59)).convert("RGBA")
    for x, y, r, c in [
        (180, 100, 250, (94, 60, 220, 95)),
        (1050, 520, 280, (18, 126, 167, 70)),
        (820, 80, 160, (255, 76, 155, 38)),
    ]:
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
    d.rounded_rectangle(CARD, radius=34, fill=(11, 15, 30, 212), outline=(166, 145, 255, 62), width=2)
    d.line((SAFE, H - SAFE, W - SAFE, H - SAFE), fill=(166, 145, 255, 28), width=1)
    return im


def draw_mark(im, center, radius, thick=8, accent=(255, 103, 166)):
    d = ImageDraw.Draw(im, "RGBA")
    cx, cy = center
    d.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), outline=(161, 139, 255, 175), width=thick)
    d.arc((cx - radius * .72, cy - radius * .72, cx + radius * .72, cy + radius * .72), 25, 285, fill=(86, 233, 255, 220), width=max(3, thick // 2))
    for ang in (18, 143, 263):
        a = math.radians(ang)
        x = cx + math.cos(a) * radius
        y = cy + math.sin(a) * radius
        d.ellipse((x - 6, y - 6, x + 6, y + 6), fill=(*accent, 230))


def fit_font(draw: ImageDraw.ImageDraw, text: str, max_width: int, start: int, min_size: int, bold: bool = True):
    size = start
    while size >= min_size:
        font = f(size, bold)
        if draw.textlength(text, font=font) <= max_width:
            return font
        size -= 2
    return f(min_size, bold)


def draw_wrapped(draw: ImageDraw.ImageDraw, xy, text: str, font: ImageFont.FreeTypeFont, fill, max_width: int, line_gap: int = 8) -> int:
    words = text.split()
    lines: list[str] = []
    line = ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if draw.textlength(candidate, font=font) <= max_width or not line:
            line = candidate
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    x, y = xy
    for line in lines:
        draw.text((x, y), line, font=font, fill=fill)
        y += font.size + line_gap
    return y


def days_since_release(status: dict) -> int:
    event = status.get("confirmed_event") or {}
    if status.get("state") == "RUSSIAN_VOICE_RELEASED" and event.get("detected_at"):
        end = datetime.fromisoformat(event["detected_at"].replace("Z", "+00:00"))
    else:
        end = datetime.now(timezone.utc)
    return max(0, int((end - RELEASE).total_seconds() // 86400))


def generate_status_card(output: Path) -> None:
    status = json.loads(STATUS.read_text(encoding="utf-8"))
    days = days_since_release(status)
    state_line = {
        "NO_RUSSIAN_VOICE": "Русская озвучка: не анонсирована",
        "POSSIBLE_MENTION": "Найдено возможное упоминание",
        "CONFIRMED_ANNOUNCEMENT": "Русская озвучка анонсирована",
        "RUSSIAN_VOICE_RELEASED": "Русская озвучка доступна",
        "UNKNOWN": "Статус требует повторной проверки",
    }.get(status.get("state"), "Статус требует проверки")
    accent = {
        "NO_RUSSIAN_VOICE": (255, 99, 127),
        "POSSIBLE_MENTION": (255, 214, 107),
        "CONFIRMED_ANNOUNCEMENT": (107, 166, 255),
        "RUSSIAN_VOICE_RELEASED": (93, 240, 184),
        "UNKNOWN": (156, 165, 195),
    }.get(status.get("state"), (156, 165, 195))

    im = draw_background()
    d = ImageDraw.Draw(im, "RGBA")
    draw_mark(im, (980, 202), 92, 7, accent)

    overline = f(22, True)
    title_font = f(58, True)
    number = f(92, True)
    small = f(23, True)
    body = f(28, False)
    foot = f(24, False)

    d.text((SAFE, 98), "NTE · RUSSIAN VOICE WATCH", font=overline, fill=(177, 157, 255, 255))
    d.text((SAFE, 154), "Сколько времени NTE", font=title_font, fill=(246, 247, 255, 255))
    d.text((SAFE, 224), "без русской озвучки?", font=title_font, fill=(103, 225, 255, 255))

    d.text((SAFE, 326), str(days), font=number, fill=(246, 247, 255, 255))
    day_word = "ДЕНЬ" if days % 10 == 1 and days % 100 != 11 else "ДНЕЙ"
    d.text((SAFE + d.textlength(str(days), font=number) + 22, 376), day_word, font=small, fill=(163, 171, 201, 255))

    pill_y = 462
    d.rounded_rectangle((SAFE, pill_y, 742, pill_y + 58), radius=15, fill=(*accent, 26), outline=(*accent, 105), width=2)
    d.text((SAFE + 24, pill_y + 16), state_line, font=small, fill=(*accent, 255))

    footer = "Official sources · Store metadata · History log"
    d.text((SAFE, 552), footer, font=foot, fill=(163, 171, 201, 255))
    output.parent.mkdir(parents=True, exist_ok=True)
    im.convert("RGB").save(output, quality=94, optimize=True)


def generate_appeal_card(output: Path) -> None:
    im = draw_background()
    d = ImageDraw.Draw(im, "RGBA")
    draw_mark(im, (986, 190), 88, 7, (255, 103, 166))

    overline = f(22, True)
    title = f(60, True)
    body = f(29, False)
    pill = f(23, True)
    foot = f(24, False)

    d.text((SAFE, 98), "NTE · RUSSIAN VOICE APPEAL", font=overline, fill=(177, 157, 255, 255))
    d.text((SAFE, 158), "Почему NTE", font=title, fill=(246, 247, 255, 255))
    d.text((SAFE, 228), "нужна русская озвучка?", font=title, fill=(103, 225, 255, 255))

    draw_wrapped(
        d,
        (SAFE, 330),
        "Открытое обращение к разработчикам: русский текст помогает читать историю, но голос создаёт присутствие.",
        body,
        (196, 205, 232, 255),
        max_width=760,
        line_gap=9,
    )

    y = 474
    tags = ["RU", "中文", "EN", "한국어", "日本語"]
    x = SAFE
    for tag in tags:
        width = int(d.textlength(tag, font=pill)) + 34
        d.rounded_rectangle((x, y, x + width, y + 46), radius=13, fill=(143, 120, 255, 38), outline=(143, 120, 255, 95), width=1)
        d.text((x + 17, y + 12), tag, font=pill, fill=(246, 247, 255, 255))
        x += width + 12

    d.text((SAFE, 552), "Reasoned request · Demand assessment · Full official voice pack", font=foot, fill=(163, 171, 201, 255))
    output.parent.mkdir(parents=True, exist_ok=True)
    im.convert("RGB").save(output, quality=94, optimize=True)


def generate(output: Path) -> None:
    generate_status_card(output)


if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "appeal":
        generate_appeal_card(Path(sys.argv[2]))
    else:
        out = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUTPUT
        generate_status_card(out)
        if out == DEFAULT_OUTPUT:
            generate_appeal_card(APPEAL_OUTPUT)
    print("Generated Open Graph card(s)")
