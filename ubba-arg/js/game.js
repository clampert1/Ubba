// Game Configuration
const CONFIG = {
    WIDTH: 640,
    HEIGHT: 480,
    POWER_DRAIN_INTERVAL: 5000, // 5 seconds
    POWER_DRAIN_AMOUNT: 5, // 5%
    CONSOLE_PENALTY: 15, // 15% power loss for wrong answer
    VIEWPORT_OFFSET: 100, // Panning range
    NIGHT_DURATION: 120000 // 2 minutes per night
};

// Game State
const state = {
    currentNight: 1,
    power: 100,
    gameActive: true,
    anomaly: null,
    currentCam: 1,
    viewOffset: { x: 0, y: 0 },
    consoleVisible: false,
    assets: {
        cameras: [],
        ubbaSprite: new Image(),
        staticSound: new Audio('assets/sounds/static.mp3'),
        jumpscareSound: new Audio('assets/sounds/jumpscare.mp3'),
        ambientSound: new Audio('assets/sounds/ambient.mp3')
    }
};

// DOM Elements
const elements = {
    canvas: document.getElementById('camera-view'),
    ctx: document.getElementById('camera-view').getContext('2d'),
    powerDisplay: document.getElementById('power-meter'),
    nightDisplay: document.getElementById('night-counter'),
    camDisplay: document.getElementById('current-cam'),
    console: document.getElementById('console'),
    consoleInput: document.getElementById('console-input'),
    staticOverlay: document.querySelector('.static-overlay'),
    anomalyAlert: document.querySelector('.anomaly-alert')
};

// Initialize Game
function initGame() {
    // Setup canvas
    elements.canvas.width = CONFIG.WIDTH;
    elements.canvas.height = CONFIG.HEIGHT;
    elements.ctx.imageSmoothingEnabled = false;

    // Load assets
    for (let i = 1; i <= 5; i++) {
        const img = new Image();
        img.src = `assets/cameras/cam${i}.png`;
        state.assets.cameras.push(img);
    }
    state.assets.ubbaSprite.src = 'assets/sprites/ubba.png';

    // Setup audio
    state.assets.ambientSound.loop = true;
    state.assets.ambientSound.volume = 0.2;
    state.assets.ambientSound.play();

    // Set first anomaly
    setNewAnomaly();

    // Setup controls
    document.addEventListener('keydown', handleKeyPress);

    // Start systems
    startPowerDrain();
    gameLoop();
}

// Game Systems
function setNewAnomaly() {
    state.anomaly = {
        cam: Math.floor(Math.random() * 5) + 1,
        x: Math.floor(Math.random() * (CONFIG.WIDTH + CONFIG.VIEWPORT_OFFSET * 2)),
        y: Math.floor(Math.random() * (CONFIG.HEIGHT + CONFIG.VIEWPORT_OFFSET * 2))
    };
}

function startPowerDrain() {
    setInterval(() => {
        if (!state.gameActive) return;
        state.power = Math.max(0, state.power - CONFIG.POWER_DRAIN_AMOUNT);
        updateUI();
        if (state.power <= 0) gameOver();
    }, CONFIG.POWER_DRAIN_INTERVAL);
}

// Input Handling
function handleKeyPress(e) {
    if (!state.gameActive) return;

    if (state.consoleVisible) {
        if (e.key === 'Enter') checkAnswer();
        return;
    }

    switch(e.key) {
        case 'ArrowUp': 
            state.viewOffset.y = Math.max(-CONFIG.VIEWPORT_OFFSET, state.viewOffset.y - 10);
            break;
        case 'ArrowDown':
            state.viewOffset.y = Math.min(CONFIG.VIEWPORT_OFFSET, state.viewOffset.y + 10);
            break;
        case 'ArrowLeft':
            state.viewOffset.x = Math.max(-CONFIG.VIEWPORT_OFFSET, state.viewOffset.x - 10);
            break;
        case 'ArrowRight':
            state.viewOffset.x = Math.min(CONFIG.VIEWPORT_OFFSET, state.viewOffset.x + 10);
            break;
        case 'Enter':
            toggleConsole();
            break;
        case '1': case '2': case '3': case '4': case '5':
            switchCamera(parseInt(e.key));
            break;
    }
}

function toggleConsole() {
    state.consoleVisible = !state.consoleVisible;
    elements.console.style.display = state.consoleVisible ? 'block' : 'none';
    if (state.consoleVisible) {
        elements.consoleInput.focus();
    }
}

function checkAnswer() {
    const answer = elements.consoleInput.value.trim().toLowerCase();
    const correct = answer === `cam${state.anomaly.cam}`;
    
    if (correct) {
        advanceNight();
    } else {
        state.power = Math.max(0, state.power - CONFIG.CONSOLE_PENALTY);
        if (Math.random() < 0.3) triggerJumpscare();
    }
    
    toggleConsole();
    elements.consoleInput.value = '';
    updateUI();
}

// Game Logic
function switchCamera(camNum) {
    state.currentCam = camNum;
    state.viewOffset = { x: 0, y: 0 };
    playStaticEffect();
    updateUI();
}

function advanceNight() {
    state.currentNight++;
    state.power = 100;
    setNewAnomaly();
    showNightComplete();
}

function gameOver() {
    state.gameActive = false;
    document.getElementById('game-over').style.display = 'flex';
}

function triggerJumpscare() {
    const jumpscare = document.getElementById('jumpscare-overlay');
    jumpscare.style.display = 'block';
    state.assets.jumpscareSound.play();
    
    setTimeout(() => {
        jumpscare.style.display = 'none';
    }, 2000);
}

// Rendering
function render() {
    // Clear canvas
    elements.ctx.fillStyle = '#000';
    elements.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    
    // Draw current camera view
    if (state.assets.cameras[state.currentCam - 1].complete) {
        elements.ctx.filter = 'grayscale(100%)';
        elements.ctx.drawImage(
            state.assets.cameras[state.currentCam - 1],
            state.viewOffset.x, state.viewOffset.y,
            CONFIG.WIDTH, CONFIG.HEIGHT,
            0, 0,
            CONFIG.WIDTH, CONFIG.HEIGHT
        );
        elements.ctx.filter = 'none';
    }
    
    // Draw Ubba if visible
    if (state.currentCam === state.anomaly.cam) {
        const ubbaX = state.anomaly.x - state.viewOffset.x;
        const ubbaY = state.anomaly.y - state.viewOffset.y;
        
        if (ubbaX > -50 && ubbaX < CONFIG.WIDTH && 
            ubbaY > -50 && ubbaY < CONFIG.HEIGHT) {
            elements.ctx.drawImage(
                state.assets.ubbaSprite,
                ubbaX, ubbaY,
                64, 128
            );
        }
    }
    
    // Draw scanlines
    elements.ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
    elements.ctx.lineWidth = 1;
    for (let y = 0; y < CONFIG.HEIGHT; y += 2) {
        elements.ctx.beginPath();
        elements.ctx.moveTo(0, y);
        elements.ctx.lineTo(CONFIG.WIDTH, y);
        elements.ctx.stroke();
    }
}

// UI Updates
function updateUI() {
    elements.powerDisplay.textContent = `POWER: ${state.power}%`;
    elements.nightDisplay.textContent = `NIGHT ${state.currentNight}`;
    elements.camDisplay.textContent = `CAM ${state.currentCam}`;
    
    if (state.power < 30) {
        elements.powerDisplay.style.color = '#f00';
    }
}

function playStaticEffect() {
    elements.staticOverlay.style.opacity = '0.5';
    state.assets.staticSound.currentTime = 0;
    state.assets.staticSound.play();
    
    setTimeout(() => {
        elements.staticOverlay.style.opacity = '0';
    }, 300);
}

function showNightComplete() {
    const screen = document.getElementById('night-complete');
    screen.style.display = 'flex';
    
    setTimeout(() => {
        screen.style.display = 'none';
    }, 3000);
}

// Main Game Loop
function gameLoop() {
    if (state.gameActive) {
        render();
        updateUI();
    }
    requestAnimationFrame(gameLoop);
}

// Start the game when assets load
window.onload = function() {
    document.getElementById('restart-btn').onclick = () => {
        location.reload();
    };
    
    state.assets.ubbaSprite.onload = initGame;
};
