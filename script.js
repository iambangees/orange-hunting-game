const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const popSound = document.getElementById("popSound");

canvas.width = 400;
canvas.height = 600;

let score = 0;
let oranges = [];

// Orange image (optional image replacement later)
function createOrange() {
  const x = Math.random() * (canvas.width - 40);
  const speed = 2 + Math.random() * 3;
  oranges.push({ x: x, y: -40, radius: 20, speed: speed });
}

function updateOranges() {
  for (let i = 0; i < oranges.length; i++) {
    oranges[i].y += oranges[i].speed;
  }

  // Remove off-screen oranges
  oranges = oranges.filter(o => o.y < canvas.height + o.radius);
}

function drawOranges() {
  ctx.fillStyle = "orange";
  oranges.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x + o.radius, o.y + o.radius, o.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  });
}

canvas.addEventListener("click", function (e) {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  for (let i = 0; i < oranges.length; i++) {
    const o = oranges[i];
    const dx = clickX - (o.x + o.radius);
    const dy = clickY - (o.y + o.radius);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < o.radius) {
      // Clicked on an orange!
      oranges.splice(i, 1);
      score += 1;
      scoreDisplay.textContent = score;
      popSound.currentTime = 0;
      popSound.play();
      break;
    }
  }
});

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (Math.random() < 0.02) {
    createOrange();
  }
  updateOranges();
  drawOranges();
  requestAnimationFrame(gameLoop);
}

gameLoop();
