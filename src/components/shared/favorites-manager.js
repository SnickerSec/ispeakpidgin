/**
 * Favorites Manager
 * Handles saving and retrieving bookmarked Pidgin words using localStorage
 */
class FavoritesManager {
    constructor() {
        this.storageKey = 'chokepidgin_favorites';
        this.favorites = this.loadFavorites();
    }

    // Load favorites from localStorage
    loadFavorites() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load favorites:', e);
            return [];
        }
    }

    // Save favorites to localStorage
    saveFavorites() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));
            // Dispatch custom event for UI updates
            window.dispatchEvent(new CustomEvent('favoritesUpdated', { detail: this.favorites }));
        } catch (e) {
            console.error('Failed to save favorites:', e);
        }
    }

    // Toggle a favorite word
    toggleFavorite(wordKey) {
        if (!wordKey) return false;
        
        const index = this.favorites.indexOf(wordKey);
        if (index === -1) {
            this.favorites.push(wordKey);
            this.saveFavorites();
            return true; // Added
        } else {
            this.favorites.splice(index, 1);
            this.saveFavorites();
            return false; // Removed
        }
    }

    // Check if a word is favorited
    isFavorite(wordKey) {
        return this.favorites.includes(wordKey);
    }

    // Get all favorite word keys
    getAllFavorites() {
        return [...this.favorites];
    }

    // Clear all favorites
    clearAll() {
        this.favorites = [];
        this.saveFavorites();
    }
}

// Create global instance
window.favoritesManager = new FavoritesManager();
