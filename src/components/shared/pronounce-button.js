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
                if (match) word = match[1].replace(/['"“”]/g, '').trim();
            }
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
    document.querySelectorAll('.download-btn').forEach(dlBtn => {
        dlBtn.addEventListener('click', async function() {
            var word = dlBtn.getAttribute('data-word');
            if (!word) {
                var title = document.title || '';
                var match = title.match(/what does (.+?) mean/i);
                if (match) word = match[1].replace(/['"“”]/g, '').trim();
            }
            if (!word) return;

            // Track audio download event
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'pronunciation_download', {
                    'word': word
                });
            }

            try {
                // Try to find pre-generated audio filename from index
                const supabaseStorageUrl = 'https://jfzgzjgdptowfbtljvyp.supabase.co/storage/v1/object/public/audio-assets';
                const response = await fetch(`${supabaseStorageUrl}/index.json`);
                if (!response.ok) throw new Error('Index not found');
                
                const index = await response.json();
                const filename = index[word.toLowerCase()];
                
                if (filename) {
                    const audioUrl = `${supabaseStorageUrl}/${filename}`;
                    const originalHtml = dlBtn.innerHTML;
                    dlBtn.innerHTML = '<i class="ti ti-loader animate-spin"></i> Downloading...';
                    dlBtn.disabled = true;

                    try {
                        const audioResponse = await fetch(audioUrl);
                        if (!audioResponse.ok) throw new Error('Failed to fetch audio file');
                        const blob = await audioResponse.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        
                        const anchor = document.createElement('a');
                        anchor.href = blobUrl;
                        anchor.download = `${word.toLowerCase().replace(/\s+/g, '-')}.mp3`;
                        document.body.appendChild(anchor);
                        anchor.click();
                        document.body.removeChild(anchor);
                        
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                    } catch (err) {
                        console.warn('Blob download failed, falling back to direct navigation:', err);
                        const anchor = document.createElement('a');
                        anchor.href = audioUrl;
                        anchor.target = '_blank';
                        anchor.click();
                    } finally {
                        dlBtn.innerHTML = originalHtml;
                        dlBtn.disabled = false;
                    }
                } else {
                    alert('Aloha! Offline download for "' + word + '" not yet available. Please check back soon!');
                }
            } catch (e) {
                console.warn('Audio download error:', e);
                alert('Aloha! Audio service is currently unavailable for direct downloads.');
            }
        });
    });

    // Handle share image buttons
    document.querySelectorAll('#share-image-btn, .share-image-btn').forEach(shareBtn => {
        shareBtn.addEventListener('click', function() {
            var word = shareBtn.getAttribute('data-word');
            if (!word) {
                var title = document.title || '';
                var match = title.match(/what does (.+?) mean/i);
                if (match) word = match[1];
            }
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'pronunciation_share_click', {
                    'word': word
                });
            }
        });
    });
})();
