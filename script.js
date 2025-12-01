class MinecraftGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.blocks = [];
        this.selectedBlockIndex = 0;
        this.blockTypes = [
            { name: 'Трава', color: 0x7CFC00 },
            { name: 'Земля', color: 0x8B4513 },
            { name: 'Камень', color: 0x808080 }
        ];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.keys = {};
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.canJump = true;
        this.moveSpeed = 5;
        this.jumpHeight = 8;
        this.gravity = 25;
        this.isOnGround = false;
        this.blockCount = 0;
        this.gameStarted = false;
        this.isLocked = false;
        this.clock = new THREE.Clock();
        this.previousTime = 0;
        this.fps = 0;
        this.fpsUpdateTime = 0;

        this.init();
        this.createGrassPlatform();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Сцена
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 500);

        // Камера (FPS камера)
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 15, 0);

        // Рендерер
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);

        // Освещение
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);

        // Небо
        const skyGeometry = new THREE.SphereGeometry(1000, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);

        // Солнце
        const sunGeometry = new THREE.SphereGeometry(20, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.position.set(200, 150, 100);
        this.scene.add(this.sun);
    }

    createGrassPlatform() {
        // Создаем большую травяную платформу для старта
        const platformSize = 30;
        const geometry = new THREE.PlaneGeometry(platformSize, platformSize);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x7CFC00,
            side: THREE.DoubleSide
        });
        const platform = new THREE.Mesh(geometry, material);
        platform.rotation.x = -Math.PI / 2;
        platform.position.y = -0.5;
        platform.receiveShadow = true;
        this.scene.add(platform);

        // Добавляем травяные блоки на платформе
        for (let x = -10; x <= 10; x++) {
            for (let z = -10; z <= 10; z++) {
                // Случайные высоты для реалистичности
                if (Math.random() > 0.7) {
                    const height = Math.floor(Math.random() * 4) + 1;
                    for (let y = 0; y < height; y++) {
                        const blockType = y === height - 1 ? 0 : (y === 0 ? 1 : 2);
                        this.addBlock(x, y, z, blockType);
                    }
                } else if (Math.random() > 0.5) {
                    // Добавляем единичные блоки травы
                    this.addBlock(x, 0, z, 0);
                }
            }
        }

        // Добавляем деревья
        this.addTree(-5, 0, -5);
        this.addTree(5, 0, 5);
        this.addTree(-8, 0, 8);
    }

    addTree(x, y, z) {
        // Ствол дерева (земля)
        for (let i = 0; i < 4; i++) {
            this.addBlock(x, y + i, z, 1);
        }
        
        // Листва (трава)
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                for (let dy = 3; dy <= 5; dy++) {
                    if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy - 4) <= 3) {
                        this.addBlock(x + dx, y + dy, z + dz, 0);
                    }
                }
            }
        }
    }

    addBlock(x, y, z, type) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshLambertMaterial({ 
            color: this.blockTypes[type].color 
        });
        const block = new THREE.Mesh(geometry, material);
        
        block.position.set(x, y, z);
        block.castShadow = true;
        block.receiveShadow = true;
        block.userData = { 
            type: type,
            health: 100 
        };
        
        this.scene.add(block);
        this.blocks.push(block);
        this.blockCount++;
        document.getElementById('blockCount').textContent = this.blockCount;
    }

    removeBlock(block) {
        this.scene.remove(block);
        const index = this.blocks.indexOf(block);
        if (index > -1) {
            this.blocks.splice(index, 1);
        }
        this.blockCount--;
        document.getElementById('blockCount').textContent = this.blockCount;
    }

    getBlockAtPosition(x, y, z) {
        for (const block of this.blocks) {
            if (Math.abs(block.position.x - x) < 0.5 &&
                Math.abs(block.position.y - y) < 0.5 &&
                Math.abs(block.position.z - z) < 0.5) {
                return block;
            }
        }
        return null;
    }

    updatePhysics(deltaTime) {
        if (!this.gameStarted || !this.isLocked) return;

        // Гравитация
        if (!this.isOnGround) {
            this.velocity.y -= this.gravity * deltaTime;
        }

        // Движение вперед/назад
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.velocity.z = -this.moveSpeed;
        } else if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.velocity.z = this.moveSpeed;
        } else {
            this.velocity.z = 0;
        }

        // Движение влево/вправо
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.velocity.x = -this.moveSpeed;
        } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.velocity.x = this.moveSpeed;
        } else {
            this.velocity.x = 0;
        }

        // Бег
        if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
            this.velocity.x *= 1.8;
            this.velocity.z *= 1.8;
        }

        // Прыжок
        if ((this.keys['Space'] || this.keys['Spacebar']) && this.isOnGround) {
            this.velocity.y = this.jumpHeight;
            this.isOnGround = false;
        }

        // Обновление позиции камеры
        const moveVector = new THREE.Vector3(
            this.velocity.x * deltaTime,
            this.velocity.y * deltaTime,
            this.velocity.z * deltaTime
        );

        // Преобразуем движение в локальные координаты камеры
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();

        const cameraRight = new THREE.Vector3();
        cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0)).normalize();

        const forwardMove = cameraDirection.clone().multiplyScalar(moveVector.z);
        const rightMove = cameraRight.clone().multiplyScalar(moveVector.x);

        this.camera.position.add(forwardMove);
        this.camera.position.add(rightMove);
        this.camera.position.y += moveVector.y;

        // Проверка столкновения с землей
        if (this.camera.position.y < 1.8) {
            this.camera.position.y = 1.8;
            this.velocity.y = 0;
            this.isOnGround = true;
        }

        // Обновляем координаты
        document.getElementById('coords').textContent = 
            `${Math.round(this.camera.position.x * 10) / 10}, ${Math.round(this.camera.position.y * 10) / 10}, ${Math.round(this.camera.position.z * 10) / 10}`;
    }

    setupEventListeners() {
        // Кнопка старта
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });

        // Обработка блокировки указателя
        document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
        document.addEventListener('mozpointerlockchange', () => this.onPointerLockChange());

        // Клик по экрану для активации Pointer Lock
        this.renderer.domElement.addEventListener('click', () => {
            if (this.gameStarted && !this.isLocked) {
                this.renderer.domElement.requestPointerLock();
            }
        });

        // Управление клавиатурой
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            
            // Смена блоков цифрами 1-3
            if (event.code.startsWith('Digit')) {
                const num = parseInt(event.code[5]) - 1;
                if (num >= 0 && num <= 2) {
                    this.selectBlock(num);
                }
            }
            
            // Инвентарь
            if (event.code === 'KeyE') {
                const inventory = document.getElementById('inventory');
                inventory.style.display = inventory.style.display === 'none' ? 'block' : 'none';
            }
            
            // Выход из игры
            if (event.code === 'Escape') {
                this.exitGame();
            }
        });

        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });

        // Клики для взаимодействия с блоками
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            if (!this.gameStarted || !this.isLocked) return;
            
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            const intersects = this.raycaster.intersectObjects(this.blocks);
            
            if (intersects.length > 0) {
                const intersect = intersects[0];
                
                if (event.button === 0) { // ЛКМ - удалить блок
                    this.removeBlock(intersect.object);
                } else if (event.button === 2) { // ПКМ - добавить блок
                    const normal = intersect.face.normal;
                    const newPos = intersect.object.position.clone().add(normal);
                    
                    // Проверяем, нет ли блока на этой позиции
                    if (!this.getBlockAtPosition(newPos.x, newPos.y, newPos.z)) {
                        // Проверяем, чтобы блок не ставился внутри игрока
                        const playerPos = this.camera.position.clone();
                        playerPos.y -= 1; // Центр игрока примерно на уровне глаз
                        const distance = playerPos.distanceTo(newPos);
                        
                        if (distance > 2) { // Минимальное расстояние для установки блока
                            this.addBlock(newPos.x, newPos.y, newPos.z, this.selectedBlockIndex);
                        }
                    }
                }
            }
        });

        // Отключаем контекстное меню
        this.renderer.domElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });

        // Выбор блоков через инвентарь
        document.querySelectorAll('.slot').forEach(slot => {
            slot.addEventListener('click', (event) => {
                const slotNum = parseInt(slot.dataset.slot);
                if (slotNum <= 2) {
                    this.selectBlock(slotNum);
                }
            });
        });

        // Изменение размера окна
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Движение мыши для FPS камеры
        document.addEventListener('mousemove', (event) => {
            if (!this.gameStarted || !this.isLocked) return;

            const movementX = event.movementX || event.mozMovementX || 0;
            const movementY = event.movementY || event.mozMovementY || 0;

            // Чувствительность мыши
            const sensitivity = 0.002;

            // Вращение камеры по горизонтали
            this.camera.rotation.y -= movementX * sensitivity;

            // Вращение камеры по вертикали с ограничениями
            this.camera.rotation.x -= movementY * sensitivity;
            this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
        });
    }

    onPointerLockChange() {
        this.isLocked = document.pointerLockElement === this.renderer.domElement ||
                       document.mozPointerLockElement === this.renderer.domElement;
        
        if (this.isLocked) {
            document.body.classList.add('game-mode');
            document.getElementById('crosshair').style.display = 'block';
        } else {
            document.body.classList.remove('game-mode');
            document.getElementById('crosshair').style.display = 'none';
        }
    }

    selectBlock(index) {
        if (index < 0 || index >= this.blockTypes.length) return;
        
        this.selectedBlockIndex = index;
        document.getElementById('selectedBlock').textContent = this.blockTypes[index].name;
        
        // Обновляем активный слот
        document.querySelectorAll('.slot').forEach(slot => {
            slot.classList.remove('active');
        });
        document.querySelector(`.slot[data-slot="${index}"]`).classList.add('active');
    }

    startGame() {
        this.gameStarted = true;
        document.getElementById('startScreen').style.display = 'none';
        
        // Позиционируем игрока на платформе
        this.camera.position.set(0, 15, 0);
        
        // Активируем Pointer Lock при клике
        setTimeout(() => {
            const message = document.createElement('div');
            message.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 24px;
                background: rgba(0,0,0,0.7);
                padding: 20px;
                border-radius: 10px;
                z-index: 3000;
                text-align: center;
            `;
            message.textContent = 'КЛИКНИТЕ ПО ЭКРАНУ ДЛЯ НАЧАЛА ИГРЫ';
            document.getElementById('gameContainer').appendChild(message);
            
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 3000);
        }, 500);
    }

    exitGame() {
        this.gameStarted = false;
        this.isLocked = false;
        document.getElementById('startScreen').style.display = 'flex';
        document.body.classList.remove('game-mode');
        
        if (document.exitPointerLock) {
            document.exitPointerLock();
        } else if (document.mozExitPointerLock) {
            document.mozExitPointerLock();
        }
    }

    updateFPS() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.previousTime;
        this.previousTime = currentTime;
        
        this.fpsUpdateTime += deltaTime;
        if (this.fpsUpdateTime > 500) { // Обновляем FPS раз в 500ms
            this.fps = Math.round(1000 / deltaTime);
            document.getElementById('fpsCounter').textContent = this.fps;
            this.fpsUpdateTime = 0;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Обновляем FPS
        this.updateFPS();
        
        // Получаем delta time
        const deltaTime = this.clock.getDelta();
        
        // Обновляем физику если игра началась
        if (this.gameStarted && this.isLocked) {
            this.updatePhysics(deltaTime);
        }
        
        // Анимация солнца
        if (this.sun) {
            this.sun.position.x = 200 * Math.cos(Date.now() * 0.0001);
            this.sun.position.z = 200 * Math.sin(Date.now() * 0.0001);
        }
        
        // Рендеринг
        this.renderer.render(this.scene, this.camera);
    }
}

// Запуск игры
let game;
window.addEventListener('load', () => {
    game = new MinecraftGame();
});

// Обработка ошибок
window.addEventListener('error', (error) => {
    console.error('Game error:', error);
    alert(`Ошибка игры: ${error.message}. Пожалуйста, обновите страницу.`);
});
