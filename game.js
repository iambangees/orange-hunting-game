const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const orangeImg = new Image();
orangeImg.src = "orange.png";

const bombImg = new Image();
bombImg.src = "bomb.png";

const popSound = document.getElementById("popSound");

const scoreDisplay = document.getElementById("score");
const finalScore = document.getElementById("finalScore");
const gameOverScreen = document.getElementById("gameOverScreen");
const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");

let oranges = [];
let bombs = [];
let score = 0;
let isGameOver = false;
let isPaused = false;
let combo = 0;
let spawnInterval;

function spawnObject() {
  const isBomb = Math.random() < 0.2;
  const obj = {
    x: Math.random() * (canvas.width - 50),
    y: -50,
    width: 50,
    height: 50,
    speed: 2 + Math.random() * 3,
    type: isBomb ? "bomb" : "orange"
  };
  if (isBomb) {
    bombs.push(obj);
  } else {
    oranges.push(obj);
  }
}

function drawObject(obj, img) {
  ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
}

function updateGame() {
  if (isGameOver || isPaused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  oranges.forEach((orange, index) => {
    orange.y += orange.speed;
    drawObject(orange, orangeImg);

    if (orange.y > canvas.height) {
      oranges.splice(index, 1);
      combo = 0; // missed orange resets combo
    }
  });

  bombs.forEach((bomb, index) => {
    bomb.y += bomb.speed;
    drawObject(bomb, bombImg);

    if (bomb.y > canvas.height) {
      bombs.splice(index, 1);
    }
  });

  requestAnimationFrame(updateGame);
}

canvas.addEventListener("click", (e) => {
  if (isGameOver || isPaused) return;

  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  let hit = false;

  oranges.forEach((orange, index) => {
    if (
      clickX >= orange.x && clickX <= orange.x + orange.width &&
      clickY >= orange.y && clickY <= orange.y + orange.height
    ) {
      oranges.splice(index, 1);
      popSound.currentTime = 0;
      popSound.play();
      combo++;
      let comboBonus = combo >= 3 ? 3 : combo;
      score += comboBonus;
      scoreDisplay.textContent = score;
      hit = true;
    }
  });

  bombs.forEach((bomb) => {
    if (
      clickX >= bomb.x && clickX <= bomb.x + bomb.width &&
      clickY >= bomb.y && clickY <= bomb.y + bomb.height
    ) {
      gameOver();
      hit = true;
    }
  });

  if (!hit) {
    combo = 0;
  }
});

function gameOver() {
  isGameOver = true;
  clearInterval(spawnInterval);
  gameOverScreen.style.display = "block";
  finalScore.textContent = score;
}

restartBtn.addEventListener("click", () => {
  score = 0;
  combo = 0;
  isGameOver = false;
  oranges = [];
  bombs = [];
  scoreDisplay.textContent = score;
  gameOverScreen.style.display = "none";
  spawnInterval = setInterval(spawnObject, 1000);
  updateGame();
});

pauseBtn.addEventListener("click", () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "▶️ Resume" : "⏸ Pause";
  if (!isPaused) {
    updateGame();
  }
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Start the game
spawnInterval = setInterval(spawnObject, 1000);
updateGame();
