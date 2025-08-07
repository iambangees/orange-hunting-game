// Get elements
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const retryButton = document.getElementById("retryButton");
const gameOverScreen = document.getElementById("gameOverScreen");
const scoreDisplay = document.getElementById("scoreDisplay");
const popSound = document.getElementById("popSound");

// Load images
const orangeImg = new Image();
orangeImg.src = "orange.png";

const bombImg = new Image();
bombImg.src = "bomb.png";

// Game variables
let oranges = [];
let bombs = [];
let score = 0;
let isPlaying = false;
let isPaused = false;
let orangeSize, bombSize;

// Adjust canvas size dynamically
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    orangeSize = canvas.width * 0.15; // 15% of width
    bombSize = canvas.width * 0.15;   // same size as oranges
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Orange object
function createOrange() {
    oranges.push({
        x: Math.random() * (canvas.width - orangeSize),
        y: -orangeSize,
        speed: canvas.height * 0.005
    });
}

// Bomb object
function createBomb() {
    bombs.push({
        x: Math.random() * (canvas.width - bombSize),
        y: -bombSize,
        speed: canvas.height * 0.004
    });
}

// Game loop
function update() {
    if (!isPlaying || isPaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw oranges
    oranges.forEach((o, i) => {
        o.y += o.speed;
        ctx.drawImage(orangeImg, o.x, o.y, orangeSize, orangeSize);

        if (o.y > canvas.height) oranges.splice(i, 1);
    });

    // Draw bombs
    bombs.forEach((b, i) => {
        b.y += b.speed;
        ctx.drawImage(bombImg, b.x, b.y, bombSize, bombSize);

        if (b.y > canvas.height) bombs.splice(i, 1);
    });

    requestAnimationFrame(update);
}

// Click/touch detection
function checkHit(x, y) {
    // Oranges
    oranges.forEach((o, i) => {
        if (x > o.x && x < o.x + orangeSize && y > o.y && y < o.y + orangeSize) {
            oranges.splice(i, 1);
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            popSound.currentTime = 0;
            popSound.play();
        }
    });

    // Bombs
    bombs.forEach((b, i) => {
        if (x > b.x && x < b.x + bombSize && y > b.y && y < b.y + bombSize) {
            endGame();
        }
    });
}

// Mouse/touch events
canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    checkHit(e.clientX - rect.left, e.clientY - rect.top);
});

canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    checkHit(touch.clientX - rect.left, touch.clientY - rect.top);
}, { passive: false });

// Start game
function startGame() {
    score = 0;
    scoreDisplay.textContent = "Score: 0";
    oranges = [];
    bombs = [];
    isPlaying = true;
    isPaused = false;
    gameOverScreen.style.display = "none";
    pauseButton.style.display = "block";
    startButton.style.display = "none";

    // Spawn oranges & bombs
    setInterval(() => {
        if (isPlaying && !isPaused) createOrange();
    }, 1000);

    setInterval(() => {
        if (isPlaying && !isPaused) createBomb();
    }, 3000);

    update();
}

// Pause game
function togglePause() {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? "Resume" : "Pause";
    if (!isPaused) update();
}

// End game
function endGame() {
    isPlaying = false;
    pauseButton.style.display = "none";
    gameOverScreen.style.display = "flex";
}

// Event listeners
startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
retryButton.addEventListener("click", startGame);
