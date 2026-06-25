// Phrases page - curated phrases, rendering, filtering, and TTS
var curatedPhrases = {
    greetings: [
        { pidgin: "Howzit", english: "How's it going? / Hello", pronunciation: "HOW-zit" },
        { pidgin: "Howzit brah", english: "Hey man, how are you?", pronunciation: "HOW-zit BRAH" },
        { pidgin: "Aloha", english: "Hello / Goodbye / Love", pronunciation: "ah-LOH-ha" },
        { pidgin: "A hui hou", english: "Until we meet again / Goodbye", pronunciation: "ah HOO-ee HOH" },
        { pidgin: "Mahalo", english: "Thank you", pronunciation: "mah-HAH-loh" },
        { pidgin: "Mahalo nui loa", english: "Thank you very much", pronunciation: "mah-HAH-loh NOO-ee LOH-ah" },
        { pidgin: "A'ole pilikia", english: "No problem / You're welcome", pronunciation: "ah-OH-leh pee-lee-KEE-ah" },
        { pidgin: "E komo mai", english: "Welcome / Come in", pronunciation: "eh KOH-moh MY" },
        { pidgin: "Shoots", english: "Okay / Sure / Sounds good", pronunciation: "SHOOTS" },
        { pidgin: "Latahs", english: "See you later", pronunciation: "LAY-tahs" },
        { pidgin: "Rajah dat", english: "Got it / Roger that", pronunciation: "RAH-jah DAT" },
        { pidgin: "K den", english: "Okay then", pronunciation: "KAY-den" }
    ],
    expressions: [
        { pidgin: "Da kine", english: "The thing / Whatchamacallit", pronunciation: "dah KINE" },
        { pidgin: "No worry", english: "Don't worry about it", pronunciation: "noh WUH-ree" },
        { pidgin: "Bumbai", english: "Later / Eventually", pronunciation: "BUM-bye" },
        { pidgin: "Pau", english: "Done / Finished", pronunciation: "POW" },
        { pidgin: "Pau hana", english: "After work / Quitting time", pronunciation: "POW HAH-nah" },
        { pidgin: "Hana hou", english: "Do it again / Encore", pronunciation: "HAH-nah HOH" },
        { pidgin: "Hele on", english: "Let's go / Come on", pronunciation: "HEH-leh ON" },
        { pidgin: "Ainokea", english: "I don't care", pronunciation: "eye-noh-KEH-ah" },
        { pidgin: "No can", english: "Can't do it / Not possible", pronunciation: "noh CAN" },
        { pidgin: "Like beef?", english: "Want to fight?", pronunciation: "like BEEF" },
        { pidgin: "Try wait", english: "Hold on / Please wait", pronunciation: "try WAIT" },
        { pidgin: "No make", english: "Don't do that", pronunciation: "noh MAKE" }
    ],
    food: [
        { pidgin: "Broke da mouth", english: "Delicious / So good", pronunciation: "broke dah MOWTH" },
        { pidgin: "Ono", english: "Delicious / Tasty", pronunciation: "OH-noh" },
        { pidgin: "Ono grindz", english: "Delicious food", pronunciation: "OH-noh GRINDS" },
        { pidgin: "Grindz", english: "Food / Meal", pronunciation: "GRINDS" },
        { pidgin: "Kaukau", english: "Food / To eat", pronunciation: "KOW-kow" },
        { pidgin: "Grinds stay ono", english: "The food is delicious", pronunciation: "GRINDS stay OH-noh" },
        { pidgin: "Choke ono", english: "Very delicious", pronunciation: "CHOKE OH-noh" },
        { pidgin: "You like eat?", english: "Do you want to eat?", pronunciation: "you like EET" },
        { pidgin: "Pupus", english: "Appetizers / Snacks", pronunciation: "POO-poos" },
        { pidgin: "Get choke grindz", english: "There's lots of food", pronunciation: "get CHOKE GRINDS" },
        { pidgin: "I stay hungry", english: "I'm hungry", pronunciation: "eye stay HUNG-ree" },
        { pidgin: "Mo' bettah", english: "Better / Much better", pronunciation: "moh BET-tah" }
    ],
    slang: [
        { pidgin: "Choke", english: "A lot / Many", pronunciation: "CHOKE" },
        { pidgin: "Stink eye", english: "Dirty look / Glare", pronunciation: "STINK eye" },
        { pidgin: "Lolo", english: "Crazy / Stupid", pronunciation: "LOH-loh" },
        { pidgin: "Moke", english: "Tough local guy", pronunciation: "MOHK" },
        { pidgin: "Tita", english: "Tough local woman", pronunciation: "TEE-tah" },
        { pidgin: "Haole", english: "Caucasian / Foreigner", pronunciation: "HOW-leh" },
        { pidgin: "Brah", english: "Brother / Friend", pronunciation: "BRAH" },
        { pidgin: "Sistah", english: "Sister / Friend (female)", pronunciation: "SIS-tah" },
        { pidgin: "Buggah", english: "Person / Thing / Dude", pronunciation: "BUH-gah" },
        { pidgin: "Kanak attack", english: "Food coma / Sleepy after eating", pronunciation: "kah-NAHK ah-TACK" },
        { pidgin: "Hamajang", english: "Messed up / All wrong", pronunciation: "hah-mah-JAHNG" },
        { pidgin: "Pilau", english: "Rotten / Stinky / Bad", pronunciation: "pee-LOW" }
    ]
};

function createSlug(text) {
    if (!text) return 'unknown';
    
    return text.toLowerCase()
        // Replace common okina variants with nothing
        .replace(/['ʻ`‘’]/g, '')
        // Replace kahako (long vowels) with standard vowels
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        // Replace non-alphanumeric with hyphens
        .replace(/[^a-z0-9]+/g, '-')
        // Remove leading/trailing hyphens
        .replace(/^-|-$/g, '');
}

function getPhraseUrl(pidgin) {
    if (!pidgin) return '#';
    
    // Normalize word/phrase to check against premium pages
    var clean = pidgin.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents/macrons
        .replace(/['ʻ`‘’]/g, '') // remove okinas
        .replace(/-/g, ' ')      // normalize hyphens to spaces
        .trim();
        
    var premiumPages = {
        'a hui hou': 'what-does-a-hui-hou-mean.html',
        'akamai': 'what-does-akamai-mean.html',
        'aloha': 'what-does-aloha-mean.html',
        'howzit': 'what-does-howzit-mean.html',
        'howzit brah': 'what-does-howzit-mean.html',
        'menpachi eyes': 'what-does-menpachi-eyes-mean.html',
        'mempachi eyes': 'what-does-menpachi-eyes-mean.html',
        'stop da menpachi eye': 'what-does-menpachi-eyes-mean.html',
        'stop da mempachi eye': 'what-does-menpachi-eyes-mean.html',
        'no ka oi': 'what-does-no-ka-oi-mean.html',
        'pau': 'what-does-pau-mean.html',
        'choke': 'what-does-choke-mean.html',
        'mahalo': 'what-does-mahalo-mean.html',
        'no worry': 'what-does-no-worry-mean.html',
        'sarap': 'what-does-sarap-mean.html',
        'talk story': 'what-does-talk-story-mean.html',
        'ainokea': 'what-does-ainokea-mean.html',
        'buss up': 'what-does-buss-up-mean.html',
        'amped': 'what-does-amped-mean.html',
        'bline': 'what-does-bline-mean.html',
        'bruddah': 'what-does-bruddah-mean.html',
        'sistah': 'what-does-sistah-mean.html',
        'moopuna': 'what-does-moopuna-mean.html',
        'niele': 'what-does-niele-mean.html',
        'pilau': 'what-does-pilau-mean.html',
        'kanak attack': 'what-does-kanak-attack-mean.html',
        'you da man': 'what-does-you-da-man-mean.html',
        'you da best': 'what-does-you-da-man-mean.html',
        'brah': 'what-does-brah-mean.html',
        'broke da mouth': 'what-does-broke-da-mouth-mean.html',
        'buggah': 'what-does-buggah-mean.html',
        'chicken skin': 'what-does-chicken-skin-mean.html',
        'da kine': 'what-does-da-kine-mean.html',
        'faka': 'what-does-faka-mean.html',
        'grindz': 'what-does-grindz-mean.html',
        'hamajang': 'what-does-hamajang-mean.html',
        'haole': 'what-does-haole-mean.html',
        'humbug': 'what-does-humbug-mean.html',
        'kamaaina': 'what-does-kamaaina-mean.html',
        'keiki': 'what-does-keiki-mean.html',
        'lolo': 'what-does-lolo-mean.html',
        'mauka makai': 'what-does-mauka-makai-mean.html',
        'mauka': 'what-does-mauka-makai-mean.html',
        'makai': 'what-does-mauka-makai-mean.html',
        'mayjah': 'what-does-mayjah-mean.html',
        'ohana': 'what-does-ohana-mean.html',
        'ono grindz': 'what-does-ono-grindz-mean.html',
        'ono': 'what-does-ono-mean.html',
        'pake': 'what-does-pake-mean.html',
        'pau hana': 'what-does-pau-hana-mean.html',
        'poho': 'what-does-poho-mean.html',
        'rajah': 'what-does-rajah-mean.html',
        'shaka': 'what-does-shaka-mean.html',
        'shoots': 'what-does-shoots-mean.html',
        'small kine': 'what-does-small-kine-mean.html',
        'stink eye': 'what-does-stink-eye-mean.html',
        'wahine': 'what-does-wahine-mean.html'
    };
    
    if (premiumPages[clean]) {
        return '/' + premiumPages[clean];
    }
    
    var slug = createSlug(pidgin);
    
    // Curated terms that are registered as words (dictionary entries) instead of phrases
    var dictionaryWords = [
        'a-hui-hou',
        'aole-pilikia',
        'e-komo-mai',
        'bumbai',
        'kaukau',
        'pupus',
        'moke',
        'tita',
        'latahs'
    ];
    
    if (dictionaryWords.indexOf(slug) !== -1) {
        return '/word/' + slug + '.html';
    }
    
    return '/phrase/' + slug + '.html';
}

function renderPhraseCard(phrase) {
    var href = getPhraseUrl(phrase.pidgin);
    return '<a href="' + href + '" class="phrase-card bg-white rounded-xl p-5 shadow-md border border-gray-100 block">' +
        '<div class="flex justify-between items-start mb-2">' +
            '<h3 class="text-xl font-bold text-purple-700">' + phrase.pidgin + '</h3>' +
            '<button onclick="event.preventDefault(); event.stopPropagation(); speakPhrase(\'' + phrase.pidgin.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + '\')" ' +
                    'class="text-blue-500 hover:text-blue-700 p-1" title="Hear pronunciation">' +
                '<i class="ti ti-volume"></i>' +
            '</button>' +
        '</div>' +
        '<p class="text-gray-800 font-medium mb-1">' + phrase.english + '</p>' +
        '<p class="text-sm text-gray-500"><i class="ti ti-speakerphone"></i> ' + phrase.pronunciation + '</p>' +
        '<span class="text-xs text-purple-500 mt-2 inline-block">Learn more <i class="ti ti-arrow-right"></i></span>' +
    '</a>';
}

function renderPhrases() {
    document.getElementById('greetings-grid').innerHTML =
        curatedPhrases.greetings.map(renderPhraseCard).join('');
    document.getElementById('expressions-grid').innerHTML =
        curatedPhrases.expressions.map(renderPhraseCard).join('');
    document.getElementById('food-grid').innerHTML =
        curatedPhrases.food.map(renderPhraseCard).join('');
    document.getElementById('slang-grid').innerHTML =
        curatedPhrases.slang.map(renderPhraseCard).join('');
}

function setupFilters() {
    var tabs = document.querySelectorAll('.category-tab');
    var sections = {
        'greetings': document.getElementById('greetings-section'),
        'expressions': document.getElementById('expressions-section'),
        'food': document.getElementById('food-section'),
        'slang': document.getElementById('slang-section')
    };

    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            tabs.forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');

            var category = tab.dataset.category;

            if (category === 'all') {
                Object.values(sections).forEach(function(s) { s.style.display = 'block'; });
            } else {
                Object.entries(sections).forEach(function(entry) {
                    entry[1].style.display = entry[0] === category ? 'block' : 'none';
                });
            }
        });
    });
}

window.speakPhrase = function(text) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.SpeechSynthesisUtterance) {
        var utterance = new window.SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    renderPhrases();
    setupFilters();
});
