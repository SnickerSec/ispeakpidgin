(function() {
    var API_URL = '/api/dictionary/daily';

    // Load Word of the Day
    async function loadWordOfDay() {
        var loadingEl = document.getElementById('wod-loading');
        var contentEl = document.getElementById('wod-content');

        if (!loadingEl || !contentEl) return;

        try {
            var response = await fetch(API_URL);
            if (!response.ok) throw new Error('API unavailable');

            var data = await response.json();
            var word = data.word;

            if (word) {
                displayWord(word);
                loadingEl.classList.add('hidden');
                contentEl.classList.remove('hidden');
                
                // Initialize notifications UI if available
                initNotifications(word);
            }
        } catch (error) {
            console.warn('Daily word API unavailable, using fallback');
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
        if (!word) return;
        
        const pidginEl = document.getElementById('wod-pidgin');
        const englishEl = document.getElementById('wod-english');
        const pronEl = document.getElementById('wod-pronunciation');
        const exEl = document.getElementById('wod-example');
        const catEl = document.getElementById('wod-category');
        const diffEl = document.getElementById('wod-difficulty');
        const linkEl = document.getElementById('wod-link');

        if (pidginEl) pidginEl.textContent = word.pidgin;
        if (englishEl) englishEl.textContent = Array.isArray(word.english)
            ? word.english.join(', ')
            : word.english;
        if (pronEl) pronEl.textContent = word.pronunciation
            ? 'Pronunciation: ' + word.pronunciation
            : '';
        if (exEl) exEl.textContent = word.examples && word.examples[0]
            ? '"' + word.examples[0] + '"'
            : '';
        if (catEl) catEl.textContent = word.category || 'general';
        if (diffEl) diffEl.textContent = word.difficulty || 'beginner';

        // Create slug for link
        if (linkEl) {
            var slug = word.pidgin.toLowerCase()
                .replace(/[ʻ'‘`]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            linkEl.href = '/word/' + slug + '.html';
        }

        // Store word for speak button
        window.currentWodWord = word;
    }

    function initNotifications(word) {
        const notifyBtn = document.getElementById('notify-wod');
        if (!notifyBtn) return;

        // Check if supported and not already denied
        if (!("Notification" in window) || Notification.permission === "denied") {
            notifyBtn.style.display = 'none';
            return;
        }

        if (Notification.permission === "granted") {
            updateNotifyBtnStatus(true);
        }

        notifyBtn.addEventListener('click', async () => {
            if (Notification.permission !== "granted") {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    showDailyNotification(word, true);
                    updateNotifyBtnStatus(true);
                }
            } else {
                // Already granted, show a test one
                showDailyNotification(word, true);
            }
        });
    }

    function updateNotifyBtnStatus(isEnabled) {
        const notifyBtn = document.getElementById('notify-wod');
        if (!notifyBtn) return;
        
        if (isEnabled) {
            notifyBtn.innerHTML = '<i class="ti ti-bell-ringing"></i> Notifications On';
            notifyBtn.classList.remove('bg-blue-100', 'text-blue-700');
            notifyBtn.classList.add('bg-green-100', 'text-green-700');
        }
    }

    function showDailyNotification(word, isTest = false) {
        const title = isTest ? "Daily Word Notifications Active! 🤙" : "Today's Pidgin Word: " + word.pidgin;
        const options = {
            body: Array.isArray(word.english) ? word.english[0] : word.english,
            icon: '/apple-touch-icon.png',
            badge: '/favicon.ico',
            tag: 'daily-word'
        };

        if (Notification.permission === "granted") {
            new Notification(title, options);
        }
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

        // New word button (changed to "Random Word" in deterministic mode)
        var newBtn = document.getElementById('new-wod');
        if (newBtn) {
            newBtn.innerHTML = '<i class="ti ti-arrows-shuffle"></i> Random Word';
            newBtn.addEventListener('click', function() {
                window.location.href = '/dictionary.html?random=true';
            });
        }
    });
})();
