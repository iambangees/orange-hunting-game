// ===== DOM refs =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const pauseBtn = document.getElementById('pauseButton');
const playOverlay = document.getElementById('playOverlay');
const playBtn = document.getElementById('playButton');
const difficultyOverlay = document.getElementById('difficultyOverlay');
const diffBtns = document.querySelectorAll('.difficultyBtn');
const pauseOverlay = document.getElementById('pauseOverlay');
const resumeBtn = document.getElementById('resumeBtn');
const restartFromPauseBtn = document.getElementById('restartFromPauseBtn');
const muteBtn = document.getElementById('muteBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartButton');

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

// ===== Game state =====
let score = 0;
let oranges = [];
let bombs = [];
let running = false;
let paused = false;
let spawnTimer = null;
let muted = false;
let difficulty = "easy";

// ===== Difficulty settings =====
const difficultySettings = {
  easy: { speed: [2, 3], spawnRate: 1100 },
  medium: { speed: [3, 5], spawnRate: 850 },
  hard: { speed: [4, 6], spawnRate: 650 }
};

// ===== Helpers =====
function rand(min, max) { return Math.random() * (max - min) + min; }

function spawnOrange() {
  const base = Math.min(canvas.width, canvas.height);
  const size = Math.max(48, Math.round(base * 0.09));
  const { speed } = difficultySettings[difficulty];
  oranges.push({
    x: rand(0, canvas.width - size),
    y: -size,
    size,
    speed: rand(speed[0], speed[1])
  });
}

function spawnBomb() {
  const base = Math.min(canvas.width, canvas.height);
  const size = Math.max(48, Math.round(base * 0.09));
  const { speed } = difficultySettings[difficulty];
  bombs.push({
    x: rand(0, canvas.width - size),
    y: -size,
    size,
    speed: rand(speed[0], speed[1])
  });
}

function startSpawning() {
  stopSpawning();
  const { spawnRate } = difficultySettings[difficulty];
  spawnTimer = setInterval(() => {
    if (!running || paused) return;
    spawnOrange();
    if (Math.random() < 0.28) spawnBomb();
  }, spawnRate);
}

function stopSpawning() {
  if (spawnTimer) clearInterval(spawnTimer);
  spawnTimer = null;
}

// Draw helper
function drawImage(img, obj) {
  if (img.complete) {
    ctx.drawImage(img, Math.round(obj.x), Math.round(obj.y), obj.size, obj.size);
  }
}

function update() {
  if (!running || paused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // oranges
  for (let i = oranges.length - 1; i >= 0; i--) {
    const o = oranges[i];
    o.y += o.speed;
    drawImage(orangeImg, o);
    if (o.y > canvas.height + o.size) oranges.splice(i, 1);
  }

  // bombs
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i];
    b.y += b.speed;
    drawImage(bombImg, b);
    if (b.y > canvas.height + b.size) bombs.splice(i, 1);
  }

  requestAnimationFrame(update);
}

// ===== Hit detection =====
function handleHit(x, y) {
  if (!running || paused) return;

  // oranges
  for (let i = oranges.length - 1; i >= 0; i--) {
    const o = oranges[i];
    if (x >= o.x && x <= o.x + o.size && y >= o.y && y <= o.y + o.size) {
      score++;
      scoreEl.textContent = String(score);
      if (!muted) {
        popSound.currentTime = 0;
        popSound.play().catch(()=>{});
      }
      oranges.splice(i, 1);
      return;
    }
  }

  // bombs
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i];
    if (x >= b.x && x <= b.x + b.size && y >= b.y && y <= b.y + b.size) {
      endGame();
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

// Play → Difficulty
playBtn.addEventListener('click', () => {
  playOverlay.style.display = 'none';
  difficultyOverlay.style.display = 'flex';
});

// Select Difficulty
diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
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
  running = true;
  paused = false;

  gameOverOverlay.style.display = 'none';
  pauseBtn.style.display = 'inline-block';

  if (!muted) {
    try { bgMusic.currentTime = 0; bgMusic.play(); } catch {}
  }

  startSpawning();
  update();
}

// Pause button
pauseBtn.addEventListener('click', () => {
  if (!running) return;
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
  requestAnimationFrame(update);
});

// Restart from pause
restartFromPauseBtn.addEventListener('click', () => {
  pauseOverlay.style.display = 'none';
  startGame();
});

// Mute toggle
muteBtn.addEventListener('click', () => {
  muted = !muted;
  muteBtn.textContent = muted ? "Unmute" : "Mute";
  if (muted) {
    try { bgMusic.pause(); } catch {}
  } else {
    if (!paused) try { bgMusic.play(); } catch {}
  }
});

// Restart (from game over)
restartBtn.addEventListener('click', () => { startGame(); });

function endGame() {
  running = false;
  paused = false;
  stopSpawning();
  try { bgMusic.pause(); } catch {}
  finalScoreEl.textContent = String(score);
  gameOverOverlay.style.display = 'flex';
  pauseBtn.style.display = 'none';
}
