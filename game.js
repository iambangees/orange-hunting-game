// ===== DOM refs =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const pauseBtn = document.getElementById('pauseButton');
const playOverlay = document.getElementById('playOverlay');
const playBtn = document.getElementById('playButton');
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

// ===== Helpers =====
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnOrange() {
  const base = Math.min(canvas.width, canvas.height);
  const size = Math.max(48, Math.round(base * 0.09)); // ~9% of smaller side
  oranges.push({
    x: rand(0, canvas.width - size),
    y: -size,
    size,
    speed: rand(2.2, 3.8) + base * 0.001  // slight scale with screen
  });
}

function spawnBomb() {
  const base = Math.min(canvas.width, canvas.height);
  const size = Math.max(48, Math.round(base * 0.09));
  bombs.push({
    x: rand(0, canvas.width - size),
    y: -size,
    size,
    speed: rand(2.2, 3.8) + base * 0.001
  });
}

function startSpawning() {
  stopSpawning();
  spawnTimer = setInterval(() => {
    if (!running || paused) return;
    // spawn oranges regularly
    spawnOrange();
    // bombs sometimes
    if (Math.random() < 0.28) spawnBomb();
  }, 900);
}

function stopSpawning() {
  if (spawnTimer) {
    clearInterval(spawnTimer);
    spawnTimer = null;
  }
}

// Draw with rounded coordinates to avoid jitter
function drawImageNoJitter(img, obj) {
  if (!img.complete) return; // draw only after loaded
  ctx.drawImage(img, Math.round(obj.x), Math.round(obj.y), obj.size, obj.size);
}

function update() {
  if (!running || paused) return;

  // Clear just the pixels we draw on (canvas covers bg image via CSS)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Move + draw oranges
  for (let i = oranges.length - 1; i >= 0; i--) {
    const o = oranges[i];
    o.y += o.speed;
    drawImageNoJitter(orangeImg, o);
    if (o.y > canvas.height + o.size) oranges.splice(i, 1);
  }

  // Move + draw bombs
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i];
    b.y += b.speed;
    drawImageNoJitter(bombImg, b);
    if (b.y > canvas.height + b.size) bombs.splice(i, 1);
  }

  requestAnimationFrame(update);
}

function handleHit(x, y) {
  if (!running || paused) return;

  // Check oranges (from topmost down)
  for (let i = oranges.length - 1; i >= 0; i--) {
    const o = oranges[i];
    if (x >= o.x && x <= o.x + o.size && y >= o.y && y <= o.y + o.size) {
      score++;
      scoreEl.textContent = String(score);
      popSound.currentTime = 0;
      popSound.play().catch(()=>{});
      oranges.splice(i, 1);
      return; // one hit per tap
    }
  }

  // Check bombs
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i];
    if (x >= b.x && x <= b.x + b.size && y >= b.y && y <= b.y + b.size) {
      endGame();
      return;
    }
  }
}

// Mouse/touch
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  handleHit(e.clientX - rect.left, e.clientY - rect.top);
});

canvas.addEventListener('touchstart', (e) => {
  const t = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  handleHit(t.clientX - rect.left, t.clientY - rect.top);
}, { passive: true });

// Controls
playBtn.addEventListener('click', () => {
  // Reset state
  score = 0;
  scoreEl.textContent = '0';
  oranges = [];
  bombs = [];
  running = true;
  paused = false;

  // UI
  playOverlay.style.display = 'none';
  gameOverOverlay.style.display = 'none';
  pauseBtn.style.display = 'inline-block';
  pauseBtn.textContent = 'II';

  // Audio (start on user gesture to avoid autoplay block)
  try { bgMusic.currentTime = 0; bgMusic.play(); } catch {}

  // Go
  startSpawning();
  update();
});

pauseBtn.addEventListener('click', () => {
  if (!running) return;
  paused = !paused;
  pauseBtn.textContent = paused ? '▶' : 'II';
  if (paused) {
    try { bgMusic.pause(); } catch {}
  } else {
    try { bgMusic.play(); } catch {}
    requestAnimationFrame(update);
  }
});

restartBtn.addEventListener('click', () => {
  // Same as Play (fresh round)
  score = 0;
  scoreEl.textContent = '0';
  oranges = [];
  bombs = [];
  running = true;
  paused = false;

  gameOverOverlay.style.display = 'none';
  pauseBtn.style.display = 'inline-block';
  pauseBtn.textContent = 'II';

  try { bgMusic.currentTime = 0; bgMusic.play(); } catch {}

  startSpawning();
  update();
});

function endGame() {
  running = false;
  paused = false;
  stopSpawning();
  try { bgMusic.pause(); } catch {}

  finalScoreEl.textContent = String(score);
  gameOverOverlay.style.display = 'flex';
  pauseBtn.style.display = 'none';
}
