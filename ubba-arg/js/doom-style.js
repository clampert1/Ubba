// DOOM-style rendering utilities
class DOOMRenderer {
    constructor(canvas) {
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx.imageSmoothingEnabled = false;
    }

    // Draw pixelated background
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

    // Draw scanlines
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

    // Draw DOOM-style sprite
    drawSprite(img, x, y, width, height, pixelSize = 2) {
        if (!img.complete) return;

        // Create off-screen canvas for pixelation
        const offscreen = document.createElement('canvas');
        offscreen.width = width;
        offscreen.height = height;
        const offCtx = offscreen.getContext('2d');
        offCtx.imageSmoothingEnabled = false;
        
        // Draw original image to offscreen canvas
        offCtx.drawImage(img, 0, 0, width, height);
        
        // Apply pixelation
        this.ctx.save();
        this.ctx.scale(pixelSize, pixelSize);
        this.ctx.drawImage(
            offscreen,
            0, 0, width, height,
            Math.floor(x/pixelSize), Math.floor(y/pixelSize),
            Math.floor(width/pixelSize), Math.floor(height/pixelSize)
        );
        this.ctx.restore();
    }

    // Draw DOOM-style health bar
    drawHealthBar(x, y, width, height, percent, color = '#f00') {
        const fillWidth = (width * percent) / 100;
        
        // Background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, y, width, height);
        
        // Health
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, fillWidth, height);
        
        // Border
        this.ctx.strokeStyle = '#0f0';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Damage effect
        if (percent < 30) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${Math.random() * 0.3})`;
            this.ctx.fillRect(x, y, width, height);
        }
    }

    // Create DOOM-style text
    drawText(text, x, y, color = '#0f0', size = 16, centered = false) {
        this.ctx.font = `${size}px 'Courier New', monospace`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = centered ? 'center' : 'left';
        this.ctx.fillText(text, x, y);
    }

    // Apply CRT distortion effect
    applyCRTEffect() {
        // Vignette
        const gradient = this.ctx.createRadialGradient(
            this.width/2, this.height/2, this.height*0.4,
            this.width/2, this.height/2, this.height*0.8
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Random static
        if (Math.random() < 0.02) {
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }
}

// DOOM-style color palette
const DOOM_PALETTE = {
    background: '#111',
    accent: '#8b0000',
    text: '#0f0',
    highlight: '#f00',
    ui: '#333'
};

// Helper function for pixelation
function createPixelatedImage(img, pixelSize = 2) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    // Draw original image
    ctx.drawImage(img, 0, 0);
    
    // Apply pixelation
    const small = document.createElement('canvas');
    small.width = img.width / pixelSize;
    small.height = img.height / pixelSize;
    const smallCtx = small.getContext('2d');
    smallCtx.imageSmoothingEnabled = false;
    smallCtx.drawImage(canvas, 0, 0, small.width, small.height);
    
    ctx.drawImage(small, 0, 0, small.width, small.height, 0, 0, canvas.width, canvas.height);
    
    return canvas;
}

// Export for use in game.js
export { DOOMRenderer, DOOM_PALETTE, createPixelatedImage };
