// Legacy phrases data - replaced by consolidated data system
// This file exists to prevent 404 errors during transition

// Export empty data structure for backward compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        pidginPhrases: [],
        getDailyPhrase: function() {
            console.log('getDailyPhrase: Using consolidated data system instead');
            return null;
        }
    };
}

// Global variables for backward compatibility
window.pidginPhrases = [];
window.getDailyPhrase = function() {
    console.log('getDailyPhrase: Using consolidated data system instead');
    return null;
};

console.log('✅ Legacy phrases-data.js loaded (empty - using consolidated data)');