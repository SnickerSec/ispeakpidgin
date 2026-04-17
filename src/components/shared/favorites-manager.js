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
    async toggleFavorite(wordKey, itemType = 'word', itemId = null) {
        if (!wordKey) return false;
        
        // Always update local for instant feedback
        const index = this.favorites.indexOf(wordKey);
        let added = false;
        if (index === -1) {
            this.favorites.push(wordKey);
            added = true;
        } else {
            this.favorites.splice(index, 1);
            added = false;
        }
        this.saveFavorites();

        // Sync with backend if logged in
        if (window.UserAuth && window.UserAuth.isLoggedIn()) {
            try {
                const response = await fetch('/api/user/favorites/toggle', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...window.UserAuth.getAuthHeader()
                    },
                    body: JSON.stringify({
                        pidgin: wordKey,
                        item_type: itemType,
                        item_id: itemId || 0 // If not provided, backend should still handle it or we should lookup
                    })
                });
                
                if (!response.ok) throw new Error('Sync failed');
            } catch (error) {
                console.error('Failed to sync favorite:', error);
                // We could revert local state here, but for better UX we'll just log
            }
        }
        
        return added;
    }

    // Sync from cloud
    async syncFromCloud() {
        if (!window.UserAuth || !window.UserAuth.isLoggedIn()) return;

        try {
            const response = await fetch('/api/user/favorites', {
                headers: window.UserAuth.getAuthHeader()
            });

            if (!response.ok) throw new Error('Cloud fetch failed');

            const data = await response.json();
            const cloudFavorites = data.favorites.map(f => f.pidgin);
            
            // Merge or replace? For simplicity, we'll replace with cloud data if logged in
            this.favorites = cloudFavorites;
            this.saveFavorites();
        } catch (error) {
            console.error('Failed to sync favorites from cloud:', error);
        }
    }

    // Check if a word is favorited
    isFavorite(wordKey) {
        return this.favorites.includes(wordKey);
    }

    // Get all favorite keys
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
