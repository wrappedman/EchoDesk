# EchoDesk

EchoDesk 1.0.5 is a local-first music player built with HTML, CSS, and JavaScript, backed by a small Python API and a frameless pywebview desktop host. The English interface keeps the gray/charcoal/graphite visual direction, with a saved dark or light theme. The browser preview uses the same UI and API.

## Run the desktop app

1. Install Python 3.10 or newer.
2. Run `run.bat`. It creates a project-local virtual environment, installs the requirements, and launches EchoDesk.
3. On a fresh install, EchoDesk adds four short, original demo tracks and a sample playlist. They are local demo assets and can be removed like other library items.
4. Use **Scan Folder** to index a music folder or **Add Files** to import selected tracks. EchoDesk stores their paths and does not move or modify the originals.

The window is frameless and square-cornered. The entire top toolbar has a pywebview drag surface beneath its controls, so non-button areas are intended to move the window when held and dragged; minimize, maximize/restore, and close remain clickable above it. The duplicate toolbar search and fullscreen button are removed. Native dragging and the window controls still require a final check on the target Windows machine.

## Build the Windows executable

On Windows 10/11, install Python 3.10+ and the **Microsoft Edge WebView2 Runtime**, then run `build_exe.bat`. The executable is written to `dist\EchoDesk.exe` and copied as `dist\EchoDesk-1.0.5.exe` (a separate filename also avoids reusing a cached Explorer icon). The batch file validates and passes the absolute path to `web\assets\echodesk-icon.ico` to PyInstaller, then includes the web assets for the native window icon. Build the Windows executable on Windows; the batch file uses the project's virtual environment.

The desktop host keeps its native window and server references private from the JavaScript bridge to avoid pywebview recursively inspecting Windows accessibility objects. On Windows 11 it asks DWM for square native corners and reapplies the preference after window size/state changes.

## Run the web preview

Run `run_web.bat`, then open `http://127.0.0.1:8765`. If that port is busy, run `python app.py --web --host 0.0.0.0 --port 8766`. In browser preview mode, files selected through the browser are temporary to that preview session, and permanent folder scanning is disabled. Persistent access to local folders and files is available only from the desktop app's native file pickers.

## Features

- Local library with multi-file import and recursive folder scanning, search, likes, removal, and editable genre and custom tags.
- Library multi-select with **Select visible**, bulk metadata sync, and bulk remove. Removing tracks from EchoDesk does not delete the original audio files.
- Home keeps a searchable track list close at hand. Home, the dock, and the full player share the same play/pause state.
- Playback controls, seekable waveform, previous/next, shuffle, repeat, adjustable volume, playback history, and a **Recently Played** view.
- Playlists with editable track selection and custom cover art.
- Working dark/light theme control, reduced-motion setting, and saved default volume.
- Direct MP3 search uses **Internet Archive**, **Openverse** (open-audio catalog), **DuckDuckGo**, and optional **Google Dorks** query variants (`filetype:mp3` and `inurl:mp3`) through the official Google Programmable Search API. Landing-page results are filtered out; indexed web results must point directly to an `.mp3` URL whose filename matches part of the query.
- Each direct MP3 row shows Play and Download controls. Open-license catalog items display their license; web-indexed direct MP3 links are marked **rights not verified** but can be streamed/downloaded on the user’s request. Use those actions only for files you are permitted to access. Direct streams are restricted to public HTTPS hosts, safe redirects, and MP3 file URLs.
- Metadata sync looks for cover art via iTunes Search, artist photos via Deezer with a Wikipedia thumbnail fallback, and lyrics via LRCLIB with a Lyrics.ovh fallback. Retrieved media is cached locally. Sync sends track title/artist metadata, not local audio files.
- ZIP backups of settings, library data, playlists, cached covers, and lyrics, with an option to include audio files.
- About attribution: `behnam Ehsani` · `inbox.ehsani@gmail.com`.

### Optional Google Dorks search

EchoDesk uses Google Dork operators through the official Google Programmable Search API; it does not scrape Google HTML. Two focused queries are run per search: `"track or artist" filetype:mp3` and `inurl:mp3 "track or artist" filetype:mp3`. To enable them, create a Google Programmable Search Engine and set both environment variables before starting EchoDesk:

- `ECHODESK_GOOGLE_API_KEY`
- `ECHODESK_GOOGLE_CSE_ID`

In PowerShell, set them for the current session before launch:

```powershell
$env:ECHODESK_GOOGLE_API_KEY = "your-api-key"
$env:ECHODESK_GOOGLE_CSE_ID = "your-search-engine-id"
.\run.bat
```

Configure the Programmable Search Engine to search the whole web if you want broad coverage. Google API quota and billing limits depend on your account. Only matching direct HTTPS MP3 URLs are shown; landing pages are filtered out. Google Dorks results remain marked **rights not verified**. Direct MP3 Play/Download is available by user request, and credentials do not imply permission to use the files.

## Data locations

- Windows: `%APPDATA%\EchoDesk`
- macOS: `~/Library/Application Support/EchoDesk`
- Linux: `~/.local/share/echodesk` (or `XDG_DATA_HOME`)

EchoDesk-managed downloads, artwork, lyrics, and backups are stored in separate subfolders. Backups are intended for recovery or transfer; the current version does not include an automatic Restore action.

## Audio formats and online limitations

The scanner indexes MP3, WAV, OGG/OGA, FLAC, M4A, AAC, OPUS, WMA, and AIFF. Playback of a specific codec depends on the installed system codecs and the WebView2/browser audio engine.

Online search requires an internet connection. Internet Archive/Openverse metadata can be incomplete or stale, so a displayed license is a helpful signal, not legal advice. Web-indexed direct MP3 URLs are not presumed authorized. Their rights label stays unverified, but the user can choose to stream or download the direct file and is responsible for confirming permission. Unsafe/private hosts and redirects are blocked; a source can still be unreachable or return a non-audio response.

## Design previews

`design-preview.png` and `design-search.png` are illustrative UI mockups showing the revised Home, three top-right window controls (minimize, maximize, close), and direct-MP3 result/rights-status states. The toolbar search and fullscreen control are absent. They are design references, not captured runtime screenshots.

## Project structure

```text
EchoDesk/
├── app.py                     # Local HTTP API, library services, web search, desktop host
├── CHANGELOG.md               # Release notes
├── web/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── favicon.svg
│   └── assets/
│       ├── echodesk-icon.png  # Selected high-resolution EchoDesk icon
│       ├── echodesk-icon.ico  # Windows application icon
│       └── ...                # Original demo covers and audio loops
├── tools/make_demo_audio.py   # Regenerates the original demo loops
├── requirements.txt
├── run.bat
├── run_web.bat
├── build_exe.bat
├── design-preview.png         # Illustrative Home and searchable library mockup
└── design-search.png          # Direct-MP3 search and rights-status mockup
```
