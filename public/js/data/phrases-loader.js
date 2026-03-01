// Phrases data loader - uses Supabase API
// Loads phrases from /api/phrases endpoint

// Function to load phrases from API
async function loadPhrasesFromAPI() {
    try {
        // Fetch a large batch of phrases for daily phrase rotation
        const response = await fetch('/api/phrases?limit=500');
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();

        // Update global variables
        window.pidginPhrases = data.phrases || [];
        window.phrasesData = data;

        return data;
    } catch (error) {
        console.error('Failed to load phrases from API:', error.message);
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

