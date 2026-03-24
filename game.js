const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true;

const hud = {
  level: document.getElementById("levelText"),
  score: document.getElementById("scoreText"),
  coins: document.getElementById("coinCount"),
  time: document.getElementById("timeText"),
  lives: document.getElementById("livesCount"),
  status: document.getElementById("statusText"),
  restart: document.getElementById("restartButton"),
  start: document.getElementById("startButton"),
  sound: document.getElementById("soundToggle"),
  fullscreen: document.getElementById("fullscreenButton"),
};

const ui = {
  body: document.body,
  frame: document.querySelector(".canvas-frame"),
  shell: document.getElementById("gameShell"),
  orientationHint: document.getElementById("orientationHint"),
  mobileControls: document.querySelector(".mobile-controls"),
};

const input = {
  left: false,
  right: false,
  jump: false,
};

const audio = {
  ctx: null,
  master: null,
  muted: false,
  musicIndex: 0,
  nextNoteTime: 0,
};

const HERO_PALETTE = {
  R: "#d94841",
  S: "#f3bf96",
  H: "#5a3317",
  B: "#2767cf",
  Y: "#f7d245",
  K: "#5f3a19",
  ".": null,
};

const ENEMY_PALETTE = {
  B: "#784421",
  W: "#ffffff",
  D: "#2a1f17",
  K: "#4b2c17",
  ".": null,
};

const COIN_PALETTE = {
  Y: "#ffd84a",
  O: "#f59e0b",
  ".": null,
};

const HERO_SPRITES = {
  stand: [
    "..RRRR..",
    ".RRRRRR.",
    "...RR...",
    "..SSSS..",
    "..SHH...",
    ".SSSSS..",
    "..BBBB..",
    ".BBYYB..",
    ".BBBBB..",
    "..B..B..",
    ".K....K.",
    "KK....KK",
  ],
  walk: [
    "..RRRR..",
    ".RRRRRR.",
    "...RR...",
    "..SSSS..",
    "..SHH...",
    ".SSSSS..",
    "..BBBB..",
    ".BBYYB..",
    ".BBBBB..",
    ".B...B..",
    "K...K...",
    ".K...K..",
  ],
  jump: [
    "..RRRR..",
    ".RRRRRR.",
    "...RR...",
    "..SSSS..",
    "..SHH...",
    ".SSSSS..",
    "..BBBB..",
    ".BBYYB..",
    ".BBBBB..",
    "..B..B..",
    "..K..K..",
    ".K....K.",
  ],
};

const ENEMY_SPRITE = [
  "..BBBB..",
  ".BWWWWB.",
  "BBWDDWBB",
  "BBBBBBBB",
  ".B....B.",
  "BB....BB",
  "KKK..KKK",
  "K......K",
];

const COIN_SPRITES = [
  [
    "..YY..",
    ".YYYY.",
    "YYYYYY",
    "YYOOYY",
    "YYYYYY",
    ".YYYY.",
    "..YY..",
  ],
  [
    "...Y..",
    "..YYY.",
    ".YYYY.",
    ".YOOY.",
    ".YYYY.",
    "..YYY.",
    "...Y..",
  ],
];

const MUSIC_TRACK = [
  { freq: 392.0, bass: 196.0, duration: 0.17 },
  { freq: 523.25, bass: 196.0, duration: 0.17 },
  { freq: 659.25, bass: 220.0, duration: 0.17 },
  { freq: 783.99, bass: 196.0, duration: 0.25 },
  { freq: 659.25, bass: 220.0, duration: 0.17 },
  { freq: 523.25, bass: 174.61, duration: 0.17 },
  { freq: 440.0, bass: 164.81, duration: 0.17 },
  { freq: 523.25, bass: 174.61, duration: 0.25 },
  { freq: 392.0, bass: 196.0, duration: 0.17 },
  { freq: 0, bass: 0, duration: 0.09 },
  { freq: 392.0, bass: 146.83, duration: 0.17 },
  { freq: 493.88, bass: 196.0, duration: 0.17 },
  { freq: 587.33, bass: 220.0, duration: 0.17 },
  { freq: 659.25, bass: 196.0, duration: 0.25 },
  { freq: 587.33, bass: 220.0, duration: 0.17 },
  { freq: 493.88, bass: 174.61, duration: 0.17 },
  { freq: 440.0, bass: 164.81, duration: 0.17 },
  { freq: 392.0, bass: 146.83, duration: 0.25 },
];

const PRIMARY_JUMP_VELOCITY = -13.8;
const DOUBLE_JUMP_BOOST = Math.abs(PRIMARY_JUMP_VELOCITY) * 0.5;

function ground(x, y, w, h = 88) {
  return { x, y, w, h, kind: "ground" };
}

function brick(x, y, w = 96, h = 18) {
  return { x, y, w, h, kind: "brick" };
}

function stone(x, y, w = 96, h = 18) {
  return { x, y, w, h, kind: "stone" };
}

function coin(x, y) {
  return { x, y: y < 340 ? y + 18 : y, r: 18 };
}

function enemy(x, y, minX, maxX, vx) {
  return { x, y, w: 32, h: 32, minX, maxX, vx, squashed: false };
}

function hill(x, y, w, h) {
  return { x, y, w, h };
}

function bush(x, y, w, h = 42) {
  return { x, y, w, h };
}

function cloud(x, y, s) {
  return { x, y, s };
}

function star(x, y, size) {
  return { x, y, size };
}

const LEVELS = [
  {
    name: "Prairie Pixel",
    width: 2520,
    spawn: { x: 96, y: 360 },
    timeLimit: 95,
    theme: {
      skyTop: "#7bd4ff",
      skyBottom: "#ebfbff",
      horizon: "#d8f3af",
      sun: "#ffd54d",
      glow: "rgba(255, 213, 77, 0.28)",
      cloud: "#ffffff",
      hillBack: "#8ad05d",
      hillFront: "#4fa648",
      bush: "#1f934c",
      bushShade: "#166534",
      groundTop: "#59b64d",
      ground: "#a75f29",
      groundShade: "#7f4419",
      brick: "#d67b31",
      brickShade: "#9c4e1f",
      stone: "#98a0af",
      stoneShade: "#666d78",
      flag: "#ef4444",
      night: false,
      castle: false,
    },
    platforms: [
      ground(0, 472, 560),
      ground(620, 472, 380),
      ground(1000, 452, 240, 110),
      ground(1240, 472, 520),
      ground(1820, 472, 320),
      ground(2200, 472, 320),
      brick(210, 376, 108),
      brick(356, 340, 108),
      brick(508, 300, 108),
      brick(1080, 340, 108),
      brick(1400, 344, 132),
      stone(1548, 292, 96, 18),
      brick(1880, 356, 108),
    ],
    coins: [
      coin(240, 336),
      coin(386, 284),
      coin(538, 232),
      coin(708, 424),
      coin(1108, 290),
      coin(1434, 280),
      coin(1584, 222),
      coin(1910, 316),
      coin(2286, 424),
    ],
    enemies: [
      enemy(460, 440, 180, 520, -1.0),
      enemy(1110, 420, 1010, 1200, 1.15),
      enemy(1470, 440, 1280, 1680, -1.05),
      enemy(1980, 440, 1840, 2080, 1.0),
      enemy(2290, 440, 2230, 2440, -1.2),
    ],
    flag: { x: 2440, y: 178, poleH: 294 },
    clouds: [cloud(100, 86, 1), cloud(660, 110, 1.15), cloud(1270, 92, 0.95), cloud(1840, 114, 1.2)],
    hills: [hill(10, 474, 240, 118), hill(530, 474, 260, 150), hill(1220, 474, 280, 140), hill(1880, 474, 290, 130)],
    bushes: [bush(140, 444, 100), bush(920, 444, 112), bush(1630, 444, 98), bush(2280, 444, 104)],
    stars: [],
  },
  {
    name: "Ciel Orange",
    width: 2760,
    spawn: { x: 84, y: 360 },
    timeLimit: 105,
    theme: {
      skyTop: "#f6a04d",
      skyBottom: "#ffe7b8",
      horizon: "#ffd27b",
      sun: "#ffef9c",
      glow: "rgba(255, 239, 156, 0.28)",
      cloud: "#fff4db",
      hillBack: "#d98b3a",
      hillFront: "#a85c24",
      bush: "#3f8b44",
      bushShade: "#24552b",
      groundTop: "#6eb94c",
      ground: "#8f5124",
      groundShade: "#6e3b18",
      brick: "#b86932",
      brickShade: "#85461e",
      stone: "#7a8190",
      stoneShade: "#555c68",
      flag: "#f97316",
      night: false,
      castle: false,
    },
    platforms: [
      ground(0, 472, 500),
      ground(560, 452, 310, 110),
      ground(920, 472, 340),
      ground(1320, 452, 280, 110),
      ground(1660, 472, 360),
      ground(2070, 452, 320, 110),
      ground(2440, 472, 320),
      brick(220, 376, 108),
      brick(380, 340, 108),
      brick(540, 300, 108),
      stone(718, 260, 108, 18),
      brick(1020, 348, 108),
      brick(1490, 324, 108),
      stone(1800, 340, 108),
      brick(2140, 324, 132),
      stone(2310, 272, 104),
    ],
    coins: [
      coin(248, 336),
      coin(408, 286),
      coin(568, 236),
      coin(744, 188),
      coin(1048, 308),
      coin(1450, 260),
      coin(1836, 300),
      coin(2180, 260),
      coin(2346, 208),
      coin(2520, 424),
    ],
    enemies: [
      enemy(300, 440, 80, 420, -1.05),
      enemy(660, 420, 590, 820, 1.0),
      enemy(1110, 440, 940, 1220, -1.15),
      enemy(1440, 420, 1340, 1540, 1.08),
      enemy(1880, 440, 1700, 1980, -1.1),
      enemy(2190, 420, 2100, 2340, 1.15),
    ],
    flag: { x: 2660, y: 162, poleH: 312 },
    clouds: [cloud(120, 96, 0.9), cloud(840, 118, 1.1), cloud(1500, 90, 0.95), cloud(2120, 106, 1.18)],
    hills: [hill(40, 474, 250, 120), hill(650, 474, 300, 170), hill(1380, 474, 280, 134), hill(2240, 474, 310, 144)],
    bushes: [bush(160, 444, 96), bush(970, 444, 106), bush(1750, 444, 114), bush(2460, 444, 94)],
    stars: [],
  },
  {
    name: "Nuit du Chateau",
    width: 3000,
    spawn: { x: 96, y: 360 },
    timeLimit: 115,
    theme: {
      skyTop: "#13233f",
      skyBottom: "#314c7d",
      horizon: "#6078a6",
      sun: "#f1f5f9",
      glow: "rgba(241, 245, 249, 0.16)",
      cloud: "#d9e5ff",
      hillBack: "#405f8c",
      hillFront: "#294467",
      bush: "#1f5861",
      bushShade: "#163b45",
      groundTop: "#5faa5a",
      ground: "#6d4525",
      groundShade: "#4d2e18",
      brick: "#8792a9",
      brickShade: "#60697c",
      stone: "#6d778c",
      stoneShade: "#4a5160",
      flag: "#fde047",
      night: true,
      castle: true,
    },
    platforms: [
      ground(0, 472, 520),
      ground(580, 452, 320, 110),
      ground(960, 472, 340),
      ground(1360, 432, 320, 130),
      ground(1740, 472, 420),
      ground(2210, 432, 360, 130),
      ground(2610, 472, 390),
      stone(210, 372, 108),
      brick(380, 336, 108),
      stone(560, 288, 108),
      brick(1050, 360, 108),
      stone(1480, 308, 108),
      brick(1830, 350, 132),
      stone(2320, 312, 108),
      brick(2500, 276, 132),
    ],
    coins: [
      coin(240, 332),
      coin(408, 280),
      coin(588, 228),
      coin(1080, 320),
      coin(1510, 250),
      coin(1860, 312),
      coin(2350, 262),
      coin(2540, 212),
      coin(2690, 424),
      coin(2830, 424),
    ],
    enemies: [
      enemy(340, 440, 80, 470, -1.1),
      enemy(720, 420, 610, 860, 1.05),
      enemy(1120, 440, 980, 1260, -1.2),
      enemy(1440, 400, 1380, 1580, 1.08),
      enemy(1920, 440, 1780, 2120, -1.14),
      enemy(2270, 400, 2240, 2520, 1.1),
      enemy(2740, 440, 2640, 2900, -1.2),
    ],
    flag: { x: 2880, y: 152, poleH: 322 },
    clouds: [cloud(130, 104, 0.82), cloud(940, 88, 1), cloud(1750, 112, 0.94), cloud(2440, 98, 1.08)],
    hills: [hill(60, 474, 280, 110), hill(780, 474, 340, 160), hill(1660, 474, 300, 142), hill(2460, 474, 320, 164)],
    bushes: [bush(170, 444, 86), bush(1020, 444, 96), bush(1830, 444, 102), bush(2660, 444, 96)],
    stars: [star(120, 80, 2), star(210, 128, 2), star(460, 62, 3), star(920, 88, 2), star(1320, 66, 2), star(1560, 116, 3), star(2010, 72, 2), star(2340, 102, 2), star(2680, 64, 3)],
  },
];

const state = {
  mode: "title",
  level: null,
  currentLevelIndex: 0,
  cameraX: 0,
  player: null,
  lives: 3,
  score: 0,
  totalCoins: 0,
  levelCoins: 0,
  levelScore: 0,
  timeLeft: 0,
  status: "Ecran titre",
  invulnerableTimer: 0,
  jumpBuffer: 0,
  bannerText: "Super Plumber Sprint DX",
  bannerTimer: 0,
  transitionTimer: 0,
  lastBonus: 0,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function updateHud() {
  hud.level.textContent = state.level ? `${state.currentLevelIndex + 1} / ${LEVELS.length}` : `- / ${LEVELS.length}`;
  hud.score.textContent = `${state.score}`;
  hud.coins.textContent = state.level ? `${state.levelCoins} / ${state.level.coins.length}` : "0 / 0";
  hud.time.textContent = state.level ? `${Math.max(0, Math.ceil(state.timeLeft))}` : "--";
  hud.lives.textContent = `${state.lives}`;
  hud.status.textContent = state.status;
  hud.start.textContent = state.mode === "title" ? "Demarrer" : "Nouvelle partie";
  hud.sound.textContent = audio.muted ? "Son: OFF" : "Son: ON";
}

function isTouchDevice() {
  return (
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(hover: none) and (pointer: coarse)").matches
  );
}

function isFullscreenActive() {
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

function canUseFullscreen() {
  return Boolean(
    ui.frame &&
      (ui.frame.requestFullscreen ||
        ui.frame.webkitRequestFullscreen ||
        document.fullscreenEnabled ||
        document.webkitFullscreenEnabled)
  );
}

function updateFullscreenButton() {
  const enabled = canUseFullscreen();
  hud.fullscreen.hidden = !enabled;
  if (!enabled) {
    return;
  }
  hud.fullscreen.textContent = isFullscreenActive() ? "Quitter plein ecran" : "Plein ecran";
}

function updateResponsiveMode() {
  const touch = isTouchDevice();
  const portraitTouch = touch && window.innerHeight > window.innerWidth;
  ui.body.classList.toggle("touch-device", touch);
  ui.body.classList.toggle("portrait-touch", portraitTouch);
  if (ui.orientationHint) {
    ui.orientationHint.hidden = !portraitTouch;
  }
  updateFullscreenButton();
}

function cloneLevel(index) {
  const source = LEVELS[index];
  return {
    ...source,
    spawn: { ...source.spawn },
    theme: { ...source.theme },
    platforms: source.platforms.map((platform) => ({ ...platform })),
    coins: source.coins.map((coinItem) => ({ ...coinItem, taken: false })),
    enemies: source.enemies.map((enemyItem) => ({ ...enemyItem })),
    flag: { ...source.flag },
    clouds: source.clouds.map((item) => ({ ...item })),
    hills: source.hills.map((item) => ({ ...item })),
    bushes: source.bushes.map((item) => ({ ...item })),
    stars: source.stars.map((item) => ({ ...item })),
  };
}

function createPlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    prevX: spawn.x,
    prevY: spawn.y,
    w: 28,
    h: 46,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    coyoteFrames: 0,
    jumpPhase: 0,
  };
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleRectOverlap(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

function createAudioContext() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) {
    return null;
  }
  const ctxAudio = new AudioCtor();
  const master = ctxAudio.createGain();
  master.gain.value = 0.09;
  master.connect(ctxAudio.destination);
  audio.ctx = ctxAudio;
  audio.master = master;
  return ctxAudio;
}

function activateAudio() {
  if (!audio.ctx) {
    createAudioContext();
  }
  if (!audio.ctx) {
    return;
  }
  if (audio.ctx.state === "suspended") {
    audio.ctx.resume();
  }
}

function scheduleTone(freq, duration, options = {}) {
  if (!audio.ctx || audio.muted || freq <= 0) {
    return;
  }
  const when = options.when ?? audio.ctx.currentTime;
  const oscillator = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  oscillator.type = options.type ?? "square";
  oscillator.frequency.setValueAtTime(freq, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(options.volume ?? 0.03, when + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  oscillator.connect(gain);
  gain.connect(audio.master);
  oscillator.start(when);
  oscillator.stop(when + duration + 0.02);
}

function scheduleSweep(fromFreq, toFreq, duration, options = {}) {
  if (!audio.ctx || audio.muted || fromFreq <= 0) {
    return;
  }
  const when = options.when ?? audio.ctx.currentTime;
  const oscillator = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  oscillator.type = options.type ?? "square";
  oscillator.frequency.setValueAtTime(fromFreq, when);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, toFreq), when + duration);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(options.volume ?? 0.03, when + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  oscillator.connect(gain);
  gain.connect(audio.master);
  oscillator.start(when);
  oscillator.stop(when + duration + 0.02);
}

function playFx(name) {
  activateAudio();
  if (!audio.ctx || audio.muted) {
    return;
  }
  const start = audio.ctx.currentTime + 0.01;

  switch (name) {
    case "start":
      scheduleTone(523.25, 0.09, { when: start, type: "square", volume: 0.03 });
      scheduleTone(659.25, 0.09, { when: start + 0.1, type: "square", volume: 0.03 });
      scheduleTone(783.99, 0.14, { when: start + 0.2, type: "square", volume: 0.03 });
      break;
    case "jump":
      scheduleSweep(360, 620, 0.12, { when: start, type: "square", volume: 0.026 });
      break;
    case "coin":
      scheduleTone(880, 0.07, { when: start, type: "triangle", volume: 0.022 });
      scheduleTone(1320, 0.09, { when: start + 0.08, type: "triangle", volume: 0.02 });
      break;
    case "stomp":
      scheduleTone(180, 0.06, { when: start, type: "square", volume: 0.024 });
      scheduleTone(130, 0.09, { when: start + 0.05, type: "triangle", volume: 0.018 });
      break;
    case "hurt":
      scheduleSweep(280, 120, 0.2, { when: start, type: "sawtooth", volume: 0.03 });
      break;
    case "flag":
      scheduleTone(523.25, 0.08, { when: start, type: "square", volume: 0.028 });
      scheduleTone(659.25, 0.08, { when: start + 0.08, type: "square", volume: 0.028 });
      scheduleTone(783.99, 0.12, { when: start + 0.16, type: "square", volume: 0.028 });
      scheduleTone(1046.5, 0.18, { when: start + 0.28, type: "square", volume: 0.026 });
      break;
    case "win":
      scheduleTone(523.25, 0.11, { when: start, type: "square", volume: 0.03 });
      scheduleTone(659.25, 0.11, { when: start + 0.12, type: "square", volume: 0.03 });
      scheduleTone(783.99, 0.11, { when: start + 0.24, type: "square", volume: 0.03 });
      scheduleTone(1046.5, 0.22, { when: start + 0.36, type: "square", volume: 0.03 });
      break;
    case "gameOver":
      scheduleSweep(330, 150, 0.36, { when: start, type: "sawtooth", volume: 0.028 });
      break;
    default:
      break;
  }
}

function resetMusicClock() {
  if (!audio.ctx) {
    return;
  }
  audio.musicIndex = 0;
  audio.nextNoteTime = audio.ctx.currentTime + 0.04;
}

function updateMusic() {
  if (!audio.ctx || audio.muted || state.mode !== "playing") {
    audio.nextNoteTime = 0;
    return;
  }
  if (audio.nextNoteTime === 0) {
    resetMusicClock();
  }
  while (audio.nextNoteTime < audio.ctx.currentTime + 0.28) {
    const note = MUSIC_TRACK[audio.musicIndex];
    if (note.freq > 0) {
      scheduleTone(note.freq, note.duration * 0.88, {
        when: audio.nextNoteTime,
        type: "square",
        volume: 0.013,
      });
    }
    if (note.bass > 0) {
      scheduleTone(note.bass, note.duration * 0.92, {
        when: audio.nextNoteTime,
        type: "triangle",
        volume: 0.009,
      });
    }
    audio.nextNoteTime += note.duration;
    audio.musicIndex = (audio.musicIndex + 1) % MUSIC_TRACK.length;
  }
}

function queueJump() {
  if (state.mode !== "playing") {
    return;
  }
  state.jumpBuffer = 12;
}

function loadLevel(index) {
  state.currentLevelIndex = index;
  state.level = cloneLevel(index);
  state.player = createPlayer(state.level.spawn);
  state.cameraX = 0;
  state.levelCoins = 0;
  state.levelScore = 0;
  state.timeLeft = state.level.timeLimit;
  state.invulnerableTimer = 0;
  state.jumpBuffer = 0;
  state.transitionTimer = 0;
  state.lastBonus = 0;
  state.mode = "playing";
  state.status = `Niveau ${index + 1} en cours`;
  state.bannerText = `Niveau ${index + 1} - ${state.level.name}`;
  state.bannerTimer = 130;
  resetMusicClock();
  updateHud();
}

function startNewGame() {
  activateAudio();
  state.lives = 3;
  state.score = 0;
  state.totalCoins = 0;
  loadLevel(0);
  playFx("start");
}

function restartLevel() {
  if (!state.level) {
    startNewGame();
    return;
  }
  state.score = Math.max(0, state.score - state.levelScore);
  state.totalCoins = Math.max(0, state.totalCoins - state.levelCoins);
  loadLevel(state.currentLevelIndex);
  state.status = `Niveau ${state.currentLevelIndex + 1} rejoue`;
  updateHud();
  playFx("start");
}

function respawnPlayer(reason) {
  state.player = createPlayer(state.level.spawn);
  state.cameraX = 0;
  state.invulnerableTimer = 90;
  state.status = `${reason} - ${state.lives} vie${state.lives > 1 ? "s" : ""}`;
  updateHud();
}

function loseLife(reason) {
  if (state.mode !== "playing") {
    return;
  }
  state.lives -= 1;
  playFx("hurt");
  if (state.lives <= 0) {
    state.mode = "game-over";
    state.status = "Game over";
    state.bannerText = "Fin de partie";
    state.bannerTimer = 180;
    audio.nextNoteTime = 0;
    updateHud();
    playFx("gameOver");
    return;
  }
  respawnPlayer(reason);
}

function completeLevel() {
  if (state.mode !== "playing") {
    return;
  }
  const bonus = 1000 + Math.ceil(state.timeLeft) * 5;
  state.lastBonus = bonus;
  state.score += bonus;
  state.levelScore += bonus;
  state.mode = "level-clear";
  state.transitionTimer = 120;
  state.status = `Niveau ${state.currentLevelIndex + 1} termine`;
  state.bannerText = `Drapeau atteint +${bonus}`;
  state.bannerTimer = 120;
  audio.nextNoteTime = 0;
  updateHud();
  playFx("flag");
}

function advanceLevel() {
  if (state.currentLevelIndex < LEVELS.length - 1) {
    loadLevel(state.currentLevelIndex + 1);
    playFx("start");
    return;
  }
  state.mode = "victory";
  state.status = "Tous les niveaux termines";
  state.bannerText = "Victoire";
  state.bannerTimer = 220;
  audio.nextNoteTime = 0;
  updateHud();
  playFx("win");
}

function togglePause() {
  if (state.mode === "playing") {
    state.mode = "paused";
    state.status = "Pause";
    updateHud();
    return;
  }
  if (state.mode === "paused") {
    state.mode = "playing";
    state.status = `Niveau ${state.currentLevelIndex + 1} en cours`;
    resetMusicClock();
    updateHud();
  }
}

function toggleMute() {
  activateAudio();
  audio.muted = !audio.muted;
  if (audio.muted) {
    audio.nextNoteTime = 0;
  } else {
    resetMusicClock();
  }
  updateHud();
}

function requestGameFullscreen() {
  if (!ui.frame) {
    return;
  }
  if (ui.frame.requestFullscreen) {
    ui.frame.requestFullscreen();
    return;
  }
  if (ui.frame.webkitRequestFullscreen) {
    ui.frame.webkitRequestFullscreen();
  }
}

function exitGameFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
    return;
  }
  if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}

function toggleFullscreen() {
  if (!canUseFullscreen()) {
    return;
  }
  if (isFullscreenActive()) {
    exitGameFullscreen();
  } else {
    requestGameFullscreen();
  }
}

function resolveHorizontalCollisions(player) {
  state.level.platforms.forEach((platform) => {
    if (!rectsOverlap(player, platform)) {
      return;
    }
    if (player.vx > 0 && player.prevX + player.w <= platform.x + 4) {
      player.x = platform.x - player.w;
      player.vx = 0;
    } else if (player.vx < 0 && player.prevX >= platform.x + platform.w - 4) {
      player.x = platform.x + platform.w;
      player.vx = 0;
    }
  });
}

function resolveVerticalCollisions(player) {
  player.onGround = false;
  state.level.platforms.forEach((platform) => {
    if (!rectsOverlap(player, platform)) {
      return;
    }
    if (player.vy >= 0 && player.prevY + player.h <= platform.y + 4) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
      player.coyoteFrames = 8;
      player.jumpPhase = 0;
    } else if (player.vy < 0 && player.prevY >= platform.y + platform.h - 4) {
      player.y = platform.y + platform.h;
      player.vy = 0;
    }
  });
}

function triggerPrimaryJump(player) {
  player.vy = PRIMARY_JUMP_VELOCITY;
  player.onGround = false;
  player.coyoteFrames = 0;
  player.jumpPhase = 1;
  state.jumpBuffer = 0;
  playFx("jump");
}

function triggerDoubleJump(player) {
  player.vy = Math.min(player.vy - DOUBLE_JUMP_BOOST, -DOUBLE_JUMP_BOOST);
  player.jumpPhase = 2;
  state.jumpBuffer = 0;
  playFx("jump");
}

function handlePlayerMovement(step) {
  const player = state.player;
  player.prevX = player.x;
  player.prevY = player.y;
  player.coyoteFrames = player.onGround ? 8 : Math.max(0, player.coyoteFrames - step);
  state.jumpBuffer = Math.max(0, state.jumpBuffer - step);

  const accel = player.onGround ? 0.62 : 0.42;
  const topSpeed = 5.4;
  const friction = player.onGround ? 0.76 : 0.9;

  if (input.left) {
    player.vx = Math.max(player.vx - accel * step, -topSpeed);
    player.facing = -1;
  } else if (input.right) {
    player.vx = Math.min(player.vx + accel * step, topSpeed);
    player.facing = 1;
  } else {
    player.vx *= Math.pow(friction, step);
    if (Math.abs(player.vx) < 0.03) {
      player.vx = 0;
    }
  }

  if (state.jumpBuffer > 0 && player.coyoteFrames > 0) {
    triggerPrimaryJump(player);
  } else if (state.jumpBuffer > 0 && !player.onGround && player.jumpPhase === 1) {
    triggerDoubleJump(player);
  }

  if (!input.jump && player.vy < -4) {
    player.vy += 0.28 * step;
  }

  player.vy = Math.min(player.vy + 0.68 * step, 14);
  player.x += player.vx * step;
  player.x = clamp(player.x, 0, state.level.width - player.w);
  resolveHorizontalCollisions(player);

  player.y += player.vy * step;
  resolveVerticalCollisions(player);

  if (player.y > canvas.height + 170) {
    loseLife("Chute");
    return;
  }

  const target = clamp(player.x - canvas.width * 0.36, 0, state.level.width - canvas.width);
  state.cameraX += (target - state.cameraX) * 0.14 * step;
}

function updateCoins() {
  state.level.coins.forEach((coinItem) => {
    if (coinItem.taken) {
      return;
    }
    if (circleRectOverlap(coinItem, state.player)) {
      coinItem.taken = true;
      state.levelCoins += 1;
      state.totalCoins += 1;
      state.levelScore += 100;
      state.score += 100;
      state.status = "Piece recuperee";
      updateHud();
      playFx("coin");
    }
  });
}

function updateEnemies(step) {
  state.level.enemies.forEach((enemyItem) => {
    if (enemyItem.squashed) {
      return;
    }

    enemyItem.x += enemyItem.vx * step;
    if (enemyItem.x <= enemyItem.minX) {
      enemyItem.x = enemyItem.minX;
      enemyItem.vx *= -1;
    }
    if (enemyItem.x + enemyItem.w >= enemyItem.maxX) {
      enemyItem.x = enemyItem.maxX - enemyItem.w;
      enemyItem.vx *= -1;
    }

    if (!rectsOverlap(state.player, enemyItem)) {
      return;
    }

    const stomp = state.player.vy > 0 && state.player.prevY + state.player.h <= enemyItem.y + 10;
    if (stomp) {
      enemyItem.squashed = true;
      state.player.vy = -8.6;
      state.score += 250;
      state.levelScore += 250;
      state.status = "Ennemi ecrase";
      updateHud();
      playFx("stomp");
      return;
    }

    if (state.invulnerableTimer <= 0) {
      loseLife("Aie");
    }
  });
}

function updateFlag() {
  const zone = {
    x: state.level.flag.x - 10,
    y: state.level.flag.y,
    w: 28,
    h: state.level.flag.poleH,
  };
  if (rectsOverlap(state.player, zone)) {
    completeLevel();
  }
}

function updatePlaying(step) {
  if (state.bannerTimer > 0) {
    state.bannerTimer = Math.max(0, state.bannerTimer - step);
  }
  if (state.invulnerableTimer > 0) {
    state.invulnerableTimer = Math.max(0, state.invulnerableTimer - step);
  }
  state.timeLeft = Math.max(0, state.timeLeft - step / 60);
  if (state.timeLeft <= 0) {
    loseLife("Temps ecoule");
    return;
  }
  handlePlayerMovement(step);
  if (state.mode !== "playing") {
    return;
  }
  updateCoins();
  updateEnemies(step);
  if (state.mode !== "playing") {
    return;
  }
  updateFlag();
  updateHud();
}

function updateTransitions(step) {
  if (state.bannerTimer > 0) {
    state.bannerTimer = Math.max(0, state.bannerTimer - step);
  }
  if (state.mode === "level-clear") {
    state.transitionTimer = Math.max(0, state.transitionTimer - step);
    if (state.transitionTimer === 0) {
      advanceLevel();
    }
  }
}

function drawPixelSprite(sprite, x, y, scale, palette, flip = false) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (flip) {
    ctx.translate(sprite[0].length * scale, 0);
    ctx.scale(-1, 1);
  }
  sprite.forEach((row, rowIndex) => {
    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      const code = row[colIndex];
      if (code === "." || !palette[code]) {
        continue;
      }
      ctx.fillStyle = palette[code];
      ctx.fillRect(colIndex * scale, rowIndex * scale, scale, scale);
    }
  });
  ctx.restore();
}

function roundedRectPath(x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fillRoundedRect(x, y, w, h, r, fillStyle) {
  ctx.save();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
  }
  roundedRectPath(x, y, w, h, r);
  ctx.fill();
  ctx.restore();
}

function strokeRoundedRect(x, y, w, h, r, strokeStyle, lineWidth = 1) {
  ctx.save();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  roundedRectPath(x, y, w, h, r);
  ctx.stroke();
  ctx.restore();
}

function drawSparkle(x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();
  ctx.restore();
}

function drawCloudShape(x, y, scale, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(15, 23, 42, 0.08)";
  ctx.beginPath();
  ctx.ellipse(56, 28, 42, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(24, 30, 18, 0, Math.PI * 2);
  ctx.arc(46, 21, 23, 0, Math.PI * 2);
  ctx.arc(72, 26, 18, 0, Math.PI * 2);
  ctx.arc(88, 34, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.beginPath();
  ctx.ellipse(44, 18, 16, 7, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHillShape(x, baseY, width, height, fillColor, highlightColor, shadowColor) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x, baseY - height * 0.18);
  ctx.bezierCurveTo(
    x + width * 0.08,
    baseY - height * 0.95,
    x + width * 0.32,
    baseY - height * 1.04,
    x + width * 0.52,
    baseY - height
  );
  ctx.bezierCurveTo(
    x + width * 0.74,
    baseY - height * 1.02,
    x + width * 0.92,
    baseY - height * 0.55,
    x + width,
    baseY
  );
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + width * 0.18, baseY - height * 0.08);
  ctx.bezierCurveTo(
    x + width * 0.28,
    baseY - height * 0.7,
    x + width * 0.42,
    baseY - height * 0.92,
    x + width * 0.56,
    baseY - height * 0.88
  );
  ctx.bezierCurveTo(
    x + width * 0.48,
    baseY - height * 0.54,
    x + width * 0.34,
    baseY - height * 0.32,
    x + width * 0.18,
    baseY - height * 0.08
  );
  ctx.closePath();
  ctx.fillStyle = highlightColor;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + width * 0.62, baseY);
  ctx.bezierCurveTo(
    x + width * 0.82,
    baseY - height * 0.18,
    x + width * 0.92,
    baseY - height * 0.44,
    x + width * 0.96,
    baseY - height * 0.18
  );
  ctx.lineTo(x + width, baseY);
  ctx.closePath();
  ctx.fillStyle = shadowColor;
  ctx.fill();
  ctx.restore();
}

function drawBushShape(x, y, width, height, fillColor, shadowColor) {
  ctx.save();
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(x + width * 0.26, y - height * 0.22, width * 0.22, height * 0.28, 0, 0, Math.PI * 2);
  ctx.ellipse(x + width * 0.52, y - height * 0.34, width * 0.24, height * 0.34, 0, 0, Math.PI * 2);
  ctx.ellipse(x + width * 0.78, y - height * 0.2, width * 0.22, height * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.ellipse(x + width * 0.24, y - height * 0.26, width * 0.22, height * 0.28, 0, 0, Math.PI * 2);
  ctx.ellipse(x + width * 0.5, y - height * 0.38, width * 0.26, height * 0.36, 0, 0, Math.PI * 2);
  ctx.ellipse(x + width * 0.78, y - height * 0.24, width * 0.24, height * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.ellipse(x + width * 0.4, y - height * 0.46, width * 0.12, height * 0.08, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSky() {
  const theme = state.level ? state.level.theme : LEVELS[0].theme;
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(0.62, theme.skyBottom);
  sky.addColorStop(1, theme.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const haze = ctx.createLinearGradient(0, canvas.height * 0.52, 0, canvas.height);
  haze.addColorStop(0, "rgba(255,255,255,0)");
  haze.addColorStop(1, "rgba(245,255,240,0.55)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, canvas.height * 0.46, canvas.width, canvas.height * 0.54);

  const sunX = canvas.width - 128;
  const sunY = 94;
  const glow = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, theme.night ? 66 : 82);
  glow.addColorStop(0, theme.glow);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, theme.night ? 66 : 82, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = theme.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, theme.night ? 30 : 42, 0, Math.PI * 2);
  ctx.fill();

  if (!theme.night) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 220, 120, 0.22)";
    ctx.lineWidth = 4;
    for (let ray = 0; ray < 10; ray += 1) {
      const angle = (Math.PI * 2 * ray) / 10;
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(angle) * 54, sunY + Math.sin(angle) * 54);
      ctx.lineTo(sunX + Math.cos(angle) * 72, sunY + Math.sin(angle) * 72);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (state.level && state.level.stars.length > 0) {
    state.level.stars.forEach((item) => {
      const x = item.x - state.cameraX * 0.18;
      drawSparkle(x, item.y, item.size + 1, "rgba(248,250,252,0.95)");
    });
  }
}

function drawClouds() {
  if (!state.level) {
    return;
  }
  state.level.clouds.forEach((item, index) => {
    const x = item.x - state.cameraX * 0.2;
    drawCloudShape(x, item.y + Math.sin(performance.now() / 1200 + index) * 2, item.s, state.level.theme.cloud);
  });
}

function drawHills() {
  if (!state.level) {
    return;
  }
  state.level.hills.forEach((item, index) => {
    const x = item.x - state.cameraX * 0.38;
    const main = index % 2 === 0 ? state.level.theme.hillBack : state.level.theme.hillFront;
    const highlight = "rgba(255,255,255,0.16)";
    const shadow = "rgba(15,23,42,0.12)";
    drawHillShape(x, item.y, item.w, item.h, main, highlight, shadow);
  });
}

function drawCastle() {
  if (!state.level || !state.level.theme.castle) {
    return;
  }
  const x = state.level.flag.x + 42 - state.cameraX;
  const y = 300;
  fillRoundedRect(x + 8, y, 88, 172, 6, "#64748b");
  fillRoundedRect(x + 24, y - 34, 20, 34, 4, "#7a8697");
  fillRoundedRect(x + 58, y - 54, 24, 54, 4, "#7a8697");
  ctx.fillStyle = "#495365";
  ctx.fillRect(x + 36, y + 86, 30, 86);
  ctx.fillStyle = "#f8e17d";
  ctx.fillRect(x + 26, y + 42, 10, 18);
  ctx.fillRect(x + 66, y + 52, 10, 18);
  ctx.fillStyle = "#516070";
  for (let offset = 0; offset < 88; offset += 16) {
    fillRoundedRect(x + 8 + offset, y - 12, 10, 12, 3, "#7b8796");
  }
}

function drawBushes() {
  if (!state.level) {
    return;
  }
  state.level.bushes.forEach((item) => {
    const x = item.x - state.cameraX * 0.7;
    drawBushShape(x, item.y, item.w, item.h, state.level.theme.bush, state.level.theme.bushShade);
  });
}

function drawPlatforms() {
  if (!state.level) {
    return;
  }

  state.level.platforms.forEach((platform, index) => {
    const x = Math.round(platform.x - state.cameraX);
    if (x + platform.w < -80 || x > canvas.width + 80) {
      return;
    }

    if (platform.kind === "ground") {
      const dirtGradient = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.h);
      dirtGradient.addColorStop(0, state.level.theme.ground);
      dirtGradient.addColorStop(1, state.level.theme.groundShade);
      ctx.fillStyle = dirtGradient;
      ctx.fillRect(x, platform.y + 12, platform.w, platform.h - 12);

      const grassGradient = ctx.createLinearGradient(0, platform.y, 0, platform.y + 20);
      grassGradient.addColorStop(0, "#7ee36e");
      grassGradient.addColorStop(1, state.level.theme.groundTop);
      ctx.fillStyle = grassGradient;
      ctx.fillRect(x, platform.y, platform.w, 18);

      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(x, platform.y + 2, platform.w, 4);

      ctx.fillStyle = "rgba(92, 49, 18, 0.4)";
      for (let stripe = 8; stripe < platform.w; stripe += 28) {
        fillRoundedRect(x + stripe, platform.y + 28, 12, platform.h - 34, 4, "rgba(92,49,18,0.36)");
      }

      ctx.fillStyle = "rgba(255,255,255,0.18)";
      for (let tuft = 6; tuft < platform.w; tuft += 18) {
        ctx.beginPath();
        ctx.moveTo(x + tuft, platform.y + 18);
        ctx.lineTo(x + tuft + 4, platform.y + 10);
        ctx.lineTo(x + tuft + 8, platform.y + 18);
        ctx.closePath();
        ctx.fill();
      }

      if (!state.level.theme.night && platform.w > 260) {
        const flowerX = x + 46 + ((index * 37) % Math.max(80, platform.w - 72));
        ctx.strokeStyle = "#2f855a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(flowerX, platform.y + 14);
        ctx.lineTo(flowerX, platform.y + 2);
        ctx.stroke();
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(flowerX, platform.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    if (platform.kind === "brick") {
      fillRoundedRect(x, platform.y, platform.w, platform.h, 5, state.level.theme.brick);
      fillRoundedRect(x + 2, platform.y + 2, platform.w - 4, 5, 4, "rgba(255,255,255,0.22)");
      ctx.strokeStyle = "rgba(114, 49, 14, 0.34)";
      ctx.lineWidth = 1.25;
      for (let brickX = 0; brickX < platform.w; brickX += 24) {
        ctx.strokeRect(x + brickX + 1, platform.y + 1, 22, platform.h - 2);
        ctx.fillStyle = state.level.theme.brickShade;
        ctx.fillRect(x + brickX + 3, platform.y + platform.h - 5, 18, 3);
      }
      return;
    }

    fillRoundedRect(x, platform.y, platform.w, platform.h, 5, state.level.theme.stone);
    fillRoundedRect(x + 2, platform.y + 2, platform.w - 4, 5, 4, "rgba(255,255,255,0.18)");
    for (let tileX = 0; tileX < platform.w; tileX += 24) {
      strokeRoundedRect(x + tileX + 1, platform.y + 1, 22, platform.h - 2, 4, "rgba(71,85,105,0.36)");
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fillRect(x + tileX + 4, platform.y + 5, 14, 2);
    }
  });
}

function drawFlag() {
  if (!state.level) {
    return;
  }

  const poleX = state.level.flag.x - state.cameraX;
  const clothY = state.level.flag.y + 18;
  const wave = Math.sin(performance.now() / 180) * 10;
  const poleGradient = ctx.createLinearGradient(poleX, state.level.flag.y, poleX + 8, state.level.flag.y);
  poleGradient.addColorStop(0, "#f8fafc");
  poleGradient.addColorStop(1, "#94a3b8");
  ctx.fillStyle = poleGradient;
  ctx.fillRect(poleX, state.level.flag.y, 8, state.level.flag.poleH);
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.arc(poleX + 4, state.level.flag.y - 4, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = state.level.theme.flag;
  ctx.beginPath();
  ctx.moveTo(poleX + 8, clothY);
  ctx.bezierCurveTo(poleX + 26, clothY - 10, poleX + 44, clothY + wave * 0.2, poleX + 58, clothY + 8);
  ctx.lineTo(poleX + 58, clothY + 34);
  ctx.bezierCurveTo(poleX + 42, clothY + 24, poleX + 24, clothY + 40, poleX + 8, clothY + 28);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.24)";
  ctx.beginPath();
  ctx.moveTo(poleX + 12, clothY + 8);
  ctx.bezierCurveTo(poleX + 26, clothY + 2, poleX + 38, clothY + 6, poleX + 50, clothY + 12);
  ctx.lineTo(poleX + 50, clothY + 16);
  ctx.bezierCurveTo(poleX + 38, clothY + 10, poleX + 26, clothY + 8, poleX + 12, clothY + 14);
  ctx.closePath();
  ctx.fill();
}

function drawCoins() {
  if (!state.level) {
    return;
  }

  state.level.coins.forEach((coinItem, index) => {
    if (coinItem.taken) {
      return;
    }

    const bob = Math.sin(performance.now() / 180 + index) * 5;
    const spin = 0.7 + Math.sin(performance.now() / 120 + index * 0.8) * 0.22;
    const x = coinItem.x - state.cameraX;
    const y = coinItem.y + bob;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(spin, 1);
    const coinGradient = ctx.createLinearGradient(0, -14, 0, 14);
    coinGradient.addColorStop(0, "#fde68a");
    coinGradient.addColorStop(0.5, "#fbbf24");
    coinGradient.addColorStop(1, "#d97706");
    ctx.fillStyle = coinGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(-3, -5, 3.5, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawSparkle(x + 13, y - 12, 3, "rgba(255,244,180,0.8)");
  });
}

function drawEnemies() {
  if (!state.level) {
    return;
  }

  state.level.enemies.forEach((enemyItem, index) => {
    if (enemyItem.squashed) {
      return;
    }

    const x = enemyItem.x - state.cameraX;
    const y = enemyItem.y + Math.sin(performance.now() / 260 + index) * 1.2;
    const shadowY = y + enemyItem.h - 4;
    const capGradient = ctx.createLinearGradient(x, y, x, y + enemyItem.h);
    capGradient.addColorStop(0, "#9a5a2e");
    capGradient.addColorStop(1, "#5f3419");

    ctx.fillStyle = "rgba(15,23,42,0.14)";
    ctx.beginPath();
    ctx.ellipse(x + 16, shadowY + 6, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = capGradient;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 23);
    ctx.quadraticCurveTo(x + 16, y - 4, x + 28, y + 23);
    ctx.quadraticCurveTo(x + 16, y + 30, x + 4, y + 23);
    ctx.fill();

    ctx.fillStyle = "#f4d6ba";
    ctx.beginPath();
    ctx.ellipse(x + 16, y + 25, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.ellipse(x + 12, y + 24, 1.8, 4.2, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 20, y + 24, 1.8, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#7c2d12";
    ctx.beginPath();
    ctx.ellipse(x + 10, y + 34, 6, 4, -0.35, 0, Math.PI * 2);
    ctx.ellipse(x + 22, y + 34, 6, 4, 0.35, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlayer() {
  if (!state.player) {
    return;
  }

  const player = state.player;
  const x = player.x - state.cameraX - 4;
  const y = player.y - 5;
  const stride = player.onGround ? Math.sin(performance.now() / 100) * Math.min(1, Math.abs(player.vx) / 3) * 4 : 0;
  const armSwing = player.onGround ? Math.sin(performance.now() / 100) * Math.min(1, Math.abs(player.vx) / 3) * 3 : -2;

  ctx.save();
  if (state.invulnerableTimer > 0 && Math.floor(state.invulnerableTimer / 6) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }

  ctx.translate(x + 18, 0);
  if (player.facing < 0) {
    ctx.scale(-1, 1);
  }
  ctx.translate(-(x + 18), 0);

  ctx.fillStyle = "rgba(15,23,42,0.14)";
  ctx.beginPath();
  ctx.ellipse(x + 18, y + 54, 13, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  fillRoundedRect(x + 8, y + 8, 20, 8, 4, "#d94841");
  fillRoundedRect(x + 4, y + 13, 28, 6, 3, "#c62828");

  ctx.fillStyle = "#f5c9a8";
  ctx.beginPath();
  ctx.ellipse(x + 18, y + 25, 10, 10.5, 0, 0, Math.PI * 2);
  ctx.fill();

  fillRoundedRect(x + 10, y + 34, 16, 14, 4, "#2563eb");
  fillRoundedRect(x + 6, y + 33, 8, 14, 3, "#2563eb");
  fillRoundedRect(x + 22, y + 33, 8, 14, 3, "#2563eb");
  fillRoundedRect(x + 15, y + 34, 6, 14, 2, "#f9fafb");

  fillRoundedRect(x + 5, y + 34 + armSwing * 0.18, 6, 15, 3, "#d94841");
  fillRoundedRect(x + 25, y + 34 - armSwing * 0.18, 6, 15, 3, "#d94841");
  ctx.fillStyle = "#f9fafb";
  ctx.beginPath();
  ctx.arc(x + 8, y + 49 + armSwing * 0.18, 3.2, 0, Math.PI * 2);
  ctx.arc(x + 28, y + 49 - armSwing * 0.18, 3.2, 0, Math.PI * 2);
  ctx.fill();

  fillRoundedRect(x + 11, y + 47, 6, 10 + stride * 0.22, 3, "#1f3b8f");
  fillRoundedRect(x + 19, y + 47, 6, 10 - stride * 0.22, 3, "#1f3b8f");
  fillRoundedRect(x + 8, y + 56 + stride * 0.2, 10, 5, 3, "#5b371c");
  fillRoundedRect(x + 18, y + 56 - stride * 0.2, 10, 5, 3, "#5b371c");

  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(x + 21, y + 23, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + 12, y + 29, 10, 2.4);
  ctx.fillRect(x + 12, y + 19, 8, 2);
  ctx.restore();
}

function drawProgressBar() {
  if (!state.level || !state.player) {
    return;
  }

  fillRoundedRect(18, 16, 238, 20, 10, "rgba(15,23,42,0.18)");
  fillRoundedRect(22, 20, 230, 12, 6, "rgba(255,255,255,0.3)");
  const progress = clamp(state.player.x / (state.level.width - 40), 0, 1);
  const fill = ctx.createLinearGradient(22, 0, 252, 0);
  fill.addColorStop(0, "#facc15");
  fill.addColorStop(1, "#f97316");
  const fillWidth = 230 * progress;
  if (fillWidth > 1) {
    fillRoundedRect(22, 20, fillWidth, 12, 6, fill);
  }
}

function drawBanner() {
  if (state.bannerTimer <= 0 || !state.bannerText) {
    return;
  }

  fillRoundedRect(236, 20, 488, 58, 16, "rgba(255,250,240,0.88)");
  strokeRoundedRect(236, 20, 488, 58, 16, "rgba(120,53,15,0.2)", 2);
  ctx.fillStyle = "#8b4513";
  ctx.textAlign = "center";
  ctx.font = 'bold 24px "Trebuchet MS"';
  ctx.fillText(state.bannerText, canvas.width / 2, 56);
}

function drawOverlay() {
  if (state.mode === "playing") {
    return;
  }

  ctx.fillStyle = "rgba(8, 15, 32, 0.52)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  fillRoundedRect(150, 98, 660, 344, 26, "rgba(255,252,245,0.95)");
  strokeRoundedRect(150, 98, 660, 344, 26, "rgba(120,53,15,0.18)", 2);
  fillRoundedRect(150, 98, 660, 12, 18, "rgba(251,191,36,0.75)");

  ctx.textAlign = "center";
  ctx.fillStyle = "#7c2d12";
  ctx.font = 'bold 38px "Trebuchet MS"';

  let title = "Pause";
  let lines = ["Appuie sur P pour reprendre."];

  if (state.mode === "title") {
    title = "Super Plumber Sprint DX";
    lines = [
      "Un platformer maison avec un rendu plus propre et plus lisible.",
      "Appuie sur Entree, Demarrer ou touche le jeu pour jouer.",
      "Sur tablette, utilise les boutons transparents poses sur le jeu.",
    ];
  } else if (state.mode === "paused") {
    lines = ["Appuie sur P pour reprendre.", "R pour rejouer le niveau."];
  } else if (state.mode === "level-clear") {
    title = "Niveau termine";
    lines = [
      `${state.level.name} complete.`,
      `Bonus de fin: +${state.lastBonus}`,
      "Chargement du prochain niveau...",
    ];
  } else if (state.mode === "game-over") {
    title = "Game Over";
    lines = ["Appuie sur Entree ou Demarrer pour recommencer.", `Score final: ${state.score}`];
  } else if (state.mode === "victory") {
    title = "Victoire";
    lines = [
      "Le chateau est atteint.",
      `Score final: ${state.score}`,
      "Appuie sur Entree ou Demarrer pour rejouer.",
    ];
  }

  ctx.fillText(title, canvas.width / 2, 176);
  ctx.fillStyle = "#334155";
  ctx.font = '22px "Trebuchet MS"';
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, 244 + index * 42);
  });
}

function render() {
  drawSky();
  drawHills();
  drawClouds();
  drawCastle();
  drawBushes();
  drawPlatforms();
  drawFlag();
  drawCoins();
  drawEnemies();
  drawPlayer();
  drawProgressBar();
  drawBanner();
  drawOverlay();
}

let lastFrame = 0;

function loop(timestamp) {
  if (!lastFrame) {
    lastFrame = timestamp;
  }
  const deltaMs = Math.min(36, timestamp - lastFrame || 16.67);
  lastFrame = timestamp;
  const step = deltaMs / 16.67;

  updateMusic();

  if (state.mode === "playing") {
    updatePlaying(step);
  } else {
    updateTransitions(step);
  }

  render();
  requestAnimationFrame(loop);
}

function handleStartIntent() {
  activateAudio();
  if (state.mode === "title" || state.mode === "game-over" || state.mode === "victory") {
    startNewGame();
    return;
  }
  if (state.mode === "paused") {
    togglePause();
  }
}

function setMoveState(code, pressed) {
  switch (code) {
    case "ArrowLeft":
    case "KeyA":
      input.left = pressed;
      break;
    case "ArrowRight":
    case "KeyD":
      input.right = pressed;
      break;
    case "ArrowUp":
    case "Space":
    case "KeyW":
      input.jump = pressed;
      if (pressed) {
        queueJump();
      }
      break;
    default:
      break;
  }
}

document.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) {
    event.preventDefault();
  }
  activateAudio();

  if (event.code === "Enter" && !event.repeat) {
    handleStartIntent();
    return;
  }

  if (event.code === "KeyP" && !event.repeat) {
    togglePause();
    return;
  }

  if (event.code === "KeyM" && !event.repeat) {
    toggleMute();
    return;
  }

  if (event.code === "KeyR" && !event.repeat) {
    if (state.mode === "title" || state.mode === "game-over" || state.mode === "victory") {
      startNewGame();
    } else {
      restartLevel();
    }
    return;
  }

  setMoveState(event.code, true);
});

document.addEventListener("keyup", (event) => {
  setMoveState(event.code, false);
});

window.addEventListener("blur", () => {
  input.left = false;
  input.right = false;
  input.jump = false;
});

window.addEventListener("resize", updateResponsiveMode);
window.addEventListener("orientationchange", updateResponsiveMode);
document.addEventListener("fullscreenchange", updateFullscreenButton);
document.addEventListener("webkitfullscreenchange", updateFullscreenButton);

function preventTouchScroll(element) {
  if (!element) {
    return;
  }
  ["touchstart", "touchmove"].forEach((eventName) => {
    element.addEventListener(
      eventName,
      (event) => {
        if (isTouchDevice()) {
          event.preventDefault();
        }
      },
      { passive: false }
    );
  });
}

preventTouchScroll(canvas);
preventTouchScroll(ui.frame);
preventTouchScroll(ui.mobileControls);

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  handleStartIntent();
});

hud.start.addEventListener("click", () => {
  startNewGame();
});

hud.restart.addEventListener("click", () => {
  restartLevel();
});

hud.sound.addEventListener("click", () => {
  toggleMute();
});

hud.fullscreen.addEventListener("click", () => {
  toggleFullscreen();
});

document.querySelectorAll("[data-action]").forEach((button) => {
  const action = button.getAttribute("data-action");

  if (action === "pause") {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.classList.add("is-pressed");
    });
    button.addEventListener("pointerup", () => button.classList.remove("is-pressed"));
    button.addEventListener("pointerleave", () => button.classList.remove("is-pressed"));
    button.addEventListener("pointercancel", () => button.classList.remove("is-pressed"));
    button.addEventListener("click", () => togglePause());
    return;
  }

  const applyState = (pressed) => {
    activateAudio();
    button.classList.toggle("is-pressed", pressed);
    if (pressed && state.mode !== "playing") {
      handleStartIntent();
    }
    if (action === "left") {
      input.left = pressed;
    }
    if (action === "right") {
      input.right = pressed;
    }
    if (action === "jump") {
      input.jump = pressed;
      if (pressed) {
        queueJump();
      }
    }
  };

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    applyState(true);
  });
  button.addEventListener("pointerup", () => applyState(false));
  button.addEventListener("pointerleave", () => applyState(false));
  button.addEventListener("pointercancel", () => applyState(false));
});

updateResponsiveMode();
updateHud();
requestAnimationFrame(loop);
