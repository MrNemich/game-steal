// Инициализация Three.js сцены
let scene, camera, renderer, controls;
let player, road, bases = [];
let keys = {};
let clock = new THREE.Clock();
let playerVelocity = new THREE.Vector3();
let playerDirection = new THREE.Vector3();
let canJump = true;
let isThirdPerson = true;
let visitedBases = 0;
let totalBases = 6;

// Звуки
const backgroundMusic = document.getElementById('backgroundMusic');
const jumpSound = document.getElementById('jumpSound');
const collectSound = document.getElementById('collectSound');
const volumeSlider = document.getElementById('volumeSlider');

// Элементы интерфейса
const speedValue = document.getElementById('speedValue');
const actionValue = document.getElementById('actionValue');
const positionValue = document.getElementById('positionValue');
const basesValue = document.getElementById('basesValue');
const resetBtn = document.getElementById('resetBtn');
const cameraBtn = document.getElementById('cameraBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const baseItems = document.querySelectorAll('.base-item');

// Управление звуком
volumeSlider.addEventListener('input', function() {
    const volume = this.value / 100;
    backgroundMusic.volume = volume;
    jumpSound.volume = volume;
    collectSound.volume = volume;
});

// Инициализация сцены
function init() {
    // Создаем сцену
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a15, 10, 100);
    
    // Создаем камеру
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 15);
    
    // Создаем рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(document.getElementById('game3d').offsetWidth, document.getElementById('game3d').offsetHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game3d').appendChild(renderer.domElement);
    
    // Добавляем освещение
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);
    
    // Добавляем контролы камеры
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI / 2;
    
    // Создаем землю
    createGround();
    
    // Создаем дорогу
    createRoad();
    
    // Создаем базы
    createBases();
    
    // Создаем игрока
    createPlayer();
    
    // Добавляем небо
    createSky();
    
    // Обработчики событий
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
    // Кнопки управления
    resetBtn.addEventListener('click', resetGame);
    cameraBtn.addEventListener('click', toggleCamera);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // Стартовая музыка
    backgroundMusic.volume = 0.7;
    backgroundMusic.play().catch(e => console.log("Автовоспроизведение заблокировано"));
    
    // Начальная статистика
    updateBasesUI();
    
    // Запускаем игровой цикл
    animate();
}

// Создание земли
function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a3a1a,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Добавляем траву
    for (let i = 0; i < 200; i++) {
        const grassGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
        const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x2ecc71 });
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        
        grass.position.x = (Math.random() - 0.5) * 90;
        grass.position.y = 0.25;
        grass.position.z = (Math.random() - 0.5) * 90;
        
        // Не размещаем траву на дороге и базах
        if (Math.abs(grass.position.x) > 10 || Math.abs(grass.position.z) > 40) {
            scene.add(grass);
        }
    }
}

// Создание дороги
function createRoad() {
    const roadGeometry = new THREE.BoxGeometry(20, 0.2, 100);
    const roadMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff4757,
        roughness: 0.7,
        metalness: 0.3
    });
    road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.position.y = 0.1;
    road.receiveShadow = true;
    scene.add(road);
    
    // Добавляем дорожную разметку
    for (let i = -45; i <= 45; i += 10) {
        const lineGeometry = new THREE.BoxGeometry(0.5, 0.21, 4);
        const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.position.set(0, 0.11, i);
        scene.add(line);
    }
}

// Создание баз
function createBases() {
    const baseColors = [0xffdd59, 0x2ed573, 0x1e90ff, 0xffa502, 0x3742fa, 0x7bed9f];
    const basePositions = [
        { x: -30, z: -30 }, // Левая сторона, ближняя
        { x: -30, z: 0 },   // Левая сторона, средняя
        { x: -30, z: 30 },  // Левая сторона, дальняя
        { x: 30, z: -30 },  // Правая сторона, ближняя
        { x: 30, z: 0 },    // Правая сторона, средняя
        { x: 30, z: 30 }    // Правая сторона, дальняя
    ];
    
    for (let i = 0; i < totalBases; i++) {
        // Основное здание базы
        const baseGeometry = new THREE.BoxGeometry(8, 6, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: baseColors[i],
            roughness: 0.6,
            metalness: 0.4
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(basePositions[i].x, 3, basePositions[i].z);
        base.castShadow = true;
        base.receiveShadow = true;
        scene.add(base);
        
        // Крыша базы
        const roofGeometry = new THREE.ConeGeometry(6, 2, 4);
        const roofMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2c3e50,
            roughness: 0.8
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(basePositions[i].x, 9, basePositions[i].z);
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        scene.add(roof);
        
        // Вход в базу (арка)
        const entranceGeometry = new THREE.BoxGeometry(4, 4, 1);
        const entranceMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8a2be2,
            transparent: true,
            opacity: 0.7
        });
        const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
        entrance.position.set(basePositions[i].x, 2, basePositions[i].z + 4.5);
        entrance.castShadow = true;
        scene.add(entrance);
        
        // Флаг на крыше
        const flagPoleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3);
        const flagPoleMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
        flagPole.position.set(basePositions[i].x, 10.5, basePositions[i].z);
        scene.add(flagPole);
        
        const flagGeometry = new THREE.PlaneGeometry(2, 1);
        const flagMaterial = new THREE.MeshStandardMaterial({ 
            color: baseColors[i],
            side: THREE.DoubleSide
        });
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(basePositions[i].x + 1, 10, basePositions[i].z);
        scene.add(flag);
        
        // Свет внутри базы
        const baseLight = new THREE.PointLight(baseColors[i], 1, 10);
        baseLight.position.set(basePositions[i].x, 5, basePositions[i].z);
        scene.add(baseLight);
        
        // Сохраняем информацию о базе
        bases.push({
            mesh: base,
            roof: roof,
            entrance: entrance,
            flag: flag,
            light: baseLight,
            position: basePositions[i],
            color: baseColors[i],
            visited: false,
            index: i
        });
    }
}

// Создание игрока
function createPlayer() {
    // Тело игрока
    const bodyGeometry = new THREE.BoxGeometry(1.5, 2, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4169e1,
        roughness: 0.5,
        metalness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Голова игрока
    const headGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffdd59,
        roughness: 0.7
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    
    // Ноги игрока
    const legGeometry = new THREE.BoxGeometry(0.4, 1, 0.4);
    const legMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1e90ff,
        roughness: 0.6
    });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.4, -1.5, 0);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.4, -1.5, 0);
    
    // Руки игрока
    const armGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
    const armMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4169e1,
        roughness: 0.6
    });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-1.2, 0.2, 0);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(1.2, 0.2, 0);
    
    // Глаза
    const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 1.7, 0.7);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 1.7, 0.7);
    
    // Зрачки
    const pupilGeometry = new THREE.SphereGeometry(0.07, 8, 8);
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.3, 1.7, 0.85);
    
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.3, 1.7, 0.85);
    
    // Создаем группу для игрока
    player = new THREE.Group();
    player.add(body);
    player.add(head);
    player.add(leftLeg);
    player.add(rightLeg);
    player.add(leftArm);
    player.add(rightArm);
    player.add(leftEye);
    player.add(rightEye);
    player.add(leftPupil);
    player.add(rightPupil);
    
    player.position.set(0, 3, 0);
    player.castShadow = true;
    scene.add(player);
    
    // Создаем коллайдер для игрока (невидимый)
    const playerCollider = new THREE.Box3().setFromObject(player);
    player.userData.collider = playerCollider;
}

// Создание неба
function createSky() {
    const skyGeometry = new THREE.SphereGeometry(80, 32, 32);
    const skyMaterial = new THREE.MeshStandardMaterial({
        color: 0x87CEEB,
        side: THREE.BackSide,
        roughness: 1,
        metalness: 0
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
    
    // Добавляем облака
    for (let i = 0; i < 15; i++) {
        const cloudGeometry = new THREE.SphereGeometry(Math.random() * 3 + 1, 8, 8);
        const cloudMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        
        cloud.position.set(
            (Math.random() - 0.5) * 100,
            Math.random() * 30 + 20,
            (Math.random() - 0.5) * 100
        );
        
        scene.add(cloud);
    }
}

// Обработка нажатий клавиш
function onKeyDown(event) {
    keys[event.key.toLowerCase()] = true;
    
    // Прыжок
    if ((event.key === ' ' || event.key === 'Spacebar') && canJump) {
        playerVelocity.y = 10;
        canJump = false;
        jumpSound.currentTime = 0;
        jumpSound.play();
    }
}

function onKeyUp(event) {
    keys[event.key.toLowerCase()] = false;
}

// Обновление игрока
function updatePlayer(delta) {
    const speed = keys['shift'] ? 20 : 10;
    playerVelocity.x = 0;
    playerVelocity.z = 0;
    
    // Движение вперед/назад
    if (keys['w'] || keys['arrowup']) {
        playerVelocity.z = -speed;
    }
    if (keys['s'] || keys['arrowdown']) {
        playerVelocity.z = speed;
    }
    
    // Движение влево/вправо
    if (keys['a'] || keys['arrowleft']) {
        playerVelocity.x = -speed;
    }
    if (keys['d'] || keys['arrowright']) {
        playerVelocity.x = speed;
    }
    
    // Применяем гравитацию
    playerVelocity.y -= 25 * delta;
    
    // Сохраняем позицию до обновления
    const oldPosition = player.position.clone();
    
    // Обновляем позицию
    player.position.x += playerVelocity.x * delta;
    player.position.z += playerVelocity.z * delta;
    player.position.y += playerVelocity.y * delta;
    
    // Проверяем коллизии с землей
    if (player.position.y <= 1) {
        player.position.y = 1;
        playerVelocity.y = 0;
        canJump = true;
    }
    
    // Проверяем коллизии с базами
    checkBaseCollisions(oldPosition);
    
    // Обновляем анимацию ног при движении
    if (playerVelocity.x !== 0 || playerVelocity.z !== 0) {
        const legSpeed = speed * 5;
        player.children[2].position.y = -1.5 + Math.sin(Date.now() * 0.01 * legSpeed) * 0.3;
        player.children[3].position.y = -1.5 + Math.cos(Date.now() * 0.01 * legSpeed) * 0.3;
        
        // Поворачиваем игрока в направлении движения
        const angle = Math.atan2(playerVelocity.x, playerVelocity.z);
        player.rotation.y = angle;
    } else {
        // Возвращаем ноги в исходное положение
        player.children[2].position.y = -1.5;
        player.children[3].position.y = -1.5;
    }
    
    // Обновляем статистику
    updateStats();
}

// Проверка коллизий с базами
function checkBaseCollisions(oldPosition) {
    const playerBox = new THREE.Box3().setFromObject(player);
    
    for (let i = 0; i < bases.length; i++) {
        const base = bases[i];
        const baseBox = new THREE.Box3().setFromObject(base.mesh);
        
        // Проверяем коллизию с базой
        if (playerBox.intersectsBox(baseBox)) {
            // Если игрок внутри базы и база еще не посещена
            if (!base.visited) {
                base.visited = true;
                visitedBases++;
                
                // Меняем цвет базы на фиолетовый
                base.mesh.material.color.setHex(0x8a2be2);
                base.flag.material.color.setHex(0x8a2be2);
                
                // Включаем анимацию
                base.mesh.userData.float = true;
                
                // Воспроизводим звук
                collectSound.currentTime = 0;
                collectSound.play();
                
                // Обновляем UI
                updateBasesUI();
                
                // Проверяем, все ли базы посещены
                if (visitedBases === totalBases) {
                    setTimeout(() => {
                        alert(`Поздравляем! Вы посетили все ${totalBases} баз!`);
                    }, 500);
                }
            }
            
            // Отталкиваем игрока от базы
            const direction = player.position.clone().sub(base.mesh.position).normalize();
            player.position.copy(oldPosition);
            player.position.add(direction.multiplyScalar(0.5));
        }
        
        // Анимация посещенных баз
        if (base.visited && base.mesh.userData.float) {
            base.mesh.position.y = 3 + Math.sin(Date.now() * 0.003) * 0.5;
            base.roof.position.y = 9 + Math.sin(Date.now() * 0.003) * 0.5;
            base.flag.position.y = 10 + Math.sin(Date.now() * 0.003) * 0.5;
        }
    }
}

// Обновление статистики
function updateStats() {
    const speed = Math.sqrt(playerVelocity.x * playerVelocity.x + playerVelocity.z * playerVelocity.z);
    speedValue.textContent = Math.round(speed);
    
    let action = "Стоит";
    if (!canJump && playerVelocity.y > 0) action = "Прыгает";
    else if (speed > 12) action = "Бежит";
    else if (speed > 0) action = "Идет";
    actionValue.textContent = action;
    
    positionValue.textContent = `${Math.round(player.position.x)}, ${Math.round(player.position.z)}`;
    basesValue.textContent = `${visitedBases}/${totalBases}`;
}

// Обновление UI баз
function updateBasesUI() {
    baseItems.forEach((item, index) => {
        const base = bases[index];
        const statusElement = item.querySelector('.base-status');
        
        if (base && base.visited) {
            item.classList.add('visited');
            item.classList.remove('not-visited');
            statusElement.textContent = 'Посещена';
            statusElement.classList.remove('not-visited');
            statusElement.classList.add('visited');
        } else {
            item.classList.remove('visited');
            item.classList.add('not-visited');
            statusElement.textContent = 'Не посещена';
            statusElement.classList.add('not-visited');
            statusElement.classList.remove('visited');
        }
    });
}

// Переключение камеры
function toggleCamera() {
    isThirdPerson = !isThirdPerson;
    cameraBtn.classList.toggle('active');
    
    if (isThirdPerson) {
        cameraBtn.innerHTML = '<i class="fas fa-video"></i> Вид от 3-го лица';
        controls.enabled = true;
    } else {
        cameraBtn.innerHTML = '<i class="fas fa-user"></i> Вид от 1-го лица';
        controls.enabled = false;
        camera.position.copy(player.position);
        camera.position.y += 5;
        camera.position.z += 3;
        camera.lookAt(player.position);
    }
}

// Переключение полноэкранного режима
function toggleFullscreen() {
    const elem = document.getElementById('game3d');
    
    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
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
}

// Сброс игры
function resetGame() {
    // Сбрасываем позицию игрока
    player.position.set(0, 3, 0);
    playerVelocity.set(0, 0, 0);
    player.rotation.y = 0;
    
    // Сбрасываем базы
    visitedBases = 0;
    bases.forEach((base, index) => {
        base.visited = false;
        base.mesh.material.color.setHex(base.color);
        base.flag.material.color.setHex(base.color);
        base.mesh.position.y = 3;
        base.roof.position.y = 9;
        base.flag.position.y = 10;
        base.mesh.userData.float = false;
    });
    
    // Сбрасываем камеру
    camera.position.set(0, 10, 15);
    controls.target.set(0, 3, 0);
    
    // Обновляем UI
    updateBasesUI();
    updateStats();
}

// Обработка изменения размера окна
function onWindowResize() {
    const container = document.getElementById('game3d');
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
}

// Игровой цикл
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Обновляем игрока
    updatePlayer(delta);
    
    // Обновляем камеру в режиме от третьего лица
    if (isThirdPerson) {
        controls.target.copy(player.position);
        controls.target.y += 2;
        controls.update();
    } else {
        // В режиме от первого лица камера следует за игроком
        camera.position.x = player.position.x;
        camera.position.z = player.position.z + 3;
        camera.position.y = player.position.y + 5;
        camera.lookAt(player.position.x, player.position.y + 2, player.position.z);
    }
    
    // Рендерим сцену
    renderer.render(scene, camera);
}

// Запускаем игру при загрузке страницы
window.addEventListener('load', init);
