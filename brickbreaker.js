// Neon Brick Breaker Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Neon color palette
const neonColors = [
  '#00fff7', '#ff00ea', '#39ff14', '#fffb00', '#ff007f', '#00bfff', '#ff5f1f'
];

// Game objects
const paddle = {
  width: 90,
  height: 16,
  x: canvas.width / 2 - 45,
  y: canvas.height - 40,
  dx: 0,
  speed: 8,
  color: '#00fff7',
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height - 60,
  radius: 10,
  speed: 5,
  dx: 4,
  dy: -5,
  color: '#ff00ea',
  trail: [],
  maxTrail: 10
};

const brick = {
  rowCount: 6,
  colCount: 7,
  width: 56,
  height: 24,
  padding: 12,
  offsetTop: 60,
  offsetLeft: 18
};

let bricks = [];
let score = 0;
let lives = 5;
let gameState = 'start'; // start, running, gameover, win

function initBricks() {
  bricks = [];
  for (let r = 0; r < brick.rowCount; r++) {
    bricks[r] = [];
    for (let c = 0; c < brick.colCount; c++) {
      const color = neonColors[(r + c) % neonColors.length];
      bricks[r][c] = { x: 0, y: 0, status: 1, color };
    }
  }
}

function drawNeonRect(x, y, w, h, color, glow=20) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function drawNeonCircle(x, y, r, color, glow=18) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawPaddle() {
  drawNeonRect(paddle.x, paddle.y, paddle.width, paddle.height, paddle.color, 24);
}

function drawBall() {
  // Draw ball trail
  for (let i = 0; i < ball.trail.length; i++) {
    const t = ball.trail[i];
    drawNeonCircle(t.x, t.y, ball.radius - i, '#ff00ea', 12 - i);
  }
  drawNeonCircle(ball.x, ball.y, ball.radius, ball.color, 24);
}

function drawBricks() {
  for (let r = 0; r < brick.rowCount; r++) {
    for (let c = 0; c < brick.colCount; c++) {
      if (bricks[r][c].status === 1) {
        const bx = c * (brick.width + brick.padding) + brick.offsetLeft;
        const by = r * (brick.height + brick.padding) + brick.offsetTop;
        bricks[r][c].x = bx;
        bricks[r][c].y = by;
        drawNeonRect(bx, by, brick.width, brick.height, bricks[r][c].color, 32);
      }
    }
  }
}

function drawScore() {
  ctx.save();
  ctx.font = 'bold 22px Orbitron, Arial';
  ctx.fillStyle = '#39ff14';
  ctx.shadowColor = '#39ff14';
  ctx.shadowBlur = 12;
  ctx.fillText('SCORE: ' + score, 20, 36);
  ctx.restore();
}

function drawLives() {
  ctx.save();
  ctx.font = 'bold 22px Orbitron, Arial';
  ctx.fillStyle = '#fffb00';
  ctx.shadowColor = '#fffb00';
  ctx.shadowBlur = 12;
  ctx.fillText('LIVES: ' + lives, canvas.width - 120, 36);
  ctx.restore();
}

function drawStartScreen() {
  ctx.save();
  ctx.font = 'bold 36px Orbitron, Arial';
  ctx.fillStyle = '#00fff7';
  ctx.shadowColor = '#00fff7';
  ctx.shadowBlur = 24;
  ctx.textAlign = 'center';
  ctx.fillText('NEON BRICK BREAKER', canvas.width/2, canvas.height/2 - 40);
  ctx.font = 'bold 22px Orbitron, Arial';
  ctx.fillStyle = '#ff00ea';
  ctx.shadowColor = '#ff00ea';
  ctx.shadowBlur = 16;
  ctx.fillText('Press SPACE to Start', canvas.width/2, canvas.height/2 + 10);
  ctx.restore();
}

function drawGameOver(win) {
  ctx.save();
  ctx.font = 'bold 36px Orbitron, Arial';
  ctx.fillStyle = win ? '#39ff14' : '#ff007f';
  ctx.shadowColor = win ? '#39ff14' : '#ff007f';
  ctx.shadowBlur = 24;
  ctx.textAlign = 'center';
  ctx.fillText(win ? 'YOU WIN!' : 'GAME OVER', canvas.width/2, canvas.height/2 - 40);
  ctx.font = 'bold 22px Orbitron, Arial';
  ctx.fillStyle = '#00fff7';
  ctx.shadowColor = '#00fff7';
  ctx.shadowBlur = 16;
  ctx.fillText('Press SPACE to Restart', canvas.width/2, canvas.height/2 + 10);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (gameState === 'start') {
    drawStartScreen();
    return;
  }
  drawBricks();
  drawPaddle();
  drawBall();
  drawScore();
  drawLives();
  if (gameState === 'gameover' || gameState === 'win') {
    drawGameOver(gameState === 'win');
  }
}

function movePaddle() {
  paddle.x += paddle.dx;
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
}

function moveBall() {
  // Add to trail
  ball.trail.unshift({x: ball.x, y: ball.y});
  if (ball.trail.length > ball.maxTrail) ball.trail.pop();

  ball.x += ball.dx;
  ball.y += ball.dy;

  // Wall collision
  if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
    ball.dx = -ball.dx;
    ball.x += ball.dx;
    spawnParticles(ball.x, ball.y, ball.color);
  }
  if (ball.y - ball.radius < 0) {
    ball.dy = -ball.dy;
    ball.y += ball.dy;
    spawnParticles(ball.x, ball.y, ball.color);
  }
  // Paddle collision
  if (
    ball.y + ball.radius > paddle.y &&
    ball.x > paddle.x &&
    ball.x < paddle.x + paddle.width
  ) {
    ball.dy = -Math.abs(ball.dy);
    // Add some spin
    let hit = (ball.x - (paddle.x + paddle.width/2)) / (paddle.width/2);
    ball.dx = hit * 6;
    spawnParticles(ball.x, ball.y, '#00fff7');
  }
  // Bottom collision
  if (ball.y - ball.radius > canvas.height) {
    if (lives > 0) lives--;
    if (lives > 0) {
      resetBall();
    } else {
      gameState = 'gameover';
    }
  }
  // Brick collision
  for (let r = 0; r < brick.rowCount; r++) {
    for (let c = 0; c < brick.colCount; c++) {
      let b = bricks[r][c];
      if (b.status === 1) {
        if (
          ball.x > b.x && ball.x < b.x + brick.width &&
          ball.y - ball.radius < b.y + brick.height &&
          ball.y + ball.radius > b.y
        ) {
          ball.dy = -ball.dy;
          b.status = 0;
          score += 10;
          spawnParticles(ball.x, ball.y, b.color);
          if (checkWin()) {
            gameState = 'win';
          }
        }
      }
    }
  }
}

// Particle system for effects
let particles = [];
function spawnParticles(x, y, color) {
  for (let i = 0; i < 14; i++) {
    particles.push({
      x, y,
      dx: (Math.random() - 0.5) * 6,
      dy: (Math.random() - 0.5) * 6,
      life: 20 + Math.random() * 10,
      color
    });
  }
}
function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    drawNeonCircle(p.x, p.y, 4, p.color, 10);
    p.x += p.dx;
    p.y += p.dy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function checkWin() {
  for (let r = 0; r < brick.rowCount; r++) {
    for (let c = 0; c < brick.colCount; c++) {
      if (bricks[r][c].status === 1) return false;
    }
  }
  return true;
}

function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height - 60;
  ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
  ball.dy = -5;
  ball.trail = [];
}

function resetGame() {
  score = 0;
  lives = 5;
  gameState = 'start';
  initBricks();
  resetBall();
}

function gameLoop() {
  if (gameState === 'running') {
    movePaddle();
    moveBall();
  }
  draw();
  drawParticles();
  requestAnimationFrame(gameLoop);
}

// Controls
let leftPressed = false, rightPressed = false;
document.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.key === 'a') leftPressed = true;
  if (e.code === 'ArrowRight' || e.key === 'd') rightPressed = true;
  if (e.code === 'Space') {
    if (gameState === 'start') {
      gameState = 'running';
      resetBall();
    }
    else if (gameState === 'gameover' || gameState === 'win') {
      resetGame();
      gameState = 'running';
      resetBall();
    }
  }
});
document.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.key === 'a') leftPressed = false;
  if (e.code === 'ArrowRight' || e.key === 'd') rightPressed = false;
});

function updatePaddleDirection() {
  paddle.dx = 0;
  if (leftPressed) paddle.dx = -paddle.speed;
  if (rightPressed) paddle.dx = paddle.speed;
}
setInterval(updatePaddleDirection, 16);

// Touch controls
canvas.addEventListener('touchstart', handleTouch, false);
canvas.addEventListener('touchmove', handleTouch, false);
function handleTouch(e) {
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  paddle.x = x - paddle.width / 2;
  e.preventDefault();
}

// Start
initBricks();
resetBall();
gameLoop();
