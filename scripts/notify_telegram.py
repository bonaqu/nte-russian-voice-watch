#!/usr/bin/env python3
"""Optional Telegram notification using free Telegram Bot API.

Environment variables:
  TELEGRAM_BOT_TOKEN
  TELEGRAM_CHAT_ID
The script exits successfully when secrets are absent or no alert is required.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parents[1]
run_result = json.loads((ROOT / "data" / "run-result.json").read_text(encoding="utf-8"))
if not run_result.get("should_alert"):
    print("No alert required")
    raise SystemExit(0)

token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
chat_id = os.getenv("TELEGRAM_CHAT_ID", "").strip()
if not token or not chat_id:
    print("Telegram secrets are not configured; skipping")
    raise SystemExit(0)

text = f"{run_result['alert_title']}\n\n{run_result['alert_body']}"
response = requests.post(
    f"https://api.telegram.org/bot{token}/sendMessage",
    json={"chat_id": chat_id, "text": text[:3900], "disable_web_page_preview": False},
    timeout=20,
)
response.raise_for_status()
print("Telegram alert sent")
