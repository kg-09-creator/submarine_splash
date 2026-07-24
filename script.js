const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const uiOverlay = document.getElementById('ui-overlay');
const titleText = document.getElementById('title-text');
const scoreText = document.getElementById('score-text');
const startBtn = document.getElementById('start-btn');

let gameState = 'START'; 
let score = 0;
let highScore = 0;
let frameCount = 0;

const sub = {
    x: 80,
    y: 250,
    width: 40,
    height: 24,
    gravity: 0.35,
    lift: -6.5,
    velocity: 0
};

let obstacles = [];
const obstacleWidth = 50;
const obstacleGap = 160; 
const spawnRate = 120;   

let mines = [];

function triggerBoost() {
    if (gameState === 'PLAYING') {
        sub.velocity = sub.lift;
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        triggerBoost();
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    triggerBoost();
});

startBtn.addEventListener('click', startGame);

function startGame() {
    gameState = 'PLAYING';
    score = 0;
    frameCount = 0;
    sub.y = 250;
    sub.velocity = 0;
    obstacles = [];
    mines = [];
    uiOverlay.classList.add('hidden');
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameState = 'GAMEOVER';
    if (score > highScore) highScore = score;
    
    titleText.innerText = 'GAME OVER';
    scoreText.innerHTML = `Score: ${score}<br>Best: ${highScore}`;
    startBtn.innerText = 'TRY AGAIN';
    uiOverlay.classList.remove('hidden');
}

function gameLoop() {
    if (gameState !== 'PLAYING') return;

    update();
    draw();

    frameCount++;
    requestAnimationFrame(gameLoop);
}

function update() {
    sub.velocity += sub.gravity;
    sub.y += sub.velocity;

    if (sub.y <= 0 || sub.y + sub.height >= canvas.height) {
        gameOver();
        return;
    }

    if (frameCount % spawnRate === 0) {
        const minTopHeight = 60;
        const maxTopHeight = canvas.height - obstacleGap - minTopHeight;
        const topHeight = Math.floor(Math.random() * (maxTopHeight - minTopHeight + 1)) + minTopHeight;

        obstacles.push({
            x: canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + obstacleGap,
            passed: false
        });

        if (Math.random() < 0.4) {
            mines.push({
                x: canvas.width + obstacleWidth / 2,
                y: topHeight + (obstacleGap / 2) + (Math.random() * 40 - 20),
                radius: 12
            });
        }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= 3;

        if (!obs.passed && obs.x + obstacleWidth < sub.x) {
            obs.passed = true;
            score++;
        }

        if (
            sub.x + sub.width > obs.x &&
            sub.x < obs.x + obstacleWidth &&
            (sub.y < obs.topHeight || sub.y + sub.height > obs.bottomY)
        ) {
            gameOver();
            return;
        }

        if (obs.x + obstacleWidth < 0) {
            obstacles.splice(i, 1);
        }
    }

    for (let i = mines.length - 1; i >= 0; i--) {
        const mine = mines[i];
        mine.x -= 3;

        const closestX = Math.max(sub.x, Math.min(mine.x, sub.x + sub.width));
        const closestY = Math.max(sub.y, Math.min(mine.y, sub.y + sub.height));
        const distanceX = mine.x - closestX;
        const distanceY = mine.y - closestY;

        if ((distanceX * distanceX + distanceY * distanceY) < (mine.radius * mine.radius)) {
            gameOver();
            return;
        }

        if (mine.x + mine.radius < 0) {
            mines.splice(i, 1);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    obstacles.forEach(obs => {
        ctx.fillStyle = '#1b4332';
        ctx.strokeStyle = '#2d6a4f';
        ctx.lineWidth = 3;

        drawJaggedCoral(obs.x, 0, obstacleWidth, obs.topHeight, true);
        drawJaggedCoral(obs.x, obs.bottomY, obstacleWidth, canvas.height - obs.bottomY, false);
    });

    mines.forEach(mine => {
        ctx.fillStyle = '#d90429';
        ctx.beginPath();
        ctx.arc(mine.x, mine.y, mine.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#2b2d42';
        ctx.lineWidth = 2;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            const sx = mine.x + Math.cos(a) * (mine.radius + 4);
            const sy = mine.y + Math.sin(a) * (mine.radius + 4);
            ctx.beginPath();
            ctx.moveTo(mine.x, mine.y);
            ctx.lineTo(sx, sy);
            ctx.stroke();
        }
    });

    drawSubmarine(sub.x, sub.y, sub.width, sub.height);

    ctx.fillStyle = '#00f0ff';
    ctx.font = '24px "Courier New", monospace';
    ctx.fillText(`SCORE: ${score}`, 15, 35);
}

function drawJaggedCoral(x, y, w, h, isTop) {
    ctx.beginPath();
    if (isTop) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w / 2, y + h - 15);
        ctx.lineTo(x, y + h);
    } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x + w / 2, y + 15);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawSubmarine(x, y, w, h) {
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(x + w / 2 - 2, y - 6, 4, 8);
    ctx.fillRect(x + w / 2 - 2, y - 6, 8, 3);

    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(x + w - 12, y + h / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fb8500';
    ctx.fillRect(x - 4, y + 4, 4, h - 8);
}