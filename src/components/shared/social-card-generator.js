/**
 * Social Card Generator
 * Creates beautiful tropical-themed square images for Instagram/TikTok sharing
 */
class SocialCardGenerator {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.size = 1080; // Instagram Square
        this.canvas.width = this.size;
        this.canvas.height = this.size;
    }

    async generate(options) {
        const {
            title,
            subtitle,
            category = 'general',
            type = 'word'
        } = options;

        const ctx = this.ctx;
        const s = this.size;

        // 1. Draw Background Gradient
        const grad = ctx.createLinearGradient(0, 0, s, s);
        if (category === 'food') {
            grad.addColorStop(0, '#f59e0b');
            grad.addColorStop(1, '#d97706');
        } else if (category === 'slang') {
            grad.addColorStop(0, '#8b5cf6');
            grad.addColorStop(1, '#7c3aed');
        } else {
            grad.addColorStop(0, '#0ea5e9');
            grad.addColorStop(1, '#2563eb');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, s, s);

        // 2. Draw Decorative Shapes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(s * 0.9, s * 0.1, s * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(s * 0.1, s * 0.9, s * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 3. Draw Main Card
        const margin = s * 0.08;
        const cardWidth = s - (margin * 2);
        const cardHeight = s * 0.6;
        const cardY = (s - cardHeight) / 2;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 20;
        
        ctx.fillStyle = 'white';
        this.roundRect(ctx, margin, cardY, cardWidth, cardHeight, 40, true);
        
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // 4. Draw Logo
        ctx.fillStyle = category === 'food' ? '#d97706' : '#2563eb';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('🏝️ ChokePidgin.com', margin + 60, cardY + 80);

        // 5. Draw Title (The Word)
        ctx.fillStyle = '#111827';
        ctx.font = 'black 120px sans-serif';
        if (title.length > 12) ctx.font = 'black 80px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, s / 2, cardY + 240);

        // 6. Draw Subtitle (The Meaning)
        ctx.fillStyle = '#4b5563';
        ctx.font = '500 48px sans-serif';
        const maxWidth = cardWidth - 120;
        this.wrapText(ctx, subtitle, s / 2, cardY + 340, maxWidth, 60);

        // 7. Footer text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Learn Hawaiian Pidgin Slang & Culture', s / 2, s - 80);

        return this.canvas.toDataURL('image/png');
    }

    roundRect(ctx, x, y, width, height, radius, fill) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (fill) ctx.fill();
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let testY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, testY);
                line = words[n] + ' ';
                testY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, testY);
    }

    download(dataUrl, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
    }
}

window.socialCardGenerator = new SocialCardGenerator();
