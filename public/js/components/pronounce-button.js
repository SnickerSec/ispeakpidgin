// Generic pronunciation button handler for what-does-*-mean pages
// Looks for a #pronounce-word button and reads data-word attribute (or falls back to page title)
(function() {
    var btn = document.getElementById('pronounce-word');
    if (!btn) return;

    var word = btn.getAttribute('data-word');
    if (!word) {
        // Fallback: extract word from page title pattern "What Does X Mean"
        var title = document.title || '';
        var match = title.match(/what does (.+?) mean/i);
        if (match) word = match[1];
    }
    if (!word) return;

    btn.addEventListener('click', function() {
        if (typeof pidginSpeech !== 'undefined') {
            pidginSpeech.speak(word);
        } else if (window.speechSynthesis) {
            var utterance = new SpeechSynthesisUtterance(word);
            utterance.rate = 0.8;
            window.speechSynthesis.speak(utterance);
        }
    });
})();
