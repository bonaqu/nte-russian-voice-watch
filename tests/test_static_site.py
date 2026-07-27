from pathlib import Path


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
