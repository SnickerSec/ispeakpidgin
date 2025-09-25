// Legacy phrases data - now loads from consolidated phrases view
// This file provides backward compatibility while using the new data structure

// Function to load phrases from the consolidated view
async function loadPhrasesFromView() {
    try {
        const response = await fetch('data/views/phrases.json');
        const phrasesData = await response.json();

        // Update global variables
        window.pidginPhrases = phrasesData.pidginPhrases || [];
        window.phrasesData = phrasesData; // Full structured data

        console.log(`✅ Loaded ${phrasesData.metadata.totalPhrases} phrases from consolidated view`);
        return phrasesData;
    } catch (error) {
        console.log('⚠️ Could not load phrases view, falling back to empty data');
        window.pidginPhrases = [];
        return null;
    }
}

// Get daily phrase function
window.getDailyPhrase = function() {
    if (window.pidginPhrases && window.pidginPhrases.length > 0) {
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const index = dayOfYear % window.pidginPhrases.length;
        return window.pidginPhrases[index];
    }
    console.log('getDailyPhrase: No phrases loaded yet');
    return null;
};

// Auto-load phrases when script runs
loadPhrasesFromView();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadPhrasesFromView,
        getDailyPhrase: window.getDailyPhrase
    };
}

console.log('✅ Legacy phrases-data.js loaded (using consolidated phrases view)');