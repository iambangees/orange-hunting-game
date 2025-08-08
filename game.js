const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const orangeImage = new Image();
orangeImage.src = "orange.png";

const bombImage = new Image();
bombImage.src = "bomb.png";

const popSound = document.getElementById("popSound");
const scoreDisplay = document.getElementById("score");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const finalScoreDisplay = document.getElementById("finalScore");
const pauseBtn = document.getElementById("pauseBtn");

let oranges = [];
let bombs = [];
let score = 0;
let gameInterval;
let spawnInterval;
let gameRunning = false;
let gamePaused = false;

function randomX() {
  return Math.random() * (canvas.width - 80) + 40;
}

function spawnObjects() {
  oranges.push({ x: randomX(), y: -50, speed: 3 + Math.random() * 3 });
  if (Math.random() < 0.3) {
    bombs.push({ x: randomX(), y: -50, speed: 3 + Math.random() * 3 });
  }
}

function drawObjects() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  oranges.forEach(o => {
    ctx.drawImage(orangeImage, o.x, o.y, 60, 60);
    o.y += o.speed;
  });

  bombs.forEach(b => {
    ctx.drawImage(bombImage, b.x, b.y, 60, 60);
    b.y += b.speed;
  });
}

function updateGame() {
  if (gamePaused || !gameRunning) return;

  drawObjects();

  oranges = oranges.filter(o => o.y < canvas.height);
  bombs = bombs.filter(b => b.y < canvas.height);

  requestAnimationFrame(updateGame);
}

function handleTap(x, y) {
  if (!gameRunning || gamePaused) return;

  for (let i = 0; i < oranges.length; i++) {
    const o = oranges[i];
    if (x > o.x && x < o.x + 60 && y > o.y && y < o.y + 60) {
      oranges.splice(i, 1);
      score += 1;
      scoreDisplay.textContent = score;
      popSound.currentTime = 0;
      popSound.play();
      return;
    }
  }

  for (let i = 0; i < bombs.length; i++) {
    const b = bombs[i];
    if (x > b.x && x < b.x + 60 && y > b.y && y < b.y + 60) {
      bombs.splice(i, 1);
      endGame();
      return;
    }
  }
}

canvas.addEventListener("click", (e) => handleTap(e.clientX, e.clientY));
canvas.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  handleTap(touch.clientX, touch.clientY);
});

function startGame() {
  score = 0;
  oranges = [];
  bombs = [];
  gameRunning = true;
  gamePaused = false;
  scoreDisplay.textContent = "0";
  gameOverOverlay.style.display = "none";
  pauseBtn.style.display = "inline-block";
  document.getElementById("startScreen").style.display = "none";

  gameInterval = requestAnimationFrame(updateGame);
  spawnInterval = setInterval(spawnObjects, 1000);
}

function endGame() {
  gameRunning = false;
  clearInterval(spawnInterval);
  cancelAnimationFrame(gameInterval);
  pauseBtn.style.display = "none";
  gameOverOverlay.style.display = "flex";
  finalScoreDisplay.textContent = score;
}

function restartGame() {
  gameOverOverlay.style.display = "none";
  startGame();
}

function togglePause() {
  gamePaused = !gamePaused;
  pauseBtn.textContent = gamePaused ? "▶ Resume" : "⏸ Pause";

  if (!gamePaused) {
    requestAnimationFrame(updateGame);
  }
}

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", restartGame);
pauseBtn.addEventListener("click", togglePause);

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
