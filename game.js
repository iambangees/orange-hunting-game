const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const popSound = document.getElementById("popSound");
const restartBtn = document.getElementById("restartBtn");

let score = 0;
let lives = 3;
let gameOver = false;

const orangeImage = new Image();
orangeImage.src = "orange.png";

let orange = {
  x: 100,
  y: -100,
  size: 60,
  speedY: 2 + Math.random() * 2
};

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function spawnOrange() {
  orange.x = Math.random() * (canvas.width - orange.size);
  orange.y = -orange.size;
  orange.size = 50 + Math.random() * 20;
  orange.speedY = 2 + Math.random() * 2;
}

function draw() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(orangeImage, orange.x, orange.y, orange.size, orange.size);
  orange.y += orange.speedY;

  if (orange.y > canvas.height) {
    lives--;
    updateHUD();
    if (lives <= 0) {
      endGame();
      return;
    }
    spawnOrange();
  }

  requestAnimationFrame(draw);
}
spawnOrange();
draw();

function handleClick(e) {
  if (gameOver) return;

  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  const x = clientX - rect.left;
  const y = clientY - rect.top;

  const dx = x - (orange.x + orange.size / 2);
  const dy = y - (orange.y + orange.size / 2);
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < orange.size / 2) {
    score++;
    popSound.currentTime = 0;
    popSound.play();
    updateHUD();
    spawnOrange();
  }
}

function updateHUD() {
  scoreDisplay.textContent = `Score: ${score}`;
  livesDisplay.textContent = '❤️'.repeat(lives);
}

function endGame() {
  gameOver = true;
  scoreDisplay.textContent = `Game Over! Final Score: ${score}`;
  livesDisplay.textContent = '💀';
  restartBtn.style.display = 'block';
}

restartBtn.addEventListener("click", () => {
  // Reset game
  score = 0;
  lives = 3;
  gameOver = false;
  restartBtn.style.display = 'none';
  updateHUD();
  spawnOrange();
  draw();
});

canvas.addEventListener("click", handleClick);
canvas.addEventListener("touchstart", handleClick);
