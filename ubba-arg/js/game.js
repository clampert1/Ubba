// =============================================
// DOOM-STYLE FNAF GAME - UBBA ANOMALY DETECTION
// =============================================
import { DOOMRenderer, DOOM_PALETTE } from './doom-style.js';

// Game Configuration
const CONFIG = {
    WIDTH: 640,
    HEIGHT: 480,
    POWER_DRAIN: 0.2, // % per second
    CAMERA_SWITCH_COST: 2, // % power
    NIGHT_DURATION: 360, // seconds (6 minutes)
    UBBA_APPEARANCE_RATES: [0.1, 0.2, 0.3, 0.4, 0.5] // Per night
};

// Game State
const state = {
    currentNight: 1,
    currentCamera: 0,
    power: 100,
    time: 0,
    gameActive: true,
    ubbaVisible: false,
    ubbaPosition: { x: 0, y: 0, w: 64, h: 128 },
    cameras: [
        { name: "LOBBY", anomalyChance: 0.1 },
        { name: "WEST HALL", anomalyChance: 0.2 },
        { name: "EAST HALL", anomalyChance: 0.3 },
        { name: "STORAGE", anomalyChance: 0.4 },
        { name: "BACKSTAGE", anomalyChance: 0.5 }
    ],
    assets: {
        ubbaSprite: new Image(),
        cameraBackgrounds: [],
        staticSound: new Audio('assets/sounds/static.mp3'),
        jumpscareSound: new Audio('assets/sounds/jumpscare.mp3')
    }
};

// DOM Elements
const elements = {
    canvas: document.getElementById('camera-view'),
    ctx: document.getElementById('camera-view').getContext('2d'),
    cameraSelect: document.getElementById('camera-select'),
    powerMeter: document.getElementById('power-meter'),
    nightCounter: document.getElementById('night-counter'),
    staticOverlay: document.createElement('div'),
    jumpscareOverlay: document.createElement('div'),
    gameOverScreen: document.createElement('div')
};

// Initialize the game
function initGame() {
    // Set up canvas
    elements.canvas.width = CONFIG.WIDTH;
    elements.canvas.height = CONFIG.HEIGHT;
    elements.ctx.imageSmoothingEnabled = false;

    // Load assets
    loadAssets();

    // Create UI elements
    createCameraButtons();
    createOverlays();

    // Start game loop
    gameLoop();
}

// Load game assets
function loadAssets() {
    // Load Ubba sprite
    state.assets.ubbaSprite.src = 'assets/sprites/ubba.png';

    // Load camera backgrounds
    for (let i = 0; i < state.cameras.length; i++) {
        const img = new Image();
        img.src = `assets/cameras/cam${i+1}.png`;
        state.assets.cameraBackgrounds.push(img);
    }

    // Configure sounds
    state.assets.staticSound.loop = true;
    state.assets.staticSound.volume = 0.3;
    state.assets.jumpscareSound.volume = 0.7;
}

// Create camera selection buttons
function createCameraButtons() {
    state.cameras.forEach((cam, index) => {
        const btn = document.createElement('button');
        btn.className = 'camera-btn';
        btn.textContent = `CAM ${index+1}`;
        btn.onclick = () => switchCamera(index);
        elements.cameraSelect.appendChild(btn);
    });
}

// Create visual effect overlays
function createOverlays() {
    // Static overlay
    elements.staticOverlay.className = 'static-overlay';
    document.body.appendChild(elements.staticOverlay);

    // Jumpscare overlay
    elements.jumpscareOverlay.className = 'jumpscare-overlay';
    document.body.appendChild(elements.jumpscareOverlay);

    // Game over screen
    elements.gameOverScreen.id = 'game-over';
    elements.gameOverScreen.innerHTML = `
        <h1>GAME OVER</h1>
        <p>NIGHT ${state.currentNight} FAILED</p>
        <button id="restart-btn">TRY AGAIN</button>
    `;
    document.body.appendChild(elements.gameOverScreen);
    document.getElementById('restart-btn').onclick = resetGame;
}

// Switch camera view
function switchCamera(index) {
    if (!state.gameActive || state.power <= 0) return;
    
    // Play static sound and effect
    playStaticEffect();
    
    // Update state
    state.currentCamera = index;
    state.power -= CONFIG.CAMERA_SWITCH_COST;
    updatePowerDisplay();
    
    // Check for Ubba appearance
    checkForUbba();
}

// Play static transition effect
function playStaticEffect() {
    elements.staticOverlay.style.opacity = '0.7';
    state.assets.staticSound.currentTime = 0;
    state.assets.staticSound.play();
    
    setTimeout(() => {
        elements.staticOverlay.style.opacity = '0';
        state.assets.staticSound.pause();
    }, 300);
}

// Check if Ubba should appear
function checkForUbba() {
    const chance = state.cameras[state.currentCamera].anomalyChance * 
                  state.UBBA_APPEARANCE_RATES[state.currentNight-1];
    
    state.ubbaVisible = Math.random() < chance;
    
    if (state.ubbaVisible) {
        // Random position in camera view
        state.ubbaPosition = {
            x: Math.floor(Math.random() * (CONFIG.WIDTH - 100)),
            y: Math.floor(Math.random() * (CONFIG.HEIGHT - 200)),
            w: 64,
            h: 128
        };
        
        // Chance for jumpscare
        if (Math.random() < 0.1) {
            setTimeout(triggerJumpscare, 2000);
        }
    }
}

// Trigger jumpscare
function triggerJumpscare() {
    if (!state.gameActive) return;
    
    state.gameActive = false;
    elements.jumpscareOverlay.style.opacity = '1';
    state.assets.jumpscareSound.play();
    
    // Show game over after jumpscare
    setTimeout(() => {
        elements.jumpscareOverlay.style.opacity = '0';
        elements.gameOverScreen.style.display = 'flex';
    }, 1000);
}

// Update power display
function updatePowerDisplay() {
    elements.powerMeter.textContent = `POWER: ${Math.max(0, Math.floor(state.power))}%`;
    
    if (state.power <= 0) {
        gameOver();
    }
}

// Game over state
function gameOver() {
    state.gameActive = false;
    elements.gameOverScreen.style.display = 'flex';
}

// Reset game for retry
function resetGame() {
    state.power = 100;
    state.time = 0;
    state.gameActive = true;
    state.ubbaVisible = false;
    elements.gameOverScreen.style.display = 'none';
    updatePowerDisplay();
}

// Render game frame
function render() {
    // Clear canvas
    elements.ctx.fillStyle = '#000';
    elements.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    
    // Draw camera background
    if (state.assets.cameraBackgrounds[state.currentCamera].complete) {
        elements.ctx.drawImage(
            state.assets.cameraBackgrounds[state.currentCamera],
            0, 0, CONFIG.WIDTH, CONFIG.HEIGHT
        );
    } else {
        // Fallback: Draw pixelated background
        drawPixelBackground();
    }
    
    // Draw Ubba if visible
    if (state.ubbaVisible && state.assets.ubbaSprite.complete) {
        drawUbba();
    }
    
    // Apply CRT effects
    drawCRTEffects();
}

// Draw pixel background (fallback)
function drawPixelBackground() {
    elements.ctx.fillStyle = '#111';
    for (let x = 0; x < CONFIG.WIDTH; x += 4) {
        for (let y = 0; y < CONFIG.HEIGHT; y += 4) {
            if (Math.random() > 0.7) {
                elements.ctx.fillStyle = `rgb(0, ${Math.floor(Math.random() * 55) + 200}, 0)`;
                elements.ctx.fillRect(x, y, 4, 4);
            }
        }
    }
}

// Draw Ubba sprite
function drawUbba() {
    // Draw base sprite
    elements.ctx.drawImage(
        state.assets.ubbaSprite,
        state.ubbaPosition.x,
        state.ubbaPosition.y,
        state.ubbaPosition.w,
        state.ubbaPosition.h
    );
    
    // Add glowing eyes effect
    if (Math.random() > 0.9) {
        elements.ctx.fillStyle = '#f00';
        elements.ctx.fillRect(
            state.ubbaPosition.x + 20,
            state.ubbaPosition.y + 30,
            8, 8
        );
        elements.ctx.fillRect(
            state.ubbaPosition.x + 36,
            state.ubbaPosition.y + 30,
            8, 8
        );
    }
}

// Draw CRT screen effects
function drawCRTEffects() {
    // Scanlines
    elements.ctx.strokeStyle = 'rgba(0, 80, 0, 0.3)';
    elements.ctx.lineWidth = 1;
    for (let y = 0; y < CONFIG.HEIGHT; y += 2) {
        elements.ctx.beginPath();
        elements.ctx.moveTo(0, y);
        elements.ctx.lineTo(CONFIG.WIDTH, y);
        elements.ctx.stroke();
    }
    
    // Vignette effect
    const gradient = elements.ctx.createRadialGradient(
        CONFIG.WIDTH/2, CONFIG.HEIGHT/2, CONFIG.HEIGHT*0.4,
        CONFIG.WIDTH/2, CONFIG.HEIGHT/2, CONFIG.HEIGHT*0.8
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    elements.ctx.fillStyle = gradient;
    elements.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    
    // Random static flashes
    if (Math.random() < 0.02) {
        elements.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        elements.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    }
}

// Main game loop
function gameLoop() {
    if (state.gameActive) {
        // Update game state
        state.time++;
        state.power -= CONFIG.POWER_DRAIN / 60; // Drain power per frame
        
        // Check for night completion
        if (state.time >= CONFIG.NIGHT_DURATION * 60) {
            nightComplete();
        }
        
        // Random chance to change Ubba visibility
        if (Math.random() < 0.01) {
            checkForUbba();
        }
        
        // Update UI
        updatePowerDisplay();
        elements.nightCounter.textContent = `NIGHT ${state.currentNight}`;
    }
    
    // Render frame
    render();
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

// Night complete handler
function nightComplete() {
    state.currentNight++;
    state.time = 0;
    state.power = 100;
    
    // Show night complete screen
    const nightCompleteScreen = document.createElement('div');
    nightCompleteScreen.id = 'night-complete';
    nightCompleteScreen.innerHTML = `
        <h1>NIGHT ${state.currentNight-1} COMPLETE</h1>
        <p>ADVANCING TO NIGHT ${state.currentNight}</p>
    `;
    document.body.appendChild(nightCompleteScreen);
    
    // Continue after delay
    setTimeout(() => {
        document.body.removeChild(nightCompleteScreen);
    }, 3000);
}

// Initialize game when assets load
window.onload = function() {
    state.assets.ubbaSprite.onload = initGame;
    state.assets.cameraBackgrounds.forEach(img => {
        img.onload = () => console.log('Background loaded');
    });
};
