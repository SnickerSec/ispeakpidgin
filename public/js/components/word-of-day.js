(function() {
    var API_URL = '/api/dictionary/random';

    // Load Word of the Day
    async function loadWordOfDay() {
        var loadingEl = document.getElementById('wod-loading');
        var contentEl = document.getElementById('wod-content');

        if (!loadingEl || !contentEl) return;

        try {
            var response = await fetch(API_URL + '?count=1&_t=' + Date.now());
            if (!response.ok) throw new Error('API unavailable');

            var data = await response.json();
            var word = data.entries[0];

            if (word) {
                displayWord(word);
                loadingEl.classList.add('hidden');
                contentEl.classList.remove('hidden');
            }
        } catch (error) {
            console.warn('Word of Day API unavailable, using fallback');
            displayWord({
                pidgin: 'Howzit',
                english: ['Hello', 'How are you'],
                pronunciation: 'HOW-zit',
                examples: ['Howzit brah, long time no see!'],
                category: 'greetings',
                difficulty: 'beginner'
            });
            loadingEl.classList.add('hidden');
            contentEl.classList.remove('hidden');
        }
    }

    function displayWord(word) {
        document.getElementById('wod-pidgin').textContent = word.pidgin;
        document.getElementById('wod-english').textContent = Array.isArray(word.english)
            ? word.english.join(', ')
            : word.english;
        document.getElementById('wod-pronunciation').textContent = word.pronunciation
            ? 'Pronunciation: ' + word.pronunciation
            : '';
        document.getElementById('wod-example').textContent = word.examples && word.examples[0]
            ? '"' + word.examples[0] + '"'
            : '';
        document.getElementById('wod-category').textContent = word.category || 'general';
        document.getElementById('wod-difficulty').textContent = word.difficulty || 'beginner';

        // Create slug for link
        var slug = word.pidgin.toLowerCase()
            .replace(/'/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        document.getElementById('wod-link').href = '/word/' + slug + '.html';

        // Store word for speak button
        window.currentWodWord = word;
    }

    // Event handlers
    document.addEventListener('DOMContentLoaded', function() {
        loadWordOfDay();

        // Speak button
        var speakBtn = document.getElementById('speak-wod');
        if (speakBtn) {
            speakBtn.addEventListener('click', function() {
                if (window.currentWodWord && typeof pidginSpeech !== 'undefined') {
                    pidginSpeech.speak(window.currentWodWord.pidgin);
                } else if (window.currentWodWord && 'speechSynthesis' in window) {
                    var utterance = new SpeechSynthesisUtterance(window.currentWodWord.pidgin);
                    utterance.rate = 0.9;
                    speechSynthesis.speak(utterance);
                }
            });
        }

        // New word button
        var newBtn = document.getElementById('new-wod');
        if (newBtn) {
            newBtn.addEventListener('click', function() {
                var loadingEl = document.getElementById('wod-loading');
                var contentEl = document.getElementById('wod-content');
                loadingEl.classList.remove('hidden');
                contentEl.classList.add('hidden');
                loadWordOfDay();
            });
        }
    });
})();
