// DOOM-style renderer setup
const canvas = document.getElementById('camera-view');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Game state
const gameState = {
    currentCamera: 0,
    power: 100,
    time: 0,
    night: 1,
    ubbaPosition: 0,
    cameras: [
        { name: "Lobby", anomalyChance: 0.1 },
        { name: "West Hall", anomalyChance: 0.3 },
        { name: "East Hall", anomalyChance: 0.3 },
        { name: "Storage", anomalyChance: 0.5 },
        { name: "Backstage", anomalyChance: 0.7 }
    ],
    ubbaSprites: [
        // These would be your actual sprite references
        { x: 100, y: 200, w: 64, h: 128 },
        { x: 300, y: 150, w: 64, h: 128 },
        // Add more positions as needed
    ]
};

// Initialize camera buttons
function initCameras() {
    const container = document.getElementById('camera-select');
    gameState.cameras.forEach((cam, i) => {
        const btn = document.createElement('button');
        btn.className = 'camera-btn';
        btn.textContent = `CAM ${i+1}`;
        btn.onclick = () => switchCamera(i);
        container.appendChild(btn);
    });
}

// Switch camera view
function switchCamera(index) {
    if(gameState.power <= 0) return;
    
    gameState.currentCamera = index;
    gameState.power -= 2;
    updatePower();
    renderCameraView();
}

// Update power display
function updatePower() {
    const meter = document.getElementById('power-meter');
    meter.textContent = `POWER: ${Math.max(0, gameState.power)}%`;
    
    if(gameState.power <= 0) {
        meter.style.color = '#f00';
        // Game over logic would go here
    }
}

// Main render function
function renderCameraView() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw camera feed (pixelated background)
    drawPixelatedBackground();
    
    // Chance to show Ubba
    if(Math.random() < gameState.cameras[gameState.currentCamera].anomalyChance) {
        const sprite = gameState.ubbaSprites[Math.floor(Math.random() * gameState.ubbaSprites.length)];
        drawUbba(sprite);
    }
    
    // Add scanlines for effect
    drawScanlines();
}

// DOOM-style effects
function drawPixelatedBackground() {
    // This would use your actual camera images
    ctx.fillStyle = '#111';
    for(let x = 0; x < canvas.width; x += 4) {
        for(let y = 0; y < canvas.height; y += 4) {
            if(Math.random() > 0.7) {
                ctx.fillStyle = `rgb(0, ${Math.floor(Math.random() * 55) + 200}, 0)`;
                ctx.fillRect(x, y, 4, 4);
            }
        }
    }
}

function drawUbba(sprite) {
    // Simple pixelated Ubba sprite
    ctx.fillStyle = '#8b0000';
    for(let x = 0; x < sprite.w; x += 2) {
        for(let y = 0; y < sprite.h; y += 2) {
            if(Math.random() > 0.3) {
                ctx.fillRect(sprite.x + x, sprite.y + y, 2, 2);
            }
        }
    }
    
    // Eyes glow effect
    if(Math.random() > 0.8) {
        ctx.fillStyle = '#f00';
        ctx.fillRect(sprite.x + 15, sprite.y + 30, 8, 8);
        ctx.fillRect(sprite.x + 40, sprite.y + 30, 8, 8);
    }
}

function drawScanlines() {
    ctx.strokeStyle = 'rgba(0, 80, 0, 0.3)';
    for(let y = 0; y < canvas.height; y += 2) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Game loop
function gameLoop() {
    gameState.time++;
    
    // Drain power over time
    if(gameState.time % 60 === 0) {
        gameState.power -= 0.5;
        updatePower();
    }
    
    // Random static/flashes
    if(Math.random() < 0.05) {
        ctx.fillStyle = '#0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setTimeout(() => renderCameraView(), 100);
    }
    
    renderCameraView();
    requestAnimationFrame(gameLoop);
}

// Initialize game
initCameras();
renderCameraView();
gameLoop();
