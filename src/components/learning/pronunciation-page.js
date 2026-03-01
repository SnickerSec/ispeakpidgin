// Pronunciation practice page controller
document.addEventListener('DOMContentLoaded', function() {
    var micBtn = document.getElementById('mic-btn');
    var micStatus = document.getElementById('mic-status');
    var listenBtn = document.getElementById('listen-btn');
    var resultsSection = document.getElementById('results-section');
    var scoreNumber = document.getElementById('score-number');
    var starRating = document.getElementById('star-rating');
    var userSpoken = document.getElementById('user-spoken');
    var feedbackList = document.getElementById('feedback-list');
    var tryAgainBtn = document.getElementById('try-again-btn');
    var nextWordBtn = document.getElementById('next-word-btn');
    var wordGrid = document.getElementById('word-grid');
    var waveform = document.getElementById('waveform');
    var browserWarning = document.getElementById('browser-warning');

    var currentWord = null;
    var words = [];
    var currentDifficulty = 'beginner';
    var displayedCount = 12;

    if (!pronunciationPractice.isSupported()) {
        browserWarning.classList.remove('hidden');
        micBtn.disabled = true;
        micStatus.textContent = 'Speech recognition not supported';
    }

    var practiceWords = [
        { pidgin: "Howzit", pronunciation: "HOW-zit", english: "How is it? / Hello", difficulty: "beginner" },
        { pidgin: "Shoots", pronunciation: "shoots", english: "Okay / Sounds good", difficulty: "beginner" },
        { pidgin: "Brah", pronunciation: "brah", english: "Brother / Friend", difficulty: "beginner" },
        { pidgin: "Mahalo", pronunciation: "mah-HAH-lo", english: "Thank you", difficulty: "beginner" },
        { pidgin: "Aloha", pronunciation: "ah-LO-hah", english: "Hello / Love / Goodbye", difficulty: "beginner" },
        { pidgin: "Pau", pronunciation: "pow", english: "Finished / Done", difficulty: "beginner" },
        { pidgin: "Ono", pronunciation: "OH-no", english: "Delicious", difficulty: "beginner" },
        { pidgin: "Grindz", pronunciation: "grindz", english: "Food", difficulty: "beginner" },
        { pidgin: "Shaka", pronunciation: "SHAH-kah", english: "Hang loose / Cool", difficulty: "beginner" },
        { pidgin: "Da kine", pronunciation: "dah KYNE", english: "The thing / Whatchamacallit", difficulty: "beginner" },
        { pidgin: "Keiki", pronunciation: "KAY-kee", english: "Child / Children", difficulty: "beginner" },
        { pidgin: "Ohana", pronunciation: "oh-HAH-nah", english: "Family", difficulty: "beginner" },
        { pidgin: "Haole", pronunciation: "HOW-lee", english: "Foreigner / White person", difficulty: "beginner" },
        { pidgin: "Wahine", pronunciation: "wah-HEE-nay", english: "Woman", difficulty: "beginner" },
        { pidgin: "Kane", pronunciation: "KAH-nay", english: "Man", difficulty: "beginner" },
        { pidgin: "Tutu", pronunciation: "TOO-too", english: "Grandma / Grandpa", difficulty: "beginner" },
        { pidgin: "Poke", pronunciation: "POH-kay", english: "Raw fish dish", difficulty: "beginner" },
        { pidgin: "Lei", pronunciation: "lay", english: "Flower necklace", difficulty: "beginner" },
        { pidgin: "Hula", pronunciation: "HOO-lah", english: "Hawaiian dance", difficulty: "beginner" },
        { pidgin: "Luau", pronunciation: "LOO-ow", english: "Hawaiian feast", difficulty: "beginner" },
        { pidgin: "Pau hana", pronunciation: "pow HAH-nah", english: "After work / Happy hour", difficulty: "intermediate" },
        { pidgin: "Talk story", pronunciation: "talk STORE-ee", english: "Chat / Converse", difficulty: "intermediate" },
        { pidgin: "Mo bettah", pronunciation: "mo BET-tah", english: "Better / Much better", difficulty: "intermediate" },
        { pidgin: "Small kine", pronunciation: "small KYNE", english: "A little bit", difficulty: "intermediate" },
        { pidgin: "Chicken skin", pronunciation: "CHIK-en skin", english: "Goosebumps", difficulty: "intermediate" },
        { pidgin: "Broke da mouth", pronunciation: "broke da MOWTH", english: "Extremely delicious", difficulty: "intermediate" },
        { pidgin: "Ono grindz", pronunciation: "OH-no grindz", english: "Delicious food", difficulty: "intermediate" },
        { pidgin: "Rajah dat", pronunciation: "RAH-jah dat", english: "Roger that / Got it", difficulty: "intermediate" },
        { pidgin: "No worry", pronunciation: "no WUH-ree", english: "Don't worry", difficulty: "intermediate" },
        { pidgin: "Choke", pronunciation: "choke", english: "A lot / Plenty", difficulty: "intermediate" },
        { pidgin: "Mauka", pronunciation: "MOW-kah", english: "Toward the mountain", difficulty: "intermediate" },
        { pidgin: "Makai", pronunciation: "mah-KAI", english: "Toward the ocean", difficulty: "intermediate" },
        { pidgin: "Lidat", pronunciation: "lee-DAT", english: "Like that", difficulty: "intermediate" },
        { pidgin: "Bumbye", pronunciation: "bum-BYE", english: "Later / Eventually", difficulty: "intermediate" },
        { pidgin: "Stink eye", pronunciation: "stink EYE", english: "Dirty look", difficulty: "intermediate" },
        { pidgin: "Talk stink", pronunciation: "talk STINK", english: "Talk bad about someone", difficulty: "intermediate" },
        { pidgin: "Hang loose", pronunciation: "hang LOOSE", english: "Relax / Take it easy", difficulty: "intermediate" },
        { pidgin: "Slippahs", pronunciation: "SLIP-ahz", english: "Flip flops / Sandals", difficulty: "intermediate" },
        { pidgin: "Shave ice", pronunciation: "shave ICE", english: "Shaved ice treat", difficulty: "intermediate" },
        { pidgin: "Pupu", pronunciation: "POO-poo", english: "Appetizers / Snacks", difficulty: "intermediate" },
        { pidgin: "Puka", pronunciation: "POO-kah", english: "Hole", difficulty: "intermediate" },
        { pidgin: "Wiki wiki", pronunciation: "WEE-kee WEE-kee", english: "Quick / Hurry", difficulty: "intermediate" },
        { pidgin: "Lanai", pronunciation: "lah-NAI", english: "Porch / Balcony", difficulty: "intermediate" },
        { pidgin: "Kamaaina", pronunciation: "kah-mah-EYE-nah", english: "Local resident", difficulty: "intermediate" },
        { pidgin: "Malihini", pronunciation: "mah-lee-HEE-nee", english: "Newcomer / Visitor", difficulty: "intermediate" },
        { pidgin: "Hamajang", pronunciation: "hah-mah-JANG", english: "Messed up / Disorganized", difficulty: "advanced" },
        { pidgin: "Ainokea", pronunciation: "eye-no-KAY-ah", english: "I don't care", difficulty: "advanced" },
        { pidgin: "Kanak attack", pronunciation: "kah-NAK attack", english: "Food coma", difficulty: "advanced" },
        { pidgin: "Lolo", pronunciation: "LO-lo", english: "Crazy / Stupid", difficulty: "advanced" },
        { pidgin: "Pupule", pronunciation: "poo-POO-lay", english: "Crazy", difficulty: "advanced" },
        { pidgin: "No worry beef curry", pronunciation: "no worry beef curry", english: "Don't worry about it", difficulty: "advanced" },
        { pidgin: "Geev um", pronunciation: "geev UM", english: "Give it / Go for it", difficulty: "advanced" },
        { pidgin: "Braddah", pronunciation: "BRAH-dah", english: "Brother / Friend", difficulty: "advanced" },
        { pidgin: "Sistah", pronunciation: "SIS-tah", english: "Sister / Female friend", difficulty: "advanced" },
        { pidgin: "Da bes", pronunciation: "da BEST", english: "The best", difficulty: "advanced" },
        { pidgin: "Fo real", pronunciation: "fo REAL", english: "For real / Seriously", difficulty: "advanced" },
        { pidgin: "No can", pronunciation: "no CAN", english: "Cannot / Unable to", difficulty: "advanced" },
        { pidgin: "Rubbah slippahs", pronunciation: "RUB-bah SLIP-ahz", english: "Rubber flip flops", difficulty: "advanced" },
        { pidgin: "Malasada", pronunciation: "mah-lah-SAH-dah", english: "Portuguese donut", difficulty: "advanced" },
        { pidgin: "Poi", pronunciation: "poy", english: "Taro paste", difficulty: "advanced" },
        { pidgin: "Lau lau", pronunciation: "LOW-low", english: "Wrapped pork dish", difficulty: "advanced" },
        { pidgin: "Kalua pig", pronunciation: "kah-LOO-ah pig", english: "Roasted pig", difficulty: "advanced" },
        { pidgin: "Musubi", pronunciation: "moo-SOO-bee", english: "Rice ball with spam", difficulty: "advanced" },
        { pidgin: "Plate lunch", pronunciation: "plate LUNCH", english: "Local lunch combo", difficulty: "advanced" },
        { pidgin: "Loco moco", pronunciation: "LO-ko MO-ko", english: "Rice, burger, egg, gravy", difficulty: "advanced" }
    ];

    words = practiceWords;
    loadWord(words[0]);
    renderWordGrid();

    function loadWord(word) {
        currentWord = word;
        document.getElementById('current-word').textContent = word.pidgin;
        document.getElementById('current-pronunciation').textContent = word.pronunciation;
        document.getElementById('current-english').textContent = word.english;
        resultsSection.classList.add('hidden');
    }

    function renderWordGrid() {
        var filtered = currentDifficulty === 'all'
            ? words
            : words.filter(function(w) { return w.difficulty === currentDifficulty; });

        var toShow = filtered.slice(0, displayedCount);

        wordGrid.innerHTML = toShow.map(function(word) {
            return '<button class="word-card p-3 bg-gray-50 hover:bg-purple-50 rounded-lg text-left border-2 border-transparent hover:border-purple-300 transition" data-word="' + encodeURIComponent(JSON.stringify(word)) + '">' +
                '<div class="font-bold text-purple-700">' + word.pidgin + '</div>' +
                '<div class="text-xs text-gray-500 truncate">' + word.english + '</div>' +
            '</button>';
        }).join('');

        wordGrid.querySelectorAll('.word-card').forEach(function(card) {
            card.addEventListener('click', function() {
                var w = JSON.parse(decodeURIComponent(card.dataset.word));
                loadWord(w);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        document.getElementById('load-more-btn').style.display =
            toShow.length < filtered.length ? 'block' : 'none';
    }

    document.querySelectorAll('.difficulty-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.difficulty-btn').forEach(function(b) {
                b.classList.remove('active', 'bg-green-500', 'text-white');
                b.classList.add('bg-gray-200', 'text-gray-700');
            });
            btn.classList.add('active', 'bg-green-500', 'text-white');
            btn.classList.remove('bg-gray-200', 'text-gray-700');
            currentDifficulty = btn.dataset.difficulty;
            displayedCount = 12;
            renderWordGrid();
        });
    });

    document.getElementById('load-more-btn').addEventListener('click', function() {
        displayedCount += 12;
        renderWordGrid();
    });

    listenBtn.addEventListener('click', async function() {
        if (!currentWord) return;
        listenBtn.disabled = true;
        listenBtn.innerHTML = '<span class="text-xl"><i class="ti ti-volume"></i></span> <span>Playing...</span>';
        try {
            if (typeof pidginSpeech !== 'undefined') {
                await pidginSpeech.speak(currentWord.pidgin);
            } else if ('speechSynthesis' in window) {
                var utterance = new SpeechSynthesisUtterance(currentWord.pidgin);
                utterance.rate = 0.8;
                speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.error('Speech error:', error);
        }
        setTimeout(function() {
            listenBtn.disabled = false;
            listenBtn.innerHTML = '<span class="text-xl"><i class="ti ti-volume"></i></span> <span>Hear Native</span>';
        }, 1500);
    });

    micBtn.addEventListener('click', function() {
        if (pronunciationPractice.isListening) {
            pronunciationPractice.stopListening();
        } else {
            pronunciationPractice.startListening(currentWord);
        }
    });

    pronunciationPractice.onStart(function() {
        micBtn.classList.add('listening');
        micStatus.textContent = 'Listening... Speak now!';
        waveform.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        animateWaveform();
    });

    pronunciationPractice.onEnd(function() {
        micBtn.classList.remove('listening');
        micStatus.textContent = 'Tap to record yourself';
        waveform.classList.add('hidden');
    });

    pronunciationPractice.onResult(function(score) {
        showResults(score);
        updateStats();
    });

    pronunciationPractice.onError(function(error) {
        micStatus.textContent = getErrorMessage(error);
        setTimeout(function() { micStatus.textContent = 'Tap to record yourself'; }, 3000);
    });

    function showResults(score) {
        resultsSection.classList.remove('hidden');
        scoreNumber.textContent = score.overall;
        var stars = [];
        for (var i = 0; i < 5; i++) {
            stars.push('<span class="star ' + (i < score.stars ? 'filled' : '') + '">★</span>');
        }
        starRating.innerHTML = stars.join('');
        var normalized = score.spokenNormalized || score.spoken || '(not recognized)';
        userSpoken.textContent = normalized;
        feedbackList.innerHTML = score.feedback.map(function(fb) {
            var colors = {
                success: 'bg-green-50 border-green-400 text-green-800',
                good: 'bg-blue-50 border-blue-400 text-blue-800',
                ok: 'bg-yellow-50 border-yellow-400 text-yellow-800',
                needs_work: 'bg-orange-50 border-orange-400 text-orange-800',
                tip: 'bg-purple-50 border-purple-400 text-purple-800'
            };
            return '<div class="border-l-4 ' + (colors[fb.type] || colors.tip) + ' p-4 rounded-r-lg">' + fb.message + '</div>';
        }).join('');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function updateStats() {
        var stats = pronunciationPractice.getStats();
        document.getElementById('stat-attempts').textContent = stats.totalAttempts;
        document.getElementById('stat-average').textContent = stats.averageScore + '%';
        document.getElementById('stat-best').textContent = stats.bestScore + '%';
    }

    tryAgainBtn.addEventListener('click', function() {
        resultsSection.classList.add('hidden');
        pronunciationPractice.startListening(currentWord);
    });

    nextWordBtn.addEventListener('click', function() {
        var filtered = currentDifficulty === 'all'
            ? words
            : words.filter(function(w) { return w.difficulty === currentDifficulty; });
        var currentIndex = filtered.findIndex(function(w) { return w.pidgin === currentWord.pidgin; });
        var nextIndex = (currentIndex + 1) % filtered.length;
        loadWord(filtered[nextIndex]);
    });

    function getErrorMessage(error) {
        var messages = {
            'no-speech': 'No speech detected. Try again?',
            'audio-capture': 'Microphone not found. Check permissions.',
            'not-allowed': 'Microphone access denied. Please allow access.',
            'network': 'Network error. Check your connection.',
            'aborted': 'Recording cancelled.'
        };
        return messages[error] || 'Error occurred. Try again.';
    }

    function animateWaveform() {
        if (!pronunciationPractice.isListening) return;
        var bars = waveform.querySelectorAll('.waveform-bar');
        bars.forEach(function(bar) {
            bar.style.height = (20 + Math.random() * 80) + '%';
        });
        requestAnimationFrame(function() { setTimeout(animateWaveform, 100); });
    }

    async function loadWordsFromAPI() {
        try {
            var response = await fetch('/api/dictionary/all');
            if (response.ok) {
                var data = await response.json();
                var apiWords = data
                    .filter(function(entry) { return entry.pronunciation && entry.pidgin.split(' ').length <= 3; })
                    .slice(0, 50)
                    .map(function(entry) {
                        return {
                            pidgin: entry.pidgin,
                            pronunciation: entry.pronunciation,
                            english: Array.isArray(entry.english) ? entry.english[0] : entry.english,
                            difficulty: entry.difficulty || 'intermediate'
                        };
                    });
                if (apiWords.length > 0) {
                    words = practiceWords.concat(apiWords);
                    renderWordGrid();
                }
            }
        } catch (error) {
            console.log('Using default practice words');
        }
    }

    loadWordsFromAPI();
});
