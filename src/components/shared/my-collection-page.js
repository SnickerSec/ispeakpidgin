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

    const renderUserInfo = async () => {
        const user = window.UserAuth.user;
        if (!user) return;

        const escapedName = escapeHtml(user.display_name);
        const initial = escapeHtml(user.display_name.charAt(0).toUpperCase());

        // Display basic info first
        userInfo.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl border border-white/30">
                    ${initial}
                </div>
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-lg leading-tight">${escapedName}</span>
                        <span id="user-rank-badge" class="px-2 py-0.5 bg-yellow-400 text-blue-900 text-[10px] font-black rounded-full uppercase tracking-tighter">
                            LOADING...
                        </span>
                    </div>
                    <div id="xp-progress-container" class="mt-2 w-full">
                        <div class="flex justify-between text-[10px] mb-1 font-bold">
                            <span id="level-display">LEVEL --</span>
                            <span id="xp-display">-- / -- XP</span>
                        </div>
                        <div class="w-full bg-white/10 rounded-full h-1.5 overflow-hidden border border-white/10">
                            <div id="xp-progress-bar" class="bg-yellow-400 h-full transition-all duration-1000" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Fetch gamification data
        try {
            const response = await fetch('/api/user/gamification', {
                headers: { 'Authorization': `Bearer ${window.UserAuth.token}` }
            });
            const data = await response.json();
            
            if (data && data.profile) {
                const { total_xp, current_level, current_rank } = data.profile;
                
                // Update UI
                const rankBadge = document.getElementById('user-rank-badge');
                const levelDisplay = document.getElementById('level-display');
                const xpDisplay = document.getElementById('xp-display');
                const progressBar = document.getElementById('xp-progress-bar');
                
                if (rankBadge) rankBadge.innerText = current_rank;
                if (levelDisplay) levelDisplay.innerText = `LEVEL ${current_level}`;
                
                // Simple level logic for display (100 XP per level for simplicity in UI)
                const xpInLevel = total_xp % 100;
                const nextLevelXp = 100;
                
                if (xpDisplay) xpDisplay.innerText = `${total_xp} TOTAL XP`;
                if (progressBar) progressBar.style.width = `${xpInLevel}%`;

                // Render Badges
                if (data.badges && data.badges.length > 0) {
                    renderGamification(data.badges);
                }
            }
        } catch (error) {
            console.error('Failed to load gamification data:', error);
        }
    };

    const renderGamification = (badges) => {
        const gamificationSection = document.getElementById('gamification-section');
        const badgesContainer = document.getElementById('badges-container');
        
        if (!gamificationSection || !badgesContainer) return;
        
        gamificationSection.classList.remove('hidden');
        
        const badgeIcons = {
            'malahini_arrival': '🏝️',
            'first_shaka': '🤙',
            'word_wizard': '🧙‍♂️',
            'helpful_local': '🤝',
            'quiz_king': '👑',
            'talk_story_pro': '🗣️'
        };

        badgesContainer.innerHTML = badges.map(badge => `
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-yellow-200 transition">
                <div class="text-3xl mb-2 group-hover:scale-110 transition duration-300">
                    ${badgeIcons[badge.id] || '🏅'}
                </div>
                <div class="text-[10px] font-black text-gray-900 uppercase tracking-tighter mb-1">${badge.name}</div>
                <div class="text-[9px] text-gray-500 leading-tight">${badge.description}</div>
            </div>
        `).join('');
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

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
