#!/usr/bin/env python3
"""Check official NTE and store sources and update static JSON data.

Designed for GitHub Actions. No paid API, database, or secret is required.
The script is conservative by design: it separates text support from full audio,
uses structured store fields where possible, and never declares a release from a
single ambiguous keyword hit.
"""
from __future__ import annotations

import hashlib
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import os
from pathlib import Path
import re
import sys
import time
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from detector import (
    STATE_ANNOUNCED,
    STATE_NO_VOICE,
    STATE_POSSIBLE,
    STATE_RELEASED,
    choose_overall_state,
    detect_general,
    detect_playstation_voice_list,
    detect_steam_language_table,
    normalize_text,
)

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
CONFIG_PATH = DATA / "sources.json"
STATUS_PATH = DATA / "status.json"
EVIDENCE_PATH = DATA / "evidence.json"
HISTORY_PATH = DATA / "history.json"
STATE_PATH = DATA / "crawler_state.json"
RUN_RESULT_PATH = DATA / "run-result.json"

RELEASE_UTC = datetime.fromisoformat("2026-04-29T03:00:00+00:00")
MAX_HISTORY = 20_000  # ~13 years at four checks/day.
MAX_EXCERPT = 640

STATE_LABELS = {
    STATE_NO_VOICE: "Русской озвучки нет",
    STATE_POSSIBLE: "Найдено возможное упоминание",
    STATE_ANNOUNCED: "Русская озвучка официально анонсирована",
    STATE_RELEASED: "Русская озвучка доступна",
    "UNKNOWN": "Статус временно не подтверждён",
}


def now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def read_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()


def build_session() -> requests.Session:
    retry = Retry(
        total=1,
        connect=1,
        read=1,
        backoff_factor=0.8,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset({"GET", "HEAD"}),
        respect_retry_after_header=True,
    )
    session = requests.Session()
    session.mount("https://", HTTPAdapter(max_retries=retry))
    session.mount("http://", HTTPAdapter(max_retries=retry))
    session.headers.update(
        {
            "User-Agent": "NTE-Russian-Voice-Watch/1.0 (+https://bonaqu.github.io/nte-russian-voice-watch/; public factual monitor)",
            "Accept-Language": "en,ru;q=0.9,ja;q=0.7,ko;q=0.7,zh-CN;q=0.7",
            "Cache-Control": "no-cache",
        }
    )
    return session


def fetch(session: requests.Session, url: str, timeout: int = 15) -> tuple[int, str, str]:
    response = session.get(url, timeout=timeout, allow_redirects=True)
    response.raise_for_status()
    content_type = response.headers.get("content-type", "")
    if "text" not in content_type and "json" not in content_type and "html" not in content_type:
        raise ValueError(f"unsupported content type: {content_type}")
    if len(response.content) > 5_000_000:
        raise ValueError("document exceeds 5 MB safety limit")
    response.encoding = response.apparent_encoding or response.encoding or "utf-8"
    return response.status_code, response.url, response.text


def html_to_text(html: str) -> tuple[str, BeautifulSoup]:
    soup = BeautifulSoup(html, "html.parser")
    for node in soup(["script", "style", "noscript", "svg", "template"]):
        node.decompose()
    text = normalize_text(soup.get_text("\n", strip=True))
    return text, soup


def clip(text: str, limit: int = MAX_EXCERPT) -> str:
    value = re.sub(r"\s+", " ", text).strip()
    return value if len(value) <= limit else value[: limit - 1].rstrip() + "…"


def parse_steam(soup: BeautifulSoup, text: str):
    rows: list[dict[str, object]] = []
    table = soup.select_one("table.game_language_options")
    if table:
        for tr in table.select("tr"):
            cells = tr.find_all(["td", "th"])
            if len(cells) < 4:
                continue
            lang = cells[0].get_text(" ", strip=True)
            if not lang or lang.lower() in {"languages", "language"}:
                continue
            marks = []
            for cell in cells[1:4]:
                raw = cell.get_text(" ", strip=True).lower()
                has_check = bool(cell.select_one("span.checkcol, img[src*='check'], .ico16")) or "✔" in raw or "✓" in raw
                marks.append(has_check)
            rows.append({"language": lang, "interface": marks[0], "full_audio": marks[1], "subtitles": marks[2]})
    if not rows:
        # Fallback for changed Steam markup. Use a narrow row-like pattern only.
        for line in text.splitlines():
            if re.search(r"\bRussian\b|Русский", line, re.I):
                tokens = re.findall(r"[✓✔]", line)
                if tokens:
                    rows.append({"language": "Russian", "interface": len(tokens) >= 1, "full_audio": len(tokens) >= 3, "subtitles": len(tokens) >= 2})
    return detect_steam_language_table(rows)


def split_language_list(value: str) -> list[str]:
    return [x.strip(" \t\n\r:;•") for x in re.split(r",|/|·|\n", value) if x.strip(" \t\n\r:;•")]


def parse_playstation(text: str):
    compact = re.sub(r"\s+", " ", text)
    voice_match = re.search(r"(?:Voice|音声|음성)\s*:?\s*(.{1,220}?)(?=Screen Languages|表示言語|화면 언어|Release|Platform|Publisher|$)", compact, re.I)
    screen_match = re.search(r"(?:Screen Languages|表示言語|화면 언어)\s*:?\s*(.{1,320}?)(?=Release|Platform|Publisher|Genres|$)", compact, re.I)
    voices = split_language_list(voice_match.group(1)) if voice_match else []
    screens = split_language_list(screen_match.group(1)) if screen_match else []
    return detect_playstation_voice_list(voices, screens)


def discover_article_links(soup: BeautifulSoup, base_url: str, max_links: int) -> list[dict[str, str]]:
    host = urlparse(base_url).netloc
    found: list[dict[str, str]] = []
    seen: set[str] = set()
    for anchor in soup.find_all("a", href=True):
        url = urljoin(base_url, anchor["href"])
        parsed = urlparse(url)
        if parsed.netloc != host:
            continue
        if not re.search(r"/article/(?:news|notice)/", parsed.path, re.I):
            continue
        clean = parsed._replace(query="", fragment="").geturl()
        if clean in seen:
            continue
        seen.add(clean)
        title = clip(anchor.get_text(" ", strip=True), 180) or clean.rsplit("/", 1)[-1]
        found.append({"url": clean, "title": title})
        if len(found) >= max_links:
            break
    return found


def source_result(source: dict, checked_at: str, **updates: Any) -> dict:
    base = {
        "id": source["id"],
        "title": source["title"],
        "url": source["url"],
        "category": source.get("category", "official"),
        "language": source.get("language", "unknown"),
        "authority": int(source.get("authority", 2)),
        "checked_at": checked_at,
        "ok": False,
        "http_status": None,
        "classification": "error",
        "confidence": "low",
        "quote": "",
        "reason": "",
        "content_hash": "",
    }
    base.update(updates)
    return base


def check_single(session: requests.Session, source: dict, checked_at: str) -> tuple[dict, BeautifulSoup | None]:
    try:
        status, final_url, html = fetch(session, source["url"])
        text, soup = html_to_text(html)
        kind = source.get("kind", "general")
        if kind == "steam":
            detection = parse_steam(soup, text)
        elif kind == "playstation":
            detection = parse_playstation(text)
        else:
            detection = detect_general(text)
        quote = detection.matched_text or source.get("baseline_excerpt", "")
        return source_result(
            source,
            checked_at,
            url=final_url,
            ok=True,
            http_status=status,
            classification=detection.classification,
            confidence=detection.confidence,
            quote=clip(quote),
            reason=detection.reason,
            content_hash=sha256(text),
        ), soup
    except Exception as exc:  # network/parser failures are evidence health, not voice status.
        return source_result(source, checked_at, reason=f"{type(exc).__name__}: {exc}"), None


def check_article(session: requests.Session, parent: dict, article: dict, checked_at: str) -> dict:
    derived = {
        "id": f"{parent['id']}:{sha256(article['url'])[:12]}",
        "title": article.get("title") or "Official NTE article",
        "url": article["url"],
        "category": "official_news",
        "language": parent.get("language", "unknown"),
        "authority": 1,
        "kind": "general",
    }
    result, _ = check_single(session, derived, checked_at)
    result["parent_id"] = parent["id"]
    return result


def meaningful_signature(result: dict) -> str:
    return "|".join(
        [
            str(result.get("id", "")),
            str(result.get("classification", "")),
            str(result.get("content_hash", "")),
            str(result.get("ok", False)),
        ]
    )


def build_status(previous: dict, results: list[dict], checked: datetime) -> dict:
    state, confidence = choose_overall_state(results)
    ok_count = sum(1 for r in results if r.get("ok"))
    failed_count = len(results) - ok_count
    previous_state = previous.get("state", STATE_NO_VOICE)
    state_changed = state != previous_state
    last_change_at = iso(checked) if state_changed else previous.get("last_change_at", previous.get("last_checked_at"))
    confirmed_event = previous.get("confirmed_event")
    if state in {STATE_ANNOUNCED, STATE_RELEASED} and state_changed:
        strongest = next((r for r in results if r.get("classification") in {"released", "announced"}), None)
        confirmed_event = {
            "detected_at": iso(checked),
            "source": strongest.get("url") if strongest else None,
            "title": strongest.get("title") if strongest else None,
            "classification": strongest.get("classification") if strongest else None,
        }
    if state not in {STATE_ANNOUNCED, STATE_RELEASED}:
        confirmed_event = None

    return {
        "schema_version": 2,
        "project": {
            "name": "NTE Russian Voice Watch",
            "game": "NTE: Neverness to Everness",
            "repository": "https://github.com/bonaqu/nte-russian-voice-watch",
            "site": "https://bonaqu.github.io/nte-russian-voice-watch/",
            "unofficial": True,
        },
        "release": {
            "utc": "2026-04-29T03:00:00Z",
            "official_local": "2026-04-29 11:00 (UTC+8)",
            "source": "https://nte.perfectworld.com/ru/article/news/gamebroad/20260426/261935.html",
        },
        "state": state,
        "state_label_ru": STATE_LABELS[state],
        "confidence": confidence,
        "last_checked_at": iso(checked),
        "last_change_at": last_change_at,
        "check_interval_hours": 6,
        "source_health": {"total": len(results), "successful": ok_count, "failed": failed_count},
        "russian_text": {"supported": True, "label": "Русский интерфейс и субтитры доступны"},
        "russian_voice": {
            "supported": state == STATE_RELEASED,
            "announced": state in {STATE_ANNOUNCED, STATE_RELEASED},
            "label": STATE_LABELS[state],
        },
        "known_voice_languages": ["Chinese", "English", "Japanese", "Korean"],
        "confirmed_event": confirmed_event,
        "state_changed": state_changed,
        "methodology_version": "1.0.0",
    }


def main() -> int:
    checked = now_utc()
    checked_at = iso(checked)
    config = read_json(CONFIG_PATH, {})
    sources = config.get("sources", [])
    if not sources:
        print("No sources configured", file=sys.stderr)
        return 2

    previous_status = read_json(STATUS_PATH, {})
    previous_evidence = read_json(EVIDENCE_PATH, {"results": []})
    crawler_state = read_json(STATE_PATH, {"known_articles": {}, "last_hashes": {}})
    known_articles: dict[str, list[str]] = crawler_state.setdefault("known_articles", {})

    results: list[dict] = []
    hub_soups: list[tuple[dict, BeautifulSoup]] = []

    def run_source(source: dict):
        return source, *check_single(build_session(), source, checked_at)

    worker_count = max(2, min(int(config.get("max_workers", 6)), 8))
    with ThreadPoolExecutor(max_workers=worker_count) as executor:
        futures = [executor.submit(run_source, source) for source in sources]
        for future in as_completed(futures):
            source, result, soup = future.result()
            results.append(result)
            if source.get("discover_articles") and soup is not None:
                hub_soups.append((source, soup))

    # Crawl only unseen articles plus a few newest links to catch edits, keeping traffic polite.
    for hub, soup in hub_soups:
        discovered = discover_article_links(soup, hub["url"], int(hub.get("max_discovered_links", 12)))
        previously_known = set(known_articles.get(hub["id"], []))
        new_links = [item for item in discovered if item["url"] not in previously_known]
        refresh_links = discovered[: int(hub.get("refresh_recent_links", 3))]
        queue: list[dict[str, str]] = []
        queued: set[str] = set()
        for item in [*new_links, *refresh_links]:
            if item["url"] not in queued:
                queued.add(item["url"])
                queue.append(item)
        article_queue = queue[: int(hub.get("max_article_fetches_per_run", 8))]
        with ThreadPoolExecutor(max_workers=min(4, max(1, len(article_queue)))) as executor:
            futures = [executor.submit(check_article, build_session(), hub, article, checked_at) for article in article_queue]
            for future in as_completed(futures):
                results.append(future.result())
        known_articles[hub["id"]] = list(dict.fromkeys([item["url"] for item in discovered] + list(previously_known)))[:500]

    # Preserve last successful structured evidence when a transient source failure occurs,
    # but clearly mark it stale instead of pretending the current request succeeded.
    old_by_id = {r.get("id"): r for r in previous_evidence.get("results", [])}
    for result in results:
        if result.get("ok"):
            continue
        old = old_by_id.get(result.get("id"))
        if old and old.get("ok"):
            result["last_successful_classification"] = old.get("classification")
            result["last_successful_quote"] = old.get("quote")
            result["last_successful_checked_at"] = old.get("checked_at")

    status = build_status(previous_status, results, checked)
    evidence = {
        "schema_version": 2,
        "generated_at": checked_at,
        "methodology": "Structured store fields + explicit multilingual voice-over patterns; generic Russian text support is ignored.",
        "results": sorted(results, key=lambda r: (int(r.get("authority", 9)), str(r.get("category", "")), str(r.get("title", "")))),
    }

    history = read_json(HISTORY_PATH, {"schema_version": 2, "entries": []})
    entries = history.setdefault("entries", [])
    previous_signature = previous_status.get("evidence_signature")
    current_signature = sha256("\n".join(sorted(meaningful_signature(r) for r in results)))
    status["evidence_signature"] = current_signature
    changed = status.get("state_changed") or current_signature != previous_signature
    elapsed_seconds = max(0, int((checked - RELEASE_UTC).total_seconds()))
    entries.append(
        {
            "checked_at": checked_at,
            "state": status["state"],
            "state_label_ru": status["state_label_ru"],
            "confidence": status["confidence"],
            "successful": status["source_health"]["successful"],
            "failed": status["source_health"]["failed"],
            "changed": bool(changed),
            "elapsed_seconds": elapsed_seconds,
            "evidence_signature": current_signature[:16],
        }
    )
    history["entries"] = entries[-MAX_HISTORY:]
    history["generated_at"] = checked_at

    prior_state = previous_status.get("state")
    should_alert = status["state"] in {STATE_POSSIBLE, STATE_ANNOUNCED, STATE_RELEASED} and status["state"] != prior_state
    alert_sources = [
        r for r in results if r.get("classification") in {"possible", "announced", "released"}
    ][:5]
    run_result = {
        "checked_at": checked_at,
        "state": status["state"],
        "previous_state": prior_state,
        "state_changed": status["state_changed"],
        "should_alert": should_alert,
        "alert_title": f"NTE voice monitor: {status['state_label_ru']}",
        "alert_body": "\n\n".join(
            [
                f"Detected state: **{status['state']}**",
                *[f"- [{r['title']}]({r['url']}): {r.get('quote') or r.get('reason')}" for r in alert_sources],
                "This is an automated signal. Verify the original source before publishing a final claim.",
            ]
        ),
    }

    write_json(STATUS_PATH, status)
    write_json(EVIDENCE_PATH, evidence)
    write_json(HISTORY_PATH, history)
    write_json(STATE_PATH, crawler_state)
    write_json(RUN_RESULT_PATH, run_result)

    print(json.dumps(run_result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
