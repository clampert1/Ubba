// Game Configuration
const CONFIG = {
    WIDTH: 740,
    HEIGHT: 580,
    POWER_DRAIN_INTERVAL: 15000, // 15 seconds
    POWER_DRAIN_AMOUNT: 5, // 5%
    CONSOLE_PENALTY: 15,
    VIEWPORT_OFFSET: 100,
    UBBA_CHILL_MIN: 15000, // 15 seconds
    UBBA_CHILL_MAX: 20000, // 20 seconds
    UBBA_FREAKOUT_MIN: 60000, // 1 minute
    UBBA_FREAKOUT_MAX: 120000, // 2 minutes
    PAN_SPEED: 8, // Smooth panning speed
    UBBA_WIDTH: 64,
    UBBA_HEIGHT: 128,
    UBBA_CENTER_RANGE: 100 // Pixel range from center for chill position
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
    ubbaState: 'hidden', // 'hidden', 'chill', 'freaking'
    ubbaPosition: { x: 0, y: 0 }, // Fixed position for current camera
    ubbaVelocity: { x: 0, y: 0 },
    assets: {
        cameras: [],
        ubbaSprite: new Image(),
        staticSound: document.getElementById('static-sound'),
        jumpscareSound: document.getElementById('jumpscare-sound'),
        ambientSound: document.getElementById('ambient-sound'),
        freakoutSound: new Audio('assets/sounds/jumpscare.mp3')
    },
    keys: {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    },
    nextUbbaStateChange: 0,
    powerDrainInterval: null,
    panInterval: null,
    anomalyAlertActive: false,
    gameStartTime: Date.now(),
    lastPanTime: Date.now(),
    cameraUbbaPositions: {} // Stores fixed Ubba positions for each camera
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
    consoleSubmit: document.getElementById('console-submit'),
    staticOverlay: document.getElementById('static-overlay'),
    anomalyAlert: document.getElementById('anomaly-alert'),
    leftArrow: document.getElementById('left-arrow'),
    rightArrow: document.getElementById('right-arrow'),
    gameContainer: document.getElementById('game-container'),
    restartBtn: document.getElementById('restart-btn')
};

// Initialize Game
function initGame() {
    // Setup canvas
    elements.canvas.width = CONFIG.WIDTH;
    elements.canvas.height = CONFIG.HEIGHT;
    elements.ctx.imageSmoothingEnabled = false;

    // Load assets and set fixed Ubba positions
    for (let i = 1; i <= 5; i++) {
        const img = new Image();
        img.src = `assets/cameras/cam${i}.png`;
        img.onload = function() {
            // Set fixed random position near center for this camera
            state.cameraUbbaPositions[i] = {
                x: (img.width/2) + (Math.random() * CONFIG.UBBA_CENTER_RANGE * 2) - CONFIG.UBBA_CENTER_RANGE,
                y: (img.height/2) + (Math.random() * CONFIG.UBBA_CENTER_RANGE * 2) - CONFIG.UBBA_CENTER_RANGE
            };
        };
        state.assets.cameras.push(img);
    }
    
    state.assets.ubbaSprite.src = 'assets/sprites/ubba.png';

    // Setup audio with fixed volumes
    state.assets.ambientSound.loop = true;
    state.assets.ambientSound.volume = 0.3; // Consistent volume
    state.assets.ambientSound.play();
    
    state.assets.freakoutSound.volume = 0.7;
    state.assets.staticSound.volume = 0.4;
    state.assets.jumpscareSound.volume = 0.8;

    // Set first anomaly
    setNewAnomaly();
    startUbbaSystem();

    // Setup controls
    setupControls();

    // Start systems
    startPowerDrain();
    gameLoop();
}

function startUbbaSystem() {
    // Start with chill Ubba
    setUbbaState('chill');
}

function setUbbaState(newState) {
    // Clean up previous state
    if (state.ubbaState === 'freaking') {
        state.assets.freakoutSound.pause();
        state.assets.freakoutSound.currentTime = 0;
    }

    state.ubbaState = newState;
    
    if (newState === 'hidden') {
        const delay = CONFIG.UBBA_CHILL_MIN + 
                     Math.random() * (CONFIG.UBBA_CHILL_MAX - CONFIG.UBBA_CHILL_MIN);
        state.nextUbbaStateChange = Date.now() + delay;
    }
    else if (newState === 'chill') {
        // Use the pre-set position for this camera
        if (state.cameraUbbaPositions[state.currentCam]) {
            state.ubbaPosition = state.cameraUbbaPositions[state.currentCam];
        }
        
        const delay = CONFIG.UBBA_CHILL_MIN + 
                     Math.random() * (CONFIG.UBBA_CHILL_MAX - CONFIG.UBBA_CHILL_MIN);
        state.nextUbbaStateChange = Date.now() + delay;
        
        setNewAnomaly();
    }
    else if (newState === 'freaking') {
        // Random position for freaking out
        state.ubbaPosition = {
            x: Math.random() * (CONFIG.WIDTH + CONFIG.VIEWPORT_OFFSET * 2),
            y: Math.random() * (CONFIG.HEIGHT + CONFIG.VIEWPORT_OFFSET * 2)
        };
        state.ubbaVelocity = {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10
        };
        
        // Show anomaly alert ONLY when freaking out
        state.anomalyAlertActive = true;
        elements.anomalyAlert.style.opacity = '1';
        setTimeout(() => {
            elements.anomalyAlert.style.opacity = '0';
            state.anomalyAlertActive = false;
        }, 2000);
        
        // Play looping freakout sound
        state.assets.freakoutSound.loop = true;
        state.assets.freakoutSound.play();
    }
}

function updateUbbaState() {
    if (Date.now() > state.nextUbbaStateChange) {
        if (state.ubbaState === 'hidden') {
            setUbbaState('chill');
        }
        else if (state.ubbaState === 'chill') {
            // After enough time, start freaking out
            if (Date.now() - state.gameStartTime > CONFIG.UBBA_FREAKOUT_MIN && 
                Math.random() < 0.3) {
                setUbbaState('freaking');
            } else {
                setUbbaState('hidden');
            }
        }
    }
}

function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (state.keys.hasOwnProperty(e.key)) {
            state.keys[e.key] = true;
            startPanning();
        }
        handleKeyPress(e);
    });
    
    document.addEventListener('keyup', (e) => {
        if (state.keys.hasOwnProperty(e.key)) {
            state.keys[e.key] = false;
            stopPanning();
        }
    });

    // Arrow click handlers
    elements.leftArrow.addEventListener('click', () => {
        const newCam = state.currentCam > 1 ? state.currentCam - 1 : 5;
        switchCamera(newCam);
    });
    
    elements.rightArrow.addEventListener('click', () => {
        const newCam = state.currentCam < 5 ? state.currentCam + 1 : 1;
        switchCamera(newCam);
    });

    // Console submit
    elements.consoleSubmit.addEventListener('click', checkAnswer);
}

function startPanning() {
    if (!state.panInterval) {
        state.panInterval = setInterval(() => {
            handlePanning();
        }, 16); // ~60fps
    }
}

function stopPanning() {
    if (state.panInterval) {
        clearInterval(state.panInterval);
        state.panInterval = null;
    }
}

function setNewAnomaly() {
    state.anomaly = {
        cam: Math.floor(Math.random() * 5) + 1,
        x: Math.floor(Math.random() * (CONFIG.WIDTH + CONFIG.VIEWPORT_OFFSET * 2)),
        y: Math.floor(Math.random() * (CONFIG.HEIGHT + CONFIG.VIEWPORT_OFFSET * 2))
    };
}

function startPowerDrain() {
    if (state.powerDrainInterval) {
        clearInterval(state.powerDrainInterval);
    }
    state.powerDrainInterval = setInterval(() => {
        if (!state.gameActive) return;
        state.power = Math.max(0, state.power - CONFIG.POWER_DRAIN_AMOUNT);
        updateUI();
        if (state.power <= 0) endGame(false);
    }, CONFIG.POWER_DRAIN_INTERVAL);
}

function handleKeyPress(e) {
    if (!state.gameActive) return;

    if (state.consoleVisible) {
        if (e.key === 'Enter') checkAnswer();
        return;
    }

    switch(e.key) {
        case 'Enter':
            toggleConsole();
            break;
        case '1': case '2': case '3': case '4': case '5':
            switchCamera(parseInt(e.key));
            break;
    }
}

function handlePanning() {
    const now = Date.now();
    const deltaTime = Math.min(now - state.lastPanTime, 100) / 16;
    state.lastPanTime = now;

    if (state.keys.ArrowUp) {
        state.viewOffset.y = Math.min(CONFIG.VIEWPORT_OFFSET, state.viewOffset.y + CONFIG.PAN_SPEED * deltaTime);
    }
    if (state.keys.ArrowDown) {
        state.viewOffset.y = Math.max(-CONFIG.VIEWPORT_OFFSET, state.viewOffset.y - CONFIG.PAN_SPEED * deltaTime);
    }
    if (state.keys.ArrowLeft) {
        state.viewOffset.x = Math.min(CONFIG.VIEWPORT_OFFSET, state.viewOffset.x + CONFIG.PAN_SPEED * deltaTime);
    }
    if (state.keys.ArrowRight) {
        state.viewOffset.x = Math.max(-CONFIG.VIEWPORT_OFFSET, state.viewOffset.x - CONFIG.PAN_SPEED * deltaTime);
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
        // End game after night 1 with success
        endGame(true);
    } else {
        state.power = Math.max(0, state.power - CONFIG.CONSOLE_PENALTY);
        if (Math.random() < 0.3) triggerJumpscare();
    }
    
    toggleConsole();
    elements.consoleInput.value = '';
    updateUI();
}

function switchCamera(camNum) {
    state.currentCam = camNum;
    state.viewOffset = { x: 0, y: 0 };
    playStaticEffect();
    updateUI();
}

function endGame(success) {
    state.gameActive = false;
    clearInterval(state.powerDrainInterval);
    clearInterval(state.panInterval);
    
    // Stop all sounds
    state.assets.ambientSound.pause();
    state.assets.freakoutSound.pause();
    state.assets.staticSound.pause();
    
    if (success) {
        const endingScreen = document.createElement('div');
        endingScreen.style.position = 'absolute';
        endingScreen.style.top = '0';
        endingScreen.style.left = '0';
        endingScreen.style.width = '100%';
        endingScreen.style.height = '100%';
        endingScreen.style.backgroundColor = 'black';
        endingScreen.style.color = '#0f0';
        endingScreen.style.display = 'flex';
        endingScreen.style.flexDirection = 'column';
        endingScreen.style.justifyContent = 'center';
        endingScreen.style.alignItems = 'center';
        endingScreen.style.zIndex = '1000';
        endingScreen.style.fontSize = '24px';
        endingScreen.innerHTML = `
            <h1>UBBA CONTAINED</h1>
            <p>SECURITY PROTOCOLS COMPLETE</p>
            <p>Thank you for your service</p>
            <button id="restart-button" style="margin-top: 20px; padding: 10px 20px; background: #8b0000; color: white; border: 1px solid red; cursor: pointer;">
                Play Again
            </button>
        `;
        elements.gameContainer.appendChild(endingScreen);
        
        document.getElementById('restart-button').addEventListener('click', () => {
            location.reload();
        });
    } else {
        document.getElementById('game-over').style.display = 'flex';
    }
}

function triggerJumpscare() {
    const jumpscare = document.createElement('div');
    jumpscare.style.position = 'absolute';
    jumpscare.style.top = '0';
    jumpscare.style.left = '0';
    jumpscare.style.width = '100%';
    jumpscare.style.height = '100%';
    jumpscare.style.backgroundImage = 'url(assets/sprites/ubba.png)';
    jumpscare.style.backgroundSize = 'cover';
    jumpscare.style.zIndex = '1000';
    elements.gameContainer.appendChild(jumpscare);
    
    state.assets.jumpscareSound.play();
    
    setTimeout(() => {
        jumpscare.remove();
        if (state.power <= 0) {
            endGame(false);
        }
    }, 2000);
}

function render() {
    // Clear canvas
    elements.ctx.fillStyle = '#000';
    elements.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    
    // Draw current camera view with offset
    if (state.assets.cameras[state.currentCam - 1]?.complete) {
        elements.ctx.filter = 'grayscale(100%)';
        elements.ctx.drawImage(
            state.assets.cameras[state.currentCam - 1],
            0, 0,
            state.assets.cameras[state.currentCam - 1].width,
            state.assets.cameras[state.currentCam - 1].height,
            state.viewOffset.x, state.viewOffset.y,
            CONFIG.WIDTH + (CONFIG.VIEWPORT_OFFSET * 2),
            CONFIG.HEIGHT + (CONFIG.VIEWPORT_OFFSET * 2)
        );
        elements.ctx.filter = 'none';
    }
    
    // Draw Ubba if visible on this camera
    if (state.ubbaState !== 'hidden' && state.currentCam === state.anomaly.cam) {
        let drawX, drawY;
        
        if (state.ubbaState === 'chill') {
            // Fixed position relative to camera image (not affected by panning)
            const fixedPos = state.cameraUbbaPositions[state.currentCam];
            drawX = fixedPos.x - (CONFIG.UBBA_WIDTH/2);
            drawY = fixedPos.y - (CONFIG.UBBA_HEIGHT/2);
        } else {
            // Freaking out - use dynamic position
            drawX = state.ubbaPosition.x - state.viewOffset.x - (CONFIG.UBBA_WIDTH/2);
            drawY = state.ubbaPosition.y - state.viewOffset.y - (CONFIG.UBBA_HEIGHT/2);
        }
        
        if (drawX > -CONFIG.UBBA_WIDTH && drawX < CONFIG.WIDTH && 
            drawY > -CONFIG.UBBA_HEIGHT && drawY < CONFIG.HEIGHT) {
            elements.ctx.drawImage(
                state.assets.ubbaSprite,
                drawX, drawY,
                CONFIG.UBBA_WIDTH, CONFIG.UBBA_HEIGHT
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

function updateUI() {
    elements.powerDisplay.textContent = `POWER: ${state.power}%`;
    elements.nightDisplay.textContent = `NIGHT ${state.currentNight}`;
    elements.camDisplay.textContent = `CAM ${state.currentCam}`;
    
    if (state.power < 30) {
        elements.powerDisplay.style.color = '#f00';
    } else {
        elements.powerDisplay.style.color = '#0f0';
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

function gameLoop() {
    if (state.gameActive) {
        // Update Ubba state
        updateUbbaState();
        
        // Update positions
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
        
        // Render
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
    
    // Start game when Ubba sprite loads
    const ubbaImg = new Image();
    ubbaImg.src = 'assets/sprites/ubba.png';
    ubbaImg.onload = initGame;
};
