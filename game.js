const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Elemen UI
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const startBtn = document.getElementById("start-btn");
const leaderboardList = document.getElementById("leaderboard-list");
const rialoLogoImg = document.getElementById("rialoLogoSource");

// Konfigurasi Grid
const gridSize = 20;
const tileCount = canvas.width / gridSize;

// Status Game
let snake = [];
let food = { x: 0, y: 0 };
let dx = gridSize;
let dy = 0;
let score = 0;
let currentHighScore = 0;
let gameInterval;
let isGameRunning = false;

// Memuat Leaderboard Global dari Server Firebase secara Otomatis
tampilkanLeaderboardGlobal();

// Event Listener
startBtn.addEventListener("click", startGame);
document.addEventListener("keydown", changeDirection);

document.getElementById("ctrl-up").addEventListener("click", () => triggerDirection("UP"));
document.getElementById("ctrl-down").addEventListener("click", () => triggerDirection("DOWN"));
document.getElementById("ctrl-left").addEventListener("click", () => triggerDirection("LEFT"));
document.getElementById("ctrl-right").addEventListener("click", () => triggerDirection("RIGHT"));

const noScrollButtons = document.querySelectorAll('.ctrl-btn');
noScrollButtons.forEach(btn => {
    btn.addEventListener('touchstart', (e) => e.preventDefault(), {passive: false});
    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        btn.click();
    }, {passive: false});
});

function startGame() {
    overlay.style.display = "none";
    isGameRunning = true;
    
    snake = [
        { x: gridSize * 5, y: gridSize * 10 },
        { x: gridSize * 4, y: gridSize * 10 },
        { x: gridSize * 3, y: gridSize * 10 }
    ];
    dx = gridSize;
    dy = 0;
    score = 0;
    scoreElement.innerText = `SCORE: ${score}`;
    highScoreElement.innerText = `HIGH SCORE: ${currentHighScore}`;
    
    generateFood();
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 115);
}

function gameLoop() {
    if (checkGameOver()) {
        endGame();
        return;
    }
    clearCanvas();
    drawFood();
    moveSnake();
    drawSnake();
}

function clearCanvas() {
    ctx.fillStyle = "#121212";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
    for (let i = 0; i < canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
}

function drawSnake() {
    snake.forEach((part, index) => {
        if (index === 0) {
            ctx.fillStyle = "#f0efe9"; 
        } else {
            ctx.fillStyle = "#ffdd53"; 
        }
        ctx.fillRect(part.x, part.y, gridSize - 1, gridSize - 1);
        ctx.strokeStyle = "#121212";
        ctx.strokeRect(part.x, part.y, gridSize - 1, gridSize - 1);
    });
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    if (snake[0].x === food.x && snake[0].y === food.y) {
        score += 10;
        scoreElement.innerText = `SCORE: ${score}`;
        generateFood();
    } else {
        snake.pop();
    }
}

function generateFood() {
    food.x = Math.floor(Math.random() * tileCount) * gridSize;
    food.y = Math.floor(Math.random() * tileCount) * gridSize;
    snake.forEach(part => {
        if (part.x === food.x && part.y === food.y) generateFood();
    });
}

function drawFood() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(food.x + gridSize / 2, food.y + gridSize / 2, gridSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(rialoLogoImg, food.x, food.y, gridSize, gridSize);
    ctx.restore();
    
    ctx.strokeStyle = "#ffdd53";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(food.x + gridSize / 2, food.y + gridSize / 2, gridSize / 2, 0, Math.PI * 2);
    ctx.stroke();
}

function triggerDirection(dir) {
    if (!isGameRunning) return;
    const goingUp = dy === -gridSize;
    const goingDown = dy === gridSize;
    const goingRight = dx === gridSize;
    const goingLeft = dx === -gridSize;

    if (dir === "LEFT" && !goingRight) { dx = -gridSize; dy = 0; }
    if (dir === "UP" && !goingDown) { dx = 0; dy = -gridSize; }
    if (dir === "RIGHT" && !goingLeft) { dx = gridSize; dy = 0; }
    if (dir === "DOWN" && !goingUp) { dx = 0; dy = -gridSize; dy = gridSize; }
}

function changeDirection(event) {
    const keyPressed = event.keyCode;
    if (keyPressed === 37) triggerDirection("LEFT");
    if (keyPressed === 38) triggerDirection("UP");
    if (keyPressed === 39) triggerDirection("RIGHT");
    if (keyPressed === 40) triggerDirection("DOWN");
}

function checkGameOver() {
    if (snake[0].x < 0 || snake[0].x >= canvas.width || snake[0].y < 0 || snake[0].y >= canvas.height) return true;
    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
    }
    return false;
}

function endGame() {
    clearInterval(gameInterval);
    isGameRunning = false;

    overlayTitle.innerText = "GAME OVER";
    overlayText.innerText = `Skor Kamu: ${score}`;
    startBtn.innerText = "MAIN LAGI";
    overlay.style.display = "flex";

    // Kirim langsung ke server Firebase global
    setTimeout(() => {
        let playerName = prompt("👾 GAME OVER! Masukkan namamu untuk Leaderboard Global:");
        if (!playerName || playerName.trim() === "") playerName = "Player";
        
        // Simpan data ke server Firebase
        database.ref('leaderboard').push({
            name: playerName.slice(0, 10),
            score: parseInt(score),
            timestamp: Date.now()
        });
    }, 400);
}

// LOGIKA REALTIME DATABASE FIREBASE
function tampilkanLeaderboardGlobal() {
    database.ref('leaderboard').orderByChild('score').limitToLast(5).on('value', (snapshot) => {
        let globalScores = [];
        snapshot.forEach((childSnapshot) => {
            globalScores.push(childSnapshot.val());
        });
        
        // Balik urutan agar yang tertinggi berada di atas
        globalScores.reverse();
        
        // Update skor tertinggi global saat ini untuk UI game
        if (globalScores[0]) {
            currentHighScore = globalScores[0].score;
            highScoreElement.innerText = `HIGH SCORE: ${currentHighScore}`;
        }

        // Cetak daftar ke tabel HTML
        leaderboardList.innerHTML = "";
        if (globalScores.length === 0) {
            leaderboardList.innerHTML = "<li><span class='rank-name'>Belum ada rekord. Jadilah yang pertama!</span></li>";
        } else {
            globalScores.forEach((player, index) => {
                const li = document.createElement("li");
                li.innerHTML = `<span class="rank-name">${index + 1}. ${player.name}</span> <span class="rank-score">${player.score}</span>`;
                leaderboardList.appendChild(li);
            });
        }
    });
}
