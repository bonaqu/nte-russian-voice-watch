from pathlib import Path

from scripts.cache_fingerprint import (
    CACHE_VERSION_PLACEHOLDER,
    render_service_worker,
    static_cache_fingerprint,
    version_static_asset_urls,
)


ROOT = Path(__file__).resolve().parents[1]
UX_SCRIPT = ROOT / "assets" / "js" / "ux-enhancements.js"


def test_dynamic_status_card_uses_localized_state_codes():
    source = UX_SCRIPT.read_text(encoding="utf-8")

    assert "stateLabel(s.state)" in source
    assert "s.state_label_ru || s.state" not in source


def test_dynamic_status_card_covers_every_public_state_in_every_locale():
    source = UX_SCRIPT.read_text(encoding="utf-8")
    state_codes = (
        "NO_RUSSIAN_VOICE",
        "POSSIBLE_MENTION",
        "CONFIRMED_ANNOUNCEMENT",
        "RUSSIAN_VOICE_RELEASED",
        "UNKNOWN",
    )
    locale_blocks = source.split("const STATE_LABELS = {", 1)[1].split("\n  };", 1)[0]

    for locale in ("ru", "zh", "en", "ko", "ja"):
        block = locale_blocks.split(f"    {locale}: {{", 1)[1].split("\n    }", 1)[0]
        for state_code in state_codes:
            assert f"      {state_code}:" in block


def test_service_worker_cache_version_tracks_static_sources():
    source = (ROOT / "sw.js").read_text(encoding="utf-8")
    rendered = render_service_worker(source, ROOT)

    assert CACHE_VERSION_PLACEHOLDER not in rendered
    assert f"nte-voice-{static_cache_fingerprint(ROOT)}" in rendered


def test_static_cache_fingerprint_changes_with_asset_content(tmp_path):
    asset = tmp_path / "asset.js"
    asset.write_text("old", encoding="utf-8")
    old_fingerprint = static_cache_fingerprint(tmp_path, ("asset.js",))

    asset.write_text("new", encoding="utf-8")

    assert static_cache_fingerprint(tmp_path, ("asset.js",)) != old_fingerprint


def test_versioned_asset_urls_bypass_an_old_service_worker_cache():
    fingerprint = static_cache_fingerprint(ROOT)
    source = (
        '<script src="assets/js/ux-enhancements.js"></script>'
        "<style>background:url('../brand/nte-symbol.svg')</style>"
    )

    rendered = version_static_asset_urls(source, fingerprint)

    assert f"assets/js/ux-enhancements.js?v={fingerprint}" in rendered
    assert f"../brand/nte-symbol.svg?v={fingerprint}" in rendered
    assert version_static_asset_urls(rendered, fingerprint) == rendered


def test_service_worker_precaches_the_same_versioned_script_url_as_html():
    fingerprint = static_cache_fingerprint(ROOT)
    html = version_static_asset_urls((ROOT / "index.html").read_text(encoding="utf-8"), fingerprint)
    worker = version_static_asset_urls(
        render_service_worker((ROOT / "sw.js").read_text(encoding="utf-8"), ROOT),
        fingerprint,
    )
    script_url = f"assets/js/ux-enhancements.js?v={fingerprint}"

    assert script_url in html
    assert f"./{script_url}" in worker
