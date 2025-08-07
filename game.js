const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let oranges = [];
let bombs = [];
let score = 0;
let gameRunning = false;
let paused = false;

const orangeImg = new Image();
orangeImg.src = "orange.png";

const bombImg = new Image();
bombImg.src = "bomb.png";

const popSound = document.getElementById("popSound");
const scoreDisplay = document.getElementById("score");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");

// Responsive canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Game objects scale
function getObjectSize() {
    return Math.min(canvas.width, canvas.height) * 0.08; // 8% of screen size
}

// Spawn oranges
function spawnOrange() {
    const size = getObjectSize();
    oranges.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        size: size,
        speed: Math.random() * 2 + 3
    });
}

// Spawn bombs
function spawnBomb() {
    const size = getObjectSize();
    bombs.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        size: size,
        speed: Math.random() * 2 + 3
    });
}

// Game loop
function gameLoop() {
    if (!gameRunning || paused) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw oranges
    oranges.forEach((orange, index) => {
        orange.y += orange.speed;
        ctx.drawImage(orangeImg, orange.x, orange.y, orange.size, orange.size);
        if (orange.y > canvas.height) oranges.splice(index, 1);
    });

    // Draw bombs
    bombs.forEach((bomb, index) => {
        bomb.y += bomb.speed;
        ctx.drawImage(bombImg, bomb.x, bomb.y, bomb.size, bomb.size);
        if (bomb.y > canvas.height) bombs.splice(index, 1);
    });

    requestAnimationFrame(gameLoop);
}

// Handle clicks/touches
canvas.addEventListener("click", handleClick);
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleClick({ clientX: touch.clientX, clientY: touch.clientY });
}, { passive: false });

function handleClick(e) {
    const x = e.clientX;
    const y = e.clientY;

    // Oranges
    oranges.forEach((orange, index) => {
        if (x >= orange.x && x <= orange.x + orange.size &&
            y >= orange.y && y <= orange.y + orange.size) {
            oranges.splice(index, 1);
            score++;
            popSound.currentTime = 0;
            popSound.play();
            scoreDisplay.textContent = `Score: ${score}`;
        }
    });

    // Bombs
    bombs.forEach((bomb, index) => {
        if (x >= bomb.x && x <= bomb.x + bomb.size &&
            y >= bomb.y && y <= bomb.y + bomb.size) {
            gameOver();
        }
    });
}

// Start game
startBtn.addEventListener("click", () => {
    score = 0;
    oranges = [];
    bombs = [];
    scoreDisplay.textContent = `Score: ${score}`;
    gameRunning = true;
    paused = false;
    pauseBtn.style.display = "inline-block";
    startBtn.style.display = "none";

    setInterval(spawnOrange, 1000);
    setInterval(spawnBomb, 3000);
    gameLoop();
});

// Pause game
pauseBtn.addEventListener("click", () => {
    paused = !paused;
    if (!paused) gameLoop();
});

// Game over
function gameOver() {
    gameRunning = false;
    pauseBtn.style.display = "none";
    startBtn.style.display = "inline-block";
    alert(`Game Over! Final Score: ${score}`);
}
