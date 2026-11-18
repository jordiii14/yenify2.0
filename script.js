/* ==========================================================================
   YENIFY 2.0 — MODULAR AUDIO, LYRICS, MIXER & STATE ENGINE
   ========================================================================== */

(() => {
  "use strict";

  // ------------------------------------------------------------------------
  // 1. CATALOG CONFIGURATION (Map to your existing songs/ and images/ files)
  // ------------------------------------------------------------------------
  const DEFAULT_TRACKS = [
    {
      id: "track-1",
      title: "Midnight Neon Drive",
      artist: "YENIFY Originals",
      album: "Cyber Tokyo",
      src: "songs/song1.mp3",
      cover: "images/cover1.jpg",
      lrc: `[00:00.00] [Instrumental Intro - Load your custom .LRC file anytime]
[00:06.50] City lights reflect across the midnight rain
[00:12.00] Every frequency is pulsing through the static frame
[00:18.20] Turn the dial up and let the bassline breathe
[00:24.00] Welcome to YENIFY 2.0`
    },
    {
      id: "track-2",
      title: "Velvet Horizon",
      artist: "Aura Synth",
      album: "Nocturne",
      src: "songs/song2.mp3",
      cover: "images/cover2.jpg",
      lrc: ""
    },
    {
      id: "track-3",
      title: "Crimson Echoes",
      artist: "Kairo",
      album: "Afterhours",
      src: "songs/song3.mp3",
      cover: "images/cover3.jpg",
      lrc: ""
    },
    {
      id: "track-4",
      title: "Glass Cathedral",
      artist: "Mira & Sol",
      album: "Ether",
      src: "songs/song4.mp3",
      cover: "images/cover4.jpg",
      lrc: ""
    }
  ];

  // Fallback SVG cover data-URI if local image path isn't present yet
  const FALLBACK_COVER =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ff2e93"/>
            <stop offset="100%" stop-color="#3a0ca3"/>
          </linearGradient>
        </defs>
        <rect width="300" height="300" fill="url(#g)"/>
        <circle cx="150" cy="150" r="78" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="4"/>
        <text x="150" y="158" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="26">YENIFY</text>
      </svg>`
    );

  // ------------------------------------------------------------------------
  // 2. THEME DEFINITIONS (10 Complete Visual Identities)
  // ------------------------------------------------------------------------
  const THEMES = [
    { id: "midnight-pink", name: "Midnight Pink", desc: "Signature Black, Pink & Magenta", colors: ["#09050c", "#ff2e93", "#9d4edd"] },
    { id: "aurora", name: "Aurora", desc: "Deep Blue, Violet & Cyan Glow", colors: ["#040b16", "#38bdf8", "#818cf8"] },
    { id: "midnight-purple", name: "Midnight Purple", desc: "Dark Plum with Lavender Highlights", colors: ["#0b0614", "#c084fc", "#f472b6"] },
    { id: "rose-gold", name: "Rose Gold", desc: "Dark Charcoal & Warm Rose Gold", colors: ["#120d0e", "#f4a29e", "#b5838d"] },
    { id: "arctic", name: "Arctic", desc: "Cool Frost White, Ice Blue & Silver", colors: ["#eef4fa", "#0284c7", "#94a3b8"] },
    { id: "crimson", name: "Crimson", desc: "Obsidian Black, Burgundy & Red", colors: ["#0a0304", "#ef4444", "#7f1d1d"] },
    { id: "ocean", name: "Ocean", desc: "Abyssal Navy, Cyan & Deep Blue", colors: ["#030e17", "#06b6d4", "#2563eb"] },
    { id: "minimal-black", name: "Minimal Black", desc: "Pure OLED Black & Crisp White", colors: ["#000000", "#ffffff", "#525252"] },
    { id: "sunset", name: "Sunset", desc: "Warm Amber, Coral & Dusk Purple", colors: ["#12070c", "#fb923c", "#db2777"] },
    { id: "lavender-dream", name: "Lavender Dream", desc: "Soft Pastel Lavender & Deep Violet", colors: ["#161124", "#d8b4fe", "#7e22ce"] }
  ];

  // ------------------------------------------------------------------------
  // 3. EQ PRESETS (8 Bands: 60, 150, 400, 1k, 2.4k, 6k, 12k, 16k Hz)
  // ------------------------------------------------------------------------
  const EQ_FREQS = [60, 150, 400, 1000, 2400, 6000, 12000, 16000];
  const EQ_PRESETS = {
    balanced: [0, 0, 0, 0, 0, 0, 0, 0],
    "deep-bass": [8, 6.5, 3, 0, -1, 0, 1.5, 2],
    "vocal-boost": [-2, -1, 1.5, 4.5, 5.5, 3, 1, 0],
    acoustic: [3, 2, 0.5, 1, 2.5, 3.5, 3, 2],
    electronic: [6.5, 4.5, 0, -1.5, 2, 4.5, 5.5, 6],
    pop: [2, 3.5, 1, -0.5, 2, 3.5, 3, 2],
    rock: [5, 3.5, -1, -1.5, 1.5, 4, 5, 4.5],
    jazz: [3.5, 2, 1, 2, -1, 1.5, 3, 3.5],
    custom: [0, 0, 0, 0, 0, 0, 0, 0]
  };

  // ------------------------------------------------------------------------
  // 4. APPLICATION STATE (Backed by localStorage)
  // ------------------------------------------------------------------------
  const STORAGE_KEY = "yenify_2_state_v1";

  function loadPersistedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  const saved = loadPersistedState();

  const state = {
    tracks: DEFAULT_TRACKS.map((t) => ({
      ...t,
      lrc: saved.customLyrics?.[t.id] ?? t.lrc
    })),
    queue: [],
    currentIndex: 0,
    isPlaying: false,
    shuffle: Boolean(saved.shuffle),
    shuffleOrder: [],
    shuffleHistory: [],
    repeatMode: saved.repeatMode || "off", // 'off' | 'all' | 'one'
    likedIds: new Set(saved.likedIds || []),
    playCounts: saved.playCounts || {},
    history: saved.history || [],
    playlists: saved.playlists || [
      { id: "pl-favorites", name: "Late Night Vibes", trackIds: ["track-1", "track-2"] }
    ],
    activePlaylistId: saved.activePlaylistId || "pl-favorites",
    theme: saved.theme || "midnight-pink",
    customLyrics: saved.customLyrics || {},
    customEq: saved.customEq || [...EQ_PRESETS.balanced],
    activeFilter: "all",
    searchQuery: "",
    parsedLyrics: [],
    hasTimestamps: false,
    activeLyricLine: -1,
    crossfadeSec: saved.crossfadeSec ?? 2,
    smoothFade: saved.smoothFade ?? true
  };

  state.queue = state.tracks.map((t) => t.id);

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          shuffle: state.shuffle,
          repeatMode: state.repeatMode,
          likedIds: Array.from(state.likedIds),
          playCounts: state.playCounts,
          history: state.history.slice(0, 40),
          playlists: state.playlists,
          activePlaylistId: state.activePlaylistId,
          theme: state.theme,
          customLyrics: state.customLyrics,
          customEq: state.customEq,
          crossfadeSec: state.crossfadeSec,
          smoothFade: state.smoothFade
        })
      );
    } catch (e) {
      console.warn("Storage quota warning:", e);
    }
  }

  // ------------------------------------------------------------------------
  // 5. DOM REFERENCES
  // ------------------------------------------------------------------------
  const audio = document.getElementById("audio-player");
  const playPauseBtn = document.getElementById("play-pause-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const repeatBtn = document.getElementById("repeat-btn");
  const repeatBadge = document.getElementById("repeat-badge");
  const progressBar = document.getElementById("progress-bar");
  const currentTimeEl = document.getElementById("current-time");
  const totalDurationEl = document.getElementById("total-duration");
  const volumeSlider = document.getElementById("volume-slider");
  const muteBtn = document.getElementById("mute-btn");

  // Dynamic Island elements
  const island = document.getElementById("dynamic-island");
  const islandCompactTrigger = document.getElementById("di-compact-trigger");
  const islandCollapseBtn = document.getElementById("di-collapse-btn");

  // ------------------------------------------------------------------------
  // 6. WEB AUDIO API STUDIO ENGINE (Single Graph, Clip-Safe Limiter)
  // ------------------------------------------------------------------------
  const dsp = {
    ctx: null,
    source: null,
    eqFilters: [],
    bassShelf: null,
    trebleShelf: null,
    panner: null,
    splitter: null,
    merger: null,
    midGain: null,
    sideGain: null,
    convolver: null,
    reverbGain: null,
    delayNode: null,
    delayFeedback: null,
    echoGain: null,
    dryGain: null,
    compressor: null,
    analyser: null,
    masterGain: null,
    initialized: false,
    active: true
  };

  function createImpulseResponse(ctx, duration = 2.1, decay = 2.4) {
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  function initWebAudio() {
    if (dsp.initialized) {
      if (dsp.ctx.state === "suspended") dsp.ctx.resume();
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    dsp.ctx = ctx;

    // Create MediaElementSource ONLY ONCE
    dsp.source = ctx.createMediaElementSource(audio);

    // 8-band peaking EQ
    dsp.eqFilters = EQ_FREQS.map((freq) => {
      const filter = ctx.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.value = freq;
      filter.Q.value = 1.4;
      filter.gain.value = 0;
      return filter;
    });

    // Dedicated Bass & Treble Shelves
    dsp.bassShelf = ctx.createBiquadFilter();
    dsp.bassShelf.type = "lowshelf";
    dsp.bassShelf.frequency.value = 110;

    dsp.trebleShelf = ctx.createBiquadFilter();
    dsp.trebleShelf.type = "highshelf";
    dsp.trebleShelf.frequency.value = 8500;

    // Stereo Panner
    dsp.panner = ctx.createStereoPanner();

    // Parallel Dry + Reverb + Echo Sends
    dsp.dryGain = ctx.createGain();
    dsp.dryGain.gain.value = 1;

    dsp.convolver = ctx.createConvolver();
    dsp.convolver.buffer = createImpulseResponse(ctx);
    dsp.reverbGain = ctx.createGain();
    dsp.reverbGain.gain.value = 0;

    dsp.delayNode = ctx.createDelay(1.0);
    dsp.delayNode.delayTime.value = 0.28;
    dsp.delayFeedback = ctx.createGain();
    dsp.delayFeedback.gain.value = 0.32;
    dsp.echoGain = ctx.createGain();
    dsp.echoGain.gain.value = 0;

    // Anti-Clipping Dynamics Compressor / Normalizer
    dsp.compressor = ctx.createDynamicsCompressor();
    dsp.compressor.threshold.value = -14;
    dsp.compressor.knee.value = 18;
    dsp.compressor.ratio.value = 4;
    dsp.compressor.attack.value = 0.005;
    dsp.compressor.release.value = 0.18;

    dsp.analyser = ctx.createAnalyser();
    dsp.analyser.fftSize = 128;

    dsp.masterGain = ctx.createGain();
    dsp.masterGain.gain.value = 1;

    // Chain series EQ + Shelves + Panner
    let head = dsp.source;
    dsp.eqFilters.forEach((f) => {
      head.connect(f);
      head = f;
    });
    head.connect(dsp.bassShelf);
    dsp.bassShelf.connect(dsp.trebleShelf);
    dsp.trebleShelf.connect(dsp.panner);

    // Parallel Dry
    dsp.panner.connect(dsp.dryGain);
    dsp.dryGain.connect(dsp.compressor);

    // Parallel Reverb
    dsp.panner.connect(dsp.convolver);
    dsp.convolver.connect(dsp.reverbGain);
    dsp.reverbGain.connect(dsp.compressor);

    // Parallel Echo loop
    dsp.panner.connect(dsp.delayNode);
    dsp.delayNode.connect(dsp.delayFeedback);
    dsp.delayFeedback.connect(dsp.delayNode);
    dsp.delayNode.connect(dsp.echoGain);
    dsp.echoGain.connect(dsp.compressor);

    // Master out
    dsp.compressor.connect(dsp.analyser);
    dsp.analyser.connect(dsp.masterGain);
    dsp.masterGain.connect(ctx.destination);

    dsp.initialized = true;
    startVisualizerLoop();
  }

  // ------------------------------------------------------------------------
  // 7. REAL-TIME VISUALIZER LOOP (Hero + Dock)
  // ------------------------------------------------------------------------
  function startVisualizerLoop() {
    const heroCanvas = document.getElementById("hero-spectrum");
    const dockCanvas = document.getElementById("dock-mini-visualizer");
    const hCtx = heroCanvas?.getContext("2d");
    const dCtx = dockCanvas?.getContext("2d");
    const bufferLength = dsp.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function renderFrame() {
      requestAnimationFrame(renderFrame);
      dsp.analyser.getByteFrequencyData(dataArray);
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#ff2e93";

      if (hCtx && heroCanvas) {
        hCtx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
        const bars = 36;
        const barW = heroCanvas.width / bars - 3;
        for (let i = 0; i < bars; i++) {
          const val = dataArray[i] || 4;
          const barH = Math.max(4, (val / 255) * (heroCanvas.height - 14));
          hCtx.fillStyle = accentColor;
          hCtx.globalAlpha = 0.35 + (val / 255) * 0.65;
          hCtx.beginPath();
          hCtx.roundRect(i * (barW + 3), heroCanvas.height - barH, barW, barH, 4);
          hCtx.fill();
        }
      }

      if (dCtx && dockCanvas) {
        dCtx.clearRect(0, 0, dockCanvas.width, dockCanvas.height);
        const bars = 14;
        const barW = dockCanvas.width / bars - 2;
        for (let i = 0; i < bars; i++) {
          const val = dataArray[i * 2] || 3;
          const barH = Math.max(3, (val / 255) * dockCanvas.height);
          dCtx.fillStyle = accentColor;
          dCtx.fillRect(i * (barW + 2), dockCanvas.height - barH, barW, barH);
        }
      }
    }
    renderFrame();
  }

  // ------------------------------------------------------------------------
  // 8. PERFECT SHUFFLE & REPEAT ENGINE
  // ------------------------------------------------------------------------
  function buildShuffleOrder(anchorId) {
    const ids = [...state.queue];
    if (ids.length <= 1) {
      state.shuffleOrder = ids;
      return;
    }
    const others = ids.filter((id) => id !== anchorId);
    // Fisher-Yates unbiased shuffle
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    state.shuffleOrder = anchorId ? [anchorId, ...others] : others;
  }

  function getCurrentTrack() {
    const id = state.queue[state.currentIndex];
    return state.tracks.find((t) => t.id === id) || state.tracks[0];
  }

  function getNextTrackId() {
    if (state.queue.length === 0) return null;
    if (state.queue.length === 1) {
      return state.repeatMode === "off" ? null : state.queue[0];
    }

    const currentId = getCurrentTrack().id;
    if (state.shuffle) {
      if (state.shuffleOrder.length !== state.queue.length) {
        buildShuffleOrder(currentId);
      }
      const pos = state.shuffleOrder.indexOf(currentId);
      if (pos >= 0 && pos < state.shuffleOrder.length - 1) {
        return state.shuffleOrder[pos + 1];
      }
      if (state.repeatMode === "all") {
        // Reshuffle ensuring first new track != currentId
        const candidates = state.queue.filter((id) => id !== currentId);
        const nextFirst = candidates[Math.floor(Math.random() * candidates.length)];
        buildShuffleOrder(nextFirst);
        return nextFirst;
      }
      return null;
    } else {
      if (state.currentIndex < state.queue.length - 1) {
        return state.queue[state.currentIndex + 1];
      }
      if (state.repeatMode === "all") {
        return state.queue[0];
      }
      return null;
    }
  }

  function getPrevTrackId() {
    if (state.queue.length === 0) return null;
    if (state.shuffle && state.shuffleHistory.length > 0) {
      return state.shuffleHistory.pop();
    }
    if (state.currentIndex > 0) {
      return state.queue[state.currentIndex - 1];
    }
    return state.repeatMode === "all" ? state.queue[state.queue.length - 1] : state.queue[0];
  }

  function updateTransportIndicators() {
    shuffleBtn.classList.toggle("active-state", state.shuffle);
    shuffleBtn.title = `Shuffle: ${state.shuffle ? "On" : "Off"}`;

    repeatBtn.classList.toggle("active-state", state.repeatMode !== "off");
    repeatBadge.classList.toggle("hidden", state.repeatMode !== "one");
    repeatBtn.title = `Repeat: ${state.repeatMode.toUpperCase()}`;
  }

  // ------------------------------------------------------------------------
  // 9. CORE PLAYBACK & MEDIA SESSION API
  // ------------------------------------------------------------------------
  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  function loadTrackById(trackId, autoplay = true) {
    const idx = state.queue.indexOf(trackId);
    if (idx !== -1) state.currentIndex = idx;
    const track = getCurrentTrack();
    if (!track) return;

    audio.src = track.src;
    audio.load();

    // Update UI surfaces
    const coverSrc = track.cover || FALLBACK_COVER;
    document.getElementById("dock-cover").src = coverSrc;
    document.getElementById("dock-title").textContent = track.title;
    document.getElementById("dock-artist").textContent = track.artist;

    document.getElementById("np-cover-art").src = coverSrc;
    document.getElementById("np-vinyl-art").src = coverSrc;
    document.getElementById("np-title").textContent = track.title;
    document.getElementById("np-artist").textContent = track.artist;
    document.getElementById("np-album-badge").textContent = track.album || "Single";

    // Sync Dynamic Island
    document.getElementById("di-art").src = coverSrc;
    document.getElementById("di-art-exp").src = coverSrc;
    document.getElementById("di-title-compact").textContent = track.title;
    document.getElementById("di-artist-compact").textContent = track.artist;
    document.getElementById("di-title-exp").textContent = track.title;
    document.getElementById("di-artist-exp").textContent = track.artist;

    // Handle fallback cover if local file missing
    ["dock-cover", "np-cover-art", "np-vinyl-art", "di-art", "di-art-exp"].forEach((id) => {
      const img = document.getElementById(id);
      img.onerror = () => {
        img.onerror = null;
        img.src = FALLBACK_COVER;
      };
    });

    // Update Like indicators
    syncLikeButtons(track.id);

    // Load Lyrics for track
    parseAndRenderLyrics(track.lrc || "");

    // Update OS Media Session API
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || "YENIFY",
        artwork: [{ src: coverSrc, sizes: "512x512", type: "image/jpeg" }]
      });
    }

    renderTrackList();
    renderQueue();

    if (autoplay) {
      playAudio();
    }
  }

  async function playAudio() {
    initWebAudio();
    try {
      if (state.smoothFade && dsp.masterGain && dsp.ctx) {
        dsp.masterGain.gain.cancelScheduledValues(dsp.ctx.currentTime);
        dsp.masterGain.gain.setValueAtTime(0.05, dsp.ctx.currentTime);
        dsp.masterGain.gain.linearRampToValueAtTime(1, dsp.ctx.currentTime + 0.35);
      }
      await audio.play();
      state.isPlaying = true;
      updatePlayStateUI(true);

      const track = getCurrentTrack();
      if (track) {
        state.playCounts[track.id] = (state.playCounts[track.id] || 0) + 1;
        state.history = [
          { trackId: track.id, playedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
          ...state.history.filter((h) => h.trackId !== track.id)
        ];
        saveState();
        renderStatsAndHistory();
      }
    } catch (err) {
      console.warn("Playback awaiting user interaction or valid audio file:", err.message);
      state.isPlaying = false;
      updatePlayStateUI(false);
    }
  }

  function pauseAudio() {
    audio.pause();
    state.isPlaying = false;
    updatePlayStateUI(false);
  }

  function togglePlayPause() {
    if (!audio.src) {
      loadTrackById(state.queue[0], true);
      return;
    }
    state.isPlaying ? pauseAudio() : playAudio();
  }

  function updatePlayStateUI(playing) {
    const icon = playing ? "⏸" : "▶";
    playPauseBtn.textContent = icon;
    document.getElementById("di-play-btn").textContent = icon;
    document.getElementById("vinyl-disc").classList.toggle("spinning", playing);
    document.getElementById("di-mini-eq").classList.toggle("playing", playing);
    if (playing) {
      island.classList.remove("hidden");
    }
  }

  function playNext(autoTriggered = false) {
    const current = getCurrentTrack();
    if (autoTriggered && state.repeatMode === "one") {
      audio.currentTime = 0;
      playAudio();
      return;
    }
    const nextId = getNextTrackId();
    if (!nextId) {
      pauseAudio();
      return;
    }
    if (state.shuffle && current) {
      state.shuffleHistory.push(current.id);
    }
    loadTrackById(nextId, true);
  }

  function playPrev() {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const prevId = getPrevTrackId();
    if (prevId) loadTrackById(prevId, true);
  }

  // ------------------------------------------------------------------------
  // 10. REVOLUTIONARY LYRICS PARSER & 6-MODE RENDERER
  // ------------------------------------------------------------------------
  function parseAndRenderLyrics(rawText) {
    const viewport = document.getElementById("lyrics-viewport");
    viewport.innerHTML = "";
    state.parsedLyrics = [];
    state.activeLyricLine = -1;

    if (!rawText || !rawText.trim()) {
      state.hasTimestamps = false;
      viewport.innerHTML = `
        <div class="lyric-line active" style="font-size:1.15rem">
          No synchronized lyrics loaded for this track yet.<br/>
          <span style="font-size:0.85rem;opacity:0.75">Click "+ Load .LRC" or "+ Paste / Edit LRC" above to attach authorized LRC timestamps or plain lyrics.</span>
        </div>`;
      return;
    }

    const lines = rawText.split(/\r?\n/).filter((l) => l.trim());
    const timeRegex = /\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]/;
    const wordRegex = /<(\d{1,2}):(\d{2}(?:\.\d{1,3})?)>([^<]+)/g;

    let timestampCount = 0;

    lines.forEach((line) => {
      const match = line.match(timeRegex);
      if (match) {
        timestampCount++;
        const timeSec = parseInt(match[1], 10) * 60 + parseFloat(match[2]);
        const content = line.replace(timeRegex, "").trim();
        const words = [];
        let wMatch;
        while ((wMatch = wordRegex.exec(content)) !== null) {
          words.push({
            time: parseInt(wMatch[1], 10) * 60 + parseFloat(wMatch[2]),
            text: wMatch[3].trim()
          });
        }
        state.parsedLyrics.push({
          time: timeSec,
          text: content.replace(/<\d{1,2}:\d{2}(?:\.\d{1,3})?>/g, "").trim(),
          words
        });
      } else {
        state.parsedLyrics.push({ time: null, text: line.trim(), words: [] });
      }
    });

    state.hasTimestamps = timestampCount > 0;
    if (state.hasTimestamps) {
      state.parsedLyrics.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
    }

    state.parsedLyrics.forEach((item, idx) => {
      const div = document.createElement("div");
      div.className = "lyric-line";
      div.dataset.index = idx;

      if (item.words.length > 0) {
        item.words.forEach((w, wIdx) => {
          const span = document.createElement("span");
          span.className = "lyric-word";
          span.dataset.wTime = w.time;
          span.dataset.wIdx = wIdx;
          span.textContent = w.text;
          div.appendChild(span);
        });
      } else {
        const plainWords = item.text.split(/\s+/);
        plainWords.forEach((pw, wIdx) => {
          const span = document.createElement("span");
          span.className = "lyric-word";
          span.dataset.wIdx = wIdx;
          span.textContent = pw;
          div.appendChild(span);
        });
      }

      if (item.time !== null) {
        div.addEventListener("click", () => {
          audio.currentTime = item.time;
          if (!state.isPlaying) playAudio();
        });
      }

      viewport.appendChild(div);
    });
  }

  function syncLyricsToTime(currentTime) {
    if (!state.hasTimestamps || state.parsedLyrics.length === 0) return;

    let activeIdx = -1;
    for (let i = 0; i < state.parsedLyrics.length; i++) {
      if (state.parsedLyrics[i].time !== null && currentTime >= state.parsedLyrics[i].time) {
        activeIdx = i;
      } else {
        break;
      }
    }

    const lineEls = document.querySelectorAll("#lyrics-viewport .lyric-line");
    if (activeIdx !== state.activeLyricLine) {
      state.activeLyricLine = activeIdx;
      lineEls.forEach((el, i) => {
        el.classList.toggle("active", i === activeIdx);
        el.classList.toggle("past", i < activeIdx);
        el.classList.toggle("next-line", i === activeIdx + 1);
      });

      const autoScroll = document.getElementById("lyr-autoscroll").checked;
      if (autoScroll && activeIdx >= 0 && lineEls[activeIdx]) {
        lineEls[activeIdx].scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    // Progressive word-level highlight on active line
    const wordHlEnabled = document.getElementById("lyr-word-hl").checked;
    if (wordHlEnabled && activeIdx >= 0 && lineEls[activeIdx]) {
      const lineObj = state.parsedLyrics[activeIdx];
      const nextLineObj = state.parsedLyrics[activeIdx + 1];
      const wordSpans = lineEls[activeIdx].querySelectorAll(".lyric-word");

      if (lineObj.words.length > 0) {
        wordSpans.forEach((sp) => {
          const wt = parseFloat(sp.dataset.wTime);
          sp.classList.toggle("sung", currentTime >= wt);
        });
      } else {
        // Interpolate word progress smoothly across line duration
        const lineStart = lineObj.time;
        const lineEnd = nextLineObj?.time ?? lineStart + 4;
        const ratio = Math.min(1, Math.max(0, (currentTime - lineStart) / Math.max(0.4, lineEnd - lineStart)));
        const activeWordCount = Math.ceil(ratio * wordSpans.length);
        wordSpans.forEach((sp, idx) => {
          sp.classList.toggle("sung", idx < activeWordCount);
        });
      }
    }
  }

  // ------------------------------------------------------------------------
  // 11. UI RENDERERS (Catalog, Queue, Playlists, Themes, Mixer)
  // ------------------------------------------------------------------------
  function getFilteredTracks() {
    let list = [...state.tracks];
    if (state.activeFilter === "liked") {
      list = list.filter((t) => state.likedIds.has(t.id));
    } else if (state.activeFilter === "recent") {
      const recentIds = state.history.map((h) => h.trackId);
      list = recentIds.map((id) => state.tracks.find((t) => t.id === id)).filter(Boolean);
    } else if (state.activeFilter === "most-played") {
      list.sort((a, b) => (state.playCounts[b.id] || 0) - (state.playCounts[a.id] || 0));
    }

    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          (t.album && t.album.toLowerCase().includes(q))
      );
    }
    return list;
  }

  function renderTrackList() {
    const container = document.getElementById("track-list");
    const groupedBrowser = document.getElementById("grouped-browser");
    const tracks = getFilteredTracks();
    const current = getCurrentTrack();

    document.getElementById("catalog-count").textContent = `${tracks.length} tracks`;

    if (state.activeFilter === "albums" || state.activeFilter === "artists") {
      groupedBrowser.classList.remove("hidden");
      groupedBrowser.innerHTML = "";
      const key = state.activeFilter === "albums" ? "album" : "artist";
      const groups = {};
      state.tracks.forEach((t) => {
        const name = t[key] || "Unknown";
        if (!groups[name]) groups[name] = [];
        groups[name].push(t);
      });
      Object.entries(groups).forEach(([name, items]) => {
        const card = document.createElement("div");
        card.className = "group-card";
        card.innerHTML = `
          <img src="${items[0].cover || FALLBACK_COVER}" alt="${name}" onerror="this.src='${FALLBACK_COVER}'" />
          <strong>${name}</strong>
          <div class="muted-xs">${items.length} track(s)</div>
        `;
        card.addEventListener("click", () => {
          state.queue = items.map((i) => i.id);
          loadTrackById(items[0].id, true);
        });
        groupedBrowser.appendChild(card);
      });
    } else {
      groupedBrowser.classList.add("hidden");
    }

    container.innerHTML = "";
    tracks.forEach((track, i) => {
      const isPlaying = current && current.id === track.id;
      const isLiked = state.likedIds.has(track.id);
      const row = document.createElement("div");
      row.className = `track-row ${isPlaying ? "playing" : ""}`;
      row.innerHTML = `
        <span class="tr-idx">${isPlaying && state.isPlaying ? "▶" : i + 1}</span>
        <img class="tr-cover" src="${track.cover || FALLBACK_COVER}" alt="${track.title}" onerror="this.src='${FALLBACK_COVER}'" />
        <div class="tr-main">
          <div class="tr-title">${track.title}</div>
          <div class="tr-artist">${track.artist}</div>
        </div>
        <div class="tr-album">${track.album || "Single"}</div>
        <div class="tr-actions">
          <button class="icon-btn-xs like-row-btn" title="Like">${isLiked ? "♥" : "♡"}</button>
          <button class="icon-btn-xs add-pl-btn" title="Add to Active Playlist">+PL</button>
        </div>
      `;

      row.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        if (!state.queue.includes(track.id)) {
          state.queue = state.tracks.map((t) => t.id);
        }
        loadTrackById(track.id, true);
      });

      row.querySelector(".like-row-btn").addEventListener("click", () => toggleLike(track.id));
      row.querySelector(".add-pl-btn").addEventListener("click", () => addTrackToActivePlaylist(track.id));

      container.appendChild(row);
    });
  }

  function renderQueue() {
    const list = document.getElementById("queue-list");
    list.innerHTML = "";
    state.queue.forEach((id, idx) => {
      const track = state.tracks.find((t) => t.id === id);
      if (!track) return;
      const li = document.createElement("li");
      li.className = `queue-item ${idx === state.currentIndex ? "active-q" : ""}`;
      li.draggable = true;
      li.dataset.index = idx;
      li.innerHTML = `
        <div style="min-width:0;flex:1">
          <div style="font-size:0.86rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${track.title}</div>
          <div class="muted-xs">${track.artist}</div>
        </div>
        <span class="muted-xs">⋮⋮</span>
      `;

      li.addEventListener("click", () => loadTrackById(track.id, true));

      // Drag-and-drop queue reordering
      li.addEventListener("dragstart", (e) => e.dataTransfer.setData("text/plain", idx));
      li.addEventListener("dragover", (e) => e.preventDefault());
      li.addEventListener("drop", (e) => {
        e.preventDefault();
        const fromIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
        const toIdx = idx;
        if (fromIdx === toIdx) return;
        const [moved] = state.queue.splice(fromIdx, 1);
        state.queue.splice(toIdx, 0, moved);
        renderQueue();
      });

      list.appendChild(li);
    });
  }

  function toggleLike(trackId) {
    if (!trackId) return;
    if (state.likedIds.has(trackId)) {
      state.likedIds.delete(trackId);
    } else {
      state.likedIds.add(trackId);
    }
    saveState();
    syncLikeButtons(getCurrentTrack()?.id);
    renderTrackList();
    renderStatsAndHistory();
  }

  function syncLikeButtons(trackId) {
    const liked = trackId && state.likedIds.has(trackId);
    document.getElementById("dock-like-btn").textContent = liked ? "♥" : "♡";
    document.getElementById("np-like-btn").textContent = liked ? "♥ Liked" : "♡ Like";
    document.getElementById("di-like-btn").style.color = liked ? "var(--accent)" : "";
  }

  function renderPlaylists() {
    const sidebarList = document.getElementById("sidebar-playlist-list");
    const managerBody = document.getElementById("playlist-manager-body");
    sidebarList.innerHTML = "";
    managerBody.innerHTML = "";

    state.playlists.forEach((pl) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>♫ ${pl.name}</span><span class="muted-xs">${pl.trackIds.length}</span>`;
      li.addEventListener("click", () => {
        state.activePlaylistId = pl.id;
        saveState();
        switchView("library");
        renderPlaylists();
      });
      sidebarList.appendChild(li);
    });

    const activePl = state.playlists.find((p) => p.id === state.activePlaylistId) || state.playlists[0];
    if (!activePl) return;

    document.getElementById("active-playlist-title").textContent = `Playlist: ${activePl.name}`;
    const controls = document.createElement("div");
    controls.style.cssText = "display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;";
    controls.innerHTML = `
      <button id="play-pl-btn" class="primary-btn">▶ Play Playlist</button>
      <button id="rename-pl-btn" class="glass-btn">Rename</button>
    `;
    managerBody.appendChild(controls);

    controls.querySelector("#play-pl-btn").addEventListener("click", () => {
      if (activePl.trackIds.length === 0) return;
      state.queue = [...activePl.trackIds];
      loadTrackById(state.queue[0], true);
    });

    controls.querySelector("#rename-pl-btn").addEventListener("click", () => {
      const nextName = prompt("Rename playlist:", activePl.name);
      if (nextName && nextName.trim()) {
        activePl.name = nextName.trim();
        saveState();
        renderPlaylists();
      }
    });

    const ul = document.createElement("ul");
    ul.className = "compact-list";
    activePl.trackIds.forEach((tid, idx) => {
      const tr = state.tracks.find((t) => t.id === tid);
      if (!tr) return;
      const item = document.createElement("li");
      item.className = "queue-item";
      item.innerHTML = `
        <span>${idx + 1}. ${tr.title} — <span class="muted-xs">${tr.artist}</span></span>
        <button class="icon-btn-xs" title="Remove">✕</button>
      `;
      item.querySelector("button").addEventListener("click", () => {
        activePl.trackIds.splice(idx, 1);
        saveState();
        renderPlaylists();
      });
      ul.appendChild(item);
    });
    managerBody.appendChild(ul);
  }

  function addTrackToActivePlaylist(trackId) {
    const pl = state.playlists.find((p) => p.id === state.activePlaylistId) || state.playlists[0];
    if (!pl) return;
    if (!pl.trackIds.includes(trackId)) {
      pl.trackIds.push(trackId);
      saveState();
      renderPlaylists();
    }
  }

  function renderStatsAndHistory() {
    const totalPlays = Object.values(state.playCounts).reduce((a, b) => a + b, 0);
    document.getElementById("stat-total-plays").textContent = totalPlays;
    document.getElementById("stat-liked-count").textContent = state.likedIds.size;
    document.getElementById("stat-playlist-count").textContent = state.playlists.length;

    let topTitle = "—";
    let maxP = 0;
    Object.entries(state.playCounts).forEach(([id, count]) => {
      if (count > maxP) {
        maxP = count;
        const found = state.tracks.find((t) => t.id === id);
        if (found) topTitle = found.title;
      }
    });
    document.getElementById("stat-top-track").textContent = topTitle;

    const histEl = document.getElementById("history-list");
    histEl.innerHTML = "";
    state.history.forEach((entry) => {
      const tr = state.tracks.find((t) => t.id === entry.trackId);
      if (!tr) return;
      const li = document.createElement("li");
      li.className = "queue-item";
      li.innerHTML = `<span>${tr.title}</span><span class="muted-xs">${entry.playedAt}</span>`;
      li.addEventListener("click", () => loadTrackById(tr.id, true));
      histEl.appendChild(li);
    });
  }

  function renderThemes() {
    const grid = document.getElementById("theme-gallery-grid");
    grid.innerHTML = "";
    THEMES.forEach((th) => {
      const card = document.createElement("div");
      card.className = `theme-swatch-card glass-card ${state.theme === th.id ? "active-theme" : ""}`;
      card.innerHTML = `
        <div class="swatch-dots">
          ${th.colors.map((c) => `<span style="background:${c}"></span>`).join("")}
        </div>
        <div>
          <strong>${th.name}</strong>
          <p class="muted-xs">${th.desc}</p>
        </div>
      `;
      card.addEventListener("click", () => applyTheme(th.id));
      grid.appendChild(card);
    });
  }

  function applyTheme(themeId) {
    state.theme = themeId;
    document.documentElement.setAttribute("data-theme", themeId);
    saveState();
    renderThemes();
  }

  function buildMixerUI() {
    const wrap = document.getElementById("eq-sliders-wrap");
    wrap.innerHTML = "";
    EQ_FREQS.forEach((freq, idx) => {
      const label = freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`;
      const band = document.createElement("div");
      band.className = "eq-band";
      band.innerHTML = `
        <span class="eq-gain-label" id="eq-val-${idx}">0dB</span>
        <input type="range" min="-12" max="12" step="0.5" value="0" data-band="${idx}" aria-label="${label} EQ" />
        <span class="eq-freq-label">${label}</span>
      `;
      const slider = band.querySelector("input");
      slider.addEventListener("input", () => {
        const val = parseFloat(slider.value);
        document.getElementById(`eq-val-${idx}`).textContent = `${val > 0 ? "+" : ""}${val}dB`;
        initWebAudio();
        if (dsp.eqFilters[idx] && dsp.active) {
          dsp.eqFilters[idx].gain.value = val;
        }
        state.customEq[idx] = val;
        document.getElementById("eq-preset-select").value = "custom";
      });
      wrap.appendChild(band);
    });
  }

  function applyEqPreset(presetName) {
    const gains = presetName === "custom" ? state.customEq : EQ_PRESETS[presetName] || EQ_PRESETS.balanced;
    const sliders = document.querySelectorAll("#eq-sliders-wrap input[type='range']");
    sliders.forEach((sl, idx) => {
      const g = gains[idx] ?? 0;
      sl.value = g;
      document.getElementById(`eq-val-${idx}`).textContent = `${g > 0 ? "+" : ""}${g}dB`;
      if (dsp.eqFilters[idx] && dsp.active) {
        dsp.eqFilters[idx].gain.value = g;
      }
    });
  }

  // ------------------------------------------------------------------------
  // 12. NAVIGATION & EVENT BINDINGS
  // ------------------------------------------------------------------------
  function switchView(viewName) {
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });
    document.querySelectorAll(".view-section").forEach((sec) => {
      sec.classList.toggle("active", sec.id === `view-${viewName}`);
    });
  }

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  // Transport controls
  playPauseBtn.addEventListener("click", togglePlayPause);
  document.getElementById("di-play-btn").addEventListener("click", togglePlayPause);
  nextBtn.addEventListener("click", () => playNext(false));
  document.getElementById("di-next-btn").addEventListener("click", () => playNext(false));
  prevBtn.addEventListener("click", playPrev);
  document.getElementById("di-prev-btn").addEventListener("click", playPrev);

  shuffleBtn.addEventListener("click", () => {
    state.shuffle = !state.shuffle;
    if (state.shuffle) {
      buildShuffleOrder(getCurrentTrack()?.id);
    }
    updateTransportIndicators();
    saveState();
  });

  repeatBtn.addEventListener("click", () => {
    const modes = ["off", "all", "one"];
    state.repeatMode = modes[(modes.indexOf(state.repeatMode) + 1) % modes.length];
    updateTransportIndicators();
    saveState();
  });

  // Scrubber & Audio events
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressBar.value = pct;
    document.getElementById("di-seek").value = pct;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    document.getElementById("di-curr-time").textContent = formatTime(audio.currentTime);
    syncLyricsToTime(audio.currentTime);
  });

  audio.addEventListener("loadedmetadata", () => {
    totalDurationEl.textContent = formatTime(audio.duration);
    document.getElementById("di-dur-time").textContent = formatTime(audio.duration);
  });

  audio.addEventListener("ended", () => playNext(true));

  progressBar.addEventListener("input", () => {
    if (audio.duration) {
      audio.currentTime = (progressBar.value / 100) * audio.duration;
    }
  });

  document.getElementById("di-seek").addEventListener("input", (e) => {
    if (audio.duration) {
      audio.currentTime = (e.target.value / 100) * audio.duration;
    }
  });

  volumeSlider.addEventListener("input", () => {
    audio.volume = parseFloat(volumeSlider.value);
    muteBtn.textContent = audio.volume === 0 ? "🔇" : "🔊";
  });

  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.textContent = audio.muted ? "🔇" : "🔊";
  });

  // Dynamic Island interactions
  islandCompactTrigger.addEventListener("click", () => {
    island.classList.remove("collapsed");
    island.classList.add("expanded");
  });

  islandCollapseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    island.classList.remove("expanded");
    island.classList.add("collapsed");
  });

  document.addEventListener("click", (e) => {
    if (island.classList.contains("expanded") && !island.contains(e.target)) {
      island.classList.remove("expanded");
      island.classList.add("collapsed");
    }
  });

  document.getElementById("island-toggle-btn").addEventListener("click", () => {
    island.classList.toggle("hidden");
  });

  document.getElementById("di-lyrics-jump").addEventListener("click", () => switchView("lyrics"));

  // Lyrics Mode & Customization bindings
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const stage = document.getElementById("lyrics-stage");
      stage.className = `lyrics-stage mode-${btn.dataset.lyricMode}`;
    });
  });

  const lyricsStage = document.getElementById("lyrics-stage");
  document.getElementById("lyr-font-family").addEventListener("change", (e) => {
    lyricsStage.style.setProperty("--lyr-font", e.target.value);
  });
  document.getElementById("lyr-font-size").addEventListener("input", (e) => {
    document.getElementById("lyr-size-val").textContent = e.target.value;
    lyricsStage.style.setProperty("--lyr-size", `${e.target.value}px`);
  });
  document.getElementById("lyr-font-weight").addEventListener("change", (e) => {
    lyricsStage.style.setProperty("--lyr-weight", e.target.value);
  });
  document.getElementById("lyr-align").addEventListener("change", (e) => {
    lyricsStage.style.setProperty("--lyr-align", e.target.value);
  });
  document.getElementById("lyr-text-color").addEventListener("input", (e) => {
    lyricsStage.style.setProperty("--lyr-color", e.target.value);
  });
  document.getElementById("lyr-highlight-color").addEventListener("input", (e) => {
    lyricsStage.style.setProperty("--lyr-hl", e.target.value);
  });
  document.getElementById("lyr-bg-opacity").addEventListener("input", (e) => {
    document.getElementById("lyr-opacity-val").textContent = e.target.value;
    lyricsStage.style.setProperty("--lyr-opacity", e.target.value / 100);
  });
  document.getElementById("lyr-anim-intensity").addEventListener("input", (e) => {
    document.getElementById("lyr-anim-val").textContent = e.target.value;
    lyricsStage.style.setProperty("--lyr-anim", e.target.value);
  });
  document.getElementById("lyr-line-spacing").addEventListener("input", (e) => {
    document.getElementById("lyr-spacing-val").textContent = e.target.value;
    lyricsStage.style.setProperty("--lyr-spacing", e.target.value);
  });

  document.getElementById("lyrics-settings-toggle").addEventListener("click", () => {
    document.getElementById("lyrics-settings-panel").classList.toggle("hidden");
  });
  document.getElementById("close-lyrics-settings").addEventListener("click", () => {
    document.getElementById("lyrics-settings-panel").classList.add("hidden");
  });

  document.getElementById("lyrics-fullscreen-btn").addEventListener("click", () => {
    const container = document.getElementById("lyrics-studio-container");
    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  });

  // LRC File Upload & Paste Modal
  const lrcModal = document.getElementById("lrc-modal");
  document.getElementById("lyrics-paste-modal-btn").addEventListener("click", () => {
    document.getElementById("lrc-textarea").value = getCurrentTrack()?.lrc || "";
    lrcModal.classList.remove("hidden");
  });
  document.getElementById("close-lrc-modal").addEventListener("click", () => lrcModal.classList.add("hidden"));

  document.getElementById("save-lrc-text-btn").addEventListener("click", () => {
    const current = getCurrentTrack();
    if (!current) return;
    const text = document.getElementById("lrc-textarea").value;
    current.lrc = text;
    state.customLyrics[current.id] = text;
    saveState();
    parseAndRenderLyrics(text);
    lrcModal.classList.add("hidden");
  });

  document.getElementById("upload-lrc-trigger").addEventListener("click", () => {
    document.getElementById("lrc-file-input").click();
  });

  document.getElementById("lrc-file-input").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const current = getCurrentTrack();
      if (!current) return;
      current.lrc = String(reader.result || "");
      state.customLyrics[current.id] = current.lrc;
      saveState();
      parseAndRenderLyrics(current.lrc);
      switchView("lyrics");
    };
    reader.readAsText(file);
  });

  // Mixer & FX Rack bindings
  document.getElementById("eq-preset-select").addEventListener("change", (e) => {
    initWebAudio();
    applyEqPreset(e.target.value);
  });

  document.getElementById("save-custom-preset-btn").addEventListener("click", () => {
    EQ_PRESETS.custom = [...state.customEq];
    saveState();
    document.getElementById("eq-preset-select").value = "custom";
  });

  document.getElementById("fx-bass").addEventListener("input", (e) => {
    document.getElementById("val-bass").textContent = e.target.value;
    initWebAudio();
    if (dsp.bassShelf && dsp.active) dsp.bassShelf.gain.value = parseFloat(e.target.value);
  });

  document.getElementById("fx-treble").addEventListener("input", (e) => {
    document.getElementById("val-treble").textContent = e.target.value;
    initWebAudio();
    if (dsp.trebleShelf && dsp.active) dsp.trebleShelf.gain.value = parseFloat(e.target.value);
  });

  document.getElementById("fx-balance").addEventListener("input", (e) => {
    document.getElementById("val-balance").textContent = e.target.value;
    initWebAudio();
    if (dsp.panner && dsp.active) dsp.panner.pan.value = parseFloat(e.target.value);
  });

  document.getElementById("fx-width").addEventListener("input", (e) => {
    document.getElementById("val-width").textContent = e.target.value;
  });

  document.getElementById("fx-reverb").addEventListener("input", (e) => {
    document.getElementById("val-reverb").textContent = e.target.value;
    initWebAudio();
    if (dsp.reverbGain && dsp.active) dsp.reverbGain.gain.value = parseFloat(e.target.value) / 100;
  });

  document.getElementById("fx-echo").addEventListener("input", (e) => {
    document.getElementById("val-echo").textContent = e.target.value;
    initWebAudio();
    if (dsp.echoGain && dsp.active) dsp.echoGain.gain.value = parseFloat(e.target.value) / 100;
  });

  document.getElementById("fx-speed").addEventListener("input", (e) => {
    document.getElementById("val-speed").textContent = parseFloat(e.target.value).toFixed(2);
    audio.playbackRate = parseFloat(e.target.value);
  });

  document.getElementById("fx-crossfade").addEventListener("input", (e) => {
    document.getElementById("val-crossfade").textContent = e.target.value;
    state.crossfadeSec = parseInt(e.target.value, 10);
    saveState();
  });

  document.getElementById("reset-mixer-btn").addEventListener("click", () => {
    applyEqPreset("balanced");
    document.getElementById("eq-preset-select").value = "balanced";
    ["fx-bass", "fx-treble", "fx-balance", "fx-reverb", "fx-echo"].forEach((id) => {
      const el = document.getElementById(id);
      el.value = 0;
      el.dispatchEvent(new Event("input"));
    });
    const speedEl = document.getElementById("fx-speed");
    speedEl.value = 1;
    speedEl.dispatchEvent(new Event("input"));
  });

  // Search, Filters & Quick Actions
  document.getElementById("global-search").addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    renderTrackList();
  });

  document.getElementById("search-filter").addEventListener("change", (e) => {
    state.activeFilter = e.target.value;
    renderTrackList();
  });

  document.querySelectorAll("#quick-tabs .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll("#quick-tabs .chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      state.activeFilter = chip.dataset.filter;
      renderTrackList();
    });
  });

  document.getElementById("hero-play-all").addEventListener("click", () => {
    state.queue = state.tracks.map((t) => t.id);
    loadTrackById(state.queue[0], true);
  });

  document.getElementById("hero-shuffle-all").addEventListener("click", () => {
    state.shuffle = true;
    buildShuffleOrder(null);
    updateTransportIndicators();
    loadTrackById(state.shuffleOrder[0], true);
  });

  // Like & Navigation shortcuts
  document.getElementById("dock-like-btn").addEventListener("click", () => toggleLike(getCurrentTrack()?.id));
  document.getElementById("np-like-btn").addEventListener("click", () => toggleLike(getCurrentTrack()?.id));
  document.getElementById("di-like-btn").addEventListener("click", () => toggleLike(getCurrentTrack()?.id));

  document.getElementById("dock-art-trigger").addEventListener("click", () => switchView("now-playing"));
  document.getElementById("dock-lyrics-btn").addEventListener("click", () => switchView("lyrics"));
  document.getElementById("dock-mixer-btn").addEventListener("click", () => switchView("mixer"));
  document.getElementById("np-open-lyrics").addEventListener("click", () => switchView("lyrics"));
  document.getElementById("np-open-mixer").addEventListener("click", () => switchView("mixer"));
  document.getElementById("quick-theme-btn").addEventListener("click", () => switchView("themes"));

  document.getElementById("np-share-btn").addEventListener("click", async () => {
    const tr = getCurrentTrack();
    if (!tr) return;
    if (navigator.share) {
      await navigator.share({ title: tr.title, text: `Listening to ${tr.title} by ${tr.artist} on YENIFY 2.0` });
    } else {
      navigator.clipboard?.writeText(`${tr.title} — ${tr.artist} on YENIFY 2.0`);
      alert("Track info copied to clipboard!");
    }
  });

  // Playlist creation
  function promptNewPlaylist() {
    const name = prompt("Enter new playlist name:");
    if (!name || !name.trim()) return;
    const newPl = { id: `pl-${Date.now()}`, name: name.trim(), trackIds: [] };
    state.playlists.push(newPl);
    state.activePlaylistId = newPl.id;
    saveState();
    renderPlaylists();
    renderStatsAndHistory();
  }

  document.getElementById("create-playlist-btn").addEventListener("click", promptNewPlaylist);
  document.getElementById("lib-new-playlist-btn").addEventListener("click", promptNewPlaylist);

  document.getElementById("clear-queue-btn").addEventListener("click", () => {
    state.queue = state.tracks.map((t) => t.id);
    renderQueue();
  });

  document.getElementById("clear-history-btn").addEventListener("click", () => {
    state.history = [];
    saveState();
    renderStatsAndHistory();
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
    if (e.code === "Space") {
      e.preventDefault();
      togglePlayPause();
    } else if (e.key.toLowerCase() === "l") {
      switchView("lyrics");
    } else if (e.key.toLowerCase() === "m") {
      switchView("mixer");
    } else if (e.code === "ArrowRight") {
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
    } else if (e.code === "ArrowLeft") {
      audio.currentTime = Math.max(0, audio.currentTime - 5);
    }
  });

  // Media Session OS hardware/lock-screen controls
  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", playAudio);
    navigator.mediaSession.setActionHandler("pause", pauseAudio);
    navigator.mediaSession.setActionHandler("previoustrack", playPrev);
    navigator.mediaSession.setActionHandler("nexttrack", () => playNext(false));
  }

  // ------------------------------------------------------------------------
  // 13. BOOTSTRAP APPLICATION
  // ------------------------------------------------------------------------
  applyTheme(state.theme);
  buildMixerUI();
  updateTransportIndicators();
  renderTrackList();
  renderPlaylists();
  renderStatsAndHistory();
  loadTrackById(state.queue[0], false);
})();