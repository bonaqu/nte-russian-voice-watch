"""Deterministic multilingual detector for Russian voice-over evidence.

The detector deliberately separates text-language support from voice-over support.
It never promotes a generic "Russian language supported" phrase to a voice claim.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
import re
from typing import Iterable


STATE_NO_VOICE = "NO_RUSSIAN_VOICE"
STATE_POSSIBLE = "POSSIBLE_MENTION"
STATE_ANNOUNCED = "CONFIRMED_ANNOUNCEMENT"
STATE_RELEASED = "RUSSIAN_VOICE_RELEASED"
STATE_UNKNOWN = "UNKNOWN"


@dataclass(slots=True)
class Detection:
    classification: str
    confidence: str
    matched_text: str = ""
    reason: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


# Explicit Russian + voice pairings. Generic language support is intentionally absent.
EXPLICIT_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"\brussian\b.{0,45}\b(?:voice(?:-?over)?|full\s+audio|audio\s+language|dub(?:bing)?)\b", re.I | re.S),
    re.compile(r"\b(?:voice(?:-?over)?|full\s+audio|audio\s+language|dub(?:bing)?)\b.{0,45}\brussian\b", re.I | re.S),
    re.compile(r"русск(?:ая|ую|ой|ое|ий|ого|ому|им|ом)?\s+(?:озвучк\w*|дубляж\w*|голос\w*)", re.I),
    re.compile(r"(?:озвучк\w*|дубляж\w*|голос\w*)\s+(?:на\s+)?русск\w*", re.I),
    re.compile(r"(?:俄语|俄文).{0,12}(?:配音|语音)", re.I | re.S),
    re.compile(r"(?:配音|语音).{0,12}(?:俄语|俄文)", re.I | re.S),
    re.compile(r"ロシア語.{0,12}(?:音声|ボイス|吹替)", re.I | re.S),
    re.compile(r"(?:音声|ボイス|吹替).{0,12}ロシア語", re.I | re.S),
    re.compile(r"러시아어.{0,12}(?:음성|더빙|보이스)", re.I | re.S),
    re.compile(r"(?:음성|더빙|보이스).{0,12}러시아어", re.I | re.S),
)

NEGATION_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"(?:no|not|without|isn['’]?t|is\s+not|currently\s+unavailable).{0,35}(?:russian|voice|audio|dub)", re.I | re.S),
    re.compile(r"(?:russian|voice|audio|dub).{0,35}(?:not\s+available|not\s+supported|unavailable|absent)", re.I | re.S),
    re.compile(r"(?:нет|без|не\s+будет|не\s+поддерживается|не\s+доступн\w*).{0,35}(?:русск\w*|озвучк\w*|дубляж\w*)", re.I | re.S),
    re.compile(r"(?:русск\w*|озвучк\w*|дубляж\w*).{0,35}(?:нет|не\s+будет|не\s+поддерживается|не\s+доступн\w*)", re.I | re.S),
    re.compile(r"(?:未対応|なし|ありません|未実装).{0,20}(?:ロシア語|音声|ボイス|吹替)", re.I | re.S),
    re.compile(r"(?:不支持|没有|暂无|未提供).{0,20}(?:俄语|俄文|配音|语音)", re.I | re.S),
    re.compile(r"(?:지원하지|없음|미지원).{0,20}(?:러시아어|음성|더빙)", re.I | re.S),
)

FUTURE_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"\b(?:coming|planned|will\s+be\s+added|will\s+support|roadmap|in\s+development|soon)\b", re.I),
    re.compile(r"(?:планиру\w*|добав\w*|появит\w*|скоро|в\s+разработке|будет\s+доступн\w*)", re.I),
    re.compile(r"(?:今後|予定|追加予定|実装予定|近日)", re.I),
    re.compile(r"(?:计划|即将|未来|后续|将支持|将加入)", re.I),
    re.compile(r"(?:예정|추가될|지원할|곧|향후)", re.I),
)

AVAILABLE_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"\b(?:available\s+now|now\s+available|supported|full\s+audio|voice\s+language)\b", re.I),
    re.compile(r"(?:уже\s+доступн\w*|добавлен\w*|поддерживается|вышл\w*|релиз\w*)", re.I),
    re.compile(r"(?:対応済み|実装済み|配信開始|利用可能)", re.I),
    re.compile(r"(?:现已|已经|支持|上线|实装)", re.I),
    re.compile(r"(?:지원됨|추가되었습니다|이용\s*가능|출시)", re.I),
)


VOICE_SECTION_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"(?:voice(?:-?over)?\s+languages?|audio\s+languages?|full\s+audio)\s*[:：]\s*([^\n]{1,260})", re.I),
    re.compile(r"(?:язык(?:и)?\s+озвуч(?:ивания|ки)?|озвучк\w*)\s*[:：]\s*([^\n]{1,260})", re.I),
    re.compile(r"(?:配音语言|语音语言)\s*[:：]\s*([^\n]{1,260})", re.I),
    re.compile(r"(?:ボイス言語|収録ボイス|音声言語)\s*[:：]\s*([^\n]{1,260})", re.I),
    re.compile(r"(?:음성\s*언어|보이스\s*언어|더빙\s*언어)\s*[:：]\s*([^\n]{1,260})", re.I),
)

RUSSIAN_TOKEN = re.compile(r"\bRussian\b|русск\w*|俄语|俄文|ロシア語|러시아어", re.I)


def detect_structured_voice_section(text: str) -> Detection | None:
    """Read explicit voice-language lists before proximity rules.

    This prevents a common false positive where Russian appears at the end of
    a text-language list immediately before a separate Voice Languages label.
    """
    for pattern in VOICE_SECTION_PATTERNS:
        match = pattern.search(text)
        if not match:
            continue
        voice_list = re.split(r"(?:game\s+languages?|screen\s+languages?|text\s+languages?|interface|subtitles?|язык(?:и)?\s+(?:игры|текста|интерфейса)|游戏语言|文本语言|テキスト言語|表示言語|게임\s*언어|화면\s*언어)", match.group(1), maxsplit=1, flags=re.I)[0]
        excerpt = re.sub(r"\s+", " ", match.group(0)[:320]).strip()
        if RUSSIAN_TOKEN.search(voice_list):
            return Detection("released", "high", excerpt, "Russian is explicitly listed in a voice-language field")
        return Detection("not_listed", "high", excerpt, "voice-language field exists and does not include Russian")
    return None

GENERIC_RUSSIAN_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"\brussian\b", re.I),
    re.compile(r"русск\w*", re.I),
    re.compile(r"俄语|俄文", re.I),
    re.compile(r"ロシア語", re.I),
    re.compile(r"러시아어", re.I),
)

VOICE_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"voice|audio|dub", re.I),
    re.compile(r"озвуч|дубляж|голос", re.I),
    re.compile(r"配音|语音", re.I),
    re.compile(r"音声|ボイス|吹替", re.I),
    re.compile(r"음성|더빙|보이스", re.I),
)

TEXT_ONLY_LABELS: tuple[re.Pattern[str], ...] = (
    re.compile(r"game\s+languages?|screen\s+languages?|text\s+languages?|interface|subtitles?", re.I),
    re.compile(r"язык(?:и)?\s+(?:игры|интерфейса|текста)|субтитр", re.I),
    re.compile(r"游戏语言|文本语言|界面语言|字幕", re.I),
    re.compile(r"テキスト言語|表示言語|字幕", re.I),
    re.compile(r"게임\s*언어|화면\s*언어|자막", re.I),
)


def normalize_text(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[\t\r\f\v]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def _window(text: str, start: int, end: int, radius: int = 160) -> str:
    lo = max(0, start - radius)
    hi = min(len(text), end + radius)
    return re.sub(r"\s+", " ", text[lo:hi]).strip()


def _is_negated(context: str) -> bool:
    return any(pattern.search(context) for pattern in NEGATION_PATTERNS)


def detect_general(text: str) -> Detection:
    """Detect explicit multilingual Russian voice-over claims in arbitrary text."""
    text = normalize_text(text)
    if not text:
        return Detection("neutral", "low", reason="empty document")

    structured = detect_structured_voice_section(text)
    if structured is not None:
        return structured

    for pattern in EXPLICIT_PATTERNS:
        match = pattern.search(text)
        if not match:
            continue
        context = _window(text, match.start(), match.end())
        if _is_negated(context):
            return Detection(
                "not_available",
                "high",
                matched_text=context,
                reason="explicit Russian voice mention is negated",
            )
        if any(p.search(context) for p in FUTURE_PATTERNS):
            return Detection(
                "announced",
                "high",
                matched_text=context,
                reason="explicit Russian voice mention with future/announcement wording",
            )
        if any(p.search(context) for p in AVAILABLE_PATTERNS):
            return Detection(
                "released",
                "high",
                matched_text=context,
                reason="explicit Russian voice mention with availability wording",
            )
        return Detection(
            "possible",
            "medium",
            matched_text=context,
            reason="explicit Russian voice pairing found without clear timing",
        )

    # Weak signal: Russian and voice terms occur close together, but may be a list boundary.
    russian_hits = [m for p in GENERIC_RUSSIAN_PATTERNS for m in p.finditer(text)]
    voice_hits = [m for p in VOICE_PATTERNS for m in p.finditer(text)]
    for r in russian_hits:
        for v in voice_hits:
            if abs(r.start() - v.start()) <= 90:
                context = _window(text, min(r.start(), v.start()), max(r.end(), v.end()), radius=100)
                if _is_negated(context):
                    return Detection("not_available", "medium", context, "nearby mention is explicitly negated")
                if any(label.search(context) for label in TEXT_ONLY_LABELS):
                    continue
                return Detection("possible", "low", context, "Russian and voice terms are nearby but not explicit")

    return Detection("neutral", "high", reason="no explicit Russian voice-over claim found")


def detect_steam_language_table(rows: Iterable[dict[str, object]]) -> Detection:
    """Inspect normalized Steam language rows.

    Expected row shape: {"language": "Russian", "interface": bool,
    "full_audio": bool, "subtitles": bool}
    """
    for row in rows:
        language = str(row.get("language", "")).strip().lower()
        if language in {"russian", "русский"}:
            full_audio = bool(row.get("full_audio"))
            excerpt = (
                f"Steam language row — {row.get('language')}: "
                f"interface={bool(row.get('interface'))}, "
                f"full_audio={full_audio}, subtitles={bool(row.get('subtitles'))}"
            )
            if full_audio:
                return Detection("released", "high", excerpt, "Steam marks Russian Full Audio")
            return Detection("not_listed", "high", excerpt, "Steam Russian row does not mark Full Audio")
    return Detection("neutral", "low", reason="Russian row was not found in Steam table")


def detect_playstation_voice_list(voice_languages: Iterable[str], screen_languages: Iterable[str]) -> Detection:
    voices = [str(x).strip() for x in voice_languages if str(x).strip()]
    screens = [str(x).strip() for x in screen_languages if str(x).strip()]
    voice_lower = {x.casefold() for x in voices}
    screen_lower = {x.casefold() for x in screens}
    russian_names = {"russian", "русский", "ロシア語", "러시아어", "俄语", "俄文"}
    has_voice = bool(voice_lower & russian_names)
    has_screen = bool(screen_lower & russian_names)
    excerpt = f"PlayStation Voice: {', '.join(voices) or 'unknown'}; Screen Languages: {', '.join(screens) or 'unknown'}"
    if has_voice:
        return Detection("released", "high", excerpt, "PlayStation lists Russian under Voice")
    if has_screen and voices:
        return Detection("not_listed", "high", excerpt, "Russian is a screen language but not a voice language")
    return Detection("neutral", "medium", excerpt, "PlayStation language metadata was incomplete")


def choose_overall_state(results: Iterable[dict]) -> tuple[str, str]:
    """Choose a conservative public state from individual source results."""
    results = list(results)
    official_released = [r for r in results if r.get("classification") == "released" and int(r.get("authority", 3)) <= 2]
    official_announced = [r for r in results if r.get("classification") == "announced" and int(r.get("authority", 3)) <= 2]
    possible = [r for r in results if r.get("classification") == "possible"]
    baseline_no = [r for r in results if r.get("classification") in {"not_listed", "not_available"}]
    successful = [r for r in results if r.get("ok")]

    # A store's structured Full Audio/Voice field or a direct official release statement is enough.
    if official_released:
        return STATE_RELEASED, "high"
    if official_announced:
        return STATE_ANNOUNCED, "high"
    if possible:
        return STATE_POSSIBLE, "medium"
    independent_categories = {str(r.get("category", "")) for r in baseline_no}
    if len(successful) >= 2 and len(independent_categories) >= 2:
        return STATE_NO_VOICE, "high"
    if successful:
        return STATE_UNKNOWN, "low"
    return STATE_UNKNOWN, "low"
