// 游戏配置
const CONFIG = {
    gridSize: 20,
    canvasSize: 600,
    difficulty: {
        easy: { speed: 150, name: '简单' },
        medium: { speed: 100, name: '中等' },
        hard: { speed: 60, name: '困难' }
    }
};

// 游戏状态
let gameState = {
    snake: [],
    food: null,
    specialFood: null,
    direction: 'right',
    nextDirection: 'right',
    score: 0,
    highScore: parseInt(localStorage.getItem('snakeHighScore')) || 0,
    gameLoop: null,
    countdownInterval: null,
    isRunning: false,
    isPaused: false,
    isCountingDown: false,
    currentDifficulty: 'medium'
};

// 获取DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const difficultyDisplay = document.getElementById('difficultyDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');

// 计算单元格大小
const cellSize = CONFIG.canvasSize / CONFIG.gridSize;

// 初始化游戏
function initGame() {
    gameState.snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    gameState.direction = 'right';
    gameState.nextDirection = 'right';
    gameState.score = 0;
    gameState.isPaused = false;

    spawnFood();
    spawnSpecialFood();
    updateUI();
    draw();
}

// 生成食物
function spawnFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * CONFIG.gridSize),
            y: Math.floor(Math.random() * CONFIG.gridSize)
        };
    } while (isOnSnake(newFood) ||
             (gameState.specialFood && newFood.x === gameState.specialFood.x && newFood.y === gameState.specialFood.y));

    gameState.food = newFood;
}

// 生成特殊食物
function spawnSpecialFood() {
    if (Math.random() < 0.3) { // 30% 概率生成特殊食物
        let newSpecialFood;
        do {
            newSpecialFood = {
                x: Math.floor(Math.random() * CONFIG.gridSize),
                y: Math.floor(Math.random() * CONFIG.gridSize)
            };
        } while (isOnSnake(newSpecialFood) ||
                 (gameState.food && newSpecialFood.x === gameState.food.x && newSpecialFood.y === gameState.food.y));

        gameState.specialFood = newSpecialFood;

        // 5秒后移除特殊食物
        setTimeout(() => {
            if (gameState.specialFood === newSpecialFood) {
                gameState.specialFood = null;
                if (gameState.isRunning) draw();
            }
        }, 5000);
    }
}

// 检查位置是否在蛇身上
function isOnSnake(pos) {
    return gameState.snake.some(segment => segment.x === pos.x && segment.y === pos.y);
}

// 移动蛇
function moveSnake() {
    gameState.direction = gameState.nextDirection;

    const head = { ...gameState.snake[0] };

    switch (gameState.direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    // 检查碰撞
    if (head.x < 0 || head.x >= CONFIG.gridSize ||
        head.y < 0 || head.y >= CONFIG.gridSize ||
        isOnSnake(head)) {
        gameOver();
        return;
    }

    gameState.snake.unshift(head);

    // 检查是否吃到食物
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        gameState.score += 10;
        spawnFood();
        spawnSpecialFood();
        updateUI();
    }
    // 检查是否吃到特殊食物
    else if (gameState.specialFood &&
             head.x === gameState.specialFood.x && head.y === gameState.specialFood.y) {
        gameState.score += 50;
        gameState.specialFood = null;
        spawnSpecialFood();
        updateUI();
    }
    else {
        gameState.snake.pop();
    }
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, CONFIG.canvasSize, CONFIG.canvasSize);

    // 绘制网格
    ctx.strokeStyle = '#3d4a5c';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= CONFIG.gridSize; i++) {
        const pos = i * cellSize;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, CONFIG.canvasSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(CONFIG.canvasSize, pos);
        ctx.stroke();
    }

    // 绘制蛇
    gameState.snake.forEach((segment, index) => {
        const gradient = ctx.createRadialGradient(
            segment.x * cellSize + cellSize / 2,
            segment.y * cellSize + cellSize / 2,
            0,
            segment.x * cellSize + cellSize / 2,
            segment.y * cellSize + cellSize / 2,
            cellSize / 2
        );

        if (index === 0) {
            // 蛇头
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(1, '#c0392b');
        } else {
            // 蛇身
            gradient.addColorStop(0, '#4ecdc4');
            gradient.addColorStop(1, '#44a08d');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(
            segment.x * cellSize + 1,
            segment.y * cellSize + 1,
            cellSize - 2,
            cellSize - 2,
            5
        );
        ctx.fill();

        // 绘制蛇头眼睛
        if (index === 0) {
            ctx.fillStyle = 'white';
            const eyeSize = 3;
            const eyeOffset = 5;

            let eye1X, eye1Y, eye2X, eye2Y;

            switch (gameState.direction) {
                case 'up':
                    eye1X = segment.x * cellSize + cellSize / 3;
                    eye1Y = segment.y * cellSize + eyeOffset;
                    eye2X = segment.x * cellSize + cellSize * 2 / 3;
                    eye2Y = segment.y * cellSize + eyeOffset;
                    break;
                case 'down':
                    eye1X = segment.x * cellSize + cellSize / 3;
                    eye1Y = segment.y * cellSize + cellSize - eyeOffset;
                    eye2X = segment.x * cellSize + cellSize * 2 / 3;
                    eye2Y = segment.y * cellSize + cellSize - eyeOffset;
                    break;
                case 'left':
                    eye1X = segment.x * cellSize + eyeOffset;
                    eye1Y = segment.y * cellSize + cellSize / 3;
                    eye2X = segment.x * cellSize + eyeOffset;
                    eye2Y = segment.y * cellSize + cellSize * 2 / 3;
                    break;
                case 'right':
                    eye1X = segment.x * cellSize + cellSize - eyeOffset;
                    eye1Y = segment.y * cellSize + cellSize / 3;
                    eye2X = segment.x * cellSize + cellSize - eyeOffset;
                    eye2Y = segment.y * cellSize + cellSize * 2 / 3;
                    break;
            }

            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // 绘制食物（苹果）
    if (gameState.food) {
        const x = gameState.food.x * cellSize + cellSize / 2;
        const y = gameState.food.y * cellSize + cellSize / 2;

        ctx.font = `${cellSize - 5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍎', x, y);
    }

    // 绘制特殊食物（星星）
    if (gameState.specialFood) {
        const x = gameState.specialFood.x * cellSize + cellSize / 2;
        const y = gameState.specialFood.y * cellSize + cellSize / 2;

        ctx.font = `${cellSize - 5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', x, y);
    }
}

// 游戏循环
function gameLoop() {
    moveSnake();
    draw();
}

// 开始游戏
function startGame() {
    if (gameState.isRunning && !gameState.isPaused) return;

    if (!gameState.isRunning) {
        initGame();
        startCountdown();
    } else if (gameState.isPaused) {
        gameState.isPaused = false;
        gameState.gameLoop = setInterval(gameLoop, CONFIG.difficulty[gameState.currentDifficulty].speed);
        pauseBtn.textContent = '⏸️ 暂停';
        overlay.style.display = 'none';
    }
}

// 开始倒计时
function startCountdown() {
    gameState.isCountingDown = true;
    let countdown = 5;

    overlayTitle.innerHTML = '🎮 准备开始！';
    overlayTitle.style.fontSize = '2.5em';
    overlayMessage.innerHTML = `<span style="font-size: 4em; color: #f39c12; font-weight: bold;">${countdown}</span>`;
    overlay.style.display = 'flex';

    gameState.countdownInterval = setInterval(() => {
        countdown--;

        if (countdown > 0) {
            overlayMessage.innerHTML = `<span style="font-size: 4em; color: #f39c12; font-weight: bold;">${countdown}</span>`;
        } else {
            clearInterval(gameState.countdownInterval);
            overlayMessage.innerHTML = '<span style="font-size: 4em; color: #27ae60; font-weight: bold;">GO!</span>';

            setTimeout(() => {
                overlay.style.display = 'none';
                gameState.isRunning = true;
                gameState.isCountingDown = false;
                gameState.gameLoop = setInterval(gameLoop, CONFIG.difficulty[gameState.currentDifficulty].speed);
                startBtn.textContent = '🔄 重新开始';
                pauseBtn.disabled = false;
            }, 500);
        }
    }, 1000);
}

// 暂停游戏
function pauseGame() {
    if (!gameState.isRunning || gameState.isPaused || gameState.isCountingDown) return;

    gameState.isPaused = true;
    clearInterval(gameState.gameLoop);
    pauseBtn.textContent = '▶️ 继续';

    overlayTitle.textContent = '游戏暂停';
    overlayMessage.textContent = '点击"继续"按钮继续游戏';
    overlay.style.display = 'flex';
}

// 游戏结束
function gameOver() {
    clearInterval(gameState.gameLoop);
    if (gameState.countdownInterval) {
        clearInterval(gameState.countdownInterval);
    }
    gameState.isRunning = false;
    gameState.isCountingDown = false;

    // 更新最高分
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('snakeHighScore', gameState.highScore);
        overlayTitle.textContent = '🎉 新纪录！';
        overlayMessage.textContent = `太棒了！你的分数是 ${gameState.score} 分！`;
    } else {
        overlayTitle.textContent = '游戏结束';
        overlayMessage.textContent = `你的分数是 ${gameState.score} 分！再试一次吧！`;
    }

    updateUI();
    startBtn.textContent = '▶️ 开始游戏';
    pauseBtn.textContent = '⏸️ 暂停';
    pauseBtn.disabled = true;
    overlay.style.display = 'flex';
}

// 更新UI
function updateUI() {
    scoreElement.textContent = gameState.score;
    highScoreElement.textContent = gameState.highScore;
    difficultyDisplay.textContent = CONFIG.difficulty[gameState.currentDifficulty].name;
}

// 设置难度
function setDifficulty(difficulty) {
    gameState.currentDifficulty = difficulty;

    // 更新按钮样式
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.difficulty === difficulty) {
            btn.classList.add('active');
        }
    });

    // 如果游戏正在运行，更新游戏速度
    if (gameState.isRunning && !gameState.isPaused) {
        clearInterval(gameState.gameLoop);
        gameState.gameLoop = setInterval(gameLoop, CONFIG.difficulty[difficulty].speed);
    }

    updateUI();
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    const key = e.key;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        e.preventDefault();

        if (gameState.isCountingDown) return;

        if (!gameState.isRunning || gameState.isPaused) {
            startGame();
            return;
        }

        switch (key) {
            case 'ArrowUp':
                if (gameState.direction !== 'down') {
                    gameState.nextDirection = 'up';
                }
                break;
            case 'ArrowDown':
                if (gameState.direction !== 'up') {
                    gameState.nextDirection = 'down';
                }
                break;
            case 'ArrowLeft':
                if (gameState.direction !== 'right') {
                    gameState.nextDirection = 'left';
                }
                break;
            case 'ArrowRight':
                if (gameState.direction !== 'left') {
                    gameState.nextDirection = 'right';
                }
                break;
        }
    }

    // 空格键暂停/继续
    if (key === ' ') {
        e.preventDefault();
        if (gameState.isRunning && !gameState.isCountingDown) {
            if (gameState.isPaused) {
                startGame();
            } else {
                pauseGame();
            }
        }
    }
});

// 移动端控制
document.getElementById('upBtn').addEventListener('click', () => {
    if (gameState.direction !== 'down') gameState.nextDirection = 'up';
    if (!gameState.isRunning || gameState.isPaused) {
        if (!gameState.isCountingDown) startGame();
    }
});

document.getElementById('downBtn').addEventListener('click', () => {
    if (gameState.direction !== 'up') gameState.nextDirection = 'down';
    if (!gameState.isRunning || gameState.isPaused) {
        if (!gameState.isCountingDown) startGame();
    }
});

document.getElementById('leftBtn').addEventListener('click', () => {
    if (gameState.direction !== 'right') gameState.nextDirection = 'left';
    if (!gameState.isRunning || gameState.isPaused) {
        if (!gameState.isCountingDown) startGame();
    }
});

document.getElementById('rightBtn').addEventListener('click', () => {
    if (gameState.direction !== 'left') gameState.nextDirection = 'right';
    if (!gameState.isRunning || gameState.isPaused) {
        if (!gameState.isCountingDown) startGame();
    }
});

// 按钮事件监听
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', () => {
    if (gameState.isPaused) {
        startGame();
    } else {
        pauseGame();
    }
});

// 难度按钮事件监听
document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setDifficulty(btn.dataset.difficulty);
    });
});

// 初始化
updateUI();
initGame();
