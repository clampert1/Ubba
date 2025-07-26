// Game Configuration
const CONFIG = {
    WIDTH: 740,
    HEIGHT: 580,
    POWER_DRAIN_INTERVAL: 15000,
    POWER_DRAIN_AMOUNT: 5,
    CONSOLE_PENALTY: 15,
    VIEWPORT_OFFSET: 100,
    UBBA_FREAKOUT_DELAY: 60000, // Exactly 1 minute
    PAN_SPEED: 8,
    UBBA_WIDTH: 64,
    UBBA_HEIGHT: 128,
    UBBA_CENTER_RANGE: 100
};

// Game State
const state = {
    power: 100,
    gameActive: true,
    currentCam: 1,
    viewOffset: { x: 0, y: 0 },
    consoleVisible: false,
    ubbaState: 'hidden',
    ubbaPosition: { x: 0, y: 0 },
    ubbaVelocity: { x: 0, y: 0 },
    canReportAnomaly: false,
    gameStartTime: 0,
    lastPanTime: 0
};

// DOM Elements
const elements = {
    canvas: document.getElementById('camera-view'),
    ctx: document.getElementById('camera-view').getContext('2d'),
    powerDisplay: document.getElementById('power-meter'),
    camDisplay: document.getElementById('current-cam'),
    console: document.getElementById('console'),
    consoleInput: document.getElementById('console-input'),
    consoleSubmit: document.getElementById('console-submit'),
    staticOverlay: document.getElementById('static-overlay'),
    leftArrow: document.getElementById('left-arrow'),
    rightArrow: document.getElementById('right-arrow'),
    gameContainer: document.getElementById('game-container')
};

// Assets
const assets = {
    cameras: [],
    ubbaSprite: new Image(),
    staticSound: document.getElementById('static-sound'),
    jumpscareSound: document.getElementById('jumpscare-sound'),
    ambientSound: document.getElementById('ambient-sound')
};

// Initialize Game
function initGame() {
    // Setup canvas
    elements.canvas.width = CONFIG.WIDTH;
    elements.canvas.height = CONFIG.HEIGHT;
    elements.ctx.imageSmoothingEnabled = false;

    // Load camera images
    for (let i = 1; i <= 5; i++) {
        const img = new Image();
        img.src = `assets/cameras/cam${i}.png`;
        assets.cameras.push(img);
    }
    
    // Load Ubba sprite
    assets.ubbaSprite.src = 'assets/sprites/ubba.png';

    // Setup audio
    assets.ambientSound.loop = true;
    assets.ambientSound.volume = 0.3;
    assets.ambientSound.play().catch(e => console.log("Audio error:", e));
    
    assets.staticSound.volume = 0.4;
    assets.jumpscareSound.volume = 0.8;

    // Initialize game state
    state.gameStartTime = Date.now();
    setNewAnomaly();
    setupControls();
    startPowerDrain();
    gameLoop();
}

function setNewAnomaly() {
    state.anomaly = {
        cam: Math.floor(Math.random() * 5) + 1
    };
}

function startUbbaFreakout() {
    state.ubbaState = 'freaking';
    state.ubbaPosition = {
        x: Math.random() * (CONFIG.WIDTH + CONFIG.VIEWPORT_OFFSET * 2),
        y: Math.random() * (CONFIG.HEIGHT + CONFIG.VIEWPORT_OFFSET * 2)
    };
    state.ubbaVelocity = {
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 10
    };
    state.canReportAnomaly = true;
    
    // Play freakout sound on loop
    const freakoutSound = new Audio('assets/sounds/jumpscare.mp3');
    freakoutSound.loop = true;
    freakoutSound.volume = 0.7;
    freakoutSound.play().catch(e => console.log("Freakout sound error:", e));
}

function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
            startPanning();
        }
        handleKeyPress(e);
    });
    
    document.addEventListener('keyup', () => stopPanning());

    // Arrow click handlers
    elements.leftArrow.addEventListener('click', () => switchCamera(state.currentCam > 1 ? state.currentCam - 1 : 5));
    elements.rightArrow.addEventListener('click', () => switchCamera(state.currentCam < 5 ? state.currentCam + 1 : 1));
    elements.consoleSubmit.addEventListener('click', checkAnswer);
}

function switchCamera(camNum) {
    state.currentCam = camNum;
    state.viewOffset = { x: 0, y: 0 };
    playStaticEffect();
    updateUI();
}

function startPowerDrain() {
    setInterval(() => {
        if (!state.gameActive) return;
        state.power = Math.max(0, state.power - CONFIG.POWER_DRAIN_AMOUNT);
        updateUI();
        if (state.power <= 0) endGame(false);
    }, CONFIG.POWER_DRAIN_INTERVAL);
}

function gameLoop() {
    if (state.gameActive) {
        // Start freakout after 1 minute
        if (Date.now() - state.gameStartTime > CONFIG.UBBA_FREAKOUT_DELAY && state.ubbaState !== 'freaking') {
            startUbbaFreakout();
        }
        
        // Update positions if freaking out
        if (state.ubbaState === 'freaking') {
            state.ubbaPosition.x += state.ubbaVelocity.x;
            state.ubbaPosition.y += state.ubbaVelocity.y;
            
            // Bounce off edges
            if (state.ubbaPosition.x < 0 || state.ubbaPosition.x > CONFIG.WIDTH + CONFIG.VIEWPORT_OFFSET * 2) {
                state.ubbaVelocity.x *= -1;
            }
            if (state.ubbaPosition.y < 0 || state.ubbaPosition.y > CONFIG.HEIGHT + CONFIG.VIEWPORT_OFFSET * 2) {
                state.ubbaVelocity.y *= -1;
            }
        }
        
        render();
    }
    requestAnimationFrame(gameLoop);
}

function render() {
    // Clear canvas
    elements.ctx.fillStyle = '#000';
    elements.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    
    // Draw current camera view
    const camImage = assets.cameras[state.currentCam - 1];
    if (camImage.complete) {
        elements.ctx.drawImage(
            camImage,
            0, 0, camImage.width, camImage.height,
            state.viewOffset.x, state.viewOffset.y,
            CONFIG.WIDTH + (CONFIG.VIEWPORT_OFFSET * 2),
            CONFIG.HEIGHT + (CONFIG.VIEWPORT_OFFSET * 2)
        );
    }
    
    // Draw Ubba if visible
    if (state.ubbaState === 'freaking' && state.currentCam === state.anomaly.cam) {
        const drawX = state.ubbaPosition.x - state.viewOffset.x - (CONFIG.UBBA_WIDTH/2);
        const drawY = state.ubbaPosition.y - state.viewOffset.y - (CONFIG.UBBA_HEIGHT/2);
        
        if (drawX > -CONFIG.UBBA_WIDTH && drawX < CONFIG.WIDTH && 
            drawY > -CONFIG.UBBA_HEIGHT && drawY < CONFIG.HEIGHT) {
            elements.ctx.drawImage(
                assets.ubbaSprite,
                drawX, drawY,
                CONFIG.UBBA_WIDTH, CONFIG.UBBA_HEIGHT
            );
        }
    }
    
    updateUI();
}

// Start the game when window loads
window.addEventListener('load', initGame);
