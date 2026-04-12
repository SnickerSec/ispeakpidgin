/**
 * Voice Chat Module
 * Handles speech-to-text for the AI Chat interface
 */

class VoiceChat {
    constructor(options = {}) {
        this.recognition = null;
        this.isListening = false;
        this.supported = false;
        
        this.onResult = options.onResult || (() => {});
        this.onError = options.onError || (() => {});
        this.onStart = options.onStart || (() => {});
        this.onEnd = options.onEnd || (() => {});
        this.onInterim = options.onInterim || (() => {});

        this.init();
    }

    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported');
            return;
        }

        this.supported = true;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.onStart();
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.onEnd();
        };

        this.recognition.onerror = (event) => {
            this.isListening = false;
            this.onError(event.error);
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                this.onResult(finalTranscript);
            } else if (interimTranscript) {
                this.onInterim(interimTranscript);
            }
        };
    }

    start() {
        if (!this.supported || this.isListening) return;
        try {
            this.recognition.start();
        } catch (err) {
            console.error('Recognition start error:', err);
        }
    }

    stop() {
        if (!this.supported || !this.isListening) return;
        this.recognition.stop();
    }

    toggle() {
        if (this.isListening) {
            this.stop();
        } else {
            this.start();
        }
    }
}

// Create global instance if in browser
if (typeof window !== 'undefined') {
    window.VoiceChat = VoiceChat;
}
