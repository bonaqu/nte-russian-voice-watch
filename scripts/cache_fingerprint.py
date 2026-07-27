"""Create deterministic service-worker cache versions from static source files."""
from hashlib import sha256
from pathlib import Path
import re


CACHE_VERSION_PLACEHOLDER = "__STATIC_CACHE_FINGERPRINT__"
STATIC_CACHE_INPUTS = (
    "index.html",
    "appeal.html",
    "404.html",
    "manifest.webmanifest",
    "assets/css",
    "assets/js",
    "assets/brand",
    "assets/icons",
)
VERSIONABLE_ASSET_URL = re.compile(
    r"(?P<url>assets/[^'\"\s)>]+|(?:\.\./)+(?:brand|icons)/[^'\"\s)>]+|manifest\.webmanifest(?:\?[^'\"\s)>]+)?)"
)


def static_cache_fingerprint(root: Path, inputs=STATIC_CACHE_INPUTS) -> str:
    digest = sha256()
    files = []

    for entry in inputs:
        path = root / entry
        if path.is_dir():
            files.extend(candidate for candidate in path.rglob("*") if candidate.is_file())
        elif path.is_file():
            files.append(path)
        else:
            raise FileNotFoundError(f"Static cache input does not exist: {path}")

    for path in sorted(files, key=lambda candidate: candidate.relative_to(root).as_posix()):
        relative_path = path.relative_to(root).as_posix().encode("utf-8")
        digest.update(relative_path)
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")

    return digest.hexdigest()[:12]


def render_service_worker(source: str, root: Path) -> str:
    if source.count(CACHE_VERSION_PLACEHOLDER) != 1:
        raise ValueError("Service worker must contain exactly one cache-version placeholder")
    return source.replace(CACHE_VERSION_PLACEHOLDER, static_cache_fingerprint(root))


def version_static_asset_urls(source: str, fingerprint: str) -> str:
    """Give static asset requests content-versioned URLs that bypass an old worker."""

    def add_version(match: re.Match) -> str:
        url = match.group("url")
        if "?v=" in url:
            return url
        return f"{url}?v={fingerprint}"

    return VERSIONABLE_ASSET_URL.sub(add_version, source)
