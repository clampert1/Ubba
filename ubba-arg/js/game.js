// DOOM Renderer (included directly for GitHub Pages compatibility)
class DOOMRenderer {
    constructor(canvas) {
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx.imageSmoothingEnabled = false;
    }

    drawPixelBackground(color1 = '#111', color2 = '#0a0') {
        this.ctx.fillStyle = color1;
        this.ctx.fillRect(0, 0, this.width, this.height);
        for (let x = 0; x < this.width; x += 4) {
            for (let y = 0; y < this.height; y += 4) {
                if (Math.random() > 0.7) {
                    this.ctx.fillStyle = color2;
                    this.ctx.fillRect(x, y, 4, 4);
                }
            }
        }
    }

    drawScanLines(opacity = 0.3) {
        this.ctx.strokeStyle = `rgba(0, 255, 0, ${opacity})`;
        this.ctx.lineWidth = 1;
        for (let y = 0; y < this.height; y += 2) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    drawSprite(img, x, y, width, height, pixelSize = 2) {
        if (!img.complete) return;
        this.ctx.save();
        this.ctx.scale(pixelSize, pixelSize);
        this.ctx.drawImage(
            img,
            0, 0, img.width, img.height,
            Math.floor(x/pixelSize), Math.floor(y/pixelSize),
            Math.floor(width/pixelSize), Math.floor(height/pixelSize)
        );
        this.ctx.restore();
    }

    drawHealthBar(x, y, width, height, percent, color = '#f00') {
        const fillWidth = (width * percent) / 100;
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, y, width, height);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, fillWidth, height);
        this.ctx.strokeStyle = '#0f0';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        if (percent < 30) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${Math.random() * 0.3})`;
            this.ctx.fillRect(x, y, width, height);
        }
    }

    drawText(text, x, y, color = '#0f0', size = 16, centered = false) {
        this.ctx.font = `${size}px 'Courier New', monospace`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = centered ? 'center' : 'left';
        this.ctx.fillText(text, x, y);
    }

    applyCRTEffect() {
        const gradient = this.ctx.createRadialGradient(
            this.width/2, this.height/2, this.height*0.4,
            this.width/2, this.height/2, this.height*0.8
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        if (Math.random() < 0.02) {
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }
}

// Game Configuration
const CONFIG = {
    WIDTH: 640,
    HEIGHT: 480,
    POWER_DRAIN: 0.2,
    CAMERA_SWITCH_COST: 2,
    NIGHT_DURATION: 360,
    UBBA_APPEARANCE_RATES: [0.1, 0.2, 0.3, 0.4, 0.5]
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
        jumpscareSound: new Audio('assets/sounds/jumpscare.mp3'),
        ambientSound: new Audio('assets/sounds/ambient.mp3')
    }
};

// Initialize DOOM Renderer
const renderer = new DOOMRenderer(document.getElementById('camera-view'));

// Initialize Game
function initGame() {
    loadAssets();
    createCameraButtons();
    createOverlays();
    state.assets.ambientSound.loop = true;
    state.assets.ambientSound.volume = 0.2;
    state.assets.ambientSound.play();
    gameLoop();
}

// [Rest of your existing game functions remain exactly the same until render()]

function render() {
    // Clear and draw background
    renderer.drawPixelBackground('#111', '#0a0');
    
    // Draw camera background
    if (state.assets.cameraBackgrounds[state.currentCamera].complete) {
        renderer.drawSprite(
            state.assets.cameraBackgrounds[state.currentCamera],
            0, 0, CONFIG.WIDTH, CONFIG.HEIGHT, 2
        );
    }
    
    // Draw Ubba
    if (state.ubbaVisible && state.assets.ubbaSprite.complete) {
        renderer.drawSprite(
            state.assets.ubbaSprite,
            state.ubbaPosition.x,
            state.ubbaPosition.y,
            state.ubbaPosition.w,
            state.ubbaPosition.h,
            3
        );
        
        // Eyes glow
        if (Math.random() > 0.9) {
            renderer.ctx.fillStyle = '#f00';
            renderer.ctx.fillRect(
                state.ubbaPosition.x + 20,
                state.ubbaPosition.y + 30,
                8, 8
            );
            renderer.ctx.fillRect(
                state.ubbaPosition.x + 36,
                state.ubbaPosition.y + 30,
                8, 8
            );
        }
    }
    
    // Apply effects
    renderer.drawScanLines();
    renderer.applyCRTEffect();
    
    // Draw UI
    renderer.drawText(`NIGHT ${state.currentNight}`, 20, 30, '#0f0', 18);
    renderer.drawHealthBar(
        CONFIG.WIDTH - 220, 20,
        200, 20,
        state.power,
        state.power > 30 ? '#0f0' : '#f00'
    );
}

// [Keep all other existing functions exactly the same]

// Start the game when assets load
window.onload = function() {
    state.assets.ubbaSprite.onload = initGame;
    state.assets.ubbaSprite.src = 'assets/sprites/ubba.png';
    
    // Load camera backgrounds
    for (let i = 0; i < state.cameras.length; i++) {
        const img = new Image();
        img.src = `assets/cameras/cam${i+1}.png`;
        state.assets.cameraBackgrounds.push(img);
    }
};
