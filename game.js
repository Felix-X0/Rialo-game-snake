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
const snakeHeadImg = document.getElementById("snakeHeadImg");
const snakeBodyImg = document.getElementById("snakeBodyImg");
const bgMusic = document.getElementById("bgMusic");
const swipeGameArea = document.getElementById("swipeGameArea");

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

// Koordinat untuk melacak geseran jari (Swipe)
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

fetchGlobalLeaderboard();

startBtn.addEventListener("click", startGame);
document.addEventListener("keydown", changeDirection);

// FITUR KONTROL PREMIUM: Deteksi Swipe Layar Pintar
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
    
    const minSwipeDistance = 30; 

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                triggerDirection("RIGHT");
            } else {
                triggerDirection("LEFT");
            }
        }
    } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0) {
                triggerDirection("DOWN");
            } else {
                triggerDirection("UP");
            }
        }
    }
}

document.body.addEventListener('touchmove', function(e) {
    if (isGameRunning) {
        e.preventDefault();
    }
}, { passive: false });


function startGame() {
    overlay.style.display = "none";
    isGameRunning = true;

    if(bgMusic) {
        bgMusic.volume = 0.20;
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.log("Waiting for interaction."));
    }

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
        if (idx === 0) {
            // Menggambar Kepala menggunakan IMG_3910.png
            if (snakeHeadImg.complete && snakeHeadImg.naturalHeight !== 0) {
                ctx.drawImage(snakeHeadImg, part.x, part.y, gridSize, gridSize);
            } else {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(part.x, part.y, gridSize - 1, gridSize - 1);
            }
        } else {
            // Menggambar Badan menggunakan pola IMG_3921.jpg (Gambar No 2)
            if (snakeBodyImg.complete && snakeBodyImg.naturalHeight !== 0) {
                ctx.drawImage(snakeBodyImg, part.x, part.y, gridSize, gridSize);
            } else {
                ctx.fillStyle = "#9cb525"; // Fallback hijau retro jika gambar gagal dimuat
                ctx.fillRect(part.x, part.y, gridSize - 1, gridSize - 1);
            }
        }
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
    if (rialoLogoImg.complete && rialoLogoImg.naturalHeight !== 0) {
        ctx.drawImage(rialoLogoImg, food.x, food.y, gridSize, gridSize);
    } else {
        ctx.fillStyle = "red";
        ctx.fillRect(food.x, food.y, gridSize, gridSize);
    }
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
    if (snake[0].x < 0 || snake[0].x >= canvas.width || snake[0].y < 0 || snake[0].y >= canvas.height) {
        return true;
    }
    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
    }
    return false;
}

function endGame() {
    clearInterval(gameInterval);
    isGameRunning = false;

    if(bgMusic) {
        bgMusic.pause();
    }

    overlayTitle.innerText = "💥 MISSION OVER";
    overlayText.innerText = `Your Score: ${score} | Beat the next global record!`;
    startBtn.innerText = "TRY AGAIN";
    overlay.style.display = "flex";

    setTimeout(() => {
        let playerName = prompt("👾 Enter your name for the Global Leaderboard:");
        if (!playerName || playerName.trim() === "") playerName = "Player";
        
        database.ref('leaderboard').push({
            name: playerName.slice(0, 10),
            score: parseInt(score),
            timestamp: Date.now()
        });
    }, 400);
}

function fetchGlobalLeaderboard() {
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
            leaderboardList.innerHTML = "<li><span class=\"rank-name\">No global records yet.</span></li>";
        } else {
            leaderboardList.innerHTML = scores.map((p, i) => 
                `<li><span class="rank-name">${i + 1}. ${p.name}</span> <span class="rank-score">${p.score}</span></li>`
            ).join("");
        }
    });
}
