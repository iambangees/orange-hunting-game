// ===== DOM refs =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const timerEl = document.getElementById('timer');
const pauseBtn = document.getElementById('pauseButton');
const playOverlay = document.getElementById('playOverlay');
const playBtn = document.getElementById('playButton');
const bestLine = document.getElementById('bestLine');
const bestScoreEl = document.getElementById('bestScore');
const difficultyOverlay = document.getElementById('difficultyOverlay');
const diffBtns = document.querySelectorAll('.difficultyBtn');
const pauseOverlay = document.getElementById('pauseOverlay');
const resumeBtn = document.getElementById('resumeBtn');
const restartFromPauseBtn = document.getElementById('restartFromPauseBtn');
const muteBtn = document.getElementById('muteBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const gameOverReasonEl = document.getElementById('gameOverReason');
const finalScoreEl = document.getElementById('finalScore');
const finalBestEl = document.getElementById('finalBest');
const newBestEl = document.getElementById('newBest');
const restartBtn = document.getElementById('restartButton');
const countdownEl = document.getElementById('countdown');
const reviveBtn = document.getElementById('reviveButton');
const adOverlay = document.getElementById('adOverlay');
const adContent = document.getElementById('adContent');
const adProgressBar = document.getElementById('adProgressBar');
const adCountdown = document.getElementById('adCountdown');
const adClaimBtn = document.getElementById('adClaimBtn');

const popSound = document.getElementById('popSound');
const bgMusic = document.getElementById('bgMusic');

// ===== Canvas sizing =====
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ===== Assets =====
const orangeImg = new Image();
orangeImg.src = 'orange.png';
const bombImg = new Image();
bombImg.src = 'bomb.png';

// ===== Tiny synth sounds (golden ding / bomb boom), honouring the mute toggle =====
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
}
function ding() {
  if (muted || !audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    [880, 1318].forEach((f, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.18, t + i * 0.07 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.25);
      o.connect(g).connect(audioCtx.destination);
      o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.3);
    });
  } catch {}
}
function boom() {
  if (muted || !audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    const dur = 0.5;
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = audioCtx.createBufferSource(); src.buffer = buffer;
    const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(60, t + dur);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(audioCtx.destination);
    src.start(t);
  } catch {}
}

// ===== Game state =====
const GAME_SECONDS = 60;
let score = 0;
let best = Number(localStorage.getItem('ohg-best') || 0);
let oranges = [];
let bombs = [];
let particles = [];
let floaters = [];
let phase = 'menu'; // menu | countdown | playing | exploding | over
let paused = false;
let muted = false;
let difficulty = 'easy';
let timeLeft = GAME_SECONDS;
let elapsed = 0;
let spawnAcc = 0;
let combo = 0;
let comboWindow = 0;
let countT = 0;
let countShown = '';
let shakeT = 0;
let flashA = 0;
let reviveUsed = false;
let shieldT = 0;
let lastTs = null;
let loopRunning = false;

// ===== Difficulty settings =====
const difficultySettings = {
  easy: { speed: [2, 3], spawnRate: 1100 },
  medium: { speed: [3, 5], spawnRate: 850 },
  hard: { speed: [4, 6], spawnRate: 650 }
};

// ===== Helpers =====
function rand(min, max) { return Math.random() * (max - min) + min; }

function entitySize() {
  const base = Math.min(canvas.width, canvas.height);
  return Math.max(48, Math.round(base * 0.09));
}

function speedScale() { return Math.min(1.8, 1 + elapsed * 0.01); }
function spawnInterval() {
  const { spawnRate } = difficultySettings[difficulty];
  return Math.max(340, spawnRate * Math.pow(0.94, elapsed / 8)) / 1000;
}

function spawnOrange(golden) {
  const size = entitySize();
  const { speed } = difficultySettings[difficulty];
  oranges.push({
    x: rand(0, canvas.width - size),
    y: -size,
    size,
    speed: rand(speed[0], speed[1]) * speedScale() * (golden ? 0.85 : 1),
    golden: !!golden,
    age: 0
  });
}

function spawnBomb() {
  const size = entitySize();
  const { speed } = difficultySettings[difficulty];
  bombs.push({
    x: rand(0, canvas.width - size),
    y: -size,
    size,
    speed: rand(speed[0], speed[1]) * speedScale(),
    age: 0
  });
}

// ===== Effects =====
function burst(x, y, colors, n, power) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), v = rand(40, power || 260);
    particles.push({
      x, y,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60,
      life: 0, maxLife: rand(0.35, 0.7),
      size: rand(3, 8),
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

function floater(x, y, text, color) {
  floaters.push({ x, y, text, color: color || '#ffffff', life: 0 });
}

function bumpScore() {
  scoreEl.classList.remove('bump');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('bump');
}

// ===== Drawing =====
function drawEntity(img, o) {
  if (!img.complete) return;
  const t = Math.min(1, o.age / 0.18);
  const scale = 0.4 + 0.6 * (1 - Math.pow(1 - t, 3)); // pop-in
  const s = o.size * scale;
  const dx = o.x + (o.size - s) / 2, dy = o.y + (o.size - s) / 2;
  if (o.golden) {
    const cx = o.x + o.size / 2, cy = o.y + o.size / 2;
    const pulse = 1 + Math.sin(elapsed * 6) * 0.06;
    const r = o.size * 0.72 * pulse;
    const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
    grad.addColorStop(0, 'rgba(255, 215, 64, 0.55)');
    grad.addColorStop(1, 'rgba(255, 215, 64, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.drawImage(img, Math.round(dx), Math.round(dy), s, s);
}

function drawEffects(dt) {
  // particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life += dt;
    if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt;
    ctx.globalAlpha = 1 - p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // floaters
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.life += dt;
    if (f.life >= 0.9) { floaters.splice(i, 1); continue; }
    f.y -= 46 * dt;
    ctx.globalAlpha = 1 - f.life / 0.9;
    ctx.fillStyle = f.color;
    ctx.font = '15px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

// ===== Main loop (delta-timed, pause-safe) =====
function update(ts) {
  if (!loopRunning) return;
  requestAnimationFrame(update);
  if (lastTs === null) lastTs = ts;
  let dt = Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;
  if (paused) dt = 0;

  ctx.save();
  if (shakeT > 0) {
    shakeT -= dt;
    ctx.translate(rand(-9, 9), rand(-9, 9));
  }
  ctx.clearRect(-12, -12, canvas.width + 24, canvas.height + 24);

  if (dt > 0 && phase !== 'menu' && phase !== 'over') {
    // ----- countdown phase -----
    if (phase === 'countdown') {
      countT += dt;
      const step = Math.floor(countT / 0.6);
      const label = step < 3 ? String(3 - step) : 'GO!';
      if (label !== countShown) {
        countShown = label;
        countdownEl.textContent = label;
        countdownEl.classList.remove('pop');
        void countdownEl.offsetWidth;
        countdownEl.classList.add('pop');
      }
      if (countT >= 2.4) {
        phase = 'playing';
        countdownEl.style.display = 'none';
      }
    }

    // ----- playing phase -----
    if (phase === 'playing') {
      elapsed += dt;
      timeLeft -= dt;
      if (shieldT > 0) shieldT -= dt;

      // combo window
      if (comboWindow > 0) {
        comboWindow -= dt;
        if (comboWindow <= 0) { combo = 0; comboEl.style.display = 'none'; }
      }

      // spawning
      spawnAcc += dt;
      const interval = spawnInterval();
      while (spawnAcc >= interval) {
        spawnAcc -= interval;
        spawnOrange(Math.random() < 0.05);
        if (Math.random() < 0.28) spawnBomb();
      }

      // timer HUD
      const shown = Math.max(0, Math.ceil(timeLeft));
      if (timerEl.textContent !== String(shown)) timerEl.textContent = String(shown);
      timerEl.classList.toggle('low', timeLeft <= 10);

      if (timeLeft <= 0) { endGame('time'); }
    }

    // ----- move entities (speeds are px per 60fps frame, as in the original) -----
    for (let i = oranges.length - 1; i >= 0; i--) {
      const o = oranges[i];
      o.age += dt;
      o.y += o.speed * dt * 60;
      if (o.y > canvas.height + o.size) {
        oranges.splice(i, 1);
        if (phase === 'playing' && combo > 0) { combo = 0; comboEl.style.display = 'none'; }
      }
    }
    for (let i = bombs.length - 1; i >= 0; i--) {
      const b = bombs[i];
      b.age += dt;
      b.y += b.speed * dt * 60;
      if (b.y > canvas.height + b.size) bombs.splice(i, 1);
    }
  }

  // ----- draw world -----
  for (const o of oranges) drawEntity(orangeImg, o);
  for (const b of bombs) drawEntity(bombImg, b);
  drawEffects(dt);

  // shield glow after a revive
  if (shieldT > 0 && phase === 'playing') {
    ctx.strokeStyle = `rgba(128, 216, 255, ${0.45 + 0.3 * Math.sin(elapsed * 10)})`;
    ctx.lineWidth = 7;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  }

  // red flash on explosion
  if (flashA > 0) {
    flashA = Math.max(0, flashA - dt * 1.6);
    ctx.fillStyle = `rgba(255, 40, 40, ${flashA * 0.45})`;
    ctx.fillRect(-12, -12, canvas.width + 24, canvas.height + 24);
  }
  ctx.restore();
}

// ===== Hit detection =====
function handleHit(x, y) {
  if (phase !== 'playing' || paused) return;

  // oranges first (topmost wins)
  for (let i = oranges.length - 1; i >= 0; i--) {
    const o = oranges[i];
    if (x >= o.x && x <= o.x + o.size && y >= o.y && y <= o.y + o.size) {
      const cx = o.x + o.size / 2, cy = o.y + o.size / 2;
      oranges.splice(i, 1);
      if (o.golden) {
        score += 5;
        timeLeft = Math.min(99, timeLeft + 3);
        burst(cx, cy, ['#ffd740', '#fff59d', '#ffffff'], 22, 320);
        floater(cx, cy - 10, '+5 ⏱+3', '#ffd740');
        ding();
      } else {
        combo++;
        comboWindow = 2.5;
        let gained = 1;
        if (combo % 5 === 0) {
          gained += 5;
          floater(cx, cy - 26, `COMBO ×${combo} +5`, '#69f0ae');
        }
        score += gained;
        burst(cx, cy, ['#ffa726', '#ff9800', '#ffcc80', '#fff3e0'], 14, 260);
        floater(cx, cy - 8, '+1', '#ffffff');
        if (combo >= 2) {
          comboEl.textContent = `COMBO ×${combo}`;
          comboEl.style.display = 'block';
        }
        if (!muted) {
          popSound.currentTime = 0;
          popSound.play().catch(() => {});
        }
      }
      scoreEl.textContent = String(score);
      bumpScore();
      return;
    }
  }

  // bombs
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i];
    if (x >= b.x && x <= b.x + b.size && y >= b.y && y <= b.y + b.size) {
      const cx = b.x + b.size / 2, cy = b.y + b.size / 2;
      bombs.splice(i, 1);
      if (shieldT > 0) {
        burst(cx, cy, ['#80d8ff', '#b3e5fc', '#ffffff'], 18, 300);
        floater(cx, cy - 10, '🛡 BLOCKED', '#80d8ff');
        ding();
        return;
      }
      burst(cx, cy, ['#ff5252', '#ff9800', '#616161', '#212121'], 34, 380);
      shakeT = 0.45;
      flashA = 1;
      boom();
      phase = 'exploding';
      setTimeout(() => { if (phase === 'exploding') endGame('bomb'); }, 500);
      return;
    }
  }
}

// clicks / touches
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  handleHit(e.clientX - rect.left, e.clientY - rect.top);
});
canvas.addEventListener('touchstart', e => {
  const t = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  handleHit(t.clientX - rect.left, t.clientY - rect.top);
}, { passive: true });

// ===== Controls =====
function showBest() {
  if (best > 0) {
    bestScoreEl.textContent = String(best);
    bestLine.style.display = 'block';
  }
}
showBest();

// Play → Difficulty
playBtn.addEventListener('click', () => {
  ensureAudio();
  playOverlay.style.display = 'none';
  difficultyOverlay.style.display = 'flex';
});

// Select Difficulty
diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    ensureAudio();
    difficulty = btn.dataset.diff;
    difficultyOverlay.style.display = 'none';
    startGame();
  });
});

function startGame() {
  score = 0;
  scoreEl.textContent = '0';
  oranges = [];
  bombs = [];
  particles = [];
  floaters = [];
  combo = 0;
  comboWindow = 0;
  comboEl.style.display = 'none';
  timeLeft = GAME_SECONDS;
  elapsed = 0;
  spawnAcc = 0;
  paused = false;
  shakeT = 0;
  flashA = 0;
  reviveUsed = false;
  shieldT = 0;
  timerEl.textContent = String(GAME_SECONDS);
  timerEl.classList.remove('low');
  timerEl.style.display = 'block';

  gameOverOverlay.style.display = 'none';
  pauseBtn.style.display = 'inline-block';

  // countdown 3 · 2 · 1 · GO
  phase = 'countdown';
  countT = 0;
  countShown = '';
  countdownEl.textContent = '3';
  countdownEl.style.display = 'flex';

  if (!muted) {
    try { bgMusic.currentTime = 0; bgMusic.play(); } catch {}
  }

  if (!loopRunning) {
    loopRunning = true;
    lastTs = null;
    requestAnimationFrame(update);
  }
}

// Pause button
pauseBtn.addEventListener('click', () => {
  if (phase !== 'playing' && phase !== 'countdown') return;
  paused = true;
  pauseBtn.style.display = 'none';
  pauseOverlay.style.display = 'flex';
  try { bgMusic.pause(); } catch {}
});

// Resume
resumeBtn.addEventListener('click', () => {
  paused = false;
  pauseOverlay.style.display = 'none';
  pauseBtn.style.display = 'inline-block';
  if (!muted) try { bgMusic.play(); } catch {}
});

// Restart from pause
restartFromPauseBtn.addEventListener('click', () => {
  pauseOverlay.style.display = 'none';
  startGame();
});

// Mute toggle
muteBtn.addEventListener('click', () => {
  muted = !muted;
  muteBtn.textContent = muted ? 'Unmute' : 'Mute';
  if (muted) {
    try { bgMusic.pause(); } catch {}
  } else {
    if (!paused) try { bgMusic.play(); } catch {}
  }
});

// Restart (from game over)
restartBtn.addEventListener('click', () => { startGame(); });

function endGame(reason) {
  phase = 'over';
  paused = false;
  try { bgMusic.pause(); } catch {}
  const isNewBest = score > best;
  if (isNewBest) {
    best = score;
    localStorage.setItem('ohg-best', String(best));
  }
  gameOverReasonEl.textContent = reason === 'bomb' ? '💣 Boom! The bomb got you.' : "⏰ Time's up!";
  finalScoreEl.textContent = String(score);
  finalBestEl.textContent = String(best);
  newBestEl.style.display = isNewBest && score > 0 ? 'block' : 'none';
  reviveBtn.style.display = reviveUsed ? 'none' : 'block';
  gameOverOverlay.style.display = 'flex';
  pauseBtn.style.display = 'none';
  timerEl.style.display = 'none';
  comboEl.style.display = 'none';
  countdownEl.style.display = 'none';
  showBest();
}

// ===== Rewarded ads + revive =====
// In the Android app this uses AdMob with Orange Hunt's real ad unit (below).
// On the web, or if an ad can't load, a short house ad for Bangees' own
// projects plays instead, so the revive always works.
const REWARDED_UNIT = 'ca-app-pub-2663209733107420/3995748928';

const HOUSE_PROMOS = [
  { emoji: '🧭', title: 'DISCARO', text: 'Discover what\'s worth knowing — scholarships, freebies and opportunities from around the world.', link: 'https://discaro.vercel.app', linkText: 'discaro.vercel.app' },
  { emoji: '🔤', title: 'NAME ATLAS', text: 'What does your name mean — and how does the world say it? 1,001 names and counting.', link: 'https://iambangees.github.io/name-atlas/', linkText: 'Open Name Atlas' },
  { emoji: '🌦️', title: 'AERIS', text: 'Weather, beautifully simplified. Live conditions and forecasts for any city on Earth.', link: 'https://iambangees.github.io/aeris/', linkText: 'Open Aeris' },
  { emoji: '🔍', title: 'CLAIM CHECKER', text: 'Before you claim that airdrop, check what it really costs. Paste the pitch, spot the traps.', link: 'https://iambangees.github.io/claim-checker/', linkText: 'Open Claim Checker' }
];

function showHouseAd() {
  return new Promise((resolve) => {
    const promo = HOUSE_PROMOS[Math.floor(Math.random() * HOUSE_PROMOS.length)];
    adContent.innerHTML =
      `<div class="ad-emoji">${promo.emoji}</div><h3>${promo.title}</h3>` +
      `<p>${promo.text}</p><p><a href="${promo.link}" target="_blank" rel="noopener">${promo.linkText}</a></p>`;
    adClaimBtn.style.display = 'none';
    adOverlay.style.display = 'flex';
    const total = 5;
    let left = total;
    adCountdown.textContent = `Your revive in ${left}…`;
    adProgressBar.style.width = '0%';
    const iv = setInterval(() => {
      left -= 0.1;
      adProgressBar.style.width = `${Math.min(100, (1 - left / total) * 100)}%`;
      adCountdown.textContent = left > 0 ? `Your revive in ${Math.ceil(left)}…` : 'Your revive is ready!';
      if (left <= 0) {
        clearInterval(iv);
        adClaimBtn.style.display = 'inline-block';
      }
    }, 100);
    adClaimBtn.onclick = () => {
      adOverlay.style.display = 'none';
      resolve(true);
    };
  });
}

function showNativeRewarded() {
  const AdMob = window.Capacitor.Plugins.AdMob;
  return new Promise((resolve) => {
    let settled = false;
    const handles = [];
    const cleanup = () => handles.forEach(h => { try { h.remove(); } catch {} });
    const finish = (val) => { if (settled) return; settled = true; cleanup(); resolve(val); };
    const fallback = () => { if (settled) return; settled = true; cleanup(); showHouseAd().then(resolve); };
    const timer = setTimeout(fallback, 20000);
    const wrap = (fn) => () => { clearTimeout(timer); fn(); };
    Promise.all([
      AdMob.addListener('onRewardedVideoAdReward', wrap(() => finish(true))),
      AdMob.addListener('onRewardedVideoAdDismissed', wrap(() => finish(false))),
      AdMob.addListener('onRewardedVideoAdFailedToShow', wrap(fallback)),
      AdMob.addListener('onRewardedVideoAdFailedToLoad', wrap(fallback))
    ]).then(hs => handles.push(...hs)).catch(() => {});
    (async () => {
      try {
        await AdMob.initialize({});
        await AdMob.prepareRewardVideoAd({ adId: REWARDED_UNIT });
        await AdMob.showRewardVideoAd();
      } catch { fallback(); }
    })();
  });
}

function showRewardedAd() {
  if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.AdMob) {
    return showNativeRewarded();
  }
  return showHouseAd();
}

function doRevive() {
  reviveUsed = true;
  oranges = [];
  bombs = [];
  timeLeft = Math.max(timeLeft, 0) + 15;
  shieldT = 2.5;
  phase = 'playing';
  gameOverOverlay.style.display = 'none';
  pauseBtn.style.display = 'inline-block';
  timerEl.style.display = 'block';
  timerEl.textContent = String(Math.ceil(timeLeft));
  floater(canvas.width / 2, canvas.height / 2 - 40, '🛡 +15s', '#80d8ff');
  if (!muted) { try { bgMusic.play(); } catch {} }
}

reviveBtn.addEventListener('click', async () => {
  reviveBtn.disabled = true;
  const earned = await showRewardedAd();
  reviveBtn.disabled = false;
  if (earned) doRevive();
});
