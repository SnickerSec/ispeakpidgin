// Phrases data loader - uses Supabase API
// Loads phrases from /api/phrases endpoint

// Function to load phrases from API
async function loadPhrasesFromAPI() {
    try {
        const response = await fetch('/api/phrases');
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();

        // Update global variables
        window.pidginPhrases = data.phrases || [];
        window.phrasesData = data;

        console.log(`✅ Loaded ${window.pidginPhrases.length} phrases from Supabase API`);
        return data;
    } catch (error) {
        console.error('❌ Failed to load phrases from API:', error.message);
        window.pidginPhrases = [];
        throw error;
    }
}

// Get daily phrase function (randomized on page load)
window.getDailyPhrase = function() {
    if (window.pidginPhrases && window.pidginPhrases.length > 0) {
        const randomIndex = Math.floor(Math.random() * window.pidginPhrases.length);
        return window.pidginPhrases[randomIndex];
    }
    console.log('getDailyPhrase: Phrases not loaded yet');
    return null;
};

// Store the loading promise globally so other functions can await it
window.phrasesLoadPromise = null;

// Auto-load phrases when script runs
window.phrasesLoadPromise = loadPhrasesFromAPI();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadPhrasesFromAPI,
        getDailyPhrase: window.getDailyPhrase
    };
}

console.log('✅ Phrases data loader initialized (using Supabase API)');
