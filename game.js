const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let gameRunning = false;
let gamePaused = false;

const scoreDisplay = document.getElementById("score");
const pauseButton = document.getElementById("pauseButton");
const gameOverScreen = document.getElementById("gameOverScreen");
const tryAgainBtn = document.getElementById("tryAgainBtn");
const popSound = document.getElementById("popSound");

const orangeImg = new Image();
orangeImg.src = "orange.png";

const bombImg = new Image();
bombImg.src = "bomb.png";

// Sizes for responsive design
const fruitSize = Math.min(canvas.width, canvas.height) * 0.08;

let fruits = [];

function randomX() {
  return Math.random() * (canvas.width - fruitSize);
}

function spawnFruit() {
  const isBomb = Math.random() < 0.2;
  fruits.push({
    x: randomX(),
    y: -fruitSize,
    speed: Math.random() * 2 + 2,
    isBomb: isBomb
  });
}

function drawFruit(fruit) {
  const img = fruit.isBomb ? bombImg : orangeImg;
  ctx.drawImage(img, fruit.x, fruit.y, fruitSize, fruitSize);
}

function updateFruits() {
  fruits.forEach(fruit => {
    fruit.y += fruit.speed;
  });
  fruits = fruits.filter(fruit => fruit.y < canvas.height + fruitSize);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  fruits.forEach(drawFruit);

  if (gameRunning && !gamePaused) {
    updateFruits();
    if (Math.random() < 0.03) spawnFruit();
  }

  requestAnimationFrame(draw);
}

function getClickedFruit(x, y) {
  return fruits.find(fruit => {
    return (
      x >= fruit.x &&
      x <= fruit.x + fruitSize &&
      y >= fruit.y &&
      y <= fruit.y + fruitSize
    );
  });
}

function handleCanvasClick(e) {
  if (!gameRunning || gamePaused) return;

  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const clicked = getClickedFruit(clickX, clickY);

  if (clicked) {
    if (clicked.isBomb) {
      endGame();
    } else {
      score++;
      popSound.currentTime = 0;
      popSound.play();
      fruits.splice(fruits.indexOf(clicked), 1);
      scoreDisplay.textContent = `Score: ${score}`;
    }
  }
}

canvas.addEventListener("click", handleCanvasClick);
canvas.addEventListener("touchstart", function (e) {
  const touch = e.touches[0];
  handleCanvasClick({ clientX: touch.clientX, clientY: touch.clientY });
});

pauseButton.addEventListener("click", () => {
  gamePaused = !gamePaused;
  pauseButton.textContent = gamePaused ? "Resume" : "Pause";
});

tryAgainBtn.addEventListener("click", startGame);

function startGame() {
  score = 0;
  fruits = [];
  gameRunning = true;
  gamePaused = false;
  scoreDisplay.textContent = "Score: 0";
  gameOverScreen.style.display = "none";
  pauseButton.style.display = "block";
  pauseButton.textContent = "Pause";
}

function endGame() {
  gameRunning = false;
  gameOverScreen.style.display = "block";
  pauseButton.style.display = "none";
}

// Start animation loop
draw();
