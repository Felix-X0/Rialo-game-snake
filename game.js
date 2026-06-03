const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const startBtn = document.getElementById("start-btn");
const leaderboardList = document.getElementById("leaderboard-list");
const rialoLogoImg = document.getElementById("rialoLogoSource");
const bgMusic = document.getElementById("bgMusic");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [];
let food = { x: 0, y: 0 };
let dx = gridSize;
let dy = 0;
let score = 0;
let currentHighScore = 0;
let gameInterval;
let isGameRunning = false;

// Memuat data papan peringkat pertama kali dijalankan
tampilkanLeaderboardGlobal();

// Event Listener Kontrol Utama
startBtn.addEventListener("click", startGame);
document.addEventListener("keydown", changeDirection);

document.getElementById("ctrl-up").addEventListener("click", () => triggerDirection("UP"));
document.getElementById("ctrl-down").addEventListener("click", () => triggerDirection("DOWN"));
document.getElementById("ctrl-left").addEventListener("click", () => triggerDirection("LEFT"));
document.getElementById("ctrl-right").addEventListener("click", () => triggerDirection("RIGHT"));

// Mencegah layar bergeser (Scroll) otomatis saat tombol HP ditekan
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

    // Memainkan musik latar dengan aman setelah interaksi klik pengguna
    if(bgMusic) {
        bgMusic.volume = 0.25; // Mengeset volume di tingkat yang pas (25%)
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.log("Menunggu interaksi browser lengkap."));
    }

    // Posisi awal ular
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
}

function drawSnake() {
    snake.forEach((part, idx) => {
        // Kepala berwarna abu terang, badan berwarna kuning khas Rialo
        ctx.fillStyle = idx === 0 ? "#f0efe9" : "#ffdd53";
        ctx.fillRect(part.x, part.y, gridSize - 1, gridSize - 1);
    });
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    // Jika ular memakan Logo Rialo
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

    // Menghindari makanan muncul persis di atas tubuh ular
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
}

function triggerDirection(dir) {
    if (!isGameRunning) return;
    if (dir === "LEFT" && dx === 0) { dx = -gridSize; dy = 0; }
    if (dir === "UP" && dy === 0) { dx = 0; dy = -gridSize; }
    if (dir === "RIGHT" && dx === 0) { dx = gridSize; dy = 0; }
    if (dir === "DOWN" && dy === 0) { dx = 0; dy = gridSize; }
}

function changeDirection(e) {
    const keyCodes = [37, 38, 39, 40];
    if (keyCodes.includes(e.keyCode)) {
        const directions = ["LEFT", "UP", "RIGHT", "DOWN"];
        triggerDirection(directions[e.keyCode - 37]);
    }
}

function checkGameOver() {
    // Menabrak dinding pembatas
    if (snake[0].x < 0 || snake[0].x >= canvas.width || snake[0].y < 0 || snake[0].y >= canvas.height) {
        return true;
    }
    // Menabrak tubuh sendiri
    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
    }
    return false;
}

function endGame() {
    clearInterval(gameInterval);
    isGameRunning = false;

    // Menghentikan musik saat Game Over agar dramatis
    if(bgMusic) {
        bgMusic.pause();
    }

    overlayTitle.innerText = "💥 GAME OVER";
    overlayText.innerText = `Skor Kamu: ${score} | Coba lagi untuk mengalahkan rekor!`;
    startBtn.innerText = "MAIN LAGI";
    overlay.style.display = "flex";

    // Menampilkan input nama global
    setTimeout(() => {
        let playerName = prompt("👾 GAME OVER! Masukkan namamu untuk Leaderboard Global:");
        if (!playerName || playerName.trim() === "") playerName = "Player";
        
        database.ref('leaderboard').push({
            name: playerName.slice(0, 10),
            score: parseInt(score),
            timestamp: Date.now()
        });
    }, 400);
}

function tampilkanLeaderboardGlobal() {
    database.ref('leaderboard').orderByChild('score').limitToLast(5).on('value', (snapshot) => {
        let scores = [];
        snapshot.forEach(child => {
            scores.push(child.val());
        });
        scores.reverse();

        if (scores[0]) {
            currentHighScore = scores[0].score;
            highScoreElement.innerText = `HIGH SCORE: ${currentHighScore}`;
        }

        if (scores.length === 0) {
            leaderboardList.innerHTML = "<li><span class=\"rank-name\">Belum ada rekor dunia.</span></li>";
        } else {
            leaderboardList.innerHTML = scores.map((p, i) => 
                `<li><span class="rank-name">${i + 1}. ${p.name}</span> <span class="rank-score">${p.score}</span></li>`
            ).join("");
        }
    });
}
