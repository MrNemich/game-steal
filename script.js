// Инициализация холста и контекста
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const speedValue = document.getElementById('speedValue');
const actionValue = document.getElementById('actionValue');
const positionValue = document.getElementById('positionValue');
const groundedValue = document.getElementById('groundedValue');
const resetBtn = document.getElementById('resetBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const volumeSlider = document.getElementById('volumeSlider');
const backgroundMusic = document.getElementById('backgroundMusic');
const jumpSound = document.getElementById('jumpSound');

// Громкость звука
volumeSlider.addEventListener('input', function() {
    const volume = this.value / 100;
    backgroundMusic.volume = volume;
    jumpSound.volume = volume;
});

// Воспроизведение фоновой музыки
backgroundMusic.volume = 0.7;
backgroundMusic.play().catch(e => console.log("Автовоспроизведение заблокировано, нажмите на игру для включения звука"));

canvas.addEventListener('click', () => {
    if (backgroundMusic.paused) {
        backgroundMusic.play().catch(e => console.log("Не удалось воспроизвести музыку"));
    }
});

// Полноэкранный режим
fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen();
        } else if (canvas.webkitRequestFullscreen) {
            canvas.webkitRequestFullscreen();
        } else if (canvas.msRequestFullscreen) {
            canvas.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
});

// Игровые переменные
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 40,
    height: 80,
    speed: 3,
    runSpeed: 5,
    jumpForce: 15,
    velocityX: 0,
    velocityY: 0,
    isJumping: false,
    isRunning: false,
    isOnGround: true,
    direction: 1, // 1 - вправо, -1 - влево
    color: '#4169e1'
};

// Карта и базы
const map = {
    road: {
        x: canvas.width / 2 - 75,
        y: 0,
        width: 150,
        height: canvas.height,
        color: '#ff4757'
    },
    bases: []
};

// Создание баз
function createBases() {
    map.bases = [];
    const baseWidth = 120;
    const baseHeight = 120;
    const baseSpacing = 180;
    
    // Левая сторона (3 базы)
    for (let i = 0; i < 3; i++) {
        map.bases.push({
            x: 50,
            y: 100 + i * baseSpacing,
            width: baseWidth,
            height: baseHeight,
            color: i === 0 ? '#ffdd59' : (i === 1 ? '#2ed573' : '#1e90ff'),
            visited: false
        });
    }
    
    // Правая сторона (3 базы)
    for (let i = 0; i < 3; i++) {
        map.bases.push({
            x: canvas.width - 50 - baseWidth,
            y: 100 + i * baseSpacing,
            width: baseWidth,
            height: baseHeight,
            color: i === 0 ? '#ffa502' : (i === 1 ? '#3742fa' : '#7bed9f'),
            visited: false
        });
    }
}

// Проверка коллизий
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Проверка нахождения на земле
function checkGround() {
    const groundLevel = canvas.height - player.height;
    player.isOnGround = player.y >= groundLevel;
    
    if (player.isOnGround) {
        player.y = groundLevel;
        player.velocityY = 0;
        player.isJumping = false;
    }
}

// Проверка коллизий с базами
function checkBaseCollisions() {
    for (let i = 0; i < map.bases.length; i++) {
        const base = map.bases[i];
        
        if (checkCollision(player, base)) {
            if (!base.visited) {
                base.visited = true;
                base.color = '#8a2be2'; // Фиолетовый цвет при посещении
                
                // Проверка, посещены ли все базы
                const allVisited = map.bases.every(b => b.visited);
                if (allVisited) {
                    setTimeout(() => {
                        alert('Поздравляем! Вы посетили все базы!');
                    }, 100);
                }
            }
            return true;
        }
    }
    return false;
}

// Проверка коллизий с границами карты
function checkBoundaries() {
    // Левая граница
    if (player.x < 0) {
        player.x = 0;
    }
    
    // Правая граница
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
    
    // Верхняя граница
    if (player.y < 0) {
        player.y = 0;
        player.velocityY = 0;
    }
}

// Обновление игрового состояния
function update() {
    // Применяем гравитацию
    if (!player.isOnGround) {
        player.velocityY += 0.8; // Гравитация
    }
    
    // Обновляем позицию игрока
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Проверяем коллизии
    checkGround();
    checkBaseCollisions();
    checkBoundaries();
    
    // Обновляем статистику
    updateStats();
}

// Обновление статистики
function updateStats() {
    const speed = Math.sqrt(player.velocityX * player.velocityX + player.velocityY * player.velocityY);
    speedValue.textContent = speed.toFixed(1);
    
    let action = "Стоит";
    if (player.isJumping) action = "Прыгает";
    else if (player.isRunning && player.velocityX !== 0) action = "Бежит";
    else if (player.velocityX !== 0) action = "Идет";
    actionValue.textContent = action;
    
    positionValue.textContent = `${Math.floor(player.x)}, ${Math.floor(player.y)}`;
    groundedValue.textContent = player.isOnGround ? "Да" : "Нет";
}

// Отрисовка игры
function draw() {
    // Очистка холста
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем фон
    drawBackground();
    
    // Рисуем дорогу
    ctx.fillStyle = map.road.color;
    ctx.fillRect(map.road.x, map.road.y, map.road.width, map.road.height);
    
    // Рисуем дорожную разметку
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Рисуем базы
    drawBases();
    
    // Рисуем игрока
    drawPlayer();
}

// Отрисовка фона
function drawBackground() {
    // Градиентный фон
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f3460');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем звезды на фоне
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1.5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Отрисовка баз
function drawBases() {
    map.bases.forEach(base => {
        // Основной цвет базы
        ctx.fillStyle = base.color;
        ctx.fillRect(base.x, base.y, base.width, base.height);
        
        // Обводка базы
        ctx.strokeStyle = base.visited ? '#ffffff' : '#000000';
        ctx.lineWidth = 3;
        ctx.strokeRect(base.x, base.y, base.width, base.height);
        
        // Номер базы
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const baseIndex = map.bases.indexOf(base) + 1;
        ctx.fillText(baseIndex.toString(), base.x + base.width / 2, base.y + base.height / 2);
        
        // Текст "База"
        ctx.font = '14px Poppins';
        ctx.fillText('База', base.x + base.width / 2, base.y + base.height / 2 + 25);
        
        // Индикатор посещения
        if (base.visited) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(base.x + 5, base.y + 5, base.width - 10, base.height - 10);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('✓', base.x + base.width - 20, base.y + 20);
        }
    });
}

// Отрисовка игрока
function drawPlayer() {
    // Сохраняем контекст
    ctx.save();
    
    // Перемещаем контекст к позиции игрока
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    
    // Отражаем игрока в зависимости от направления
    ctx.scale(player.direction, 1);
    
    // Тело игрока (Roblox персонаж)
    ctx.fillStyle = player.color;
    
    // Голова
    ctx.beginPath();
    ctx.arc(0, -player.height/2 + 15, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Тело
    ctx.fillRect(-player.width/2 + 5, -player.height/2 + 30, player.width - 10, player.height - 40);
    
    // Ноги
    const legOffset = player.isJumping ? 10 : Math.sin(Date.now() / 100) * 5 * Math.abs(player.velocityX) / player.speed;
    ctx.fillRect(-player.width/2 + 5, player.height/2 - 20, 10, 20);
    ctx.fillRect(player.width/2 - 15, player.height/2 - 20, 10, 20);
    
    // Руки
    const armOffset = player.isJumping ? 15 : Math.sin(Date.now() / 80) * 8 * Math.abs(player.velocityX) / player.speed;
    ctx.fillRect(-player.width/2 - 5, -player.height/2 + 40, 10, 30);
    ctx.fillRect(player.width/2 - 5, -player.height/2 + 40, 10, 30);
    
    // Глаза
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-5, -player.height/2 + 10, 4, 0, Math.PI * 2);
    ctx.arc(5, -player.height/2 + 10, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Зрачки
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-5 + (player.direction === 1 ? 2 : -2), -player.height/2 + 10, 2, 0, Math.PI * 2);
    ctx.arc(5 + (player.direction === 1 ? 2 : -2), -player.height/2 + 10, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Индикатор бега
    if (player.isRunning && player.velocityX !== 0) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(0, -player.height/2 - 10, 8, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Восстанавливаем контекст
    ctx.restore();
}

// Управление
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    // Прыжок
    if ((e.key === ' ' || e.key === 'Spacebar') && player.isOnGround) {
        player.velocityY = -player.jumpForce;
        player.isJumping = true;
        player.isOnGround = false;
        jumpSound.currentTime = 0;
        jumpSound.play();
    }
    
    // Бег
    if (e.key === 'Shift') {
        player.isRunning = true;
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    
    // Остановка бега
    if (e.key === 'Shift') {
        player.isRunning = false;
    }
    
    // Остановка горизонтального движения при отпускании клавиш
    if (e.key === 'a' || e.key === 'd' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        player.velocityX = 0;
    }
});

// Обработка движения
function handleMovement() {
    const currentSpeed = player.isRunning ? player.runSpeed : player.speed;
    
    player.velocityX = 0;
    
    // Движение влево
    if (keys['a'] || keys['arrowleft']) {
        player.velocityX = -currentSpeed;
        player.direction = -1;
    }
    
    // Движение вправо
    if (keys['d'] || keys['arrowright']) {
        player.velocityX = currentSpeed;
        player.direction = 1;
    }
    
    // Движение вверх (для тестирования)
    if (keys['w'] || keys['arrowup']) {
        if (keys['shift']) {
            player.y -= currentSpeed * 1.5;
        } else {
            player.y -= currentSpeed;
        }
    }
    
    // Движение вниз (для тестирования)
    if (keys['s'] || keys['arrowdown']) {
        if (keys['shift']) {
            player.y += currentSpeed * 1.5;
        } else {
            player.y += currentSpeed;
        }
    }
}

// Сброс позиции игрока
resetBtn.addEventListener('click', () => {
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isJumping = false;
    player.isRunning = false;
    
    // Сброс посещения баз
    map.bases.forEach(base => {
        const originalColors = ['#ffdd59', '#2ed573', '#1e90ff', '#ffa502', '#3742fa', '#7bed9f'];
        base.color = originalColors[map.bases.indexOf(base)];
        base.visited = false;
    });
});

// Игровой цикл
function gameLoop() {
    handleMovement();
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Инициализация игры
function init() {
    createBases();
    gameLoop();
}

// Запуск игры при загрузке страницы
window.addEventListener('load', init);