// Generic pronunciation button handler for what-does-*-mean pages
// Looks for .pronounce-btn buttons and reads data-word attribute
(function() {
    function extractWord(el) {
        var word = el && el.getAttribute('data-word');
        if (word) return word.trim();
        var title = (typeof document !== 'undefined' && document.title) || '';
        var legacyMatch = title.match(/what does (.+?) mean/i);
        if (legacyMatch) return legacyMatch[1].replace(/['"“”]/g, '').trim();
        var answerFirstMatch = title.match(/^([^:|–—-]+?)\s+Meaning\b/i);
        if (answerFirstMatch) return answerFirstMatch[1].replace(/['"“”]/g, '').trim();
        if (typeof window !== 'undefined' && window.location && window.location.pathname) {
            var pathMatch = window.location.pathname.match(/what-does-([a-z0-9-]+)-mean/i);
            if (pathMatch) return pathMatch[1].replace(/-/g, ' ').trim();
        }
        return '';
    }

    // Audio Speak Handler
    document.querySelectorAll('.pronounce-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            var word = extractWord(btn);
            if (!word) return;

            if (typeof pidginSpeech !== 'undefined') {
                pidginSpeech.speak(word);
            } else if (typeof window !== 'undefined' && window.speechSynthesis && window.SpeechSynthesisUtterance) {
                // Track fallback play event
                if (window.gtag) {
                    window.gtag('event', 'pronunciation_play', {
                        'word': word,
                        'provider': 'Browser_Direct'
                    });
                }
                var utterance = new window.SpeechSynthesisUtterance(word);
                utterance.rate = 0.8;
                window.speechSynthesis.speak(utterance);
            }
        });
    });

    // Handle download buttons
    document.querySelectorAll('#download-audio, .download-btn').forEach(dlBtn => {
        dlBtn.addEventListener('click', async function() {
            var word = extractWord(dlBtn);
            if (!word) return;

            // Track audio download event
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'pronunciation_download', {
                    'word': word
                });
            }

            // Same source as the play button: the server's TTS route, which serves the stored
            // clip from translation_cache (or makes one). audio-assets/index.json used to be read
            // here, and for some words it still pointed at clips the server had since replaced.
            const originalHtml = dlBtn.innerHTML;
            dlBtn.innerHTML = '<iconify-icon icon="lucide:loader-2" class="animate-spin"></iconify-icon> Downloading...';
            dlBtn.disabled = true;
            try {
                const response = await fetch('/api/text-to-speech', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: word, originalText: word })
                });
                if (!response.ok) throw new Error('TTS request failed: ' + response.status);
                const blob = await response.blob();
                if (!blob.size) throw new Error('Empty audio');
                const blobUrl = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = blobUrl;
                anchor.download = `${word.toLowerCase().replace(/\s+/g, '-')}.mp3`;
                document.body.appendChild(anchor);
                anchor.click();
                document.body.removeChild(anchor);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
            } catch (e) {
                console.warn('Audio download error:', e);
                alert('Aloha! Audio service is currently unavailable for direct downloads.');
            } finally {
                dlBtn.innerHTML = originalHtml;
                dlBtn.disabled = false;
            }
        });
    });

    // Handle share image buttons
    document.querySelectorAll('#share-image-btn, .share-image-btn').forEach(shareBtn => {
        shareBtn.addEventListener('click', function() {
            var word = extractWord(shareBtn);
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'pronunciation_share_click', {
                    'word': word
                });
            }
        });
    });
})();
