/**
 * Voice Visualizer Component
 * Creates a CSS-based voice waveform animation
 */

class VoiceVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.isActive = false;
        this.bars = [];
        this.init();
    }

    init() {
        if (!this.container) return;

        // Create HTML structure
        this.container.innerHTML = `
            <div class="voice-visualizer-bars flex items-end justify-center gap-1 h-10 py-2">
                ${Array(16).fill(0).map((_, i) => `<div class="v-bar w-1.5 bg-gradient-to-t from-red-500 to-pink-400 rounded-full h-2 shadow-sm"></div>`).join('')}
            </div>
        `;

        this.bars = this.container.querySelectorAll('.v-bar');
        
        // Add CSS if not present
        if (!document.getElementById('voice-visualizer-styles')) {
            const style = document.createElement('style');
            style.id = 'voice-visualizer-styles';
            style.innerHTML = `
                @keyframes voice-bar-pulse {
                    0% { height: 15%; opacity: 0.6; transform: scaleY(1); }
                    50% { height: 100%; opacity: 1; transform: scaleY(1.2); }
                    100% { height: 15%; opacity: 0.6; transform: scaleY(1); }
                }
                .v-bar.animating {
                    animation: voice-bar-pulse 0.5s ease-in-out infinite;
                    transform-origin: bottom;
                }
            `;
            document.head.appendChild(style);
        }
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.container.classList.remove('hidden');
        
        this.bars.forEach((bar, i) => {
            // Stagger animations
            bar.style.animationDelay = `${i * 0.05}s`;
            bar.style.animationDuration = `${0.4 + Math.random() * 0.4}s`;
            bar.classList.add('animating');
        });
    }

    stop() {
        this.isActive = false;
        this.container.classList.add('hidden');
        this.bars.forEach(bar => {
            bar.classList.remove('animating');
        });
    }
}

if (typeof window !== 'undefined') {
    window.VoiceVisualizer = VoiceVisualizer;
}
