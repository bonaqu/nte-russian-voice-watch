from scripts.detector import (
    STATE_ANNOUNCED,
    STATE_NO_VOICE,
    STATE_RELEASED,
    choose_overall_state,
    detect_general,
    detect_playstation_voice_list,
    detect_steam_language_table,
)


def test_generic_language_support_is_not_voice():
    result = detect_general("Game Languages: English, Russian. Voice-Over Languages: English, Japanese, Korean, Chinese")
    assert result.classification == "not_listed"


def test_russian_announcement():
    result = detect_general("Russian voice-over will be added in version 1.3 and is currently in development.")
    assert result.classification == "announced"


def test_russian_release():
    result = detect_general("Русская озвучка уже доступна после сегодняшнего обновления.")
    assert result.classification == "released"


def test_negative_russian_voice():
    result = detect_general("Русская озвучка пока не доступна.")
    assert result.classification == "not_available"


def test_chinese_announcement():
    result = detect_general("俄语配音将在后续版本加入。")
    assert result.classification == "announced"


def test_japanese_release():
    result = detect_general("ロシア語音声が実装済みです。")
    assert result.classification == "released"


def test_korean_announcement():
    result = detect_general("러시아어 더빙이 향후 업데이트에 추가될 예정입니다.")
    assert result.classification == "announced"


def test_steam_full_audio_false():
    result = detect_steam_language_table([
        {"language": "Russian", "interface": True, "full_audio": False, "subtitles": True}
    ])
    assert result.classification == "not_listed"


def test_steam_full_audio_true():
    result = detect_steam_language_table([
        {"language": "Russian", "interface": True, "full_audio": True, "subtitles": True}
    ])
    assert result.classification == "released"


def test_playstation_separates_voice_and_screen():
    result = detect_playstation_voice_list(
        ["Chinese", "English", "Japanese", "Korean"],
        ["English", "Russian", "Japanese"],
    )
    assert result.classification == "not_listed"


def test_overall_no_voice_requires_independent_categories():
    state, confidence = choose_overall_state([
        {"ok": True, "classification": "not_listed", "category": "store_steam", "authority": 1},
        {"ok": True, "classification": "not_listed", "category": "store_playstation", "authority": 1},
    ])
    assert state == STATE_NO_VOICE
    assert confidence == "high"


def test_overall_official_announcement_wins():
    state, _ = choose_overall_state([
        {"ok": True, "classification": "announced", "category": "official_news", "authority": 1},
        {"ok": True, "classification": "not_listed", "category": "store_steam", "authority": 1},
    ])
    assert state == STATE_ANNOUNCED


def test_overall_store_release_wins():
    state, _ = choose_overall_state([
        {"ok": True, "classification": "released", "category": "store_steam", "authority": 1},
    ])
    assert state == STATE_RELEASED
