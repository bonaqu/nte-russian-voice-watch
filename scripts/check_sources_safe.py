#!/usr/bin/env python3
"""Run the monitor with a public-status safety layer.

Community and media pages are useful as an early-warning watchlist, but they must not
change the public status of Russian voice-over. Only official pages and store metadata
are allowed to move the main state to possible / announced / released.
"""
from __future__ import annotations

import json
from pathlib import Path

import check_sources
from detector import choose_overall_state

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
STATUS_PATH = DATA / "status.json"
EVIDENCE_PATH = DATA / "evidence.json"
RUN_RESULT_PATH = DATA / "run-result.json"
TRUSTED_AUTHORITY_MAX = check_sources.TRUSTED_AUTHORITY_MAX


def trusted_only_state(results: list[dict]):
    trusted = [r for r in results if int(r.get("authority", 3)) <= TRUSTED_AUTHORITY_MAX]
    return choose_overall_state(trusted)


def postprocess_public_outputs() -> None:
    status = json.loads(STATUS_PATH.read_text(encoding="utf-8"))
    evidence = json.loads(EVIDENCE_PATH.read_text(encoding="utf-8"))
    run_result = json.loads(RUN_RESULT_PATH.read_text(encoding="utf-8"))

    results = evidence.get("results", [])
    trusted = [r for r in results if int(r.get("authority", 3)) <= TRUSTED_AUTHORITY_MAX]
    watch = [r for r in results if int(r.get("authority", 3)) > TRUSTED_AUTHORITY_MAX]

    trusted_ok = sum(1 for r in trusted if r.get("ok"))
    trusted_failed = len(trusted) - trusted_ok
    watch_ok = sum(1 for r in watch if r.get("ok"))
    watch_signals = [r for r in watch if r.get("ok") and r.get("classification") in {"possible", "announced", "released"}]

    # Hide failed optional watchlist pages from the public evidence list. Official/store
    # errors stay visible because they are relevant to trust and freshness.
    evidence["results"] = [r for r in results if int(r.get("authority", 3)) <= TRUSTED_AUTHORITY_MAX or r in watch_signals]
    evidence["methodology"] = (
        "Public status is based only on official sources and store metadata. "
        "Community/media sources are watchlist-only: they may surface an unverified signal, "
        "but cannot change the main status without official/store confirmation."
    )

    status["source_health"]["total"] = len(trusted)
    status["source_health"]["successful"] = trusted_ok
    status["source_health"]["failed"] = trusted_failed
    status["source_health"]["official_or_store"] = len(trusted)
    status["source_health"]["non_official_watch"] = len(watch)
    status["source_health"]["non_official_successful"] = watch_ok
    status["source_health"]["unverified_watch_signals"] = len(watch_signals)

    # Do not notify from watchlist-only noise. If a community source saw something,
    # it remains visible as an unverified signal in Evidence, but not as a fact alert.
    if status.get("state") == "NO_RUSSIAN_VOICE":
        run_result["should_alert"] = False
        run_result["alert_title"] = "NTE voice monitor: Русской озвучки нет"
        if watch_signals:
            run_result["watchlist_note"] = "Unverified community/media signal exists; official/store confirmation required."

    STATUS_PATH.write_text(json.dumps(status, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    EVIDENCE_PATH.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    RUN_RESULT_PATH.write_text(json.dumps(run_result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    check_sources.choose_overall_state = trusted_only_state
    code = check_sources.main()
    if code == 0:
        postprocess_public_outputs()
    return code


if __name__ == "__main__":
    raise SystemExit(main())
