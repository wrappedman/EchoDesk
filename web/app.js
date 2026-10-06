/* EchoDesk UI — vanilla HTML/CSS/JS, no CDN or remote front-end dependencies. */
(() => {
  'use strict';

  const ICONS = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/><path d="M9 21v-6h6v6"/>',
    library: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 6v12M8 7h8M8 11h7M8 15h5"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
    heart: '<path d="M20.8 8.8c0 4.3-8.8 10-8.8 10s-8.8-5.7-8.8-10A4.8 4.8 0 0 1 12 6.3a4.8 4.8 0 0 1 8.8 2.5Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    playlist: '<path d="M4 5h12M4 10h12M4 15h7"/><path d="M17 14v6l4-2v-6z"/>',
    settings: '<circle cx="12" cy="12" r="4.1"/><path d="M12 2.7v2.1M12 19.2v2.1M21.3 12h-2.1M4.8 12H2.7M18.57 5.43l-1.48 1.48M6.91 17.09l-1.48 1.48m13.14 0-1.48-1.48M6.91 6.91 5.43 5.43"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M2 14h4M10 8h4M18 16h4"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    play: '<path d="M8 5.4c0-.8.9-1.3 1.6-.9l10.1 6.6a1.1 1.1 0 0 1 0 1.8l-10.1 6.6c-.7.5-1.6 0-1.6-.9z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M8 5h3v14H8zM15 5h3v14h-3z" fill="currentColor" stroke="none"/>',
    next: '<path d="M5 5.5v13l9-6.5z" fill="currentColor" stroke="none"/><path d="M19 5v14"/>',
    previous: '<path d="M19 5.5v13L10 12z" fill="currentColor" stroke="none"/><path d="M5 5v14"/>',
    shuffle: '<path d="m18 14 3 3-3 3M3 7h2.5c5.5 0 7.5 10 13 10H21M18 4l3 3-3 3M3 17h2.5c2.1 0 3.7-1.9 5.2-4M13.8 9c1.4-1.2 2.8-2 4.7-2H21"/>',
    repeat: '<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>',
    volume: '<path d="M4 10v4h3l4 3V7l-4 3z"/><path d="M15 9a5 5 0 0 1 0 6M17.5 6.5a9 9 0 0 1 0 11"/>',
    mute: '<path d="M4 10v4h3l4 3V7l-4 3zM16 9l5 6M21 9l-5 6"/>',
    expand: '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
    compress: '<path d="M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zM4 14h2v4h4v2H4zm14 0h2v6h-6v-2h4z"/>',
    lyrics: '<path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>',
    queue: '<path d="M4 6h13M4 11h13M4 16h8"/><path d="m17 15 4 2.5-4 2.5z" fill="currentColor" stroke="none"/>',
    add: '<path d="M12 5v14M5 12h14"/><circle cx="12" cy="12" r="9"/>',
    download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v3h16v-3"/>',
    folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h5l2 2h8A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/><path d="M3 10h18"/>',
    sync: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 9a7 7 0 0 1 11.6-2.6L20 9M4 15l2.3 2.6A7 7 0 0 0 18 15"/>',
    edit: '<path d="m4 16.5-.8 4.3 4.3-.8L19 8.5 15.5 5z"/><path d="m13.8 6.7 3.5 3.5M4 21h16"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    forward: '<path d="m9 18 6-6-6-6"/>',
    album: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    spark: '<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="m9 12 2 2 4-4"/>',
    cloud: '<path d="M7 18a5 5 0 0 1-.6-10A6.5 6.5 0 0 1 19 9.5 4.3 4.3 0 1 1 18 18z"/><path d="M12 12v7m0 0-3-3m3 3 3-3"/>',
    heartMusic: '<path d="M20 8.8c0 4.1-8 9.4-8 9.4S4 12.9 4 8.8A4.4 4.4 0 0 1 12 6a4.4 4.4 0 0 1 8 2.8Z"/><path d="M10 9v4m0 0 4-1V8l-4 1"/>',
    headphones: '<path d="M3 13v-1a9 9 0 0 1 18 0v1"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    clockSmall: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    wave: '<path d="M3 10v4M7 6v12M11 3v18M15 8v8M19 5v14M23 10v4"/>',
    moon: '<path d="M20.5 14.2A8 8 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    external: '<path d="M14 3h7v7M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    tag: '<path d="m20 13-7 7-10-10V3h7z"/><circle cx="7.5" cy="7.5" r="1"/>',
  };

  const state = {
    mode: 'web-preview',
    page: 'home',
    library: [],
    remoteLibrary: [],
    browserTracks: [],
    playlists: [],
    remotePlaylists: [],
    localPlaylists: [],
    settings: { theme: 'dark', defaultVolume: 0.72, includeMusicInBackup: true, reduceMotion: false },
    downloads: [],
    backups: [],
    sync: { status: 'idle', done: 0, total: 0, message: '' },
    storage: {},
    dataDir: '',
    currentId: '',
    currentOnline: null,
    heroArtFlipped: false,
    onlineResults: [],
    webResults: [],
    onlineQuery: '',
    onlineLoading: false,
    onlineError: '',
    onlineErrors: {},
    librarySearch: '',
    homeSearch: '',
    libraryGenreFilter: '',
    selectedPlaylistId: '',
    queueIds: [],
    isShuffle: false,
    isRepeat: false,
    recentIds: [],
    selectedTrackIds: new Set(),
  };

  const audio = document.getElementById('audioEngine');
  const pageHost = document.getElementById('pageHost');
  const rightRail = document.getElementById('rightRail');
  const modalLayer = document.getElementById('modalLayer');
  const toastStack = document.getElementById('toastStack');
  const folderPicker = document.getElementById('folderPicker');
  const filePicker = document.getElementById('filePicker');
  const coverPicker = document.getElementById('coverPicker');
  let pendingCoverData = '';
  let pendingCoverObjectUrl = '';
  let recentToasts = new Set();
  let lastSnapshotTime = 0;

  const faDigits = value => String(value);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const escAttr = value => esc(value).replace(/`/g, '&#96;');
  const icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.music}</svg>`;
  const hasBridge = () => Boolean(window.pywebview && window.pywebview.api);
  const getTrack = id => state.library.find(track => track.id === id) || (state.currentOnline && state.currentOnline.id === id ? state.currentOnline : null);
  const currentTrack = () => getTrack(state.currentId);

  function hydrateIcons(root = document) {
    root.querySelectorAll('[data-icon]').forEach(node => {
      const name = node.getAttribute('data-icon');
      if (node.dataset.iconDone === '1' && node.dataset.iconName === name) return;
      node.innerHTML = icon(name);
      node.dataset.iconDone = '1';
      node.dataset.iconName = name;
    });
  }

  async function apiRequest(path, body, options = {}) {
    const config = { method: body === undefined ? 'GET' : 'POST', headers: { 'Accept': 'application/json' }, cache: 'no-store' };
    if (body !== undefined) {
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(body);
    }
    if (options.signal) config.signal = options.signal;
    const response = await fetch(path, config);
    let payload = {};
    try { payload = await response.json(); } catch (_) { /* empty response */ }
    if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
    return payload;
  }

  function mergePlaylists() {
    state.playlists = [...state.remotePlaylists, ...state.localPlaylists];
  }

  function applySnapshot(snapshot) {
    state.mode = snapshot.mode || state.mode;
    state.remoteLibrary = Array.isArray(snapshot.library) ? snapshot.library : [];
    state.library = [...state.browserTracks, ...state.remoteLibrary];
    state.selectedTrackIds = new Set([...state.selectedTrackIds].filter(id => state.library.some(track => track.id === id)));
    state.remotePlaylists = Array.isArray(snapshot.playlists) ? snapshot.playlists : [];
    state.settings = { ...state.settings, ...(snapshot.settings || {}) };
    if (!['dark', 'light'].includes(state.settings.theme)) state.settings.theme = 'dark';
    state.downloads = Array.isArray(snapshot.downloads) ? snapshot.downloads : [];
    state.backups = Array.isArray(snapshot.backups) ? snapshot.backups : [];
    state.sync = snapshot.sync || state.sync;
    state.storage = snapshot.storage || {};
    state.dataDir = snapshot.dataDir || state.dataDir;
    mergePlaylists();
    lastSnapshotTime = Date.now();
    document.body.classList.toggle('dark', state.settings.theme !== 'light');
    document.body.classList.toggle('reduce-motion', Boolean(state.settings.reduceMotion));
    const savedRecent = safeStorageGet('echodeskRecentIds', []);
    state.recentIds = Array.isArray(savedRecent) ? savedRecent : [];
    const savedCurrent = safeStorageGet('echodeskCurrent', '');
    if (!state.currentId || !getTrack(state.currentId)) {
      const preferred = state.library.find(track => track.id === savedCurrent);
      state.currentId = preferred ? preferred.id : (state.library[0]?.id || '');
      state.currentOnline = null;
      primeAudio(false);
    }
    const localIds = safeStorageGet('echodeskLocalPlaylist', []);
    state.localPlaylists = Array.isArray(localIds) ? localIds : state.localPlaylists;
    mergePlaylists();
  }

  function safeStorageGet(key, fallback) {
    try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch (_) { return fallback; }
  }
  function safeStorageSet(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* private browsing */ } }

  async function loadState(showError = false) {
    try {
      const snapshot = await apiRequest('/api/state');
      applySnapshot(snapshot);
      renderAll();
      if (!audio.src && state.currentId) primeAudio(false);
    } catch (error) {
      if (showError) toast(`EchoDesk failed to load: ${error.message}`, 'error');
      pageHost.innerHTML = `<div class="page"><div class="empty-state"><div class="empty-state-icon">${icon('info')}</div><h3>Local connection unavailable</h3><p>The EchoDesk server is unavailable. Start it with run.bat or python app.py.</p></div></div>`;
      hydrateIcons(pageHost);
    }
  }

  function formatTime(seconds) {
    const value = Number.isFinite(Number(seconds)) && Number(seconds) > 0 ? Math.floor(Number(seconds)) : 0;
    const minutes = Math.floor(value / 60);
    const secs = String(value % 60).padStart(2, '0');
    return faDigits(`${minutes}:${secs}`);
  }

  function formatCount(value) {
    return faDigits(new Intl.NumberFormat('en-US').format(Number(value) || 0));
  }

  function trackCover(track, fallbackClass = '') {
    if (track && track.artworkUrl) {
      return `<img src="${escAttr(track.artworkUrl)}" alt="Cover for ${escAttr(track.title || '')}" loading="lazy" onerror="this.style.display='none'">`;
    }
    return `<div class="cover-fallback ${fallbackClass}">${icon('music')}</div>`;
  }

  function coverStyle(index = 0) {
    const values = [
      'linear-gradient(145deg,#25272c,#686c74)',
      'linear-gradient(145deg,#1c1e22,#52565e)',
      'linear-gradient(145deg,#303237,#747880)',
      'linear-gradient(145deg,#202226,#5c6068)',
      'linear-gradient(145deg,#292b30,#7b7f87)',
    ];
    return `--cover-grad:${values[index % values.length]}`;
  }

  function waveBars(count, trackId, id = '') {
    let seed = 17;
    for (const ch of String(trackId || 'wave')) seed = (seed * 31 + ch.charCodeAt(0)) % 65521;
    const bars = [];
    for (let i = 0; i < count; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      const random = seed / 233280;
      const envelope = 0.18 + Math.abs(Math.sin((i / count) * Math.PI * 3.5)) * 0.55;
      const height = Math.max(11, Math.round((0.2 + random * 0.72) * envelope * 100));
      bars.push(`<span class="wave-bar" style="--bar-height:${height}%"></span>`);
    }
    return `<div class="waveform" ${id ? `id="${id}"` : ''} data-wave data-track-id="${escAttr(trackId || '')}" role="slider" aria-label="Audio waveform and track position" tabindex="0">${bars.join('')}</div>`;
  }

  function pageHeading(kicker, title, subtitle, actions = '') {
    return `<div class="page-heading"><div class="heading-copy"><span class="kicker">${esc(kicker)}</span><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>${actions ? `<div class="heading-actions">${actions}</div>` : ''}</div>`;
  }

  function emptyState(title, description, actions = '') {
    return `<div class="empty-state"><div class="empty-state-icon">${icon('music')}</div><h3>${esc(title)}</h3><p>${esc(description)}</p>${actions ? `<div class="empty-actions">${actions}</div>` : ''}</div>`;
  }

  function setPage(page) {
    state.page = page;
    if (page !== 'playlists') state.selectedPlaylistId = page === 'playlist-detail' ? state.selectedPlaylistId : '';
    renderAll();
    document.querySelector('.page-host')?.scrollTo({ top: 0, behavior: state.settings.reduceMotion ? 'instant' : 'smooth' });
  }

  function renderAll() {
    renderSidebar();
    renderPage();
    renderRightRail();
    renderDock();
    syncPlayButtons();
    hydrateIcons();
    updateProgress();
    markNavigation();
  }

  function renderSidebar() {
    const count = state.library.length;
    const trackCount = document.getElementById('navTrackCount');
    const playlistCount = document.getElementById('navPlaylistCount');
    const storageCount = document.getElementById('storageCount');
    if (trackCount) trackCount.textContent = formatCount(count);
    if (playlistCount) playlistCount.textContent = formatCount(state.playlists.length);
    if (storageCount) storageCount.textContent = `${formatCount(count)} tracks`;
  }

  function markNavigation() {
    document.querySelectorAll('.nav-item[data-page], .sidebar-settings[data-page]').forEach(button => {
      const activePage = state.page === 'favorites' || state.page === 'recent' ? 'library' : (state.page === 'playlist-detail' ? 'playlists' : state.page);
      button.classList.toggle('active', button.dataset.page === activePage);
    });
  }

  function renderPage() {
    switch (state.page) {
      case 'library': pageHost.innerHTML = renderLibrary(); break;
      case 'favorites': pageHost.innerHTML = renderLibrary('favorites'); break;
      case 'recent': pageHost.innerHTML = renderLibrary('recent'); break;
      case 'online': pageHost.innerHTML = renderOnline(); break;
      case 'playlists': pageHost.innerHTML = renderPlaylists(); break;
      case 'playlist-detail': pageHost.innerHTML = renderPlaylistDetail(); break;
      case 'settings': pageHost.innerHTML = renderSettings(); break;
      case 'player': pageHost.innerHTML = renderFullPlayer(); break;
      default: state.page = 'home'; pageHost.innerHTML = renderHome(); break;
    }
    hydrateIcons(pageHost);
  }

  function renderHome() {
    const track = currentTrack() || state.library[0];
    if (!track) {
      const actions = `<button class="primary-btn" data-action="scan-folder">${icon('folder')} Scan Music Folder</button><button class="secondary-btn" data-page="online">${icon('search')} Search Online</button>`;
      return `<div class="page"><div class="home-greeting"><div><span class="kicker">WELCOME TO ECHODESK</span><h1>Your music, your space</h1><p>Your library is empty. Add local music or discover tracks online.</p></div></div>${emptyState('Add your first track', 'Scan a folder or add audio files to build your library. Original files are never moved.', actions)}<div class="home-bottom-grid"><div class="mini-collection"><div class="mini-collection-icon">${icon('shield')}</div><div class="mini-collection-copy"><strong>Private by design</strong><span>Your library stays on this device.</span></div></div><div class="mini-collection"><div class="mini-collection-icon">${icon('wave')}</div><div class="mini-collection-copy"><strong>Ready when you are</strong><span>Common audio formats are supported.</span></div></div></div></div>`;
    }
    const isPlaying = state.currentId === track.id && !audio.paused;
    const playedLabel = isPlaying ? 'NOW PLAYING' : 'READY TO PLAY';
    const query = String(state.homeSearch || '').trim().toLocaleLowerCase();
    const homeTracks = state.library.filter(item => !query || [item.title, item.artist, item.album, item.genre, ...(item.tags || [])].join(' ').toLocaleLowerCase().includes(query)).slice(0, 10);
    return `<div class="page">
      <div class="home-greeting"><div><span class="kicker">YOUR SOUND, EVERY DAY</span><h1>Welcome back to EchoDesk</h1><p>Your music is ready. Pick a track and press play.</p></div><div class="date-chip">LOCAL LIBRARY · OFFLINE READY</div></div>
      <section class="feature-player" aria-label="Main music player">
        <div class="feature-copy">
          <div class="feature-topline"><span class="feature-label">${icon('spark')} FEATURED TRACK</span><span class="feature-status">${playedLabel}</span></div>
          <h2 class="feature-title">${esc(track.title || 'Untitled')}</h2>
          <p class="feature-artist"><strong>${esc(track.artist || 'Unknown artist')}</strong>${track.album ? ` <span>· ${esc(track.album)}</span>` : ''}</p>
          <div class="feature-album">${icon('album')}<span>${esc(track.genre || 'Uncategorized')}</span></div>
          <div class="feature-wave-wrap"><div class="wave-time-row"><span>TRACK WAVEFORM</span><span>${formatTime(audio.currentTime || 0)} <span style="opacity:.55">/</span> ${formatTime(audio.duration || track.duration || 0)}</span></div>${waveBars(62, track.id, 'homeWave')}</div>
          <div class="feature-actions"><button class="feature-play" data-action="play-pause" aria-label="${isPlaying ? 'Pause' : 'Play'}">${icon(isPlaying ? 'pause' : 'play')}</button><button class="feature-secondary" data-action="show-lyrics" data-id="${escAttr(track.id)}">${icon('lyrics')} Lyrics</button><button class="feature-secondary" data-action="edit-track" data-id="${escAttr(track.id)}">${icon('sliders')} Organize</button><button class="feature-secondary" data-action="favorite-track" data-id="${escAttr(track.id)}">${icon('heart')} ${track.favorite ? 'Liked' : 'Like'}</button></div>
        </div>
        <div class="feature-art-area"><button type="button" class="feature-art-flip ${state.heroArtFlipped ? 'is-flipped' : ''}" data-action="flip-artist-image" aria-pressed="${state.heroArtFlipped}" aria-label="${state.heroArtFlipped ? 'Show album cover' : 'Show artist photo'}" title="Click to flip between cover and artist photo"><span class="feature-art-inner"><span class="feature-art-face feature-art-front"><span class="feature-art-frame">${trackCover(track)}<span class="art-tag"><span></span>${track.source && track.source.toLowerCase().includes('demo') ? 'ORIGINAL ECHODESK DEMO' : 'OFFLINE & READY'}</span></span></span><span class="feature-art-face feature-art-back">${track.artistImageUrl ? `<img class="artist-image" src="${escAttr(track.artistImageUrl)}" alt="Artist photo for ${escAttr(track.artist || track.title)}" title="Artist photo from ${escAttr(track.artistImageSource || 'an online source')}" loading="lazy" onerror="this.classList.add('image-error')">` : ''}<span class="artist-photo-empty ${track.artistImageUrl ? '' : 'no-image'}">${icon('music')}<strong>Artist photo not synced</strong><span>Use Sync Metadata in Library.</span></span><span class="artist-photo-credit">${track.artistImageUrl ? `ARTIST PHOTO · ${esc(track.artistImageSource || 'SOURCE')}` : 'ARTIST PHOTO'}</span></span></span></button><span class="feature-art-hint">${state.heroArtFlipped ? 'Click to return to album cover' : 'Click album art to view artist'}</span></div>
      </section>
      <div class="section-head home-library-head"><div><h2>Your Library</h2><p>${formatCount(state.library.length)} local and downloaded tracks · play anything without leaving Home</p></div><div class="home-library-controls"><label class="library-search">${icon('search')}<input id="homeLibrarySearch" type="search" value="${escAttr(state.homeSearch || '')}" placeholder="Search your tracks…"></label><button class="secondary-btn" data-action="add-files">${icon('plus')} Add Files</button><button class="primary-btn" data-action="scan-folder">${icon('folder')} Scan Folder</button></div></div>
      ${renderTrackTable(homeTracks, 'home')}
      ${homeTracks.length >= 10 ? `<div class="table-footnote">Showing 10 tracks. <button class="text-button" data-page="library">Open full library ${icon('forward')}</button></div>` : ''}
    </div>`;
  }

  function renderRightRail() {
    const playlistCount = state.playlists.length;
    const downloaded = state.storage.downloaded || 0;
    const queue = state.library.length ? [...state.library].sort((a, b) => (a.id === state.currentId ? -1 : b.id === state.currentId ? 1 : 0)).slice(0, 5) : [];
    const queueRows = queue.map((track, index) => {
      const active = track.id === state.currentId;
      return `<div class="queue-row ${active ? 'current' : ''}" data-action="play-track" data-id="${escAttr(track.id)}"><div class="queue-art">${trackCover(track)}</div><div class="queue-copy"><strong>${esc(track.title)}</strong><span>${esc(track.artist || 'Unknown artist')}</span></div>${active && !audio.paused ? `<span class="queue-playing"><i></i><i></i><i></i></span>` : `<span class="queue-number">${formatCount(index + 1)}</span>`}<button class="queue-add" data-action="add-track-to-playlist" data-id="${escAttr(track.id)}" title="Add to playlist">${icon('plus')}</button></div>`;
    }).join('');
    rightRail.innerHTML = `<div class="rail-heading"><h2>Up Next</h2><button class="tiny-icon-btn" data-action="queue" title="Manage queue">${icon('more')}</button></div>
      <div class="rail-subtitle"><span>From your library</span><span>${formatCount(queue.length)} tracks</span></div>
      <div class="queue-list">${queueRows || `<div class="queue-row"><div class="queue-art"></div><div class="queue-copy"><strong>Your queue is empty</strong><span>Add a few tracks to get started</span></div></div>`}</div>
      <div class="rail-divider"></div>
      <div class="rail-heading"><h2>Your Collection</h2><span class="storage-live" title="Ready"></span></div>
      <div class="rail-stats"><div class="rail-stat"><span>Local tracks</span><strong>${formatCount(state.library.length)}<em>tracks</em></strong></div><div class="rail-stat"><span>Playlists</span><strong>${formatCount(playlistCount)}<em>lists</em></strong></div></div>
      <div class="rail-note">${icon('shield')}<span>${downloaded ? `${formatCount(downloaded)} downloaded tracks` : 'Your music stays on this device.'}<br>Check source rights before reusing online results.</span></div>`;
    hydrateIcons(rightRail);
  }

  function syncPlayButtons() {
    const isPlaying = !audio.paused;
    document.querySelectorAll('[data-action="play-pause"]').forEach(button => {
      button.innerHTML = icon(isPlaying ? 'pause' : 'play');
      button.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
      button.title = isPlaying ? 'Pause' : 'Play';
    });
  }

  function renderDock() {
    const track = currentTrack();
    const art = document.getElementById('dockArt');
    const title = document.getElementById('dockTitle');
    const artist = document.getElementById('dockArtist');
    const playBtn = document.querySelector('.dock-play');
    const heartBtn = document.getElementById('dockHeart');
    if (track) {
      if (art) {
        art.src = track.artworkUrl || '';
        art.style.opacity = track.artworkUrl ? '1' : '.15';
        art.onerror = () => { art.style.opacity = '.18'; };
      }
      if (title) title.textContent = track.title || 'Untitled';
      if (artist) artist.textContent = track.artist || 'Unknown artist';
      if (heartBtn) heartBtn.classList.toggle('is-favorite', Boolean(track.favorite));
    } else {
      if (art) { art.src = ''; art.style.opacity = '.1'; }
      if (title) title.textContent = 'Nothing selected';
      if (artist) artist.textContent = 'Choose a track from your library';
      if (heartBtn) heartBtn.classList.remove('is-favorite');
    }
    if (playBtn) playBtn.innerHTML = icon(audio.paused ? 'play' : 'pause');
    const slider = document.getElementById('volumeSlider');
    if (slider && document.activeElement !== slider) slider.value = Math.round(Number(state.settings.defaultVolume ?? .72) * 100);
    updateVolumeUI();
    hydrateIcons(document.getElementById('playerDock'));
  }

  function renderTrackTable(tracks, context = '') {
    if (!tracks.length) return emptyState(context === 'favorites' ? 'No liked songs yet' : 'No tracks found', context === 'favorites' ? 'Tap the heart to collect your favorite tracks here.' : 'Try different filters or add more music to your library.', context ? '' : `<button class="primary-btn" data-action="scan-folder">${icon('folder')} Scan Folder</button>`);
    const selectable = context === 'library';
    const allVisibleSelected = selectable && tracks.every(track => state.selectedTrackIds.has(track.id));
    const selectHead = selectable ? `<label class="track-select-head"><input id="selectVisibleTracks" type="checkbox" ${allVisibleSelected ? 'checked' : ''} aria-label="Select all visible tracks"><span>Select</span></label>` : '';
    const rows = tracks.map(track => {
      const genreLabel = track.genre || 'Uncategorized';
      const album = track.album || track.source || '—';
      const isFavorite = Boolean(track.favorite);
      const selected = state.selectedTrackIds.has(track.id);
      const checkbox = selectable ? `<label class="track-select-cell"><input class="track-select-checkbox" data-track-select="${escAttr(track.id)}" type="checkbox" ${selected ? 'checked' : ''} aria-label="Select ${escAttr(track.title || 'track')}"></label>` : '';
      return `<div class="track-row ${selected && selectable ? 'is-selected' : ''}" data-track-id="${escAttr(track.id)}">
        ${checkbox}<div class="track-cell-main"><div class="track-thumb">${trackCover(track)}</div><div class="track-title-copy"><strong>${esc(track.title || 'Untitled')}</strong><span>${esc(track.artist || 'Unknown artist')}</span></div></div>
        <div class="track-muted-cell">${esc(album)}</div><div class="track-muted-cell"><span class="tag-chip">${esc(genreLabel)}</span></div>
        <div class="track-duration">${formatTime(track.duration || 0)}</div>
        <div class="track-actions">
          <button class="icon-action" data-action="play-track" data-id="${escAttr(track.id)}" title="Play">${icon('play')}</button>
          <button class="icon-action ${isFavorite ? 'is-favorite' : ''}" data-action="favorite-track" data-id="${escAttr(track.id)}" title="Like">${icon('heart')}</button>
          ${context.startsWith('playlist:') ? `<button class="icon-action" data-action="remove-from-playlist" data-id="${escAttr(track.id)}" title="Remove from playlist">${icon('trash')}</button>` : `<button class="icon-action" data-action="track-menu" data-id="${escAttr(track.id)}" title="More options">${icon('more')}</button>`}
        </div>
      </div>`;
    }).join('');
    return `<div class="track-table ${selectable ? 'selectable-track-table' : ''}"><div class="track-table-head">${selectHead}<span>Track</span><span>Album / Source</span><span>Genre</span><span>Length</span><span></span></div>${rows}</div>`;
  }

  function renderLibrary(kind = '') {
    const pageKind = kind || (state.page === 'favorites' ? 'favorites' : state.page === 'recent' ? 'recent' : 'library');
    let tracks = [...state.library];
    let title = 'My Library';
    let subtitle = 'All your local and downloaded music, together.';
    if (pageKind === 'favorites') { tracks = tracks.filter(track => track.favorite); title = 'Liked Songs'; subtitle = 'Tracks you have saved with a heart.'; }
    if (pageKind === 'recent') {
      const ranks = new Map(state.recentIds.map((id, index) => [id, index]));
      tracks = tracks.filter(track => track.lastPlayedAt || ranks.has(track.id)).sort((a, b) => {
        const aTime = Date.parse(a.lastPlayedAt || '') || 0;
        const bTime = Date.parse(b.lastPlayedAt || '') || 0;
        if (aTime && bTime && aTime !== bTime) return bTime - aTime;
        if (aTime !== bTime) return bTime ? 1 : -1;
        return (ranks.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (ranks.get(b.id) ?? Number.MAX_SAFE_INTEGER);
      });
      title = 'Recently Played'; subtitle = 'The last tracks you listened to.';
    }
    const all = [...tracks];
    if (pageKind === 'library') {
      if (state.librarySearch.trim()) {
        const q = state.librarySearch.toLocaleLowerCase();
        tracks = tracks.filter(track => [track.title, track.artist, track.album, track.genre, ...(track.tags || [])].join(' ').toLocaleLowerCase().includes(q));
      }
      if (state.libraryGenreFilter) tracks = tracks.filter(track => track.genre === state.libraryGenreFilter);
    }
    const genres = [...new Set(all.map(track => track.genre).filter(Boolean))].sort((a,b) => a.localeCompare(b));
    const actions = pageKind === 'library' ? `<button class="secondary-btn" data-action="sync-library">${icon('sync')} Sync Metadata</button><button class="secondary-btn" data-action="add-files">${icon('plus')} Add Files</button><button class="primary-btn" data-action="scan-folder">${icon('folder')} Scan Folder</button>` : `<button class="secondary-btn" data-page="library">${icon('library')} View All Tracks</button>`;
    const selectedCount = state.selectedTrackIds.size;
    const bulkActions = pageKind === 'library' ? `<div class="bulk-actions"><span class="bulk-selection-count">${formatCount(selectedCount)} selected</span><button class="secondary-btn" data-action="select-visible-tracks">${icon('check')} Select Visible</button><button class="secondary-btn" data-action="bulk-sync" ${selectedCount ? '' : 'disabled'}>${icon('sync')} Sync Selected</button><button class="danger-btn" data-action="bulk-delete" ${selectedCount ? '' : 'disabled'}>${icon('trash')} Remove Selected</button><button class="quiet-btn" data-action="clear-selection" ${selectedCount ? '' : 'disabled'}>Clear</button></div>` : '';
    const sync = state.sync.status === 'running' || state.sync.status === 'queued'
      ? `<div class="sync-progress-pill"><span class="loading-dot"></span>${esc(state.sync.message || 'Syncing metadata')}</div>`
      : state.sync.status === 'complete' && state.sync.message
        ? `<div class="sync-complete-note">${icon('check')}<span>${esc(state.sync.message)}</span></div>`
        : '';
    return `<div class="page">${pageHeading('YOUR MUSIC', title, subtitle, actions)}
      ${pageKind === 'library' ? `<div class="library-toolbar"><label class="library-search">${icon('search')}<input id="librarySearch" type="search" value="${escAttr(state.librarySearch)}" placeholder="Search track, artist, album…"></label><div class="library-tools-left"><select class="filter-select" id="genreFilter"><option value="">All genres</option>${genres.map(value => `<option ${state.libraryGenreFilter === value ? 'selected' : ''} value="${escAttr(value)}">${esc(value)}</option>`).join('')}</select><span class="library-summary">${formatCount(tracks.length)} of ${formatCount(all.length)} tracks</span></div></div>${bulkActions}${sync}` : `<div class="section-head"><div><h2>${formatCount(tracks.length)} tracks</h2><p>Search, play, or organize your music</p></div></div>`}
      ${renderTrackTable(tracks, pageKind)}
      <div class="table-footnote">${icon('info')}<span>Removing a track from the library does not delete the original file. EchoDesk-managed downloads can be deleted separately.</span></div>
    </div>`;
  }

  function renderOnline() {
    const taskByResult = new Map(state.downloads.map(task => [task.resultId, task]));
    const archiveRows = state.onlineResults.map(item => {
      const task = taskByResult.get(item.id);
      const play = item.playAllowed && item.streamUrl
        ? `<button class="online-play" data-action="play-online" data-id="${escAttr(item.id)}" aria-label="Play ${escAttr(item.title)}" title="${item.rightsVerified ? 'Play direct MP3' : 'Rights are not verified; play only if you are permitted to use this file.'}">${icon('play')}</button>`
        : `<button class="online-play" disabled aria-label="Play unavailable" title="This direct MP3 is not currently reachable.">${icon('play')}</button>`;
      let downloadAction = item.downloadAllowed && item.streamUrl
        ? `<button class="online-download" data-action="download-online" data-id="${escAttr(item.id)}" title="${item.rightsVerified ? 'Download direct MP3' : 'Rights are not verified; download only if you are permitted to access this file.'}">${icon('download')} Download</button>`
        : `<button class="online-download rights-disabled" disabled title="This direct MP3 cannot be downloaded.">${icon('shield')} Unavailable</button>`;
      if (task && (task.status === 'queued' || task.status === 'downloading')) {
        downloadAction = `<div class="download-progress"><span>${formatCount(task.progress || 0)}% · Downloading</span><i><b style="--progress:${Math.max(0,Math.min(100,Number(task.progress)||0))}%"></b></i></div>`;
      } else if (task && task.status === 'complete') {
        downloadAction = `<button class="online-download downloaded" disabled>${icon('check')} Added</button>`;
      } else if (task && task.status === 'error' && item.downloadAllowed && item.streamUrl) {
        downloadAction = `<button class="online-download" data-action="download-online" data-id="${escAttr(item.id)}">${icon('sync')} Retry</button>`;
      }
      return `<article class="online-card"><div class="online-art">${icon('music')}</div><div class="online-copy"><strong>${esc(item.title)}</strong><span>${esc(item.fileName || 'MP3 file')}${item.artist ? ` · ${esc(item.artist)}` : ''}</span><div class="online-meta"><span class="license-chip ${item.rightsVerified ? '' : 'rights-unknown'}" title="${escAttr(item.rightsVerified ? (item.attribution || item.licenseUrl || 'Open-license metadata reported by the catalog.') : 'Rights have not been verified; use direct actions only when permitted.')}">${icon(item.rightsVerified ? 'shield' : 'info')}${esc(item.licenseLabel || (item.rightsVerified ? 'Open license' : 'Rights not verified'))}</span><span class="online-format">${esc(item.source || 'Licensed catalog')} · MP3</span></div></div><div class="online-actions">${play}${downloadAction}</div></article>`;
    }).join('');
    const webRows = state.webResults.map(item => {
      const task = taskByResult.get(item.id);
      const play = item.playAllowed && item.streamUrl
        ? `<button class="online-play" data-action="play-online" data-id="${escAttr(item.id)}" aria-label="Play ${escAttr(item.title || item.fileName)}; rights unverified" title="Direct MP3. Rights are unverified; play only if you are allowed to use it.">${icon('play')}</button>`
        : `<button class="online-play" disabled aria-label="Direct MP3 unavailable" title="This direct MP3 is not currently reachable.">${icon('play')}</button>`;
      let downloadAction = item.downloadAllowed && item.streamUrl
        ? `<button class="online-download" data-action="download-online" data-id="${escAttr(item.id)}" title="Rights are unverified; download only if you are allowed to access this file.">${icon('download')} Download</button>`
        : `<button class="online-download rights-disabled" disabled title="This direct MP3 cannot be downloaded.">${icon('shield')} Unavailable</button>`;
      if (task && (task.status === 'queued' || task.status === 'downloading')) {
        downloadAction = `<div class="download-progress"><span>${formatCount(task.progress || 0)}% · Downloading</span><i><b style="--progress:${Math.max(0,Math.min(100,Number(task.progress)||0))}%"></b></i></div>`;
      } else if (task && task.status === 'complete') {
        downloadAction = `<button class="online-download downloaded" disabled>${icon('check')} Added</button>`;
      } else if (task && task.status === 'error' && item.downloadAllowed && item.streamUrl) {
        downloadAction = `<button class="online-download" data-action="download-online" data-id="${escAttr(item.id)}">${icon('sync')} Retry</button>`;
      }
      return `<article class="online-card web-result-card"><div class="online-art">${icon('music')}</div><div class="online-copy"><strong>${esc(item.title || item.fileName || 'MP3 file')}</strong><span>${esc(item.fileName || 'Direct MP3 file')}</span><div class="online-meta"><span class="license-chip rights-unknown" title="The search index does not verify the file's reuse license.">${icon('info')}MP3 · rights unverified</span><span class="online-format">${esc([item.searchProvider, item.source].filter(Boolean).join(' · ') || 'Web index')}</span></div></div><div class="online-actions">${play}${downloadAction}</div></article>`;
    }).join('');
    const loading = state.onlineLoading ? `<div class="empty-state"><div class="empty-state-icon"><span class="loading-dot"></span></div><h3>Searching for MP3 files…</h3><p>Checking licensed audio catalogs and direct file links in the web index.</p></div>` : '';
    const error = state.onlineError ? `<div class="online-error">${esc(state.onlineError)}</div>` : '';
    const sourceErrors = Object.entries(state.onlineErrors || {}).map(([source, message]) => `<div class="online-error source-warning"><strong>${esc(source)}:</strong> ${esc(message)}</div>`).join('');
    const hasResults = Boolean(archiveRows || webRows);
    const resultCount = state.onlineResults.length + state.webResults.length;
    const empty = !state.onlineLoading && !state.onlineError && state.onlineQuery && !hasResults
      ? emptyState('No direct MP3 links found', 'Try a different track title. Results are filtered to direct .mp3 files. Web-indexed links are marked rights-unverified and play/download only when you are permitted to use them.')
      : !state.onlineLoading && !state.onlineQuery ? emptyState('Find a direct MP3', 'Search by track or artist. This list contains audio files, not website landing pages.') : '';
    return `<div class="page">${pageHeading('DISCOVER', 'Direct MP3 Search', 'Search Internet Archive, Openverse, and DuckDuckGo; optional Google Dorks add more direct MP3 matches.')}
      <section class="online-hero"><div class="online-hero-inner"><h2>Search for an MP3</h2><p>Open-audio catalogs and web indexes, with Google Dorks available through Google Programmable Search API credentials.</p><form class="online-search-form" id="onlineSearchForm"><label class="online-search-input">${icon('search')}<input id="onlineSearchInput" type="search" value="${escAttr(state.onlineQuery)}" placeholder="Enter a track or artist…" autocomplete="off"></label><button class="primary-btn" type="submit">${icon('search')} Search MP3s</button></form></div></section>
      <div class="source-note">${icon('shield')}<span>Only direct MP3 file links are listed—no result webpages. Catalog licenses are shown when available. Web-indexed MP3 rights are not verified; Play/Download use the direct file URL, so use them only when you are permitted to access the file.</span></div>
      ${state.onlineQuery ? `<div class="online-results-head"><h2>Direct MP3 files</h2><span>${state.onlineLoading ? 'Searching…' : `${formatCount(resultCount)} results`}</span></div>` : ''}
      ${error}${sourceErrors}${loading}${archiveRows ? `<div class="online-list">${archiveRows}</div>` : ''}
      ${state.onlineQuery && webRows ? `<div class="online-results-head"><h2>Web-indexed MP3 links · rights unknown</h2><span>${formatCount(state.webResults.length)} files</span></div><div class="online-list">${webRows}</div>` : ''}
      ${empty}
    </div>`;
  }

  function renderPlaylists() {
    const cards = state.playlists.map((playlist, index) => `<article class="playlist-card" data-action="open-playlist" data-id="${escAttr(playlist.id)}"><div class="playlist-cover" style="${coverStyle(index)}">${playlist.artworkUrl ? `<img src="${escAttr(playlist.artworkUrl)}" alt="${escAttr(playlist.name)} cover" onerror="this.style.display='none'">` : `<div class="playlist-cover-art" style="${coverStyle(index)}">${icon('playlist')}</div>`}<button class="playlist-card-play" data-action="play-playlist" data-id="${escAttr(playlist.id)}" title="Play playlist">${icon('play')}</button></div><div class="playlist-card-meta"><strong>${esc(playlist.name)}</strong><span>${formatCount(playlist.count ?? (playlist.trackIds || []).length)} tracks · personal mix</span></div></article>`).join('');
    const actions = `<button class="primary-btn" data-action="new-playlist">${icon('plus')} Create Playlist</button>`;
    return `<div class="page">${pageHeading('YOUR MIXES', 'Your Playlists', 'Collect your favorite music in one place.', actions)}${cards ? `<div class="playlist-grid">${cards}</div>` : emptyState('No playlists yet', 'Bring library tracks together and choose custom cover art for each list.', `<button class="primary-btn" data-action="new-playlist">${icon('plus')} Create your first playlist</button>`)}</div>`;
  }

  function renderPlaylistDetail() {
    const playlist = state.playlists.find(item => item.id === state.selectedPlaylistId);
    if (!playlist) return renderPlaylists();
    const tracks = (playlist.trackIds || []).map(id => getTrack(id)).filter(Boolean);
    const cover = playlist.artworkUrl ? `<img src="${escAttr(playlist.artworkUrl)}" alt="" onerror="this.style.display='none'">` : `<div class="playlist-cover-art" style="${coverStyle(1)}">${icon('playlist')}</div>`;
    return `<div class="page"><div class="page-heading"><div class="heading-copy"><span class="kicker">PERSONAL PLAYLIST</span><h1>${esc(playlist.name)}</h1><p>${formatCount(tracks.length)} tracks in this mix</p></div><div class="heading-actions"><button class="secondary-btn" data-action="back-playlists">${icon('back')} All Playlists</button></div></div>
      <section class="playlist-detail-cover"><div class="playlist-detail-art">${cover}</div><div class="playlist-detail-copy"><span class="kicker">PERSONAL PLAYLIST</span><h2>${esc(playlist.name)}</h2><p>${formatCount(tracks.length)} tracks · ${playlist.updatedAt ? `Updated ${esc(playlist.updatedAt.slice(0,10))}` : 'Ready to play'}</p><div class="playlist-detail-actions"><button class="primary-btn" data-action="play-playlist" data-id="${escAttr(playlist.id)}">${icon('play')} Play All</button><button class="secondary-btn" data-action="edit-playlist" data-id="${escAttr(playlist.id)}">${icon('edit')} Edit</button><button class="quiet-btn" data-action="delete-playlist" data-id="${escAttr(playlist.id)}">${icon('trash')} Delete</button></div></div></section>
      <div class="section-head"><div><h2>Playlist Tracks</h2><p>Use the trash icon to remove a track from this playlist.</p></div><button class="text-button" data-action="edit-playlist" data-id="${escAttr(playlist.id)}">${icon('plus')} Manage Tracks</button></div>
      ${renderTrackTable(tracks, `playlist:${playlist.id}`)}
    </div>`;
  }

  function renderSettings() {
    const theme = state.settings.theme || 'dark';
    const volume = Math.round((Number(state.settings.defaultVolume) || 0) * 100);
    const includeMusic = state.settings.includeMusicInBackup !== false;
    const reduceMotion = Boolean(state.settings.reduceMotion);
    const syncText = state.sync.status === 'running' || state.sync.status === 'queued' ? `${formatCount(state.sync.done || 0)} of ${formatCount(state.sync.total || 0)} tracks` : state.sync.status === 'complete' ? (state.sync.message || 'Metadata sync complete.') : 'Find missing cover art, artist photos, and lyrics.';
    return `<div class="page">${pageHeading('PREFERENCES', 'EchoDesk Settings', 'Tune playback, appearance, and how your library is stored.')}
      <div class="settings-layout"><div class="settings-column">
        <section class="settings-card"><div class="settings-card-head"><div><h2>Appearance</h2><p>Theme and motion preferences.</p></div><span>${icon(theme === 'dark' ? 'moon' : 'sun')}</span></div>
          <div class="setting-row"><div class="setting-copy"><strong>Dark theme</strong><span>Switch between the dark and light interface.</span></div><button class="switch ${theme === 'dark' ? 'on' : ''}" data-action="toggle-setting" data-key="theme" data-value="${theme === 'dark' ? 'light' : 'dark'}" aria-label="Toggle dark theme" aria-pressed="${theme === 'dark'}"></button></div>
          <div class="setting-row"><div class="setting-copy"><strong>Reduce motion</strong><span>Use fewer animations and transitions.</span></div><button class="switch ${reduceMotion ? 'on' : ''}" data-action="toggle-setting" data-key="reduceMotion" data-value="${!reduceMotion}" aria-label="Reduce motion"></button></div>
        </section>
        <section class="settings-card"><div class="settings-card-head"><div><h2>Playback &amp; Audio</h2><p>Default volume when the app starts.</p></div><span>${icon('volume')}</span></div>
          <div class="setting-row"><div class="setting-copy"><strong>Default volume</strong><span>Adjust it anytime from the player dock.</span></div><label class="settings-volume"><input id="settingsVolume" type="range" min="0" max="100" value="${volume}"><span>${faDigits(volume)}%</span></label></div>
          <div class="setting-row"><div class="setting-copy"><strong>Offline audio formats</strong><span>MP3, WAV, OGG, FLAC, M4A, AAC, OPUS, WMA and AIFF.</span></div><span class="tag-chip">Enabled</span></div>
        </section>
        <section class="settings-card"><div class="settings-card-head"><div><h2>Metadata Sync</h2><p>${esc(syncText)}</p></div><span>${icon('sync')}</span></div>
          <div class="setting-row"><div class="setting-copy"><strong>Cover art, artist photos &amp; lyrics</strong><span>Search iTunes for covers, Deezer/Wikipedia for artist photos, and LRCLIB/Lyrics.ovh for lyrics. Saved files stay on this device.</span></div><button class="secondary-btn" data-action="sync-library">${icon('sync')} Sync Metadata</button></div>
        </section>
      </div><div class="settings-column">
        <section class="settings-card"><div class="settings-card-head"><div><h2>Backups</h2><p>Create a ZIP of your library, playlists, cover art, lyrics, and optionally audio files.</p></div><span>${icon('cloud')}</span></div>
          <div class="setting-row"><div class="setting-copy"><strong>Include audio files</strong><span>This makes the backup larger.</span></div><button class="switch ${includeMusic ? 'on' : ''}" data-action="toggle-setting" data-key="includeMusicInBackup" data-value="${!includeMusic}" aria-label="Include audio files"></button></div>
          <button class="primary-btn backup-action" data-action="create-backup">${icon('download')} Create ZIP Backup</button>
          ${state.backups.filter(item => item.status === 'queued' || item.status === 'running').map(task => `<div class="download-progress" style="width:100%;margin-top:10px"><span>${esc(task.message || 'Preparing backup')} · ${formatCount(task.progress || 0)}%</span><i><b style="--progress:${Math.max(0,Math.min(100,Number(task.progress)||0))}%"></b></i></div>`).join('')}
          <div class="settings-footnote">${icon('info')}<span>Original files outside the EchoDesk folder are included only when this option is enabled.</span></div>
        </section>
        <section class="settings-card"><div class="settings-card-head"><div><h2>Data Location</h2><p>Settings, artwork, lyrics, and downloads are stored locally.</p></div><span>${icon('folder')}</span></div><div class="data-path">${esc(state.dataDir || 'The data folder is created on first launch.')}</div><div class="settings-footnote">${icon('shield')}<span>EchoDesk does not upload your local audio files.</span></div></section>
        <section class="settings-card about-card"><div class="about-mark">${icon('wave')}</div><div class="settings-card-head"><div><h2>EchoDesk</h2><p>A personal, local-first music player</p></div></div><p>Built with Python, HTML, CSS, and JavaScript. Search finds direct MP3 files in catalogs and web indexes; web-indexed rights may be unverified, so use files only when permitted.</p><p class="about-contact"><strong>Developer</strong> behnam Ehsani<br><strong>Email</strong> <a href="mailto:inbox.ehsani@gmail.com">inbox.ehsani@gmail.com</a></p><span class="about-version">VERSION 1.0.5</span></section>
      </div></div>
    </div>`;
  }

  function renderFullPlayer() {
    const track = currentTrack();
    if (!track) return `<div class="page">${pageHeading('PLAYER', 'Nothing selected', 'Choose a track from your library.')}${emptyState('Your queue is empty', 'Pick a track in Home or Library to get started.', `<button class="primary-btn" data-page="home">${icon('home')} Go Home</button>`)}</div>`;
    return `<div class="page">${pageHeading('FULL PLAYER', 'Now Playing', 'Large artwork, waveform, and playback controls in one place.')}
      <section class="player-page-grid"><div class="player-page-art">${trackCover(track)}</div><div class="player-page-copy"><span class="kicker">${audio.paused ? 'READY TO PLAY' : 'NOW PLAYING'}</span><h1>${esc(track.title)}</h1><p class="artist"><strong>${esc(track.artist || 'Unknown artist')}</strong>${track.album ? ` · ${esc(track.album)}` : ''}</p><div class="wave-time-row" style="margin-top:25px"><span>TRACK POSITION</span><span>${formatTime(audio.currentTime || 0)} / ${formatTime(audio.duration || track.duration || 0)}</span></div>${waveBars(72, track.id, 'playerWave')}<div class="player-page-controls"><button data-action="shuffle" title="Shuffle">${icon('shuffle')}</button><button data-action="previous" title="Previous">${icon('previous')}</button><button class="big-play" data-action="play-pause" title="Play / Pause">${icon(audio.paused ? 'play' : 'pause')}</button><button data-action="next" title="Next">${icon('next')}</button><button data-action="repeat" title="Repeat">${icon('repeat')}</button></div><div class="lyric-preview"><strong>Lyrics</strong>${track.lyricsAvailable ? 'Lyrics are saved locally. Open Lyrics to view the full text.' : 'No lyrics are saved yet. Run a metadata sync from the library.'}<button class="text-button" style="margin-left:8px" data-action="show-lyrics" data-id="${escAttr(track.id)}">View Lyrics ${icon('forward')}</button></div></div></section>
    </div>`;
  }

  function renderPlaylistForm(playlist = null) {
    pendingCoverData = '';
    pendingCoverObjectUrl = '';
    const selectedIds = new Set(playlist?.trackIds || []);
    const songs = state.library.map(track => `<label class="selection-row"><input type="checkbox" name="playlistTrack" value="${escAttr(track.id)}" ${selectedIds.has(track.id) ? 'checked' : ''}><img src="${escAttr(track.artworkUrl || '')}" alt="" onerror="this.style.opacity='.1'"><div><strong>${esc(track.title)}</strong><span>${esc(track.artist || 'Unknown artist')}</span></div></label>`).join('');
    const art = playlist?.artworkUrl ? `<img src="${escAttr(playlist.artworkUrl)}" alt="">` : icon('album');
    openModal(playlist ? 'Edit Playlist' : 'Create a Playlist', 'Choose a name, cover art, and tracks for this mix.', `<form id="playlistForm" data-id="${escAttr(playlist?.id || '')}">
      <div class="form-field"><label for="playlistName">Playlist name</label><input id="playlistName" name="name" maxlength="80" required placeholder="e.g. Late-night drive" value="${escAttr(playlist?.name || '')}"></div>
      <div class="cover-upload"><div class="cover-upload-preview" id="coverPreview">${art}</div><div class="cover-upload-copy"><strong>Custom cover art</strong><span>PNG, JPG, or WebP · stored on this device</span><button class="text-button" style="margin-top:7px" type="button" data-action="choose-playlist-cover">${icon('plus')} Choose image</button></div></div>
      <div class="form-field"><label>Choose tracks</label><div class="selection-list">${songs || `<div class="empty-state" style="min-height:90px;border:0"><p>Add tracks to your library before creating a playlist.</p></div>`}</div></div>
      <div class="modal-actions"><button class="primary-btn" type="submit">${icon('check')} ${playlist ? 'Save Changes' : 'Create Playlist'}</button><button class="secondary-btn" type="button" data-action="close-modal">Cancel</button></div>
    </form>`, true);
  }

  function openModal(title, subtitle, content, wide = false) {
    modalLayer.innerHTML = `<div class="modal-card ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>${esc(title)}</h2><p>${esc(subtitle || '')}</p></div><button class="modal-close" data-action="close-modal" aria-label="Close">${icon('close')}</button></div><div class="modal-content">${content}</div></div>`;
    modalLayer.hidden = false;
    hydrateIcons(modalLayer);
    window.setTimeout(() => modalLayer.querySelector('input:not([type=checkbox]),textarea')?.focus(), 30);
  }

  function closeModal() {
    modalLayer.hidden = true;
    modalLayer.innerHTML = '';
    pendingCoverData = '';
    if (pendingCoverObjectUrl) URL.revokeObjectURL(pendingCoverObjectUrl);
    pendingCoverObjectUrl = '';
  }

  function showEditTrack(track) {
    if (track.isOnline) { toast('Download this track before editing its details.', 'info'); return; }
    openModal('Track Details', `${track.title} · ${track.artist || 'Unknown artist'}`, `<form id="editTrackForm" data-id="${escAttr(track.id)}"><div class="form-field"><label for="trackGenre">Genre</label><input id="trackGenre" name="genre" maxlength="80" value="${escAttr(track.genre || '')}" placeholder="e.g. Ambient or Jazz"></div><div class="form-field"><label for="trackTags">Custom tags</label><input id="trackTags" name="tags" maxlength="300" value="${escAttr((track.tags || []).join(', '))}" placeholder="Separate with commas, e.g. Driving, Night"><span class="form-hint">Use tags to group and find your own music.</span></div><div class="modal-actions"><button class="primary-btn" type="submit">${icon('check')} Save</button><button class="secondary-btn" type="button" data-action="close-modal">Cancel</button></div></form>`);
  }

  function showTrackMenu(track) {
    openModal('Track Options', `${track.title} · ${track.artist || 'Unknown artist'}`, `<div class="menu-actions"><button class="secondary-btn" data-action="edit-track" data-id="${escAttr(track.id)}">${icon('sliders')} Genres &amp; Tags</button><button class="secondary-btn" data-action="sync-track" data-id="${escAttr(track.id)}">${icon('sync')} Sync Metadata</button><button class="secondary-btn" data-action="add-track-to-playlist" data-id="${escAttr(track.id)}">${icon('playlist')} Add to Playlist</button><button class="secondary-btn" data-action="show-lyrics" data-id="${escAttr(track.id)}">${icon('lyrics')} View Lyrics</button><button class="quiet-btn" data-action="delete-track" data-id="${escAttr(track.id)}">${icon('trash')} Remove from Library</button></div>`);
  }

  function showDeleteTrack(track) {
    openModal('Remove Track?', 'The original audio file is left untouched by default.', `<p class="confirm-copy"><strong>${esc(track.title)}</strong> will be removed from EchoDesk and its playlists.</p><label class="selection-row" style="margin:10px 0"><input type="checkbox" id="deleteManagedFile"><div><strong>Also delete the EchoDesk-managed download</strong><span>Only files managed by EchoDesk can be deleted.</span></div></label><div class="modal-actions"><button class="primary-btn" data-action="confirm-delete-track" data-id="${escAttr(track.id)}">${icon('trash')} Remove Track</button><button class="secondary-btn" data-action="close-modal">Cancel</button></div>`);
  }

  function showAddToPlaylist(trackId) {
    const track = getTrack(trackId);
    if (!track) return;
    if (!state.playlists.length) {
      closeModal();
      toast('Create a playlist first, then add this track.', 'info');
      renderPlaylistForm();
      return;
    }
    const options = state.playlists.map(item => `<label class="selection-row"><input type="checkbox" name="addPlaylistChoice" value="${escAttr(item.id)}"><div><strong>${esc(item.name)}</strong><span>${formatCount(item.count || 0)} tracks</span></div></label>`).join('');
    openModal('Add to Playlist', track.title, `<form id="addToPlaylistForm" data-track-id="${escAttr(trackId)}"><div class="selection-list">${options}</div><div class="modal-actions" style="margin-top:12px"><button class="primary-btn" type="submit">${icon('plus')} Add Track</button><button class="secondary-btn" type="button" data-action="close-modal">Cancel</button></div></form>`);
  }

  async function showLyrics(trackId) {
    const track = getTrack(trackId) || currentTrack();
    if (!track) { toast('Choose a track first.', 'info'); return; }
    if (track.isOnline) { toast('Download this track first to save and view its lyrics.', 'info'); return; }
    if (track.browserLocal) {
      openModal('Lyrics', track.title, `<p class="confirm-copy">Lyrics for browser-added files are not available in this preview.</p>`);
      return;
    }
    if (!track.lyricsAvailable) {
      const googleLyricsUrl = `https://www.google.com/search?${new URLSearchParams({ q: `${track.artist || ''} ${track.title} lyrics` })}`;
      openModal('Lyrics Not Found', `${track.title} · ${track.artist || ''}`, `<p class="confirm-copy">No lyrics are saved yet. EchoDesk checks LRCLIB and Lyrics.ovh during metadata sync.</p><div class="modal-actions"><button class="primary-btn" data-action="sync-library">${icon('sync')} Sync Metadata</button><a class="secondary-btn" href="${escAttr(googleLyricsUrl)}" target="_blank" rel="noopener">${icon('search')} Search Google</a><button class="secondary-btn" data-action="close-modal">Close</button></div>`);
      return;
    }
    try {
      const result = await apiRequest(`/api/lyrics?id=${encodeURIComponent(track.id)}`);
      openModal('Lyrics', `${result.title || track.title} · ${result.artist || track.artist || ''}`, `<div class="form-field">${result.source ? `<span class="form-hint">Source: ${esc(result.source)}</span>` : ''}<textarea readonly>${esc(result.text || 'No lyrics saved.')}</textarea></div><div class="modal-actions"><button class="secondary-btn" data-action="close-modal">Close</button></div>`, true);
    } catch (error) { toast(error.message, 'error'); }
  }

  function setCurrentTrack(track, autoplay = true) {
    if (!track) return;
    if (state.currentId !== track.id) state.heroArtFlipped = false;
    state.currentId = track.id;
    state.currentOnline = track.isOnline ? track : null;
    safeStorageSet('echodeskCurrent', track.id);
    if (track.isOnline) {
      audio.src = track.streamUrl;
    } else if (track.browserLocal && track.previewUrl) {
      audio.src = track.previewUrl;
    } else {
      audio.src = track.mediaUrl || '';
    }
    try { audio.load(); } catch (_) { /* unsupported engine */ }
    if (autoplay) {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') playPromise.catch(() => toast('This audio file cannot be played in the browser.', 'error'));
    }
    renderAll();
  }

  function recordRecentPlayback() {
    const track = currentTrack();
    if (!track || track.isOnline) return;
    state.recentIds = [track.id, ...state.recentIds.filter(id => id !== track.id)].slice(0, 30);
    safeStorageSet('echodeskRecentIds', state.recentIds);
    track.lastPlayedAt = new Date().toISOString();
    if (!track.browserLocal) {
      apiRequest('/api/playback', { id: track.id }).then(result => {
        if (result.track) Object.assign(track, result.track);
      }).catch(() => {});
    }
  }

  function primeAudio(autoplay = false) {
    const track = currentTrack();
    if (!track) return;
    const src = track.isOnline ? track.streamUrl : track.browserLocal ? track.previewUrl : track.mediaUrl;
    if (src && audio.src !== new URL(src, location.href).href) {
      audio.src = src;
      audio.load();
    }
    audio.volume = Number(state.settings.defaultVolume ?? .72);
    if (autoplay) audio.play().catch(() => {});
  }

  function togglePlay() {
    const track = currentTrack();
    if (!track) { toast('Add or select a track to start playback.', 'info'); return; }
    if (audio.paused) {
      if (!audio.src) primeAudio(false);
      audio.play().catch(() => toast('This audio file could not be played.', 'error'));
    } else {
      audio.pause();
    }
  }

  function playNext(direction = 1) {
    let list = state.queueIds.length ? state.queueIds.map(getTrack).filter(Boolean) : state.library;
    if (!list.length) return;
    let index = list.findIndex(track => track.id === state.currentId);
    if (state.isShuffle && list.length > 1) {
      let next = index;
      while (next === index) next = Math.floor(Math.random() * list.length);
      index = next;
    } else if (index < 0) {
      index = direction > 0 ? 0 : list.length - 1;
    } else {
      index = (index + direction + list.length) % list.length;
    }
    setCurrentTrack(list[index], true);
  }

  function seekFromEvent(event) {
    if (!Number.isFinite(audio.duration) || !audio.duration) return;
    const target = event.target.closest('[data-wave], #miniProgress');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    // Waves use left-to-right progression regardless of RTL text layout.
    audio.currentTime = (x / rect.width) * audio.duration;
    updateProgress();
  }

  function updateProgress() {
    const track = currentTrack();
    const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : Number(track?.duration || 0);
    const current = Number(audio.currentTime || 0);
    const ratio = duration > 0 ? Math.max(0, Math.min(1, current / duration)) : 0;
    const elapsed = document.getElementById('dockElapsed');
    const total = document.getElementById('dockDuration');
    const fill = document.getElementById('miniProgressFill');
    if (elapsed) elapsed.textContent = formatTime(current);
    if (total) total.textContent = formatTime(duration);
    if (fill) fill.style.width = `${ratio * 100}%`;
    document.querySelectorAll('[data-wave]').forEach(wave => {
      const bars = wave.querySelectorAll('.wave-bar');
      const played = Math.floor(bars.length * ratio);
      bars.forEach((bar, index) => bar.classList.toggle('played', index < played));
    });
    document.querySelectorAll('.wave-time-row span:last-child').forEach(node => {
      if (node.closest('.wave-time-row')?.parentElement?.querySelector('[data-wave]')) node.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
    });
  }

  function updateVolumeUI() {
    const slider = document.getElementById('volumeSlider');
    const value = slider ? Number(slider.value) : Math.round(Number(state.settings.defaultVolume ?? .72) * 100);
    const label = document.getElementById('volumeValue');
    if (label) label.textContent = `${faDigits(value)}%`;
    if (slider) slider.style.background = `linear-gradient(to right,#c6c8cd 0%,#c6c8cd ${value}%,#3a3c42 ${value}%,#3a3c42 100%)`;
  }

  function setVolume(value, persist = true) {
    const normalized = Math.max(0, Math.min(100, Number(value))) / 100;
    audio.volume = normalized;
    state.settings.defaultVolume = normalized;
    const slider = document.getElementById('volumeSlider');
    if (slider) slider.value = Math.round(normalized * 100);
    updateVolumeUI();
    const settingSlider = document.getElementById('settingsVolume');
    if (settingSlider) {
      settingSlider.value = Math.round(normalized * 100);
      const output = settingSlider.parentElement.querySelector('span');
      if (output) output.textContent = `${faDigits(Math.round(normalized * 100))}%`;
    }
    if (persist) saveSettings({ defaultVolume: normalized });
  }

  async function saveSettings(patch) {
    state.settings = { ...state.settings, ...patch };
    try { await apiRequest('/api/settings', state.settings); } catch (error) { toast(error.message, 'error'); }
  }

  async function toggleFavorite(trackId) {
    const track = getTrack(trackId);
    if (!track) return;
    if (track.isOnline) { toast('Download this track first to add it to Liked Songs.', 'info'); return; }
    track.favorite = !track.favorite;
    if (track.browserLocal) {
      renderAll();
      return;
    }
    try {
      const result = await apiRequest('/api/update-track', { id: track.id, favorite: track.favorite, genre: track.genre || '', tags: track.tags || [] });
      Object.assign(track, result.track || {});
      await refreshFromServer(false);
      toast(track.favorite ? 'Added to Liked Songs.' : 'Removed from Liked Songs.', 'info');
    } catch (error) { track.favorite = !track.favorite; renderAll(); toast(error.message, 'error'); }
  }

  async function saveTrackEdits(track, values) {
    const tags = values.tags.split(',').map(value => value.trim()).filter(Boolean);
    if (track.browserLocal) {
      Object.assign(track, { genre: values.genre, tags });
      renderAll(); closeModal(); toast('Track details saved.', 'info'); return;
    }
    try {
      await apiRequest('/api/update-track', { id: track.id, genre: values.genre, tags });
      await refreshFromServer(false); closeModal(); toast('Track details saved.', 'info');
    } catch (error) { toast(error.message, 'error'); }
  }

  function localPlaylistSave(data) {
    const stableId = data.id || `local-${Date.now()}`;
    let playlist = state.localPlaylists.find(item => item.id === stableId);
    if (!playlist) playlist = { id: stableId, createdAt: new Date().toISOString() };
    const artworkUrl = data.artworkUrl || pendingCoverData || playlist.artworkUrl || '';
    Object.assign(playlist, data, { id: stableId, updatedAt: new Date().toISOString(), artworkUrl });
    const index = state.localPlaylists.findIndex(item => item.id === playlist.id);
    if (index >= 0) state.localPlaylists[index] = playlist; else state.localPlaylists.push(playlist);
    safeStorageSet('echodeskLocalPlaylist', state.localPlaylists);
    mergePlaylists();
    return playlist;
  }

  async function submitPlaylist(form) {
    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    if (!name) { toast('Enter a name for the playlist.', 'error'); return; }
    const trackIds = [...form.querySelectorAll('input[name="playlistTrack"]:checked')].map(input => input.value);
    const id = form.dataset.id || '';
    const hasBrowserTracks = trackIds.some(trackId => getTrack(trackId)?.browserLocal);
    if (hasBrowserTracks || (id && id.startsWith('local-'))) {
      let artworkUrl = pendingCoverObjectUrl || state.playlists.find(item => item.id === id)?.artworkUrl || '';
      const playlist = localPlaylistSave({ id, name, trackIds, artworkUrl, count: trackIds.length });
      state.selectedPlaylistId = playlist.id; state.page = 'playlist-detail'; closeModal(); renderAll(); toast('Playlist saved in this browser preview.', 'info'); return;
    }
    try {
      await apiRequest('/api/playlists', { id, name, trackIds, artworkData: pendingCoverData });
      await refreshFromServer(false); closeModal(); state.page = 'playlists'; renderAll(); toast('Playlist saved.', 'info');
    } catch (error) { toast(error.message, 'error'); }
  }

  async function addTrackToPlaylists(form) {
    const trackId = form.dataset.trackId;
    const selected = [...form.querySelectorAll('input[name="addPlaylistChoice"]:checked')].map(item => item.value);
    if (!selected.length) { toast('Select at least one playlist.', 'error'); return; }
    for (const id of selected) {
      const playlist = state.playlists.find(item => item.id === id);
      if (!playlist) continue;
      const ids = [...new Set([...(playlist.trackIds || []), trackId])];
      if (id.startsWith('local-')) localPlaylistSave({ ...playlist, id, trackIds: ids, count: ids.length });
      else {
        try { await apiRequest('/api/playlists', { id, name: playlist.name, trackIds: ids }); }
        catch (error) { toast(error.message, 'error'); }
      }
    }
    closeModal(); await refreshFromServer(false); toast('Track added to playlist.', 'info');
  }

  async function removeTrackFromPlaylist(trackId) {
    const playlist = state.playlists.find(item => item.id === state.selectedPlaylistId);
    if (!playlist) return;
    const trackIds = (playlist.trackIds || []).filter(id => id !== trackId);
    if (playlist.id.startsWith('local-')) localPlaylistSave({ ...playlist, trackIds, count: trackIds.length });
    else {
      try { await apiRequest('/api/playlists', { id: playlist.id, name: playlist.name, trackIds, artworkData: '' }); }
      catch (error) { toast(error.message, 'error'); return; }
    }
    await refreshFromServer(false); toast('Track removed from playlist.', 'info');
  }

  async function deletePlaylist(id) {
    const playlist = state.playlists.find(item => item.id === id);
    if (!playlist) return;
    openModal('Delete Playlist?', 'Tracks will remain in your library.', `<p class="confirm-copy"><strong>${esc(playlist.name)}</strong> will be removed from your playlists.</p><div class="modal-actions"><button class="primary-btn" data-action="confirm-delete-playlist" data-id="${escAttr(id)}">${icon('trash')} Delete Playlist</button><button class="secondary-btn" data-action="close-modal">Cancel</button></div>`);
  }

  async function confirmDeletePlaylist(id) {
    if (id.startsWith('local-')) {
      state.localPlaylists = state.localPlaylists.filter(item => item.id !== id);
      safeStorageSet('echodeskLocalPlaylist', state.localPlaylists);
      mergePlaylists();
    } else {
      try { await apiRequest('/api/delete-playlist', { id }); } catch (error) { toast(error.message, 'error'); return; }
    }
    closeModal(); state.page = 'playlists'; state.selectedPlaylistId = ''; await refreshFromServer(false); toast('Playlist deleted.', 'info');
  }

  function playPlaylist(id) {
    const playlist = state.playlists.find(item => item.id === id);
    if (!playlist) return;
    const tracks = (playlist.trackIds || []).map(getTrack).filter(Boolean);
    if (!tracks.length) { toast('This playlist has no tracks yet.', 'info'); return; }
    state.queueIds = tracks.map(track => track.id);
    setCurrentTrack(tracks[0], true);
  }

  function showBulkDelete() {
    const ids = [...state.selectedTrackIds].filter(id => state.library.some(track => track.id === id));
    if (!ids.length) { toast('Select one or more tracks first.', 'info'); return; }
    openModal('Remove selected tracks?', 'Original audio files will be left untouched.', `<p class="confirm-copy"><strong>${formatCount(ids.length)} tracks</strong> will be removed from EchoDesk and their playlists.</p><div class="modal-actions"><button class="danger-btn" data-action="confirm-bulk-delete">${icon('trash')} Remove ${formatCount(ids.length)} Tracks</button><button class="secondary-btn" data-action="close-modal">Cancel</button></div>`);
  }

  async function confirmBulkDelete() {
    const ids = [...state.selectedTrackIds];
    if (!ids.length) { closeModal(); return; }
    const browserIds = new Set(ids.filter(id => getTrack(id)?.browserLocal));
    state.browserTracks = state.browserTracks.filter(track => !browserIds.has(track.id));
    state.library = [...state.browserTracks, ...state.remoteLibrary];
    let removed = browserIds.size;
    let failed = 0;
    for (const id of ids.filter(value => !browserIds.has(value))) {
      try { await apiRequest('/api/remove-track', { id, deleteFile: false }); removed++; }
      catch (_) { failed++; }
    }
    if (ids.includes(state.currentId)) {
      state.currentId = '';
      state.currentOnline = null;
      safeStorageSet('echodeskCurrent', '');
      audio.pause(); audio.removeAttribute('src'); audio.load();
    }
    state.selectedTrackIds = new Set(ids.filter(id => failed && state.library.some(track => track.id === id)));
    closeModal();
    await refreshFromServer(false);
    if (failed) toast(`${formatCount(removed)} removed; ${formatCount(failed)} could not be removed.`, 'error');
    else toast(`${formatCount(removed)} tracks removed from the library.`, 'info');
  }

  async function deleteTrack(id) {
    const track = getTrack(id);
    if (!track) return;
    const deleteManagedFile = Boolean(document.getElementById('deleteManagedFile')?.checked);
    if (track.browserLocal) {
      state.browserTracks = state.browserTracks.filter(item => item.id !== id);
      state.library = [...state.browserTracks, ...state.remoteLibrary];
      if (state.currentId === id) { state.currentId = state.library[0]?.id || ''; primeAudio(false); }
      closeModal(); renderAll(); toast('Track removed from this preview.', 'info'); return;
    }
    try {
      await apiRequest('/api/remove-track', { id, deleteFile: deleteManagedFile });
      closeModal();
      if (state.currentId === id) { state.currentId = ''; state.currentOnline = null; }
      await refreshFromServer(false); toast(deleteManagedFile ? 'Track and downloaded file deleted.' : 'Track removed from the library.', 'info');
    } catch (error) { toast(error.message, 'error'); }
  }

  async function refreshFromServer(keepPage = true) {
    const currentPage = state.page;
    try {
      const snapshot = await apiRequest('/api/state');
      applySnapshot(snapshot);
      if (keepPage) state.page = currentPage;
      renderAll();
    } catch (error) { toast(error.message, 'error'); }
  }

  async function addLocalFiles(files, fromFolder = false) {
    const selected = [...files].filter(file => /\.(mp3|wav|ogg|oga|flac|m4a|aac|opus|wma|aiff?)$/i.test(file.name));
    if (!selected.length) { toast('No supported audio files were selected.', 'error'); return; }
    if (hasBridge()) {
      // Native paths are handled by the desktop dialog; webkitdirectory is a browser fallback.
      toast('For a permanent import, use Scan Folder in the desktop app.', 'info');
      return;
    }
    for (const file of selected) {
      const id = `browser-${Date.now()}-${Math.random().toString(16).slice(2,8)}`;
      const pathLabel = file.webkitRelativePath || file.name;
      const title = file.name.replace(/\.[^.]+$/, '');
      state.browserTracks.unshift({
        id, title, artist: 'Device file', album: fromFolder ? pathLabel.split('/').slice(0,-1).join('/') : '',
        genre: '', tags: [], duration: 0, artworkUrl: '', mediaUrl: '', previewUrl: URL.createObjectURL(file),
        source: 'Browser preview', favorite: false, browserLocal: true, lyricsAvailable: false,
      });
    }
    state.library = [...state.browserTracks, ...state.remoteLibrary];
    state.currentId = state.browserTracks[0]?.id || state.currentId;
    if (state.currentId) primeAudio(false);
    renderAll();
    toast(`${formatCount(selected.length)} files added to this preview only. Use the desktop app for permanent imports.`, 'info');
  }

  async function scanFolder() {
    if (hasBridge()) {
      const folder = await window.pywebview.api.pick_folder();
      if (!folder) return;
      try {
        const result = await apiRequest('/api/scan', { folder });
        await refreshFromServer(false);
        toast(`${formatCount(result.added)} tracks added; ${formatCount(result.skipped)} files skipped.`, 'info');
      } catch (error) { toast(error.message, 'error'); }
      return;
    }
    folderPicker.click();
  }

  async function addFiles() {
    if (hasBridge()) {
      const paths = await window.pywebview.api.pick_files();
      if (!paths || !paths.length) return;
      try {
        const result = await apiRequest('/api/add-files', { paths });
        await refreshFromServer(false);
        toast(`${formatCount(result.added)} tracks added to your library.`, 'info');
      } catch (error) { toast(error.message, 'error'); }
      return;
    }
    filePicker.click();
  }

  async function runOnlineSearch(query) {
    const text = String(query || '').trim();
    if (!text) { toast('Enter a track or artist name.', 'info'); return; }
    state.page = 'online'; state.onlineQuery = text; state.onlineError = ''; state.onlineErrors = {}; state.onlineResults = []; state.webResults = []; state.onlineLoading = true; renderAll();
    try {
      const result = await apiRequest(`/api/search-online?q=${encodeURIComponent(text)}`);
      state.onlineResults = result.results || [];
      state.webResults = result.webResults || [];
      state.onlineError = result.error || '';
      state.onlineErrors = result.errors || {};
    } catch (error) {
      state.onlineError = error.message || 'Online search failed.';
      state.onlineErrors = {};
    } finally { state.onlineLoading = false; renderAll(); }
  }

  async function startOnlineDownload(resultId) {
    try {
      const task = await apiRequest('/api/download', { resultId });
      toast(`Download started for “${task.title}”. Progress is shown on this page.`, 'info');
      await refreshFromServer(false);
    } catch (error) { toast(error.message, 'error'); }
  }

  async function syncLibrary(ids = []) {
    if (!state.library.length) { toast('Your library is empty.', 'info'); return; }
    try {
      closeModal();
      const task = await apiRequest('/api/sync', { ids });
      toast(task.status === 'running' ? 'A sync is already running.' : 'Cover art, artist photos, and lyrics sync started.', 'info');
      await refreshFromServer(false);
    } catch (error) { toast(error.message, 'error'); }
  }

  async function createBackup() {
    let target = '';
    if (hasBridge()) {
      target = await window.pywebview.api.choose_backup_path();
      if (!target) return;
    }
    try {
      const task = await apiRequest('/api/backup', { includeMusic: state.settings.includeMusicInBackup !== false, target });
      toast('Creating your backup…', 'info');
      state.page = 'settings'; await refreshFromServer(false);
    } catch (error) { toast(error.message, 'error'); }
  }

  function toast(message, kind = '') {
    if (!message) return;
    const node = document.createElement('div');
    node.className = `toast ${kind}`;
    node.textContent = message;
    toastStack.appendChild(node);
    window.setTimeout(() => node.remove(), 4100);
  }

  function openPlaylist(id) {
    state.selectedPlaylistId = id;
    state.page = 'playlist-detail';
    renderAll();
  }

  function showQueue() {
    state.page = 'home';
    renderAll();
    rightRail?.scrollTo({ top: 0, behavior: 'smooth' });
    toast('Select a track from the Up Next panel on the right.', 'info');
  }

  function onDocumentClick(event) {
    if (event.target === modalLayer) { closeModal(); return; }
    const windowButton = event.target.closest('[data-window]');
    if (windowButton) {
      const action = windowButton.dataset.window;
      if (!hasBridge()) { toast('Window controls are available in the desktop app.', 'info'); return; }
      if (action === 'minimize') window.pywebview.api.minimize();
      if (action === 'maximize') window.pywebview.api.toggle_maximize();
      if (action === 'close') window.pywebview.api.close_app();
      return;
    }
    const pageButton = event.target.closest('[data-page]');
    if (pageButton) { setPage(pageButton.dataset.page); return; }
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;
    const action = actionButton.dataset.action;
    const id = actionButton.dataset.id || '';
    switch (action) {
      case 'scan-folder': scanFolder(); break;
      case 'add-files': addFiles(); break;
      case 'sync-library': syncLibrary(); break;
      case 'play-pause': togglePlay(); break;
      case 'play-track': {
        const track = getTrack(id);
        if (track) {
          if (!state.queueIds.includes(id)) state.queueIds = [];
          setCurrentTrack(track, true);
        }
        break;
      }
      case 'play-online': {
        const item = [...state.onlineResults, ...state.webResults].find(result => result.id === id);
        if (item && item.streamUrl) setCurrentTrack({ ...item, isOnline: true }, true);
        else toast('This direct MP3 link is not available right now.', 'error');
        break;
      }
      case 'play-playlist': playPlaylist(id); break;
      case 'favorite-current': if (state.currentId) toggleFavorite(state.currentId); break;
      case 'favorite-track': toggleFavorite(id); break;
      case 'edit-track': { const track = getTrack(id); if (track) showEditTrack(track); break; }
      case 'sync-track': syncLibrary([id]); break;
      case 'track-menu': { const track = getTrack(id); if (track) showTrackMenu(track); break; }
      case 'delete-track': { const track = getTrack(id); if (track) showDeleteTrack(track); break; }
      case 'confirm-delete-track': deleteTrack(id); break;
      case 'select-visible-tracks': {
        const checkboxes = [...pageHost.querySelectorAll('.track-select-checkbox')];
        const allSelected = checkboxes.length > 0 && checkboxes.every(input => state.selectedTrackIds.has(input.dataset.trackSelect));
        checkboxes.forEach(input => allSelected ? state.selectedTrackIds.delete(input.dataset.trackSelect) : state.selectedTrackIds.add(input.dataset.trackSelect));
        renderPage();
        break;
      }
      case 'bulk-sync': syncLibrary([...state.selectedTrackIds]); break;
      case 'bulk-delete': showBulkDelete(); break;
      case 'confirm-bulk-delete': confirmBulkDelete(); break;
      case 'clear-selection': state.selectedTrackIds.clear(); renderPage(); break;
      case 'add-track-to-playlist': showAddToPlaylist(id); break;
      case 'remove-from-playlist': removeTrackFromPlaylist(id); break;
      case 'new-playlist': renderPlaylistForm(); break;
      case 'edit-playlist': { const playlist = state.playlists.find(item => item.id === id); if (playlist) renderPlaylistForm(playlist); break; }
      case 'open-playlist': openPlaylist(id); break;
      case 'back-playlists': state.page = 'playlists'; state.selectedPlaylistId = ''; renderAll(); break;
      case 'delete-playlist': deletePlaylist(id); break;
      case 'confirm-delete-playlist': confirmDeletePlaylist(id); break;
      case 'show-lyrics': showLyrics(id); break;
      case 'close-modal': closeModal(); break;
      case 'choose-playlist-cover': coverPicker.click(); break;
      case 'download-online': startOnlineDownload(id); break;
      case 'create-backup': createBackup(); break;
      case 'toggle-setting': {
        const key = actionButton.dataset.key;
        const rawValue = actionButton.dataset.value;
        let value = rawValue;
        if (rawValue === 'true') value = true;
        else if (rawValue === 'false') value = false;
        if (key === 'theme') {
          value = rawValue === 'light' ? 'light' : 'dark';
          document.body.classList.toggle('dark', value === 'dark');
        }
        const patch = { [key]: value };
        if (key === 'reduceMotion') document.body.classList.toggle('reduce-motion', Boolean(value));
        saveSettings(patch).then(() => renderAll());
        break;
      }
      case 'shuffle': state.isShuffle = !state.isShuffle; actionButton.classList.toggle('is-active', state.isShuffle); toast(state.isShuffle ? 'Shuffle is on.' : 'Shuffle is off.', 'info'); break;
      case 'repeat': state.isRepeat = !state.isRepeat; actionButton.classList.toggle('is-active', state.isRepeat); toast(state.isRepeat ? 'Repeat is on.' : 'Repeat is off.', 'info'); break;
      case 'next': playNext(1); break;
      case 'previous': playNext(-1); break;
      case 'open-player': state.page = 'player'; renderAll(); break;
      case 'flip-artist-image': {
        state.heroArtFlipped = !state.heroArtFlipped;
        actionButton.classList.toggle('is-flipped', state.heroArtFlipped);
        actionButton.setAttribute('aria-pressed', String(state.heroArtFlipped));
        actionButton.setAttribute('aria-label', state.heroArtFlipped ? 'Show album cover' : 'Show artist photo');
        const hint = actionButton.parentElement.querySelector('.feature-art-hint');
        if (hint) hint.textContent = state.heroArtFlipped ? 'Click to return to album cover' : 'Click album art to view artist';
        break;
      }
      case 'queue': showQueue(); break;
      case 'quick-settings': state.page = 'settings'; renderAll(); break;
    }
  }

  function onDocumentInput(event) {
    if (event.target.id === 'homeLibrarySearch') {
      state.homeSearch = event.target.value;
      const cursor = event.target.selectionStart;
      renderPage(); hydrateIcons(pageHost);
      const input = document.getElementById('homeLibrarySearch');
      input?.focus(); if (input && cursor !== null) input.setSelectionRange(cursor, cursor);
      updateProgress();
    }
    if (event.target.id === 'librarySearch') {
      state.librarySearch = event.target.value;
      const cursor = event.target.selectionStart;
      renderPage(); hydrateIcons(pageHost);
      const input = document.getElementById('librarySearch');
      input?.focus(); if (input && cursor !== null) input.setSelectionRange(cursor, cursor);
      updateProgress();
    }
    if (event.target.id === 'volumeSlider') {
      const value = Number(event.target.value);
      audio.volume = value / 100;
      state.settings.defaultVolume = value / 100;
      updateVolumeUI();
    }
    if (event.target.id === 'settingsVolume') {
      const value = Number(event.target.value);
      const output = event.target.parentElement.querySelector('span');
      if (output) output.textContent = `${faDigits(value)}%`;
      audio.volume = value / 100;
      state.settings.defaultVolume = value / 100;
      const dock = document.getElementById('volumeSlider'); if (dock) dock.value = value;
      updateVolumeUI();
    }
  }

  function onDocumentChange(event) {
    if (event.target.id === 'selectVisibleTracks') {
      pageHost.querySelectorAll('.track-select-checkbox').forEach(input => {
        if (event.target.checked) state.selectedTrackIds.add(input.dataset.trackSelect);
        else state.selectedTrackIds.delete(input.dataset.trackSelect);
      });
      renderPage(); return;
    }
    if (event.target.matches('.track-select-checkbox')) {
      const id = event.target.dataset.trackSelect;
      if (event.target.checked) state.selectedTrackIds.add(id);
      else state.selectedTrackIds.delete(id);
      renderPage(); return;
    }
    if (event.target.id === 'genreFilter') { state.libraryGenreFilter = event.target.value; renderPage(); return; }
    if (event.target.id === 'settingsVolume') { saveSettings({ defaultVolume: Number(event.target.value) / 100 }); return; }
    if (event.target.id === 'volumeSlider') { saveSettings({ defaultVolume: Number(event.target.value) / 100 }); return; }
    if (event.target === folderPicker) { addLocalFiles(event.target.files, true); event.target.value = ''; return; }
    if (event.target === filePicker) { addLocalFiles(event.target.files, false); event.target.value = ''; return; }
    if (event.target === coverPicker) {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      if (!file.type.startsWith('image/')) { toast('Choose an image file.', 'error'); return; }
      const reader = new FileReader();
      reader.onload = () => {
        pendingCoverData = String(reader.result || '');
        if (pendingCoverObjectUrl) URL.revokeObjectURL(pendingCoverObjectUrl);
        pendingCoverObjectUrl = URL.createObjectURL(file);
        const preview = document.getElementById('coverPreview');
        if (preview) preview.innerHTML = `<img src="${escAttr(pendingCoverObjectUrl)}" alt="Cover preview">`;
      };
      reader.readAsDataURL(file);
    }
  }

  async function onDocumentSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id === 'onlineSearchForm') {
      event.preventDefault(); runOnlineSearch(document.getElementById('onlineSearchInput')?.value || ''); return;
    }
    if (form.id === 'playlistForm') { event.preventDefault(); await submitPlaylist(form); return; }
    if (form.id === 'editTrackForm') {
      event.preventDefault();
      const track = getTrack(form.dataset.id);
      if (track) saveTrackEdits(track, { genre: form.elements.genre.value.trim(), tags: form.elements.tags.value });
      return;
    }
    if (form.id === 'addToPlaylistForm') { event.preventDefault(); await addTrackToPlaylists(form); }
  }

  async function pollTasks() {
    const active = state.downloads.some(task => task.status === 'queued' || task.status === 'downloading') || state.sync.status === 'queued' || state.sync.status === 'running' || state.backups.some(task => task.status === 'queued' || task.status === 'running');
    if (!active) return;
    try {
      const previousDownloads = new Map(state.downloads.map(item => [item.id, item.status]));
      const previousBackups = new Map(state.backups.map(item => [item.id, item.status]));
      const previousSyncStatus = state.sync.status;
      const snapshot = await apiRequest('/api/state');
      applySnapshot(snapshot);
      if (state.sync.status === 'complete' && previousSyncStatus !== 'complete' && state.sync.message && !recentToasts.has(`sync-${state.sync.updatedAt || state.sync.message}`)) {
        recentToasts.add(`sync-${state.sync.updatedAt || state.sync.message}`); toast(state.sync.message, 'info');
      }
      for (const task of state.downloads) {
        if (task.status === 'complete' && previousDownloads.get(task.id) !== 'complete' && !recentToasts.has(`d-${task.id}`)) {
          recentToasts.add(`d-${task.id}`); toast(`“${task.title}” was added to your library.`, 'info');
        }
        if (task.status === 'error' && previousDownloads.get(task.id) !== 'error' && !recentToasts.has(`de-${task.id}`)) {
          recentToasts.add(`de-${task.id}`); toast(`Download failed: ${task.message}`, 'error');
        }
      }
      for (const task of state.backups) {
        if (task.status === 'complete' && previousBackups.get(task.id) !== 'complete' && !recentToasts.has(`b-${task.id}`)) {
          recentToasts.add(`b-${task.id}`);
          toast(`Backup “${task.fileName}” is ready.`, 'info');
          if (!hasBridge() && task.path) {
            const link = document.createElement('a'); link.href = `/api/backup-file?id=${encodeURIComponent(task.id)}`; link.download = task.fileName || 'EchoDesk-backup.zip'; document.body.appendChild(link); link.click(); link.remove();
          }
        }
      }
      renderSidebar();
      renderPage(); renderRightRail(); renderDock(); syncPlayButtons(); hydrateIcons(); updateProgress(); markNavigation();
    } catch (_) { /* transient local requests are retried on the next tick */ }
  }

  function handleShortcuts(event) {
    if (event.code === 'Space' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '') && modalLayer.hidden) {
      event.preventDefault(); togglePlay();
    }
    if (event.key === 'Escape' && !modalLayer.hidden) closeModal();
  }

  document.addEventListener('click', onDocumentClick);
  document.addEventListener('input', onDocumentInput);
  document.addEventListener('change', onDocumentChange);
  document.addEventListener('submit', onDocumentSubmit);
  document.addEventListener('keydown', handleShortcuts);
  document.addEventListener('click', event => {
    if (event.target.closest('[data-wave]') || event.target.closest('#miniProgress')) seekFromEvent(event);
  });
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('loadedmetadata', updateProgress);
  audio.addEventListener('durationchange', updateProgress);
  audio.addEventListener('play', () => { recordRecentPlayback(); renderDock(); renderRightRail(); if (state.page === 'home' || state.page === 'player') renderPage(); updateProgress(); syncPlayButtons(); });
  audio.addEventListener('pause', () => { renderDock(); renderRightRail(); if (state.page === 'home' || state.page === 'player') renderPage(); updateProgress(); syncPlayButtons(); });
  audio.addEventListener('ended', () => { if (state.isRepeat) { audio.currentTime = 0; audio.play(); } else playNext(1); });
  window.addEventListener('pywebviewready', () => { document.body.classList.add('desktop-runtime'); });
  const startNativeWindowDrag = () => {
    try {
      const result = window.pywebview.api.start_drag();
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch (_) { /* native drag is only available in the desktop app */ }
  };
  let dragCandidate = null;
  let suppressDragClick = false;
  let dragSuppressTimer = 0;
  const dragExcluded = 'input, textarea, select, option, label, [contenteditable="true"], audio, video, .waveform, .volume-slider, .mini-progress, .dock-progress-row, [data-no-window-drag]';
  document.addEventListener('mousedown', event => {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    if (event.button !== 0 || !hasBridge() || typeof window.pywebview.api.start_drag !== 'function' || !target) return;
    if (target.closest('.pywebview-drag-region') || target.closest(dragExcluded)) return;
    dragCandidate = { x: event.screenX, y: event.screenY };
  }, true);
  document.addEventListener('mousemove', event => {
    if (!dragCandidate || !(event.buttons & 1)) return;
    if (Math.hypot(event.screenX - dragCandidate.x, event.screenY - dragCandidate.y) < 7) return;
    dragCandidate = null;
    suppressDragClick = true;
    window.clearTimeout(dragSuppressTimer);
    dragSuppressTimer = window.setTimeout(() => { suppressDragClick = false; }, 900);
    event.preventDefault();
    window.getSelection?.()?.removeAllRanges();
    startNativeWindowDrag();
  }, true);
  document.addEventListener('mouseup', () => { dragCandidate = null; }, true);
  window.addEventListener('blur', () => { dragCandidate = null; });
  document.addEventListener('click', event => {
    if (!suppressDragClick) return;
    suppressDragClick = false;
    window.clearTimeout(dragSuppressTimer);
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  hydrateIcons();
  loadState(true).then(() => { setVolume(Math.round(Number(state.settings.defaultVolume ?? .72) * 100), false); });
  window.setInterval(pollTasks, 1200);
})();
