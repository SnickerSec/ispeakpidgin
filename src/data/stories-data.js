// Legacy stories data - replaced by consolidated data system
// This file exists to prevent 404 errors during transition

// Export empty data structure for backward compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        stories: []
    };
}

// Global variables for backward compatibility
window.stories = [];

console.log('✅ Legacy stories-data.js loaded (empty - using consolidated data)');