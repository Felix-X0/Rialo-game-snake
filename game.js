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
const swipeGameArea = document.getElementById("swipeGameArea");

// Element Audio Baru
const bgMusic = document.getElementById("bgMusic");
const sfxEat = document.getElementById("sfxEat");
const sfxGameOver = document.getElementById("sfxGameOver");

// Element Status Level Baru
const levelDisplay = document.getElementById("level-display");
const speedDisplay = document.getElementById("speed-display");

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

// Atribut Mekanik Tingkat Kesulitan Dinamis
let currentLevel = 1;
let currentSpeedMs = 120; // Kecepatan awal (Makin kecil makin cepat)

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

tampilkanLeaderboardGlobal();

startBtn.addEventListener("click", startGame);
document.addEventListener("keydown", changeDirection);

// Deteksi Gesture Swipe Layar
swipeGameArea.addEventListener("touchstart", function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, {passive: true});

swipeGameArea.addEventListener("touchend", function(e) {
    if (!isGameRunning) return;
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipeGesture();
}, {passive: true});

function handleSwipeGesture() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 25; 

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) triggerDirection("RIGHT");
            else triggerDirection("LEFT");
        }
    } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0) triggerDirection("DOWN");
            else triggerDirection("UP");
        }
    }
}

document.body.addEventListener('touchmove', function(e) {
    if (isGameRunning) e.preventDefault();
}, { passive: false });

function startGame() {
    overlay.style.display = "none";
    isGameRunning = true;

    // Pengaturan suara musik latar (dikecilkan agar SFX makan terdengar jelas)
    if(bgMusic) {
        bgMusic.volume = 0.12;
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.log("Menunggu interaksi."));
    }

    snake = [
        { x: gridSize * 5, y: gridSize * 10 },
        { x: gridSize * 4, y: gridSize * 10 },
        { x: gridSize * 3, y: gridSize * 10 }
    ];
    
    dx = gridSize;
    dy = 0;
    score = 0;
    currentLevel = 1;
    currentSpeedMs = 120;

    scoreElement.innerText = `SCORE: ${score}`;
    highScoreElement.innerText = `HIGH SCORE: ${currentHighScore}`;
    levelDisplay.innerText = `🚀 LEVEL: ${currentLevel}`;
    speedDisplay.innerText = `⚡ SPEED: 1.0x`;

    generateFood();
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, currentSpeedMs);
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
        ctx.fillStyle = idx === 0 ? "#ffffff" : "#ffdd53";
        ctx.fillRect(part.x, part.y, gridSize - 1, gridSize - 1);
    });
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    if (snake[0].x === food.x && snake[0].y === food.y) {
        score += 10;
        scoreElement.innerText = `SCORE: ${score}`;
        
        // Memutar Efek Suara Makan Koin Instan
        if(sfxEat) {
            sfxEat.currentTime = 0;
            sfxEat.volume = 0.5;
            sfxEat.play().catch(o => {});
        }

        // HITUNG LEVEL DAN TINGKAT KECEPATAN (Naik setiap kelipatan 50 poin)
        let levelSekarang = Math.floor(score / 50) + 1;
        if (levelSekarang !== currentLevel && levelSekarang <= 5) {
            currentLevel = levelSekarang;
            currentSpeedMs = 120 - (currentLevel - 1) * 15; // Menjadi lebih cepat 15ms per level
            
            // Perbarui Interval Game secara Real-time dengan kecepatan baru
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, currentSpeedMs);
        }

        // Perbarui Tampilan Teks di Atas Game
        levelDisplay.innerText = `🚀 LEVEL: ${currentLevel}`;
        let speedMultiplier = (120 / currentSpeedMs).toFixed(1);
        speedDisplay.innerText = `⚡ SPEED: ${speedMultiplier}x`;

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
    if (snake[0].x < 0 || snake[0].x >= canvas.width || snake[0].y < 0 || snake[0].y >= canvas.height) return true;
    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
    }
    return false;
}

function endGame() {
    clearInterval(gameInterval);
    isGameRunning = false;

    if(bgMusic) bgMusic.pause();

    // Memutar Efek Suara Ledakan/Crash Game Over
    if(sfxGameOver) {
        sfxGameOver.currentTime = 0;
        sfxGameOver.volume = 0.4;
        sfxGameOver.play().catch(o => {});
    }

    overlayTitle.innerText = "💥 MISSION OVER";
    overlayText.innerText = `Mencapai Level ${currentLevel} dengan Skor: ${score}`;
    startBtn.innerText = "MAIN LAGI";
    overlay.style.display = "flex";

    setTimeout(() => {
        let playerName = prompt("👾 Masukkan namamu untuk Leaderboard Global:");
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
        snapshot.forEach(child => { scores.push(child.val()); });
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
