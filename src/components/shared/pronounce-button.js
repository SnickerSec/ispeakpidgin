// Generic pronunciation button handler for what-does-*-mean pages
// Looks for .pronounce-btn buttons and reads data-word attribute
(function() {
    // Audio Speak Handler
    document.querySelectorAll('.pronounce-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            var word = btn.getAttribute('data-word');
            if (!word) {
                // Fallback: extract word from page title pattern "What Does X Mean"
                var title = document.title || '';
                var match = title.match(/what does (.+?) mean/i);
                if (match) word = match[1];
            }
            if (!word) return;

            if (typeof pidginSpeech !== 'undefined') {
                pidginSpeech.speak(word);
            } else if (window.speechSynthesis) {
                var utterance = new SpeechSynthesisUtterance(word);
                utterance.rate = 0.8;
                window.speechSynthesis.speak(utterance);
            }
        });
    });

    // Handle download buttons
    document.querySelectorAll('.download-btn').forEach(dlBtn => {
        dlBtn.addEventListener('click', async function() {
            var word = dlBtn.getAttribute('data-word');
            if (!word) {
                var title = document.title || '';
                var match = title.match(/what does (.+?) mean/i);
                if (match) word = match[1];
            }
            if (!word) return;

            try {
                // Try to find pre-generated audio filename from index
                const response = await fetch('/assets/audio/index.json');
                if (!response.ok) throw new Error('Index not found');
                
                const index = await response.json();
                const filename = index[word.toLowerCase()];
                
                if (filename) {
                    const audioUrl = `/assets/audio/${filename}`;
                    const anchor = document.createElement('a');
                    anchor.href = audioUrl;
                    anchor.download = `${word.toLowerCase().replace(/\s+/g, '-')}.mp3`;
                    document.body.appendChild(anchor);
                    anchor.click();
                    document.body.removeChild(anchor);
                } else {
                    alert('Aloha! Offline download for "' + word + '" not yet available. Please check back soon!');
                }
            } catch (e) {
                console.warn('Audio download error:', e);
                alert('Aloha! Audio service is currently unavailable for direct downloads.');
            }
        });
    });
})();
