// Pidgin Heads Up! - Complete game logic
var gameWords = {
    greetings: [
        { word: "Howzit", hint: "Hawaiian hello", english: "How's it going?" },
        { word: "Aloha", hint: "Love, hello, goodbye", english: "Hello/Goodbye/Love" },
        { word: "Mahalo", hint: "Gratitude", english: "Thank you" },
        { word: "Shoots", hint: "Agreement", english: "Okay/Sounds good" },
        { word: "A hui hou", hint: "Farewell", english: "Until we meet again" },
        { word: "Shaka", hint: "Hand gesture", english: "Hang loose" },
        { word: "Wassup", hint: "Casual greeting", english: "What's up" },
        { word: "Howz it?", hint: "Quick check-in", english: "How are you?" },
        { word: "Rajah dat", hint: "Military style", english: "Roger that" },
        { word: "Laters", hint: "Goodbye casual", english: "See you later" }
    ],
    food: [
        { word: "Grindz", hint: "What you eat", english: "Food" },
        { word: "Ono", hint: "Tastes amazing", english: "Delicious" },
        { word: "Poke", hint: "Raw fish dish", english: "Cubed raw fish" },
        { word: "Loco Moco", hint: "Rice, burger, egg", english: "Local comfort food" },
        { word: "Musubi", hint: "Spam on rice", english: "Rice ball with spam" },
        { word: "Plate Lunch", hint: "Two scoops rice", english: "Local lunch combo" },
        { word: "Shave Ice", hint: "Not shaved ice", english: "Hawaiian snow cone" },
        { word: "Malasada", hint: "Portuguese treat", english: "Fried doughnut" },
        { word: "Poi", hint: "Purple paste", english: "Taro paste" },
        { word: "Kalua Pig", hint: "Underground cooked", english: "Roasted pork" },
        { word: "Lau Lau", hint: "Wrapped in leaves", english: "Steamed pork in taro leaves" },
        { word: "Pupu", hint: "Before main course", english: "Appetizers" },
        { word: "Broke Da Mouth", hint: "So good it hurts", english: "Extremely delicious" },
        { word: "Ono Grindz", hint: "Best kind food", english: "Delicious food" },
        { word: "Kanak Attack", hint: "After big meal", english: "Food coma" },
        { word: "Luau", hint: "Hawaiian party", english: "Feast/celebration" },
        { word: "Lilikoi", hint: "Yellow fruit", english: "Passion fruit" },
        { word: "Haupia", hint: "Coconut dessert", english: "Coconut pudding" }
    ],
    slang: [
        { word: "Da Kine", hint: "Universal word", english: "The thing/whatchamacallit" },
        { word: "Brah", hint: "Male friend", english: "Brother/dude" },
        { word: "Pau", hint: "All done", english: "Finished" },
        { word: "Choke", hint: "Lots and lots", english: "A lot/plenty" },
        { word: "Mo Bettah", hint: "Superior", english: "Much better" },
        { word: "Small Kine", hint: "Just a little", english: "A little bit" },
        { word: "Lidat", hint: "Similar way", english: "Like that" },
        { word: "Bumbye", hint: "Eventually", english: "Later/by and by" },
        { word: "Fo Real", hint: "Seriously?", english: "For real" },
        { word: "No Can", hint: "Impossible", english: "Cannot" },
        { word: "Geev Um", hint: "Go hard", english: "Give it/go for it" },
        { word: "Stink Eye", hint: "Mean look", english: "Dirty look" },
        { word: "Talk Stink", hint: "Gossip bad", english: "Talk bad about someone" },
        { word: "Hamajang", hint: "All mixed up", english: "Messed up" },
        { word: "Pupule", hint: "Lost your mind", english: "Crazy" },
        { word: "Lolo", hint: "Not smart", english: "Stupid/crazy" },
        { word: "Ainokea", hint: "Don't care", english: "I don't care" },
        { word: "Chicken Skin", hint: "Spooky feeling", english: "Goosebumps" },
        { word: "Talk Story", hint: "Chat session", english: "Have a conversation" },
        { word: "Hang Loose", hint: "Relax brah", english: "Take it easy" },
        { word: "No Worry Beef Curry", hint: "Don't stress", english: "Don't worry about it" },
        { word: "Wiki Wiki", hint: "Fast fast", english: "Quick/hurry" }
    ],
    people: [
        { word: "Ohana", hint: "Blood or not", english: "Family" },
        { word: "Keiki", hint: "Little ones", english: "Child/children" },
        { word: "Wahine", hint: "Female person", english: "Woman" },
        { word: "Kane", hint: "Male person", english: "Man" },
        { word: "Tutu", hint: "Elder relative", english: "Grandparent" },
        { word: "Braddah", hint: "Close male", english: "Brother/friend" },
        { word: "Sistah", hint: "Close female", english: "Sister/friend" },
        { word: "Haole", hint: "Not from here", english: "Caucasian/outsider" },
        { word: "Kamaaina", hint: "Been here long", english: "Local resident" },
        { word: "Malihini", hint: "Just arrived", english: "Newcomer/visitor" },
        { word: "Kupuna", hint: "Wise elder", english: "Elder/ancestor" },
        { word: "Tita", hint: "Tough woman", english: "Tough local woman" },
        { word: "Moke", hint: "Tough guy", english: "Tough local man" },
        { word: "Aunty", hint: "Respect for elder woman", english: "Older woman (respectful)" },
        { word: "Uncle", hint: "Respect for elder man", english: "Older man (respectful)" },
        { word: "Calabash Cousin", hint: "Not blood related", english: "Close family friend" }
    ],
    places: [
        { word: "Mauka", hint: "Mountain direction", english: "Toward the mountain" },
        { word: "Makai", hint: "Ocean direction", english: "Toward the sea" },
        { word: "Lanai", hint: "Outside sitting", english: "Porch/balcony" },
        { word: "Hale", hint: "Where you live", english: "House/home" },
        { word: "Heiau", hint: "Sacred place", english: "Ancient temple" },
        { word: "Pau Hana", hint: "After work spot", english: "Happy hour" },
        { word: "Da Beach", hint: "Sandy shores", english: "The beach" },
        { word: "Town", hint: "Honolulu", english: "Downtown Honolulu" },
        { word: "Country", hint: "North Shore side", english: "Rural areas" },
        { word: "Da Mainland", hint: "Not Hawaii", english: "Continental US" },
        { word: "Slippahs", hint: "Footwear everywhere", english: "Flip flops" },
        { word: "Puka", hint: "Opening", english: "Hole" }
    ]
};

var selectedCategory = 'all';
var roundTime = 60;
var difficulty = 'medium';
var currentWords = [];
var currentWordIndex = 0;
var score = 0;
var timeLeft = 60;
var gameTimer = null;
var roundResults = [];
var lastTiltAction = 0;
var canTilt = true;
var gameActive = false;
var baselineBeta = null;
var tiltCalibrated = false;
var TILT_THRESHOLD = 40;

var menuScreen = document.getElementById('menu-screen');
var countdownScreen = document.getElementById('countdown-screen');
var gameScreen = document.getElementById('game-screen');
var resultsScreen = document.getElementById('results-screen');
var rotatePrompt = document.getElementById('rotate-prompt');

function requestFullscreen() {
    var elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(function(){});
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen().catch(function(){});
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
}

function isLandscape() {
    return window.innerWidth > window.innerHeight;
}

function checkOrientation() {
    if (gameActive) {
        if (isLandscape()) {
            rotatePrompt.classList.remove('show');
        } else {
            rotatePrompt.classList.add('show');
        }
    }
}

window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);

document.querySelectorAll('.category-card').forEach(function(card) {
    card.addEventListener('click', function() {
        document.querySelectorAll('.category-card').forEach(function(c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        selectedCategory = card.dataset.category;
    });
});

document.getElementById('start-game-btn').addEventListener('click', function() {
    roundTime = parseInt(document.getElementById('round-time').value);
    difficulty = document.getElementById('difficulty').value;
    startCountdown();
});

document.getElementById('play-again-btn').addEventListener('click', function() {
    startCountdown();
});

document.getElementById('back-to-menu-btn').addEventListener('click', function() {
    gameActive = false;
    rotatePrompt.classList.remove('show');
    exitFullscreen();
    showScreen('menu');
});

function showScreen(screen) {
    menuScreen.classList.add('hidden');
    countdownScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    resultsScreen.classList.add('hidden');

    switch(screen) {
        case 'menu': menuScreen.classList.remove('hidden'); break;
        case 'countdown': countdownScreen.classList.remove('hidden'); break;
        case 'game': gameScreen.classList.remove('hidden'); break;
        case 'results': resultsScreen.classList.remove('hidden'); break;
    }
}

async function startCountdown() {
    gameActive = true;
    baselineBeta = 90;
    tiltCalibrated = true;

    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            var response = await DeviceOrientationEvent.requestPermission();
            if (response !== 'granted') {
                alert('Motion permission needed for tilt controls. Using tap instead.');
            }
        } catch (e) {
            console.warn('Motion permission error:', e);
        }
    }

    requestFullscreen();
    checkOrientation();
    showScreen('countdown');

    var count = 3;
    var countdownEl = document.getElementById('countdown-number');
    countdownEl.textContent = count;

    var countInterval = setInterval(function() {
        count--;
        if (count > 0) {
            countdownEl.textContent = count;
        } else if (count === 0) {
            countdownEl.textContent = 'GO!';
        } else {
            clearInterval(countInterval);
            startGame();
        }
    }, 1000);
}

function getWordsForGame() {
    var words = [];
    if (selectedCategory === 'all') {
        Object.values(gameWords).forEach(function(categoryWords) {
            words = words.concat(categoryWords);
        });
    } else {
        words = gameWords[selectedCategory] || [];
    }
    if (difficulty === 'easy') {
        words = words.slice(0, Math.ceil(words.length * 0.5));
    } else if (difficulty === 'hard') {
        words = words.slice(Math.floor(words.length * 0.3));
    }
    return words.sort(function() { return Math.random() - 0.5; });
}

function startGame() {
    initGame();
}

function initGame() {
    showScreen('game');
    currentWords = getWordsForGame();
    currentWordIndex = 0;
    score = 0;
    timeLeft = roundTime;
    roundResults = [];
    canTilt = true;

    var colors = {
        all: 'from-green-500 to-teal-600',
        greetings: 'from-blue-500 to-blue-700',
        food: 'from-orange-500 to-red-600',
        slang: 'from-purple-500 to-purple-700',
        people: 'from-pink-500 to-pink-700',
        places: 'from-teal-500 to-cyan-600'
    };
    document.getElementById('game-bg').className = 'game-screen bg-gradient-to-br ' + (colors[selectedCategory] || colors.all);

    updateDisplay();
    updateTimer();

    gameTimer = setInterval(function() {
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) endGame();
    }, 1000);

    setupTiltDetection();
}

function updateDisplay() {
    if (currentWordIndex < currentWords.length) {
        var word = currentWords[currentWordIndex];
        document.getElementById('current-word').textContent = word.word;
        document.getElementById('current-hint').textContent = word.hint;
    } else {
        currentWords = getWordsForGame();
        currentWordIndex = 0;
        updateDisplay();
    }
    document.getElementById('score').textContent = score;
}

function updateTimer() {
    document.getElementById('time-left').textContent = timeLeft;
    var progress = (timeLeft / roundTime) * 100;
    document.getElementById('timer-progress').style.width = progress + '%';
}

function setupTiltDetection() {
    var tiltEnabled = false;
    setTimeout(function() { tiltEnabled = true; }, 500);

    var handleOrientation = function(event) {
        var gamma = event.gamma;
        if (!canTilt || !tiltEnabled) return;
        if (gamma === null) return;

        if (gamma >= 40 && gamma <= 60) {
            handleCorrect();
        } else if (gamma >= -60 && gamma <= -40) {
            handleSkip();
        }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    window.currentOrientationHandler = handleOrientation;

    document.getElementById('game-screen').addEventListener('click', function(e) {
        var rect = gameScreen.getBoundingClientRect();
        var clickY = e.clientY - rect.top;
        var height = rect.height;
        if (clickY < height / 2) {
            handleSkip();
        } else {
            handleCorrect();
        }
    });
}

function handleCorrect() {
    if (!canTilt || Date.now() - lastTiltAction < 800) return;
    lastTiltAction = Date.now();
    canTilt = false;
    score++;
    roundResults.push({ word: currentWords[currentWordIndex], correct: true });
    var indicator = document.getElementById('tilt-correct');
    indicator.classList.add('show');
    document.getElementById('score').classList.add('score-pop');
    setTimeout(function() {
        indicator.classList.remove('show');
        document.getElementById('score').classList.remove('score-pop');
        nextWord();
        canTilt = true;
    }, 600);
}

function handleSkip() {
    if (!canTilt || Date.now() - lastTiltAction < 800) return;
    lastTiltAction = Date.now();
    canTilt = false;
    roundResults.push({ word: currentWords[currentWordIndex], correct: false });
    var indicator = document.getElementById('tilt-skip');
    indicator.classList.add('show');
    setTimeout(function() {
        indicator.classList.remove('show');
        nextWord();
        canTilt = true;
    }, 600);
}

function nextWord() {
    currentWordIndex++;
    updateDisplay();
}

function endGame() {
    clearInterval(gameTimer);
    showScreen('results');
    document.getElementById('final-score').textContent = score;
    var wordsList = document.getElementById('words-list');
    wordsList.innerHTML = roundResults.map(function(result) {
        return '<div class="flex items-center gap-2">' +
            '<span>' + (result.correct ? '<i class="ti ti-circle-check"></i>' : '<i class="ti ti-circle-x"></i>') + '</span>' +
            '<span class="font-bold">' + result.word.word + '</span>' +
            '<span class="opacity-60">- ' + result.word.english + '</span>' +
        '</div>';
    }).join('');
}
