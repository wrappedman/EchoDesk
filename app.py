from __future__ import annotations

"""EchoDesk — a local-first desktop music player with a small web UI.

The UI is served from this process and opened in a frameless pywebview window.
Run ``python app.py --web`` to use the same UI in a browser during development.
"""

import base64
import difflib
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import html as html_lib
import ipaddress
import http.server
from html.parser import HTMLParser
import json
import mimetypes
import os
import re
import shutil
import socket
import socketserver
import sys
import threading
import time
import traceback
import urllib.error
import urllib.parse
import urllib.request
import uuid
import wave
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any

APP_NAME = "EchoDesk"
APP_VERSION = "1.0.5"
AUDIO_EXTENSIONS = {".mp3", ".wav", ".ogg", ".oga", ".flac", ".m4a", ".aac", ".opus", ".wma", ".aiff", ".aif"}
USER_AGENT = f"EchoDesk/{APP_VERSION} (local music library; contact: mailto:inbox.ehsani@gmail.com)"


def is_client_disconnect_error(exc: BaseException) -> bool:
    """Recognize canceled client sockets, including Windows WSAECONNABORTED."""
    if isinstance(exc, (BrokenPipeError, ConnectionError)):
        return True
    return getattr(exc, "winerror", None) == 10053 or getattr(exc, "errno", None) == 10053


def resource_root() -> Path:
    # PyInstaller --onefile unpacks bundled web assets to _MEIPASS.
    return Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))


WEB_ROOT = resource_root() / "web"


def default_data_dir() -> Path:
    explicit = os.environ.get("ECHODESK_DATA_DIR")
    if explicit:
        return Path(explicit).expanduser().resolve()
    if os.name == "nt":
        return Path(os.environ.get("APPDATA", Path.home() / "AppData" / "Roaming")) / APP_NAME
    if sys.platform == "darwin":
        return Path.home() / "Library" / "Application Support" / APP_NAME
    return Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share")) / "echodesk"


DATA_DIR = default_data_dir()
ART_DIR = DATA_DIR / "artwork"
LYRICS_DIR = DATA_DIR / "lyrics"
DOWNLOAD_DIR = DATA_DIR / "downloads"
DEMO_DIR = DATA_DIR / "demo"
BACKUP_DIR = DATA_DIR / "backups"
LIBRARY_FILE = DATA_DIR / "library.json"
PLAYLISTS_FILE = DATA_DIR / "playlists.json"
SETTINGS_FILE = DATA_DIR / "settings.json"
DATA_LOCK = threading.RLock()
TASK_LOCK = threading.RLock()
DESKTOP_MODE = False
ALLOW_EXTERNAL_BACKUP_PATH = False

DEFAULT_SETTINGS: dict[str, Any] = {
    "theme": "dark",
    "defaultVolume": 0.72,
    "includeMusicInBackup": True,
    "reduceMotion": False,
    "firstRunComplete": False,
    "uiVersion": 4,
}

ONLINE_RESULTS: dict[str, dict[str, Any]] = {}
DOWNLOAD_TASKS: dict[str, dict[str, Any]] = {}
SYNC_TASK: dict[str, Any] = {"status": "idle", "done": 0, "total": 0, "message": ""}
BACKUP_TASKS: dict[str, dict[str, Any]] = {}


def ensure_directories() -> None:
    for folder in (DATA_DIR, ART_DIR, LYRICS_DIR, DOWNLOAD_DIR, DEMO_DIR, BACKUP_DIR):
        folder.mkdir(parents=True, exist_ok=True)
    if not SETTINGS_FILE.exists():
        write_json(SETTINGS_FILE, DEFAULT_SETTINGS)
    if not PLAYLISTS_FILE.exists():
        write_json(PLAYLISTS_FILE, [])
    if not LIBRARY_FILE.exists():
        write_json(LIBRARY_FILE, [])
    ensure_first_run_samples()


def read_json(path: Path, fallback: Any) -> Any:
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError, TypeError):
        return fallback


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    with temp.open("w", encoding="utf-8") as handle:
        json.dump(value, handle, ensure_ascii=False, indent=2)
    temp.replace(path)


def load_library() -> list[dict[str, Any]]:
    value = read_json(LIBRARY_FILE, [])
    return value if isinstance(value, list) else []


def save_library(value: list[dict[str, Any]]) -> None:
    write_json(LIBRARY_FILE, value)


def load_playlists() -> list[dict[str, Any]]:
    value = read_json(PLAYLISTS_FILE, [])
    return value if isinstance(value, list) else []


def save_playlists(value: list[dict[str, Any]]) -> None:
    write_json(PLAYLISTS_FILE, value)


def load_settings() -> dict[str, Any]:
    value = read_json(SETTINGS_FILE, {})
    if not isinstance(value, dict):
        value = {}
    settings = {**DEFAULT_SETTINGS, **value}
    theme = str(settings.get("theme", "dark")).lower()
    settings["theme"] = theme if theme in {"dark", "light"} else "dark"
    # Drop the retired Mood & Moment preference when loading older settings files.
    settings.pop("customMoods", None)
    return settings


def ensure_first_run_samples() -> None:
    """Seed three tiny, original demonstration loops on a fresh installation."""
    with DATA_LOCK:
        settings = load_settings()
        raw_settings = read_json(SETTINGS_FILE, {})
        migrated = not isinstance(raw_settings, dict) or raw_settings.get("uiVersion") != 4
        if migrated:
            settings["uiVersion"] = 4
        library = load_library()
        library_changed = False
        for item in library:
            if isinstance(item, dict) and "mood" in item:
                item.pop("mood", None)
                library_changed = True
        if library_changed:
            save_library(library)
        if settings.get("firstRunComplete"):
            if migrated:
                write_json(SETTINGS_FILE, settings)
            return
        if not library:
            samples = [
                ("first-light", "First Light", "EchoDesk Studio", "Morning Notes", "Ambient", ["Demo", "Instrumental"]),
                ("blue-hour", "Blue Hour", "EchoDesk Studio", "Quiet Loops", "Downtempo", ["Demo", "Night"]),
                ("paper-planes", "Paper Planes", "EchoDesk Studio", "Soft Shapes", "Electronic", ["Demo", "Instrumental"]),
                ("slow-bloom", "Slow Bloom", "EchoDesk Studio", "Slow Bloom", "Ambient", ["Demo", "Sunset"]),
            ]
            for key, title, artist, album, genre, tags in samples:
                audio_src = WEB_ROOT / "assets" / "audio" / f"{key}.wav"
                cover_src = WEB_ROOT / "assets" / "covers" / f"{key}.svg"
                audio_dst = DEMO_DIR / f"{key}.wav"
                cover_dst = ART_DIR / f"{key}.svg"
                if audio_src.is_file() and not audio_dst.exists():
                    shutil.copy2(audio_src, audio_dst)
                if cover_src.is_file() and not cover_dst.exists():
                    shutil.copy2(cover_src, cover_dst)
                if audio_dst.is_file():
                    library.append({
                        "id": f"sample-{key}",
                        "path": str(audio_dst),
                        "title": title,
                        "artist": artist,
                        "album": album,
                        "genre": genre,
                        "tags": tags,
                        "duration": 16.0,
                        "artworkPath": str(cover_dst) if cover_dst.is_file() else "",
                        "artistImagePath": "",
                        "lyricsPath": "",
                        "lastPlayedAt": "",
                        "playCount": 0,
                        "source": "EchoDesk Original Demo",
                        "managed": True,
                        "favorite": False,
                        "addedAt": datetime.now().isoformat(timespec="seconds"),
                    })
            save_library(library)
        playlists = load_playlists()
        if not playlists and library:
            demo_ids = [item["id"] for item in library if str(item.get("id", "")).startswith("sample-")]
            if demo_ids:
                demo_cover = str(ART_DIR / "first-light.svg")
                save_playlists([{
                    "id": "sample-soft-mornings",
                    "name": "Soft Mornings",
                    "trackIds": demo_ids[:3],
                    "artworkPath": demo_cover if Path(demo_cover).is_file() else "",
                    "createdAt": datetime.now().isoformat(timespec="seconds"),
                    "updatedAt": datetime.now().isoformat(timespec="seconds"),
                    "sample": True,
                }])
        settings["firstRunComplete"] = True
        write_json(SETTINGS_FILE, settings)


def safe_text(value: Any, limit: int = 260) -> str:
    text = str(value or "").replace("\x00", " ").strip()
    return text[:limit]


def safe_filename(value: str) -> str:
    value = safe_text(value, 150)
    value = re.sub(r'[\\/:*?"<>|]+', "_", value)
    value = re.sub(r"\s+", " ", value).strip(" .")
    return value or "EchoDesk track"


def make_id(seed: str | None = None) -> str:
    if seed:
        return hashlib.sha1(seed.encode("utf-8", "ignore")).hexdigest()[:14]
    return uuid.uuid4().hex[:14]


def is_under(path: Path, parent: Path) -> bool:
    try:
        path.resolve().relative_to(parent.resolve())
        return True
    except (ValueError, OSError):
        return False


def safe_external_url(url: str, resolve_dns: bool = False) -> bool:
    """Allow public HTTPS hosts but reject localhost, private IPs and unsafe ports."""
    try:
        parsed = urllib.parse.urlsplit(url)
        host = (parsed.hostname or "").encode("idna").decode("ascii").lower().rstrip(".")
        port = parsed.port
        if parsed.scheme.lower() != "https" or not host or parsed.username or parsed.password:
            return False
        if port not in (None, 443) or host in {"localhost", "localhost.localdomain"}:
            return False
        if host.endswith((".localhost", ".local", ".internal", ".lan", ".home", ".test")):
            return False
        try:
            address = ipaddress.ip_address(host)
            return address.is_global
        except ValueError:
            pass
        if not re.fullmatch(r"[a-z0-9.-]+", host) or host.startswith(".") or ".." in host:
            return False
        if resolve_dns:
            records = socket.getaddrinfo(host, port or 443, type=socket.SOCK_STREAM)
            addresses = {record[4][0].split("%", 1)[0] for record in records}
            return bool(addresses) and all(ipaddress.ip_address(address).is_global for address in addresses)
        return True
    except (ValueError, TypeError, UnicodeError, OSError):
        return False


class SafeExternalRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Keep direct-MP3 streams from redirecting to local/private network targets."""
    def redirect_request(self, req: Any, fp: Any, code: int, msg: str, headers: Any, newurl: str) -> Any:
        if not safe_external_url(newurl, resolve_dns=True):
            raise urllib.error.HTTPError(newurl, code, "Unsafe redirect target blocked", headers, fp)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def safe_urlopen(request: urllib.request.Request, timeout: int) -> Any:
    """Open a public HTTPS URL with redirect and DNS checks for media transfers."""
    url = request.full_url
    if not safe_external_url(url, resolve_dns=True):
        raise ValueError("This MP3 link is not a publicly reachable HTTPS URL.")
    opener = urllib.request.build_opener(SafeExternalRedirectHandler())
    response = opener.open(request, timeout=timeout)
    final_url = response.geturl()
    if not safe_external_url(final_url):
        response.close()
        raise ValueError("The MP3 host redirected to an unsafe URL.")
    return response


def request_bytes(url: str, timeout: int = 18, headers: dict[str, str] | None = None) -> bytes:
    request_headers = {"User-Agent": USER_AGENT, "Accept": "*/*"}
    if headers:
        request_headers.update(headers)
    request = urllib.request.Request(url, headers=request_headers)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def request_json(url: str, timeout: int = 18) -> Any:
    body = request_bytes(url, timeout=timeout, headers={"Accept": "application/json"})
    return json.loads(body.decode("utf-8", "replace"))


def extract_tags(path: Path) -> tuple[dict[str, str], float]:
    meta = {"title": path.stem, "artist": "Unknown artist", "album": "", "genre": ""}
    duration = 0.0
    try:
        from mutagen import File as MutagenFile  # optional until requirements are installed
        audio = MutagenFile(str(path), easy=True)
        if audio:
            for tag in ("title", "artist", "album", "genre"):
                values = audio.get(tag)
                if values:
                    meta[tag] = safe_text(values[0], 140)
            if getattr(audio, "info", None) and getattr(audio.info, "length", None):
                duration = float(audio.info.length)
    except Exception:
        pass
    if duration <= 0 and path.suffix.lower() in {".wav", ".wave"}:
        try:
            with wave.open(str(path), "rb") as audio_file:
                duration = audio_file.getnframes() / max(1, audio_file.getframerate())
        except Exception:
            pass
    return meta, duration


def extract_embedded_art(path: Path, track_id: str) -> str:
    """Copy common embedded cover formats to the application cache."""
    try:
        ext = path.suffix.lower()
        data: bytes | None = None
        mime = "image/jpeg"
        if ext == ".mp3":
            from mutagen.id3 import ID3
            tags = ID3(str(path))
            pictures = tags.getall("APIC")
            if pictures:
                data = pictures[0].data
                mime = pictures[0].mime or mime
        else:
            from mutagen import File as MutagenFile
            audio = MutagenFile(str(path))
            if audio is not None:
                pictures = getattr(audio, "pictures", None)
                if pictures:
                    data = pictures[0].data
                    mime = getattr(pictures[0], "mime", mime) or mime
                if data is None and getattr(audio, "tags", None):
                    covr = audio.tags.get("covr")
                    if covr:
                        data = bytes(covr[0])
                        mime = "image/jpeg"
        if not data:
            return ""
        ext_out = mimetypes.guess_extension(mime) or ".jpg"
        if ext_out == ".jpe":
            ext_out = ".jpg"
        destination = ART_DIR / f"{track_id}{ext_out}"
        destination.write_bytes(data)
        return str(destination)
    except Exception:
        return ""


def create_track(path: Path, source: str = "Local library", managed: bool = False,
                 title_override: str = "", artist_override: str = "", album_override: str = "") -> dict[str, Any]:
    path = path.expanduser().resolve()
    metadata, duration = extract_tags(path)
    track_id = make_id(str(path))
    artwork_path = extract_embedded_art(path, track_id)
    return {
        "id": track_id,
        "path": str(path),
        "title": safe_text(title_override or metadata["title"], 140),
        "artist": safe_text(artist_override or metadata["artist"], 140),
        "album": safe_text(album_override or metadata["album"], 140),
        "genre": safe_text(metadata["genre"], 80),
        "tags": [],
        "duration": round(duration, 2),
        "artworkPath": artwork_path,
        "artistImagePath": "",
        "lyricsPath": "",
        "lastPlayedAt": "",
        "playCount": 0,
        "source": safe_text(source, 100),
        "managed": bool(managed),
        "favorite": False,
        "addedAt": datetime.now().isoformat(timespec="seconds"),
    }


def artwork_url(path: str) -> str:
    if not path:
        return ""
    return "/api/artwork?path=" + urllib.parse.quote(path, safe="")


def serialize_track(track: dict[str, Any]) -> dict[str, Any]:
    result = dict(track)
    # Hide legacy values from installations that previously used Mood & Moment.
    result.pop("mood", None)
    file_path = str(track.get("path", ""))
    result["mediaUrl"] = "/api/media?path=" + urllib.parse.quote(file_path, safe="") if file_path else ""
    art_path = str(track.get("artworkPath", ""))
    result["artworkUrl"] = artwork_url(art_path) if art_path and Path(art_path).is_file() else ""
    artist_image_path = str(track.get("artistImagePath", ""))
    result["artistImageUrl"] = artwork_url(artist_image_path) if artist_image_path and Path(artist_image_path).is_file() else ""
    result["artistImageSource"] = safe_text(track.get("artistImageSource", ""), 60)
    result["artistImagePageUrl"] = safe_text(track.get("artistImagePageUrl", ""), 600)
    result["lyricsAvailable"] = bool(track.get("lyricsPath") and Path(str(track.get("lyricsPath"))).is_file())
    result["lyricsSource"] = safe_text(track.get("lyricsSource", ""), 80)
    return result


def serialize_playlist(playlist: dict[str, Any], library: list[dict[str, Any]]) -> dict[str, Any]:
    result = dict(playlist)
    ids = set(playlist.get("trackIds", []))
    result["count"] = sum(1 for track in library if track.get("id") in ids)
    art_path = str(playlist.get("artworkPath", ""))
    result["artworkUrl"] = artwork_url(art_path) if art_path and Path(art_path).is_file() else ""
    return result


def state_snapshot() -> dict[str, Any]:
    with DATA_LOCK:
        library = load_library()
        playlists = load_playlists()
        settings = load_settings()
        public_library = [serialize_track(track) for track in library]
        public_playlists = [serialize_playlist(item, library) for item in playlists]
    with TASK_LOCK:
        downloads = [dict(item) for item in DOWNLOAD_TASKS.values()]
        sync = dict(SYNC_TASK)
        backups = [dict(item) for item in BACKUP_TASKS.values()]
    return {
        "app": APP_NAME,
        "version": APP_VERSION,
        "mode": "desktop" if DESKTOP_MODE else "web-preview",
        "library": public_library,
        "playlists": public_playlists,
        "settings": settings,
        "downloads": downloads,
        "sync": sync,
        "backups": backups,
        "dataDir": str(DATA_DIR),
        "storage": {
            "libraryTracks": len(public_library),
            "playlists": len(public_playlists),
            "downloaded": sum(1 for track in library if is_under(Path(str(track.get("path", ""))), DOWNLOAD_DIR)),
        },
    }


def pick_open_license(metadata: dict[str, Any], doc: dict[str, Any]) -> tuple[str, str] | None:
    raw = safe_text(metadata.get("licenseurl") or doc.get("licenseurl") or metadata.get("license") or "", 500)
    rights = safe_text(metadata.get("rights") or doc.get("rights") or "", 500)
    candidate = (raw + " " + rights).lower()
    if "creativecommons.org/publicdomain/zero/" in candidate:
        version = re.search(r"publicdomain/zero/(\d+(?:\.\d+)?)/?", candidate)
        return raw or rights, f"CC0 {version.group(1)} / Public Domain" if version else "CC0 / Public Domain"
    if "creativecommons.org/publicdomain/mark/" in candidate:
        return raw or rights, "Public Domain Mark"
    if "creativecommons.org/licenses/" in candidate:
        match = re.search(r"creativecommons\.org/licenses/(by(?:-nc)?(?:-sa)?(?:-nd)?)/(\d+(?:\.\d+)?)/?", candidate)
        if match:
            code = match.group(1).upper().replace("-", "-")
            return raw or rights, f"CC {code} {match.group(2)}"
        return raw or rights, "Creative Commons — check terms"
    if "public domain" in candidate or "public-domain" in candidate:
        return raw or rights, "Public Domain"
    return None


def choose_audio_file(files: list[dict[str, Any]], mp3_only: bool = False) -> list[dict[str, Any]]:
    supported = {".mp3"} if mp3_only else {".mp3", ".wav", ".ogg", ".oga", ".flac", ".m4a", ".aac", ".opus", ".aiff", ".aif"}
    picked: list[dict[str, Any]] = []
    for item in files:
        name = str(item.get("name", ""))
        if not name or name.startswith("__ia_thumb") or name.endswith("_files.xml"):
            continue
        if Path(name).suffix.lower() not in supported:
            continue
        if item.get("private") is True:
            continue
        try:
            size = int(item.get("size", 0) or 0)
            if size and size < 12_000:
                continue
        except (TypeError, ValueError):
            pass
        picked.append(item)
    return picked


class DuckDuckGoResultsParser(HTMLParser):
    """Extract ordinary result links and snippets from DuckDuckGo's HTML view."""
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.results: list[dict[str, str]] = []
        self.target = ""
        self.depth = 0
        self.blocked_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        classes = set((values.get("class") or "").split())
        if tag in {"script", "style"}:
            self.blocked_depth += 1
            return
        if self.blocked_depth:
            return
        if tag == "a" and ("result__a" in classes or "result-link" in classes):
            self.results.append({"href": values.get("href") or "", "title": "", "snippet": ""})
            self.target = "title"
            self.depth = 1
        elif "result__snippet" in classes or "result-snippet" in classes:
            if self.results:
                self.target = "snippet"
                self.depth = 1
        elif self.target:
            self.depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"} and self.blocked_depth:
            self.blocked_depth -= 1
            return
        if self.blocked_depth or not self.target:
            return
        self.depth -= 1
        if self.depth <= 0:
            self.target = ""
            self.depth = 0

    def handle_data(self, data: str) -> None:
        if self.blocked_depth or not self.target or not self.results:
            return
        self.results[-1][self.target] += data


def unwrap_web_result_url(raw_url: str) -> str:
    raw_url = html_lib.unescape((raw_url or "").strip())
    if raw_url.startswith("//"):
        raw_url = "https:" + raw_url
    if raw_url.startswith("/"):
        raw_url = urllib.parse.urljoin("https://duckduckgo.com", raw_url)
    try:
        parsed = urllib.parse.urlsplit(raw_url)
        if (parsed.hostname or "").lower().endswith("duckduckgo.com"):
            wrapped = urllib.parse.parse_qs(parsed.query).get("uddg", [""])[0]
            if wrapped:
                raw_url = wrapped
                parsed = urllib.parse.urlsplit(raw_url)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password:
            return ""
        return raw_url
    except (ValueError, TypeError):
        return ""


def direct_mp3_filename(url: str) -> str:
    """Return a decoded filename only for direct URLs whose path ends in .mp3."""
    try:
        parsed = urllib.parse.urlsplit(url)
        filename = Path(urllib.parse.unquote(parsed.path)).name
        return filename if parsed.scheme == "https" and filename.casefold().endswith(".mp3") else ""
    except (TypeError, ValueError):
        return ""


def mp3_filename_matches_query(query: str, filename: str) -> bool:
    """Require the direct MP3 filename to contain a meaningful part of the query."""
    terms = [term.casefold() for term in re.findall(r"[^\W_]+", query, flags=re.UNICODE) if len(term) >= 2]
    if not terms:
        return True
    normalized_name = re.sub(r"[^\w]+", " ", urllib.parse.unquote(filename).casefold(), flags=re.UNICODE)
    matches = sum(1 for term in set(terms) if term in normalized_name)
    return matches >= max(1, (len(set(terms)) + 1) // 2)


def search_duckduckgo(query: str) -> list[dict[str, Any]]:
    """Return direct MP3 files only; arbitrary sites are not surfaced as results."""
    query = safe_text(query, 140)
    if not query:
        return []
    search_query = f'"{query}" filetype:mp3'
    encoded = urllib.parse.urlencode({"q": search_query, "kl": "us-en"})
    response_bytes = request_bytes(
        "https://lite.duckduckgo.com/lite/?" + encoded,
        timeout=18,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36", "Accept": "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.8"},
    )
    parser = DuckDuckGoResultsParser()
    parser.feed(response_bytes.decode("utf-8", "replace"))
    results: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in parser.results:
        media_url = unwrap_web_result_url(item.get("href", ""))
        file_name = direct_mp3_filename(media_url)
        if not media_url or not file_name or media_url in seen or not mp3_filename_matches_query(query, file_name):
            continue
        title = safe_text(re.sub(r"\s+", " ", html_lib.unescape(item.get("title", ""))), 180) or Path(file_name).stem
        snippet = safe_text(re.sub(r"\s+", " ", html_lib.unescape(item.get("snippet", ""))), 380)
        seen.add(media_url)
        host = (urllib.parse.urlsplit(media_url).hostname or "").lower()
        if host.startswith("www."):
            host = host[4:]
        result = {
            "id": "mp3web-" + make_id(media_url),
            "title": title,
            "fileName": file_name,
            "snippet": snippet,
            "format": "MP3",
            "source": host,
            "searchProvider": "DuckDuckGo",
            "pageUrl": media_url,
            "licenseStatus": "unknown",
            "licenseLabel": "Rights not verified",
            "downloadAllowed": True,
            "playAllowed": True,
            "rightsVerified": False,
            "sourceType": "web",
            "_url": media_url,
            "_size": 0,
        }
        ONLINE_RESULTS[result["id"]] = result
        results.append(result)
        if len(results) >= 10:
            break
    return results


def google_dork_queries(query: str) -> list[str]:
    """Build conservative Google Dork variants for direct MP3 file discovery."""
    phrase = re.sub(r"\s+", " ", re.sub(r'[\"“”]+', " ", safe_text(query, 120))).strip()
    if not phrase:
        return []
    quoted = f'"{phrase}"'
    # Keep queries focused on direct audio URLs; directory-index/landing-page
    # links are deliberately filtered later because EchoDesk only plays MP3 files.
    return [
        f'{quoted} filetype:mp3',
        f'inurl:mp3 {quoted} filetype:mp3',
    ]


def search_google(query: str) -> list[dict[str, Any]]:
    """Search with Google Dorks through the official Programmable Search API.

    Google HTML pages are not scraped. Two query variants are used when the
    user configures an API key and search-engine ID; results are deduplicated
    and restricted to matching direct HTTPS MP3 file URLs.
    """
    api_key = os.environ.get("ECHODESK_GOOGLE_API_KEY", "").strip()
    engine_id = os.environ.get("ECHODESK_GOOGLE_CSE_ID", "").strip()
    if not api_key or not engine_id:
        return []
    results: list[dict[str, Any]] = []
    seen: set[str] = set()
    query_succeeded = False
    for search_query in google_dork_queries(query):
        params = urllib.parse.urlencode({"key": api_key, "cx": engine_id, "q": search_query, "num": 10})
        try:
            payload = request_json("https://www.googleapis.com/customsearch/v1?" + params, timeout=18)
            query_succeeded = True
        except Exception:
            # Preserve any matches from an earlier variant if a later one fails.
            if query_succeeded:
                break
            raise
        items = payload.get("items", []) if isinstance(payload, dict) else []
        for item in items:
            media_url = unwrap_web_result_url(str(item.get("link", "")))
            file_name = direct_mp3_filename(media_url)
            if not media_url or not file_name or media_url in seen or not mp3_filename_matches_query(query, file_name):
                continue
            seen.add(media_url)
            title = safe_text(item.get("title", ""), 180) or Path(file_name).stem
            host = (urllib.parse.urlsplit(media_url).hostname or "").lower()
            if host.startswith("www."):
                host = host[4:]
            result = {
                "id": "mp3google-" + make_id(media_url),
                "title": title,
                "fileName": file_name,
                "format": "MP3",
                "snippet": safe_text(item.get("snippet", ""), 380),
                "source": host,
                "searchProvider": "Google Dorks",
                "pageUrl": media_url,
                "licenseStatus": "unknown",
                "licenseLabel": "Rights not verified",
                "downloadAllowed": True,
                "playAllowed": True,
                "rightsVerified": False,
                "sourceType": "web",
                "_url": media_url,
                "_size": 0,
            }
            ONLINE_RESULTS[result["id"]] = result
            results.append(result)
            if len(results) >= 20:
                break
        if len(results) >= 20:
            break
    return results


def search_archive(query: str) -> list[dict[str, Any]]:
    query = safe_text(query, 140)
    if not query:
        return []
    # Search the item's title first. Quotation marks are stripped so user input
    # cannot become arbitrary Solr syntax. Metadata calls run concurrently.
    phrase = query.replace('"', " ").replace("'", " ").replace("\\", " ").strip()
    params = [
        ("q", f'mediatype:audio AND (title:"{phrase}" OR creator:"{phrase}")'),
        ("fl[]", "identifier"),
        ("fl[]", "title"),
        ("fl[]", "creator"),
        ("fl[]", "date"),
        ("fl[]", "licenseurl"),
        ("fl[]", "rights"),
        ("rows", "60"),
        ("page", "1"),
        ("output", "json"),
        ("sort[]", "downloads desc"),
    ]
    search_url = "https://archive.org/advancedsearch.php?" + urllib.parse.urlencode(params)
    response = request_json(search_url, timeout=12)
    docs = response.get("response", {}).get("docs", []) if isinstance(response, dict) else []
    candidates: list[dict[str, Any]] = []
    for doc in docs[:18]:
        identifier = safe_text(doc.get("identifier", ""), 180)
        if not identifier:
            continue
        # Preserve the rights metadata and include direct MP3s even when the
        # archive record has no recognizable license; UI keeps that status clear.
        candidates.append(doc)

    def inspect_doc(doc: dict[str, Any]) -> list[dict[str, Any]]:
        identifier = safe_text(doc.get("identifier", ""), 180)
        try:
            meta_response = request_json("https://archive.org/metadata/" + urllib.parse.quote(identifier, safe=""), timeout=7)
            metadata = meta_response.get("metadata", {}) if isinstance(meta_response, dict) else {}
            open_license = pick_open_license(metadata, doc)
            files = choose_audio_file(meta_response.get("files", []), mp3_only=True)
            base_title = safe_text(metadata.get("title") or doc.get("title") or identifier, 180)
            artist = metadata.get("creator") or doc.get("creator") or "Internet Archive"
            if isinstance(artist, list):
                artist = ", ".join(str(x) for x in artist[:3])
            artist = safe_text(artist, 140)
            album = safe_text(metadata.get("album") or "", 140)
            # Only direct MP3 files are returned. If the archive does not report
            # a recognizable license, playback/download remain labeled unverified.
            if not files:
                return []
            results: list[dict[str, Any]] = []
            for file_item in files[:4]:
                name = str(file_item.get("name", ""))
                suffix = Path(name).suffix.lower()
                raw_file_title = Path(name).stem
                raw_file_title = re.sub(r"[-_ ]+[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$", "", raw_file_title, flags=re.IGNORECASE)
                raw_file_title = re.sub(r"[-_ ]+[0-9a-f]{20,}$", "", raw_file_title, flags=re.IGNORECASE)
                file_title = re.sub(r"\s+", " ", raw_file_title.replace("_", " ").replace("-", " ")).strip()
                title = base_title if len(files) == 1 else (file_title or base_title)
                result_id = make_id(identifier + "/" + name)
                direct_url = "https://archive.org/download/" + urllib.parse.quote(identifier, safe="") + "/" + urllib.parse.quote(name, safe="/")
                results.append({
                    "id": result_id,
                    "title": safe_text(title, 160),
                    "artist": artist,
                    "album": album or base_title,
                    "format": suffix.lstrip(".").upper(),
                    "fileName": name,
                    "identifier": identifier,
                    "licenseUrl": safe_text(open_license[0], 500) if open_license else "",
                    "licenseLabel": open_license[1] if open_license else "Rights not verified",
                    "pageUrl": "https://archive.org/details/" + urllib.parse.quote(identifier, safe=""),
                    "duration": 0,
                    "licenseStatus": "open" if open_license else "unknown",
                    "source": "Internet Archive",
                    "provider": "internet_archive",
                    "rightsVerified": bool(open_license),
                    "downloadAllowed": True,
                    "playAllowed": True,
                    "sourceType": "catalog" if open_license else "web",
                    "_url": direct_url,
                    "_size": int(file_item.get("size", 0) or 0),
                })
            return results
        except Exception:
            return []

    by_position: dict[int, list[dict[str, Any]]] = {}
    with ThreadPoolExecutor(max_workers=12, thread_name_prefix="ia-search") as executor:
        pending = {executor.submit(inspect_doc, doc): index for index, doc in enumerate(candidates)}
        for future in as_completed(pending):
            by_position[pending[future]] = future.result()
    found: list[dict[str, Any]] = []
    for index in range(len(candidates)):
        for result in by_position.get(index, []):
            found.append(result)
            ONLINE_RESULTS[result["id"]] = result
            if len(found) >= 20:
                return found
    return found


def search_openverse(query: str) -> list[dict[str, Any]]:
    """Search Openverse's aggregated catalog of openly licensed audio."""
    query = safe_text(query, 140)
    if not query:
        return []
    allowed_codes = "cc0,by,by-sa,by-nd,by-nc,by-nc-sa,by-nc-nd,pdm"
    params = urllib.parse.urlencode({"q": query, "page_size": 14, "license": allowed_codes})
    payload = request_json("https://api.openverse.org/v1/audio/?" + params, timeout=22)
    docs = payload.get("results", []) if isinstance(payload, dict) else []
    results: list[dict[str, Any]] = []
    extensions = {"mp32": ".mp3", "mp3": ".mp3", "mpeg": ".mp3", "wav": ".wav", "ogg": ".ogg", "oga": ".oga", "flac": ".flac", "m4a": ".m4a", "aac": ".aac", "opus": ".opus", "aiff": ".aiff", "aif": ".aif"}
    for item in docs[:14]:
        code = safe_text(item.get("license", ""), 40).lower()
        license_url = safe_text(item.get("license_url", ""), 500)
        version = safe_text(item.get("license_version", ""), 12)
        if not license_url and code in {"by", "by-sa", "by-nd", "by-nc", "by-nc-sa", "by-nc-nd"}:
            license_url = f"https://creativecommons.org/licenses/{code}/{version or '4.0'}/"
        elif not license_url and code == "cc0":
            license_url = "https://creativecommons.org/publicdomain/zero/1.0/"
        elif not license_url and code == "pdm":
            license_url = "https://creativecommons.org/publicdomain/mark/1.0/"
        recognized = pick_open_license({"licenseurl": license_url}, {}) if license_url else None
        media_url = safe_text(item.get("url", ""), 1600)
        direct_mp3 = bool(direct_mp3_filename(media_url) and safe_external_url(media_url))
        playable = direct_mp3
        provider = safe_text(item.get("provider") or item.get("source") or "Openverse", 80)
        provider_title = provider.replace("_", " ").replace("-", " ").title()
        filetype = safe_text(item.get("filetype", ""), 20).lower()
        ext = extensions.get(filetype, Path(urllib.parse.urlsplit(media_url).path).suffix.lower())
        if ext not in AUDIO_EXTENSIONS:
            ext = ".mp3" if filetype in {"mp32", "mpeg"} else ext
        file_name = Path(urllib.parse.urlsplit(media_url).path).name or ("openverse-" + safe_text(item.get("id", "audio"), 80) + (ext or ".mp3"))
        if not Path(file_name).suffix and ext:
            file_name += ext
        # This page is a direct MP3 finder, not a directory of landing pages.
        # Keep uncertain license status visible, but let the user initiate direct
        # playback/download for matching public MP3 URLs.
        if ext != ".mp3" or not direct_mp3:
            continue
        try:
            duration = float(item.get("duration") or 0)
            if duration > 10_000:  # Openverse reports milliseconds.
                duration /= 1000
        except (TypeError, ValueError):
            duration = 0
        source_url = safe_text(item.get("foreign_landing_url") or item.get("detail_url") or "https://openverse.org/", 1600)
        result_id = "ov-" + make_id("openverse/" + safe_text(item.get("id", ""), 100))
        result = {
            "id": result_id,
            "title": safe_text(item.get("title") or "Untitled audio", 180),
            "artist": safe_text(item.get("creator") or "Unknown artist", 140),
            "album": safe_text((item.get("audio_set") or {}).get("title", "") if isinstance(item.get("audio_set"), dict) else "", 140),
            "format": "MP3",
            "fileName": file_name,
            "licenseUrl": license_url if recognized else "",
            "licenseLabel": recognized[1] if recognized else "Rights not verified",
            "licenseStatus": "open" if recognized else "unknown",
            "rightsVerified": bool(recognized),
            "downloadAllowed": playable,
            "playAllowed": playable,
            "sourceType": "catalog" if recognized else "web",
            "pageUrl": source_url,
            "duration": round(duration, 2),
            "source": f"Openverse · {provider_title}",
            "provider": provider,
            "attribution": safe_text(item.get("attribution", ""), 500),
        }
        if playable:
            result["_url"] = media_url
            result["_size"] = int(item.get("filesize") or 0)
        ONLINE_RESULTS[result_id] = result
        results.append(result)
    return results


def public_online_result(result: dict[str, Any]) -> dict[str, Any]:
    public = {
        key: result.get(key)
        for key in ("id", "title", "artist", "album", "format", "fileName", "licenseUrl", "licenseLabel", "licenseStatus", "pageUrl", "duration", "downloadAllowed", "playAllowed", "rightsVerified", "source", "provider", "attribution", "searchProvider", "snippet", "sourceType")
    }
    media_url = str(result.get("_url", ""))
    direct_web_mp3 = result.get("sourceType") == "web" and bool(direct_mp3_filename(media_url))
    can_play = bool(result.get("playAllowed") and (result.get("rightsVerified") or direct_web_mp3) and safe_external_url(media_url))
    public["streamUrl"] = ("/api/online-stream?id=" + urllib.parse.quote(str(result.get("id", "")), safe="")) if can_play else ""
    return public


def start_download(result_id: str) -> dict[str, Any]:
    result = ONLINE_RESULTS.get(result_id)
    if not result:
        raise ValueError("Search result expired. Please search again.")
    media_url = str(result.get("_url", ""))
    direct_web_mp3 = result.get("sourceType") == "web" and bool(direct_mp3_filename(media_url))
    catalog_license_ok = bool(result.get("rightsVerified") and result.get("licenseUrl"))
    if not result.get("downloadAllowed") or not (catalog_license_ok or direct_web_mp3) or not safe_external_url(media_url):
        raise ValueError("This result is not a downloadable direct MP3 URL.")
    task_id = uuid.uuid4().hex[:12]
    task = {
        "id": task_id,
        "resultId": result_id,
        "title": result.get("title", ""),
        "artist": result.get("artist", ""),
        "status": "queued",
        "progress": 0,
        "downloaded": 0,
        "total": result.get("_size", 0),
        "message": "Queued for download",
        "trackId": "",
        "path": "",
        "createdAt": datetime.now().isoformat(timespec="seconds"),
    }
    with TASK_LOCK:
        DOWNLOAD_TASKS[task_id] = task
    threading.Thread(target=download_worker, args=(task_id, dict(result)), daemon=True, name=f"download-{task_id}").start()
    return {key: task[key] for key in ("id", "title", "artist", "status", "progress", "message")}


def update_download(task_id: str, **updates: Any) -> None:
    with TASK_LOCK:
        if task_id in DOWNLOAD_TASKS:
            DOWNLOAD_TASKS[task_id].update(updates)


def download_worker(task_id: str, result: dict[str, Any]) -> None:
    suffix = Path(str(result.get("fileName", ""))).suffix.lower()
    if suffix not in AUDIO_EXTENSIONS:
        suffix = ".mp3"
    label = safe_filename(f"{result.get('artist', 'Archive')} - {result.get('title', 'Track')}")
    destination = DOWNLOAD_DIR / f"{label}{suffix}"
    counter = 2
    while destination.exists():
        destination = DOWNLOAD_DIR / f"{label} ({counter}){suffix}"
        counter += 1
    temporary = DOWNLOAD_DIR / f".{task_id}.part"
    try:
        url = str(result.get("_url", ""))
        if not safe_external_url(url):
            raise ValueError("Invalid download URL.")
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
        with safe_urlopen(req, timeout=35) as response:
            content_type = response.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
            acceptable_types = {"application/octet-stream", "binary/octet-stream", "application/force-download", "application/x-download", "application/mp3"}
            if content_type and not content_type.startswith("audio/") and content_type not in acceptable_types:
                raise ValueError("The direct MP3 link did not return an audio file.")
            total = int(response.headers.get("Content-Length", "0") or 0)
            downloaded = 0
            update_download(task_id, status="downloading", total=total or result.get("_size", 0), message="Downloading…")
            with temporary.open("wb") as output:
                while True:
                    chunk = response.read(256 * 1024)
                    if not chunk:
                        break
                    output.write(chunk)
                    downloaded += len(chunk)
                    total_now = total or int(result.get("_size", 0) or 0)
                    progress = min(99, round(downloaded * 100 / total_now)) if total_now else 0
                    update_download(task_id, downloaded=downloaded, total=total_now, progress=progress, message="Downloading…")
        if not temporary.exists() or temporary.stat().st_size < 100:
            raise ValueError("The downloaded file is empty or incomplete.")
        temporary.replace(destination)
        track = create_track(
            destination,
            source=safe_text(f"{result.get('source') or 'Online audio'} • {result.get('licenseLabel') or 'Open license'}", 100),
            managed=True,
            title_override=str(result.get("title", "")),
            artist_override=str(result.get("artist", "")),
            album_override=str(result.get("album", "")),
        )
        with DATA_LOCK:
            library = load_library()
            if not any(item.get("path") == str(destination) for item in library):
                library.append(track)
                save_library(library)
        update_download(task_id, status="complete", progress=100, downloaded=destination.stat().st_size,
                        total=destination.stat().st_size, message="Downloaded and added to your library.",
                        trackId=track["id"], path=str(destination))
    except Exception as exc:
        try:
            temporary.unlink(missing_ok=True)
        except OSError:
            pass
        update_download(task_id, status="error", message=safe_text(exc, 220))


def match_similarity(left: str, right: str) -> float:
    return difflib.SequenceMatcher(None, (left or "").casefold(), (right or "").casefold()).ratio()


def fetch_itunes_art(track: dict[str, Any]) -> str:
    term = " ".join(x for x in (track.get("title", ""), track.get("artist", "")) if x)
    if not term.strip():
        return ""
    query = urllib.parse.urlencode({"term": term, "entity": "song", "limit": 8})
    payload = request_json("https://itunes.apple.com/search?" + query, timeout=16)
    results = payload.get("results", []) if isinstance(payload, dict) else []
    if not results:
        return ""
    target_title = str(track.get("title", ""))
    target_artist = str(track.get("artist", ""))
    best: dict[str, Any] | None = None
    best_score = 0.0
    for item in results:
        score = match_similarity(target_title, str(item.get("trackName", ""))) * 0.65
        score += match_similarity(target_artist, str(item.get("artistName", ""))) * 0.35
        if score > best_score:
            best_score, best = score, item
    if not best or best_score < 0.45:
        return ""
    art_url = str(best.get("artworkUrl100", ""))
    if not art_url:
        return ""
    art_url = re.sub(r"\d+x\d+bb", "600x600bb", art_url)
    data = request_bytes(art_url, timeout=18)
    if not data:
        return ""
    target = ART_DIR / f"{track['id']}.jpg"
    target.write_bytes(data)
    return str(target)


def _cache_artist_image(image_url: str, track: dict[str, Any], source: str, allowed_hosts: set[str]) -> str:
    parsed = urllib.parse.urlsplit(image_url)
    if parsed.scheme != "https" or (parsed.hostname or "").lower() not in allowed_hosts:
        return ""
    data = request_bytes(image_url, timeout=18, headers={"Accept": "image/*"})
    if not data or len(data) > 8 * 1024 * 1024:
        return ""
    suffix = Path(parsed.path).suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        suffix = ".jpg"
    target = ART_DIR / f"{track['id']}-artist{suffix}"
    target.write_bytes(data)
    track["artistImageSource"] = source
    return str(target)


def fetch_wikipedia_artist_image(track: dict[str, Any]) -> str:
    """Fallback to a Wikipedia page thumbnail when Deezer is unavailable."""
    artist = safe_text(track.get("artist", ""), 140)
    if not artist or artist.lower() in {"unknown artist", "device file"}:
        return ""
    title = urllib.parse.quote(artist.replace(" ", "_"), safe="")
    payload = request_json(f"https://en.wikipedia.org/api/rest_v1/page/summary/{title}", timeout=16)
    thumbnail = payload.get("thumbnail", {}) if isinstance(payload, dict) else {}
    image_url = str(thumbnail.get("source", "")) if isinstance(thumbnail, dict) else ""
    image_path = _cache_artist_image(image_url, track, "Wikipedia", {"upload.wikimedia.org", "thumb.wikimedia.org"})
    if image_path:
        canonical_title = safe_text((payload.get("titles") or {}).get("canonical", artist), 160)
        track["artistImagePageUrl"] = "https://en.wikipedia.org/wiki/" + urllib.parse.quote(canonical_title.replace(" ", "_"), safe="")
    return image_path


def fetch_deezer_artist_image(track: dict[str, Any]) -> str:
    artist = safe_text(track.get("artist", ""), 140)
    if not artist or artist.lower() in {"unknown artist", "device file"}:
        return ""
    try:
        params = urllib.parse.urlencode({"q": artist, "limit": 8})
        payload = request_json("https://api.deezer.com/search/artist?" + params, timeout=14)
        results = payload.get("data", []) if isinstance(payload, dict) else []
        if results:
            best = max(results, key=lambda item: match_similarity(artist, str(item.get("name", ""))))
            if match_similarity(artist, str(best.get("name", ""))) >= 0.58:
                image_url = str(best.get("picture_xl") or best.get("picture_big") or "")
                image_path = _cache_artist_image(image_url, track, "Deezer", {"cdn-images.dzcdn.net"})
                if image_path:
                    track["artistImagePageUrl"] = str(best.get("link") or "")
                    return image_path
    except Exception:
        pass
    try:
        return fetch_wikipedia_artist_image(track)
    except Exception:
        return ""


def fetch_lyrics(track: dict[str, Any]) -> str:
    title = safe_text(track.get("title", ""), 140)
    artist = safe_text(track.get("artist", ""), 140)
    if not title:
        return ""
    queries: list[tuple[str, str, bool]] = []
    params = {"track_name": title, "artist_name": artist}
    if track.get("album"):
        params["album_name"] = safe_text(track.get("album", ""), 140)
    try:
        payload = request_json("https://lrclib.net/api/search?" + urllib.parse.urlencode(params), timeout=14)
        if isinstance(payload, list):
            ranked = []
            for item in payload:
                title_score = match_similarity(title, str(item.get("trackName", "")))
                artist_score = match_similarity(artist, str(item.get("artistName", ""))) if artist and artist.lower() != "unknown artist" else 1.0
                ranked.append((title_score * 0.72 + artist_score * 0.28, title_score, item))
            ranked.sort(key=lambda row: row[0], reverse=True)
            for _score, title_score, item in ranked[:3]:
                text = str(item.get("syncedLyrics") or item.get("plainLyrics") or "").strip()
                if text and title_score >= 0.52:
                    queries.append((text, "LRCLIB", bool(item.get("syncedLyrics"))))
                    break
    except Exception:
        pass
    if not queries and artist and artist.lower() != "unknown artist":
        try:
            lyrics_url = "https://api.lyrics.ovh/v1/" + urllib.parse.quote(artist, safe="") + "/" + urllib.parse.quote(title, safe="")
            payload = request_json(lyrics_url, timeout=14)
            text = str(payload.get("lyrics", "")).strip() if isinstance(payload, dict) else ""
            if text:
                queries.append((text, "Lyrics.ovh", False))
        except Exception:
            pass
    if not queries:
        return ""
    text, source, synced = queries[0]
    suffix = ".lrc" if synced else ".txt"
    path = LYRICS_DIR / f"{track['id']}{suffix}"
    path.write_text(text.rstrip() + "\n", encoding="utf-8")
    track["lyricsSource"] = source
    return str(path)


def sync_worker(track_ids: list[str]) -> None:
    global SYNC_TASK
    with DATA_LOCK:
        library = load_library()
    selected_ids = set(track_ids)
    selected = [item for item in library if not selected_ids or item.get("id") in selected_ids]
    with TASK_LOCK:
        SYNC_TASK = {"status": "running", "done": 0, "total": len(selected), "message": "Syncing metadata…", "updatedAt": time.time()}
    failed_lookups = 0
    for index, original in enumerate(selected, start=1):
        try:
            with DATA_LOCK:
                library = load_library()
                track = next((item for item in library if item.get("id") == original.get("id")), None)
                if not track:
                    continue
            if not (track.get("artistImagePath") and Path(str(track.get("artistImagePath"))).is_file()):
                try:
                    artist_image = fetch_deezer_artist_image(track)
                    if artist_image:
                        track["artistImagePath"] = artist_image
                except Exception:
                    failed_lookups += 1
            if not (track.get("artworkPath") and Path(str(track.get("artworkPath"))).is_file()):
                try:
                    art_path = fetch_itunes_art(track)
                    if art_path:
                        track["artworkPath"] = art_path
                except Exception:
                    failed_lookups += 1
            if not (track.get("lyricsPath") and Path(str(track.get("lyricsPath"))).is_file()):
                try:
                    lyric_path = fetch_lyrics(track)
                    if lyric_path:
                        track["lyricsPath"] = lyric_path
                except Exception:
                    failed_lookups += 1
            track["syncedAt"] = datetime.now().isoformat(timespec="seconds")
            with DATA_LOCK:
                library = load_library()
                for idx, item in enumerate(library):
                    if item.get("id") == track.get("id"):
                        library[idx] = track
                        break
                save_library(library)
        except Exception:
            failed_lookups += 1
        with TASK_LOCK:
            SYNC_TASK.update({"done": index, "message": f"Syncing {index} of {len(selected)}", "updatedAt": time.time()})
        time.sleep(0.08)
    selected_ids = {item.get("id") for item in selected}
    with DATA_LOCK:
        final_tracks = [item for item in load_library() if item.get("id") in selected_ids]
        covers_found = sum(1 for item in final_tracks if item.get("artworkPath") and Path(str(item.get("artworkPath"))).is_file())
        artist_images_found = sum(1 for item in final_tracks if item.get("artistImagePath") and Path(str(item.get("artistImagePath"))).is_file())
        lyrics_found = sum(1 for item in final_tracks if item.get("lyricsPath") and Path(str(item.get("lyricsPath"))).is_file())
    summary = f"Sync complete: cover art for {covers_found}; artist photos for {artist_images_found}; lyrics for {lyrics_found} of {len(final_tracks)} tracks."
    if failed_lookups:
        summary += f" {failed_lookups} lookup(s) failed; try again when online."
    with TASK_LOCK:
        SYNC_TASK.update({"status": "complete", "done": len(selected), "total": len(selected), "message": summary, "updatedAt": time.time()})


def start_sync(track_ids: list[str] | None = None) -> dict[str, Any]:
    global SYNC_TASK
    with TASK_LOCK:
        if SYNC_TASK.get("status") == "running":
            return dict(SYNC_TASK)
        SYNC_TASK = {"status": "queued", "done": 0, "total": 0, "message": "Preparing…", "updatedAt": time.time()}
    threading.Thread(target=sync_worker, args=(track_ids or [],), daemon=True, name="metadata-sync").start()
    return dict(SYNC_TASK)


def backup_worker(task_id: str, target: Path, include_music: bool) -> None:
    try:
        with DATA_LOCK:
            library = load_library()
        files: list[tuple[Path, str]] = []
        for folder in (ART_DIR, LYRICS_DIR):
            if folder.exists():
                for path in folder.rglob("*"):
                    if path.is_file():
                        files.append((path, str(path.relative_to(DATA_DIR))))
        for json_file in (LIBRARY_FILE, PLAYLISTS_FILE, SETTINGS_FILE):
            if json_file.is_file():
                files.append((json_file, json_file.name))
        if include_music:
            seen: set[str] = set()
            for track in library:
                raw = str(track.get("path", ""))
                if not raw:
                    continue
                path = Path(raw)
                try:
                    resolved = path.resolve()
                    if not resolved.is_file() or str(resolved) in seen:
                        continue
                    seen.add(str(resolved))
                    if is_under(resolved, DATA_DIR):
                        archive_name = str(resolved.relative_to(DATA_DIR))
                    else:
                        artist = safe_filename(str(track.get("artist", "Unknown")))
                        title = safe_filename(str(track.get("title", resolved.stem)))
                        archive_name = f"Music/{artist} - {title}{resolved.suffix.lower()}"
                    files.append((resolved, archive_name))
                except OSError:
                    continue
        target.parent.mkdir(parents=True, exist_ok=True)
        total = len(files)
        with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=5) as archive:
            archive.writestr("EchoDesk-backup/manifest.json", json.dumps({
                "app": APP_NAME,
                "version": APP_VERSION,
                "createdAt": datetime.now().isoformat(timespec="seconds"),
                "includesMusic": include_music,
                "tracks": len(library),
            }, ensure_ascii=False, indent=2))
            for i, (path, arcname) in enumerate(files, start=1):
                try:
                    archive.write(path, f"EchoDesk-backup/{arcname}")
                except OSError:
                    continue
                with TASK_LOCK:
                    BACKUP_TASKS[task_id].update({"progress": round(i * 100 / max(1, total)), "done": i, "total": total, "message": f"Compressing {i} of {total}"})
        with TASK_LOCK:
            BACKUP_TASKS[task_id].update({"status": "complete", "progress": 100, "message": "Backup is ready.", "path": str(target), "fileName": target.name})
    except Exception as exc:
        with TASK_LOCK:
            BACKUP_TASKS[task_id].update({"status": "error", "message": safe_text(exc, 240)})


def start_backup(include_music: bool, target: str = "") -> dict[str, Any]:
    if not DESKTOP_MODE:
        # The browser preview is exposed on a local web port; never bundle external
        # user audio into a downloadable archive from that mode.
        include_music = False
    task_id = uuid.uuid4().hex[:12]
    if target and ALLOW_EXTERNAL_BACKUP_PATH:
        target_path = Path(target).expanduser().resolve()
    else:
        target_path = BACKUP_DIR / f"EchoDesk-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.zip"
    task = {"id": task_id, "status": "queued", "progress": 0, "done": 0, "total": 0,
            "message": "Preparing backup…", "path": "", "fileName": target_path.name}
    with TASK_LOCK:
        BACKUP_TASKS[task_id] = task
    threading.Thread(target=backup_worker, args=(task_id, target_path, include_music), daemon=True, name=f"backup-{task_id}").start()
    return {key: task[key] for key in ("id", "status", "progress", "message", "fileName")}


def check_media_allowed(path: Path) -> bool:
    if is_under(path, DATA_DIR):
        return True
    with DATA_LOCK:
        return any(Path(str(track.get("path", ""))).resolve() == path.resolve() for track in load_library())


def check_artwork_allowed(path: Path) -> bool:
    if is_under(path, DATA_DIR):
        return True
    with DATA_LOCK:
        all_paths = [str(track.get("artworkPath", "")) for track in load_library()]
        all_paths.extend(str(item.get("artworkPath", "")) for item in load_playlists())
        return any(raw and Path(raw).resolve() == path.resolve() for raw in all_paths)


class EchoHandler(http.server.BaseHTTPRequestHandler):
    server_version = "EchoDeskLocal/1.0"
    sys_version = ""

    def __init__(self, *args: Any, **kwargs: Any):
        self._response_started = False
        super().__init__(*args, **kwargs)

    def end_headers(self) -> None:
        self._response_started = True
        super().end_headers()

    def log_message(self, fmt: str, *args: Any) -> None:
        if os.environ.get("ECHODESK_LOG_HTTP") == "1":
            super().log_message(fmt, *args)

    def send_json(self, payload: Any, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length > 24 * 1024 * 1024:
            raise ValueError("Request is too large.")
        raw = self.rfile.read(length) if length else b"{}"
        parsed = json.loads(raw.decode("utf-8", "replace"))
        if not isinstance(parsed, dict):
            raise ValueError("Invalid request format.")
        return parsed

    def do_GET(self) -> None:
        parsed = urllib.parse.urlsplit(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        route = urllib.parse.unquote(parsed.path)
        try:
            if route == "/api/health":
                self.send_json({"ok": True, "app": APP_NAME, "version": APP_VERSION})
            elif route == "/api/state":
                self.send_json(state_snapshot())
            elif route == "/api/search-online":
                query = (params.get("q") or [""])[0]
                if not query.strip():
                    self.send_json({"results": [], "webResults": [], "errors": {}, "message": "Enter a track or artist name."})
                    return
                # Keep only recent result IDs to avoid unbounded growth in a long session.
                if len(ONLINE_RESULTS) > 500:
                    ONLINE_RESULTS.clear()
                errors: dict[str, str] = {}
                audio_results: list[dict[str, Any]] = []
                web_results: list[dict[str, Any]] = []
                searches: dict[str, Any] = {
                    "archive": search_archive,
                    "openverse": search_openverse,
                    "duckduckgo": search_duckduckgo,
                }
                if os.environ.get("ECHODESK_GOOGLE_API_KEY", "").strip() and os.environ.get("ECHODESK_GOOGLE_CSE_ID", "").strip():
                    searches["google_dorks"] = search_google
                source_names = {"archive": "Internet Archive", "openverse": "Openverse", "duckduckgo": "DuckDuckGo", "google_dorks": "Google Dorks"}
                with ThreadPoolExecutor(max_workers=len(searches), thread_name_prefix="online-search") as executor:
                    futures = {executor.submit(searcher, query): source for source, searcher in searches.items()}
                    for future in as_completed(futures):
                        source = futures[future]
                        try:
                            results_for_source = future.result()
                            if source in {"archive", "openverse"}:
                                audio_results.extend(results_for_source)
                            else:
                                web_results.extend(results_for_source)
                        except Exception as exc:
                            errors[source_names.get(source, source)] = safe_text(exc, 180)
                if not audio_results and not web_results and errors:
                    summary = "Online search sources are temporarily unavailable. Check your connection and try again."
                    self.send_json({"results": [], "webResults": [], "errors": errors, "error": summary}, 200)
                    return
                self.send_json({
                    "results": [public_online_result(item) for item in audio_results],
                    "webResults": [public_online_result(item) for item in web_results],
                    "errors": errors,
                    "message": "",
                })
            elif route == "/api/online-stream":
                result_id = (params.get("id") or [""])[0]
                item = ONLINE_RESULTS.get(result_id)
                media_url = str(item.get("_url", "")) if item else ""
                direct_web_mp3 = bool(item and item.get("sourceType") == "web" and direct_mp3_filename(media_url))
                rights_verified_catalog = bool(item and item.get("rightsVerified"))
                if not item or not item.get("playAllowed") or not (rights_verified_catalog or direct_web_mp3) or not safe_external_url(media_url):
                    self.send_error(404, "Result not found")
                    return
                self.proxy_audio(media_url)
            elif route == "/api/media":
                raw = (params.get("path") or [""])[0]
                path = Path(raw).expanduser().resolve()
                if not path.is_file() or not check_media_allowed(path):
                    self.send_error(404, "File not found")
                    return
                self.serve_path(path, allow_range=True)
            elif route == "/api/artwork":
                raw = (params.get("path") or [""])[0]
                path = Path(raw).expanduser().resolve()
                if not path.is_file() or not check_artwork_allowed(path):
                    self.send_error(404, "Image not found")
                    return
                self.serve_path(path, allow_range=False)
            elif route == "/api/lyrics":
                track_id = (params.get("id") or [""])[0]
                with DATA_LOCK:
                    track = next((item for item in load_library() if item.get("id") == track_id), None)
                if not track or not track.get("lyricsPath"):
                    self.send_json({"text": ""})
                    return
                path = Path(str(track["lyricsPath"])).resolve()
                if not path.is_file() or not is_under(path, LYRICS_DIR):
                    self.send_json({"text": ""})
                    return
                self.send_json({"text": path.read_text(encoding="utf-8", errors="replace"), "title": track.get("title", ""), "artist": track.get("artist", ""), "source": track.get("lyricsSource", "")})
            elif route == "/api/backup-file":
                task_id = (params.get("id") or [""])[0]
                with TASK_LOCK:
                    task = dict(BACKUP_TASKS.get(task_id, {}))
                raw = task.get("path", "")
                path = Path(raw).resolve() if raw else None
                if not path or not path.is_file() or not is_under(path, BACKUP_DIR):
                    self.send_error(404, "Backup file is unavailable")
                    return
                self.serve_path(path, allow_range=False, download_name=path.name)
            elif route == "/" or route == "/index.html":
                self.serve_path(WEB_ROOT / "index.html", allow_range=False)
            elif route.startswith("/assets/") or route in ("/app.js", "/styles.css", "/favicon.svg"):
                target = (WEB_ROOT / route.lstrip("/")).resolve()
                if not is_under(target, WEB_ROOT) or not target.is_file():
                    self.send_error(404)
                    return
                self.serve_path(target, allow_range=False)
            else:
                self.send_error(404)
        except (BrokenPipeError, ConnectionError):
            return
        except OSError as exc:
            # Windows may report a browser-canceled stream as WinError 10053,
            # which is not consistently surfaced as ConnectionAbortedError.
            if is_client_disconnect_error(exc) or self._response_started:
                return
            try:
                self.send_json({"error": safe_text(exc, 240)}, 500)
            except OSError:
                return
        except Exception as exc:
            if self._response_started:
                return
            try:
                self.send_json({"error": safe_text(exc, 240)}, 500)
            except (BrokenPipeError, ConnectionError, OSError):
                return

    def do_POST(self) -> None:
        route = urllib.parse.urlsplit(self.path).path
        try:
            data = self.read_json_body()
            if route == "/api/scan":
                if not DESKTOP_MODE:
                    self.send_json({"error": "Folder scanning is available in the desktop app."}, 403)
                    return
                folder = Path(str(data.get("folder", ""))).expanduser()
                if not folder.is_dir():
                    self.send_json({"error": "Folder not found or access was denied."}, 400)
                    return
                result = self.scan_paths(folder)
                self.send_json(result)
            elif route == "/api/add-files":
                if not DESKTOP_MODE:
                    self.send_json({"error": "Persistent file import is available in the desktop app."}, 403)
                    return
                raw = data.get("paths", [])
                if not isinstance(raw, list):
                    raise ValueError("Invalid file list.")
                result = self.add_paths([Path(str(item)).expanduser() for item in raw])
                self.send_json(result)
            elif route == "/api/playback":
                track_id = safe_text(data.get("id", ""), 100)
                with DATA_LOCK:
                    library = load_library()
                    track = next((item for item in library if item.get("id") == track_id), None)
                    if not track:
                        self.send_json({"error": "Track not found."}, 404)
                        return
                    track["lastPlayedAt"] = datetime.now().isoformat(timespec="seconds")
                    try:
                        track["playCount"] = max(0, int(track.get("playCount", 0))) + 1
                    except (TypeError, ValueError):
                        track["playCount"] = 1
                    library = [track if item.get("id") == track_id else item for item in library]
                    save_library(library)
                self.send_json({"ok": True, "track": serialize_track(track)})
            elif route == "/api/remove-track":
                track_id = safe_text(data.get("id", ""), 100)
                with DATA_LOCK:
                    library = load_library()
                    track = next((item for item in library if item.get("id") == track_id), None)
                    if not track:
                        self.send_json({"error": "Track not found."}, 404)
                        return
                    library = [item for item in library if item.get("id") != track_id]
                    save_library(library)
                    playlists = load_playlists()
                    for playlist in playlists:
                        playlist["trackIds"] = [value for value in playlist.get("trackIds", []) if value != track_id]
                    save_playlists(playlists)
                delete_file = bool(data.get("deleteFile"))
                removed_file = False
                if delete_file and track.get("managed"):
                    path = Path(str(track.get("path", ""))).resolve()
                    if is_under(path, DATA_DIR):
                        try:
                            path.unlink(missing_ok=True)
                            removed_file = True
                        except OSError:
                            pass
                self.send_json({"ok": True, "removedFile": removed_file})
            elif route == "/api/update-track":
                track_id = safe_text(data.get("id", ""), 100)
                with DATA_LOCK:
                    library = load_library()
                    track = next((item for item in library if item.get("id") == track_id), None)
                    if not track:
                        self.send_json({"error": "Track not found."}, 404)
                        return
                    track["genre"] = safe_text(data.get("genre", track.get("genre", "")), 80)
                    track.pop("mood", None)
                    tags = data.get("tags", track.get("tags", []))
                    if isinstance(tags, str):
                        tags = [value.strip() for value in tags.split(",") if value.strip()]
                    track["tags"] = [safe_text(value, 40) for value in tags[:16]] if isinstance(tags, list) else []
                    if "favorite" in data:
                        track["favorite"] = bool(data["favorite"])
                    for index, item in enumerate(library):
                        if item.get("id") == track_id:
                            library[index] = track
                            break
                    save_library(library)
                self.send_json({"ok": True, "track": serialize_track(track)})
            elif route == "/api/playlists":
                self.save_playlist(data)
            elif route == "/api/delete-playlist":
                playlist_id = safe_text(data.get("id", ""), 100)
                with DATA_LOCK:
                    playlists = load_playlists()
                    selected = next((item for item in playlists if item.get("id") == playlist_id), None)
                    if not selected:
                        self.send_json({"error": "Playlist not found."}, 404)
                        return
                    playlists = [item for item in playlists if item.get("id") != playlist_id]
                    save_playlists(playlists)
                art = Path(str(selected.get("artworkPath", ""))).resolve() if selected.get("artworkPath") else None
                if art and is_under(art, ART_DIR):
                    art.unlink(missing_ok=True)
                self.send_json({"ok": True})
            elif route == "/api/settings":
                with DATA_LOCK:
                    current = load_settings()
                    for key in ("includeMusicInBackup", "reduceMotion"):
                        if key in data:
                            current[key] = bool(data[key])
                    if "theme" in data:
                        candidate_theme = str(data.get("theme", "dark")).lower()
                        if candidate_theme in {"dark", "light"}:
                            current["theme"] = candidate_theme
                    if "defaultVolume" in data:
                        try:
                            current["defaultVolume"] = max(0.0, min(1.0, float(data["defaultVolume"])))
                        except (TypeError, ValueError):
                            pass
                    write_json(SETTINGS_FILE, current)
                self.send_json({"ok": True, "settings": current})
            elif route == "/api/sync":
                ids = data.get("ids", [])
                if not isinstance(ids, list):
                    ids = []
                self.send_json(start_sync([safe_text(item, 100) for item in ids]))
            elif route == "/api/download":
                task = start_download(safe_text(data.get("resultId", ""), 100))
                self.send_json(task, 202)
            elif route == "/api/backup":
                task = start_backup(bool(data.get("includeMusic", True)), safe_text(data.get("target", ""), 900))
                self.send_json(task, 202)
            else:
                self.send_json({"error": "Request route not found."}, 404)
        except (BrokenPipeError, ConnectionError):
            return
        except (ValueError, json.JSONDecodeError) as exc:
            if self._response_started:
                return
            try:
                self.send_json({"error": safe_text(exc, 220)}, 400)
            except (BrokenPipeError, ConnectionError, OSError):
                return
        except OSError as exc:
            if is_client_disconnect_error(exc) or self._response_started:
                return
            try:
                self.send_json({"error": safe_text(exc, 240)}, 500)
            except OSError:
                return
        except Exception as exc:
            if self._response_started:
                return
            try:
                self.send_json({"error": safe_text(exc, 240)}, 500)
            except (BrokenPipeError, ConnectionError, OSError):
                return

    def save_playlist(self, data: dict[str, Any]) -> None:
        name = safe_text(data.get("name", ""), 80)
        if not name:
            self.send_json({"error": "Enter a playlist name."}, 400)
            return
        track_ids = data.get("trackIds", [])
        if not isinstance(track_ids, list):
            track_ids = []
        artwork_data = safe_text(data.get("artworkData", ""), 12_000_000)
        with DATA_LOCK:
            library = load_library()
            valid_ids = {item.get("id") for item in library}
            track_ids = list(dict.fromkeys(str(item) for item in track_ids if str(item) in valid_ids))
            playlists = load_playlists()
            playlist_id = safe_text(data.get("id", ""), 100)
            current = next((item for item in playlists if item.get("id") == playlist_id), None) if playlist_id else None
            if not current:
                playlist_id = uuid.uuid4().hex[:12]
                current = {"id": playlist_id, "createdAt": datetime.now().isoformat(timespec="seconds")}
            old_art = str(current.get("artworkPath", ""))
            current.update({"name": name, "trackIds": track_ids, "updatedAt": datetime.now().isoformat(timespec="seconds")})
            if artwork_data.startswith("data:image/"):
                header, encoded = artwork_data.split(",", 1)
                mime = header.split(";", 1)[0].replace("data:", "").lower()
                ext = mimetypes.guess_extension(mime) or ".png"
                if ext not in {".png", ".jpg", ".jpeg", ".webp"}:
                    ext = ".png"
                image_bytes = base64.b64decode(encoded, validate=True)
                if len(image_bytes) > 8 * 1024 * 1024:
                    raise ValueError("Cover image is too large.")
                art_path = ART_DIR / f"playlist-{playlist_id}{ext}"
                art_path.write_bytes(image_bytes)
                current["artworkPath"] = str(art_path)
                if old_art and old_art != str(art_path):
                    old_path = Path(old_art).resolve()
                    if is_under(old_path, ART_DIR):
                        old_path.unlink(missing_ok=True)
            elif not current.get("artworkPath"):
                current["artworkPath"] = ""
            if current not in playlists:
                playlists.append(current)
            else:
                playlists = [current if item.get("id") == playlist_id else item for item in playlists]
            save_playlists(playlists)
        self.send_json({"ok": True, "playlist": serialize_playlist(current, library)})

    def scan_paths(self, folder: Path) -> dict[str, Any]:
        candidates: list[Path] = []
        for current, dirs, files in os.walk(folder, followlinks=False):
            dirs[:] = [name for name in dirs if not name.startswith(".")]
            for name in files:
                path = Path(current) / name
                if path.suffix.lower() in AUDIO_EXTENSIONS:
                    candidates.append(path)
        result = self.add_paths(candidates)
        result["scanned"] = len(candidates)
        return result

    def add_paths(self, paths: list[Path]) -> dict[str, Any]:
        added = 0
        skipped = 0
        with DATA_LOCK:
            library = load_library()
            existing = {str(Path(str(item.get("path", ""))).resolve()) for item in library if item.get("path")}
            for path in paths:
                try:
                    path = path.resolve()
                    if not path.is_file() or path.suffix.lower() not in AUDIO_EXTENSIONS or not os.access(path, os.R_OK):
                        skipped += 1
                        continue
                    key = str(path)
                    if key in existing:
                        skipped += 1
                        continue
                    track = create_track(path)
                    library.append(track)
                    existing.add(key)
                    added += 1
                except (OSError, ValueError):
                    skipped += 1
            save_library(library)
        return {"ok": True, "added": added, "skipped": skipped, "total": len(library)}

    def proxy_audio(self, url: str) -> None:
        if not safe_external_url(url):
            self.send_error(403)
            return
        headers = {"User-Agent": USER_AGENT, "Accept": "*/*"}
        client_range = self.headers.get("Range")
        if client_range:
            headers["Range"] = client_range
        request = urllib.request.Request(url, headers=headers)
        try:
            with safe_urlopen(request, timeout=28) as response:
                status = getattr(response, "status", 200)
                raw_type = response.headers.get("Content-Type", "audio/mpeg").split(";", 1)[0].strip().lower()
                acceptable_types = {"application/octet-stream", "binary/octet-stream", "application/force-download", "application/x-download", "application/mp3"}
                if not raw_type.startswith("audio/") and raw_type not in acceptable_types:
                    self.send_error(415, "The direct MP3 link did not return audio")
                    return
                content_type = raw_type if raw_type.startswith("audio/") else "audio/mpeg"
                self.send_response(status)
                self.send_header("Content-Type", content_type)
                length = response.headers.get("Content-Length")
                if length:
                    self.send_header("Content-Length", length)
                content_range = response.headers.get("Content-Range")
                if content_range:
                    self.send_header("Content-Range", content_range)
                self.send_header("Accept-Ranges", "bytes")
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                while True:
                    block = response.read(128 * 1024)
                    if not block:
                        break
                    self.wfile.write(block)
        except (BrokenPipeError, ConnectionError):
            return
        except urllib.error.HTTPError as exc:
            try:
                self.send_error(exc.code, safe_text(exc.reason, 120))
            except (BrokenPipeError, ConnectionError, OSError):
                return
        except (urllib.error.URLError, TimeoutError, OSError, ValueError) as exc:
            if is_client_disconnect_error(exc) or self._response_started:
                return
            try:
                self.send_error(502, "Online audio is unavailable")
            except OSError:
                return

    def serve_path(self, path: Path, allow_range: bool = False, download_name: str = "") -> None:
        if not path.is_file():
            self.send_error(404)
            return
        size = path.stat().st_size
        start = 0
        end = max(0, size - 1)
        status = 200
        if allow_range:
            range_header = self.headers.get("Range", "")
            if range_header.startswith("bytes="):
                try:
                    raw = range_header[6:].split(",", 1)[0].strip()
                    first, last = raw.split("-", 1)
                    if not first:
                        length = int(last)
                        start = max(0, size - length)
                    else:
                        start = int(first)
                    if last and first:
                        end = min(end, int(last))
                    if start > end or start >= size:
                        self.send_response(416)
                        self.send_header("Content-Range", f"bytes */{size}")
                        self.end_headers()
                        return
                    status = 206
                except (ValueError, IndexError):
                    start, end, status = 0, max(0, size - 1), 200
        length = max(0, end - start + 1)
        mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        self.send_response(status)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(length))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-cache" if mime.startswith("audio/") else "public, max-age=300")
        if allow_range:
            self.send_header("Accept-Ranges", "bytes")
            if status == 206:
                self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        if download_name:
            quoted = urllib.parse.quote(download_name)
            self.send_header("Content-Disposition", f"attachment; filename*=UTF-8''{quoted}")
        self.end_headers()
        if self.command == "HEAD":
            return
        with path.open("rb") as handle:
            handle.seek(start)
            remaining = length
            while remaining > 0:
                block = handle.read(min(128 * 1024, remaining))
                if not block:
                    break
                self.wfile.write(block)
                remaining -= len(block)

    def do_HEAD(self) -> None:
        parsed = urllib.parse.urlsplit(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        route = urllib.parse.unquote(parsed.path)
        if route == "/api/media":
            raw = (params.get("path") or [""])[0]
            path = Path(raw).expanduser().resolve()
            if path.is_file() and check_media_allowed(path):
                self.serve_path(path, allow_range=True)
                return
        elif route == "/" or route == "/index.html":
            self.serve_path(WEB_ROOT / "index.html")
            return
        self.send_error(404)


class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def handle_error(self, request: Any, client_address: Any) -> None:
        # Browsers routinely cancel/replace media range requests while seeking,
        # switching tracks, or stopping playback. Treat that as normal client behavior.
        error = sys.exc_info()[1]
        if error is not None and is_client_disconnect_error(error):
            return
        super().handle_error(request, client_address)


class DesktopAPI:
    """Small native bridge used only by the desktop build."""
    def __init__(self, server: ThreadingHTTPServer):
        # pywebview recursively inspects public js_api attributes. Keep native
        # objects private so WinForms accessibility properties are never exposed.
        self._server = server
        self._window: Any = None
        self._hwnd = 0
        self._maximized = False
        self._fullscreen = False

    def pick_folder(self) -> str:
        try:
            import tkinter as tk
            from tkinter import filedialog
            root = tk.Tk()
            root.withdraw()
            root.attributes("-topmost", True)
            selected = filedialog.askdirectory(title="Choose a music folder", mustexist=True)
            root.destroy()
            return str(selected or "")
        except Exception:
            return ""

    def pick_files(self) -> list[str]:
        try:
            import tkinter as tk
            from tkinter import filedialog
            root = tk.Tk()
            root.withdraw()
            root.attributes("-topmost", True)
            selected = filedialog.askopenfilenames(
                title="Add music files",
                filetypes=[("Audio files", "*.mp3 *.wav *.ogg *.flac *.m4a *.aac *.opus *.wma *.aiff"), ("All files", "*.*")],
            )
            root.destroy()
            return list(selected or [])
        except Exception:
            return []

    def choose_backup_path(self) -> str:
        try:
            import tkinter as tk
            from tkinter import filedialog
            root = tk.Tk()
            root.withdraw()
            root.attributes("-topmost", True)
            selected = filedialog.asksaveasfilename(
                title="Save EchoDesk backup",
                defaultextension=".zip",
                initialfile=f"EchoDesk-backup-{datetime.now().strftime('%Y%m%d')}.zip",
                filetypes=[("ZIP backup", "*.zip")],
            )
            root.destroy()
            return str(selected or "")
        except Exception:
            return ""

    def _cache_native_handle(self) -> int:
        """Get pywebview's exact HWND; title-based discovery is only a fallback."""
        if os.name != "nt" or not self._window:
            return 0
        try:
            native = self._window.native
            handle = native.Handle
            value = int(handle.ToInt64()) if hasattr(handle, "ToInt64") else (int(handle.ToInt32()) if hasattr(handle, "ToInt32") else int(handle))
            if value > 0:
                self._hwnd = value
        except Exception:
            pass
        return self._hwnd

    def start_drag(self) -> bool:
        """Start a Windows caption-drag loop using pywebview's own top-level HWND."""
        if os.name != "nt" or not self._window:
            return False
        hwnd = self._hwnd or self._cache_native_handle() or find_desktop_window_handle()
        if not hwnd:
            return False

        def move_window(target_hwnd: int) -> None:
            try:
                import ctypes
                from ctypes import wintypes

                class POINT(ctypes.Structure):
                    _fields_ = [("x", wintypes.LONG), ("y", wintypes.LONG)]

                user32 = ctypes.WinDLL("user32", use_last_error=True)
                user32.GetCursorPos.argtypes = [ctypes.POINTER(POINT)]
                user32.GetCursorPos.restype = wintypes.BOOL
                user32.ReleaseCapture.argtypes = []
                user32.ReleaseCapture.restype = wintypes.BOOL
                user32.SendMessageW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
                user32.SendMessageW.restype = ctypes.c_ssize_t
                point = POINT()
                if not user32.GetCursorPos(ctypes.byref(point)):
                    return
                # Windows packs signed screen coordinates into the low 32 bits.
                packed = ((point.y & 0xFFFF) << 16) | (point.x & 0xFFFF)
                lparam = ctypes.c_ssize_t(packed).value
                user32.ReleaseCapture()
                # WM_NCLBUTTONDOWN + HTCAPTION hands the drag loop to Windows;
                # sending to pywebview's actual form HWND avoids title lookup races.
                user32.SendMessageW(target_hwnd, 0x00A1, 2, lparam)
            except Exception:
                pass

        threading.Thread(target=move_window, args=(int(hwnd),), daemon=True, name="native-window-drag").start()
        return True

    def minimize(self) -> None:
        if self._window:
            self._window.minimize()

    def toggle_maximize(self) -> None:
        if not self._window:
            return
        try:
            if self._maximized:
                self._window.restore()
            else:
                self._window.maximize()
            self._maximized = not self._maximized
        except Exception:
            pass

    def toggle_fullscreen(self) -> bool:
        if not self._window:
            return False
        try:
            self._window.toggle_fullscreen()
            self._fullscreen = not self._fullscreen
        except Exception:
            pass
        return self._fullscreen

    def close_app(self) -> None:
        if self._window:
            try:
                self._window.destroy()
            except Exception:
                pass
        threading.Thread(target=self._server.shutdown, daemon=True).start()

def run_web(host: str, port: int) -> None:
    global DESKTOP_MODE, ALLOW_EXTERNAL_BACKUP_PATH
    DESKTOP_MODE = False
    ALLOW_EXTERNAL_BACKUP_PATH = False
    server = ThreadingHTTPServer((host, port), EchoHandler)
    actual_port = server.server_address[1]
    print(f"EchoDesk web preview: http://{host if host != '0.0.0.0' else '127.0.0.1'}:{actual_port}")
    print(f"Data folder: {DATA_DIR}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


def find_desktop_window_handle() -> int:
    """Find EchoDesk's own top-level HWND, even when the native title lookup lags."""
    if os.name != "nt":
        return 0
    try:
        import ctypes
        from ctypes import wintypes
        user32 = ctypes.windll.user32
        user32.FindWindowW.argtypes = [wintypes.LPCWSTR, wintypes.LPCWSTR]
        user32.FindWindowW.restype = wintypes.HWND
        user32.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
        user32.GetWindowThreadProcessId.restype = wintypes.DWORD
        user32.IsWindowVisible.argtypes = [wintypes.HWND]
        user32.IsWindowVisible.restype = wintypes.BOOL
        user32.GetWindowTextLengthW.argtypes = [wintypes.HWND]
        user32.GetWindowTextLengthW.restype = ctypes.c_int
        user32.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
        user32.GetWindowTextW.restype = ctypes.c_int
        direct = user32.FindWindowW(None, APP_NAME)
        if direct:
            return int(direct)
        found: list[int] = []
        current_pid = os.getpid()
        callback_type = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
        user32.EnumWindows.argtypes = [callback_type, wintypes.LPARAM]
        user32.EnumWindows.restype = wintypes.BOOL

        def visit(hwnd: int, _lparam: int) -> bool:
            pid = wintypes.DWORD()
            user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
            if pid.value == current_pid and user32.IsWindowVisible(hwnd):
                length = user32.GetWindowTextLengthW(hwnd)
                title = ctypes.create_unicode_buffer(max(2, length + 1))
                user32.GetWindowTextW(hwnd, title, len(title))
                if APP_NAME.casefold() in title.value.casefold():
                    found.append(int(hwnd))
                    return False
            return True
        user32.EnumWindows(callback_type(visit), 0)
        return found[0] if found else 0
    except Exception:
        return 0


def apply_windows_square_corners(attempts: int = 100, hwnd_hint: int = 0) -> None:
    """Ask DWM to keep the frameless native window square on Windows 11."""
    if os.name != "nt":
        return
    import ctypes
    from ctypes import wintypes
    dwmapi = ctypes.WinDLL("dwmapi", use_last_error=True)
    dwmapi.DwmSetWindowAttribute.argtypes = [wintypes.HWND, wintypes.DWORD, ctypes.c_void_p, wintypes.DWORD]
    dwmapi.DwmSetWindowAttribute.restype = ctypes.c_long
    for _ in range(max(1, attempts)):
        hwnd = int(hwnd_hint or find_desktop_window_handle())
        if hwnd:
            try:
                preference = ctypes.c_int(1)  # DWMWCP_DONOTROUND
                dwmapi.DwmSetWindowAttribute(
                    hwnd, 33, ctypes.byref(preference), ctypes.sizeof(preference)
                )
            except Exception:
                pass
            return
        time.sleep(0.1)


def run_desktop(port: int = 0, debug: bool = False) -> None:
    global DESKTOP_MODE, ALLOW_EXTERNAL_BACKUP_PATH
    DESKTOP_MODE = True
    ALLOW_EXTERNAL_BACKUP_PATH = True
    try:
        import webview
    except ImportError as exc:
        raise SystemExit("PyWebView is not installed. Install requirements.txt or run with --web.") from exc
    if os.name == "nt":
        # Let pywebview's supported native drag-region handler process the
        # explicit top-bar surface; the overlay sits below the window buttons.
        try:
            webview.settings["DRAG_REGION_SELECTOR"] = ".pywebview-drag-region"
        except Exception:
            pass
    server = ThreadingHTTPServer(("127.0.0.1", port), EchoHandler)
    threading.Thread(target=server.serve_forever, daemon=True, name="echodesk-http").start()
    url = f"http://127.0.0.1:{server.server_address[1]}/"
    api = DesktopAPI(server)
    try:
        window = webview.create_window(
            APP_NAME,
            url=url,
            width=1460,
            height=940,
            min_size=(1120, 720),
            resizable=True,
            frameless=True,
            easy_drag=False,
            shadow=True,
            transparent=(os.name != "nt"),
            background_color="#16171a",
            js_api=api,
        )
        api._window = window
        def refresh_native_shape(*_args: Any) -> None:
            native_hwnd = api._cache_native_handle()
            apply_windows_square_corners(attempts=1, hwnd_hint=native_hwnd)
        for event_name in ("before_show", "shown", "resized", "restored", "maximized"):
            try:
                event = getattr(window.events, event_name)
                event += refresh_native_shape
            except (AttributeError, TypeError):
                pass
        threading.Thread(target=apply_windows_square_corners, daemon=True, name="window-shape").start()
        web_icon = resource_root() / "web" / "assets" / "echodesk-icon.ico"
        start_options: dict[str, Any] = {"debug": debug}
        if os.name == "nt" and web_icon.is_file():
            start_options["icon"] = str(web_icon)
        webview.start(**start_options)
    finally:
        try:
            server.shutdown()
        except Exception:
            pass
        server.server_close()


def main() -> None:
    ensure_directories()
    import argparse
    parser = argparse.ArgumentParser(description="EchoDesk local music player")
    parser.add_argument("--web", action="store_true", help="serve the app in a web browser for development")
    parser.add_argument("--host", default=os.environ.get("ECHODESK_HOST", "0.0.0.0"), help="web preview bind address")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8765")), help="web preview port")
    parser.add_argument("--debug", action="store_true", help="enable pywebview developer tools")
    args = parser.parse_args()
    if args.web:
        run_web(args.host, args.port)
    else:
        run_desktop(port=0, debug=args.debug)


if __name__ == "__main__":
    main()
