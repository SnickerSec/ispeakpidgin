// Phrases data loader - uses consolidated data system
// Loads phrases from data/views/phrases.json (generated from master data)

// Function to load phrases from the consolidated view
async function loadPhrasesFromView() {
    try {
        const response = await fetch('data/views/phrases.json');
        const phrasesData = await response.json();

        // Update global variables
        window.pidginPhrases = phrasesData.phrases || [];
        window.phrasesData = phrasesData; // Full structured data

        console.log(`✅ Loaded ${phrasesData.metadata.totalPhrases} phrases from consolidated data system`);
        return phrasesData;
    } catch (error) {
        console.log('⚠️ Could not load phrases from consolidated data system');
        window.pidginPhrases = [];
        return null;
    }
}

// Get daily phrase function (randomized on page load)
window.getDailyPhrase = function() {
    if (window.pidginPhrases && window.pidginPhrases.length > 0) {
        // Generate random index for each page load
        const randomIndex = Math.floor(Math.random() * window.pidginPhrases.length);
        return window.pidginPhrases[randomIndex];
    }
    // If phrases aren't loaded yet, try to wait a bit and retry
    if (!window.phrasesLoadPromise) {
        console.log('getDailyPhrase: Phrases still loading, will retry...');
        return null;
    }
    return null;
};

// Store the loading promise globally so other functions can await it
window.phrasesLoadPromise = null;

// Auto-load phrases when script runs
window.phrasesLoadPromise = loadPhrasesFromView();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadPhrasesFromView,
        getDailyPhrase: window.getDailyPhrase
    };
}

console.log('✅ Phrases data loader initialized (using consolidated data system)');