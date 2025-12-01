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
        this.jumpHeight = 7;
        this.gravity = 15;
        this.blockCount = 0;
        this.gameStarted = false;

        this.init();
        this.createWorld();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Сцена
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 1000);

        // Камера
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 0);

        // Рендерер
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);

        // Освещение
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Небо
        const skyGeometry = new THREE.SphereGeometry(500, 60, 40);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);

        // Пол
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x7CFC00 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    createWorld() {
        // Создаем начальные блоки
        for (let x = -10; x <= 10; x += 2) {
            for (let z = -10; z <= 10; z += 2) {
                const height = Math.floor(Math.random() * 3) + 1;
                for (let y = 0; y < height; y++) {
                    const blockType = y === height - 1 ? 0 : (y === 0 ? 1 : 2);
                    this.addBlock(x, y, z, blockType);
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
        block.userData = { type: type };
        
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

    updateControls() {
        if (!this.controls) return;

        const time = performance.now() * 0.001;
        const delta = Math.min(0.05, time - this.lastTime || 0);
        this.lastTime = time;

        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= this.gravity * delta;

        this.direction.z = Number(this.keys['KeyW']) - Number(this.keys['KeyS']);
        this.direction.x = Number(this.keys['KeyD']) - Number(this.keys['KeyA']);
        this.direction.normalize();

        if (this.keys['Space'] && this.canJump) {
            this.velocity.y = this.jumpHeight;
            this.canJump = false;
        }

        const speed = this.keys['ShiftLeft'] ? this.moveSpeed * 2 : this.moveSpeed;
        
        if (this.keys['KeyW']) this.velocity.z -= speed * delta;
        if (this.keys['KeyS']) this.velocity.z += speed * delta;
        if (this.keys['KeyA']) this.velocity.x -= speed * delta;
        if (this.keys['KeyD']) this.velocity.x += speed * delta;

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);

        this.camera.position.y += this.velocity.y * delta;

        if (this.camera.position.y < 10) {
            this.velocity.y = 0;
            this.camera.position.y = 10;
            this.canJump = true;
        }

        // Обновляем координаты
        document.getElementById('coords').textContent = 
            `${Math.floor(this.camera.position.x)}, ${Math.floor(this.camera.position.y)}, ${Math.floor(this.camera.position.z)}`;
    }

    setupEventListeners() {
        // Кнопка старта
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });

        // Управление камерой
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            
            if (event.code.startsWith('Digit')) {
                const num = parseInt(event.code[5]) - 1;
                if (num >= 0 && num <= 2) {
                    this.selectBlock(num);
                }
            }
            
            if (event.code === 'KeyE') {
                const inventory = document.getElementById('inventory');
                inventory.style.display = inventory.style.display === 'none' ? 'block' : 'none';
            }
            
            if (event.code === 'Escape') {
                this.exitGame();
            }
        });

        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });

        // Клики для размещения/удаления блоков
        this.renderer.domElement.addEventListener('click', (event) => {
            if (!this.gameStarted) return;
            
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
                    
                    if (!this.getBlockAtPosition(newPos.x, newPos.y, newPos.z)) {
                        this.addBlock(newPos.x, newPos.y, newPos.z, this.selectedBlockIndex);
                    }
                }
            }
        });

        // Контекстное меню
        this.renderer.domElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });

        // Слоты инвентаря
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
        
        // Активируем PointerLockControls
        this.controls = new THREE.PointerLockControls(this.camera, document.body);
        this.scene.add(this.controls.getObject());
        
        // Запрашиваем блокировку указателя
        document.body.requestPointerLock = document.body.requestPointerLock ||
                                          document.body.mozRequestPointerLock;
        document.body.requestPointerLock();
    }

    exitGame() {
        this.gameStarted = false;
        document.getElementById('startScreen').style.display = 'flex';
        
        if (this.controls) {
            this.scene.remove(this.controls.getObject());
            this.controls = null;
        }
        
        document.exitPointerLock = document.exitPointerLock ||
                                  document.mozExitPointerLock;
        document.exitPointerLock();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.gameStarted && this.controls) {
            this.updateControls();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Запуск игры
let game;
window.addEventListener('load', () => {
    game = new MinecraftGame();
});
