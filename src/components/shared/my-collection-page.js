/**
 * My Collection Page
 * Handles rendering of user favorites
 */

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('favorites-container');
    const emptyState = document.getElementById('empty-state');
    const userInfo = document.getElementById('user-info');

    const init = async () => {
        const clearAllBtn = document.getElementById('clear-all-btn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear your entire collection?')) {
                    if (window.favoritesManager) {
                        window.favoritesManager.clearAll();
                        renderFavorites();
                    }
                }
            });
        }

        // Only show user info if logged in, but don't redirect
        if (window.UserAuth && window.UserAuth.isLoggedIn()) {
            renderUserInfo();
        } else {
            renderGuestInfo();
        }

        // Wait for data
        if (window.supabaseDataLoader && window.supabaseDataLoader.loaded) {
            renderFavorites();
        } else {
            window.addEventListener('pidginDataLoaded', renderFavorites);
        }
        
        // Listen for updates
        window.addEventListener('favoritesUpdated', renderFavorites);
    };

    const renderGuestInfo = () => {
        userInfo.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <i class="ti ti-user"></i>
                </div>
                <div>
                    <div class="font-bold leading-tight text-white">Guest User</div>
                    <a href="/login.html" class="text-xs text-blue-200 hover:text-white underline">Login to sync across devices</a>
                </div>
            </div>
        `;
    };

    const renderUserInfo = () => {
        const user = window.UserAuth.user;
        if (!user) return;

        userInfo.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
                    ${user.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div class="font-bold leading-tight">${user.display_name}</div>
                    <div class="text-xs text-blue-200">${user.email}</div>
                </div>
            </div>
        `;
    };

    const renderFavorites = () => {
        const favKeys = window.favoritesManager ? window.favoritesManager.getAllFavorites() : [];
        const clearAllBtn = document.getElementById('clear-all-btn');
        
        if (favKeys.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            if (clearAllBtn) clearAllBtn.classList.add('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        if (clearAllBtn) clearAllBtn.classList.remove('hidden');
        
        const allEntries = window.supabaseDataLoader.getAllEntries();
        const favorites = allEntries.filter(entry => favKeys.includes(entry.pidgin));

        if (favorites.length === 0 && favKeys.length > 0) {
            // LocalStorage might have stale keys not in current DB
            container.innerHTML = `
                <div class="col-span-full text-center py-10 text-gray-400">
                    <p>Some saved items are no longer available in the dictionary.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = favorites.map(entry => {
            const pidgin = entry.pidgin;
            const english = Array.isArray(entry.english) ? entry.english[0] : entry.english;
            const slug = pidgin.toLowerCase()
                .replace(/['ʻ`‘’]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');

            return `
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                    <div class="flex justify-between items-start mb-4">
                        <span class="text-xs font-bold text-blue-500 uppercase tracking-widest">${entry.category || 'general'}</span>
                        <button onclick="window.favoritesManager.toggleFavorite('${pidgin}')" class="text-red-500 hover:scale-110 transition">
                            <i class="ti ti-heart-filled text-xl"></i>
                        </button>
                    </div>
                    
                    <h3 class="text-2xl font-black text-gray-900 mb-1">${pidgin}</h3>
                    <p class="text-gray-600 mb-4 line-clamp-2">${english}</p>
                    
                    <div class="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                        <a href="/word/${slug}.html" class="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                            LEARN MORE <i class="ti ti-arrow-right"></i>
                        </a>
                        <span class="text-[10px] text-gray-400 uppercase font-medium">Saved</span>
                    </div>
                </div>
            `;
        }).join('');
    };

    init();
});
