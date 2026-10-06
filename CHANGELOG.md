# EchoDesk change log

## 1.0.5 — 2026-10-06

- Replaced the hand-triggered top-bar drag with pywebview's supported drag-region mode; the drag surface now spans the toolbar while the minimize/maximize/close buttons remain above it.
- Hardened the Windows build script to validate and pass the absolute ICO path directly to PyInstaller, use the active virtual-environment module, and include the ICO web asset for the native app-window icon. The script also creates a versioned EXE copy to avoid confusion with a stale Explorer icon cache.

## 1.0.4 — 2026-10-06

- Added optional Google Dorks search through the official Google Programmable Search API. The app runs two focused direct-MP3 query variants (`filetype:mp3` and `inurl:mp3`) when both API environment variables are configured.
- Updated the Online Search page copy to identify Internet Archive, Openverse, DuckDuckGo, and optional Google Dorks.
- Kept web-indexed MP3 results visibly marked **rights not verified**; direct Play and Download remain the user's choice and responsibility.
- Carried forward the frameless-window drag handlers, Settings icon, three window controls (minimize/maximize/close), removed duplicate toolbar search/fullscreen controls, and bundled PNG/ICO app icon.
- Updated the About/README release version and retained the design previews in the source package.

## 1.0.3

- Direct MP3 links with missing rights metadata can be played/downloaded with explicit unverified-rights warnings.
- Added the selected EchoDesk PNG/ICO icon and design previews; simplified top-bar controls and retained the Online Search page.
