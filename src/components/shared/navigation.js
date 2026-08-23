// Navigation JavaScript - automatically included on all pages
(function() {
    function initNavigation() {
        // --- shadcn Navigation Menu Controller ---
        const menuItems = document.querySelectorAll('.nav-menu-item');
        let activeItem = null;
        let closeTimeout = null;

        function closeMenuItem(item) {
            if (!item) return;
            const trigger = item.querySelector('.nav-menu-trigger');
            const content = item.querySelector('.nav-menu-content');
            if (trigger) {
                trigger.setAttribute('data-state', 'closed');
                trigger.setAttribute('aria-expanded', 'false');
            }
            if (content) {
                content.setAttribute('data-state', 'closed');
                content.classList.add('hidden');
            }
            if (activeItem === item) activeItem = null;
        }

        function openMenuItem(item) {
            if (!item) return;
            clearTimeout(closeTimeout);

            // Close any other open menu item
            if (activeItem && activeItem !== item) {
                closeMenuItem(activeItem);
            }

            const trigger = item.querySelector('.nav-menu-trigger');
            const content = item.querySelector('.nav-menu-content');
            if (!trigger || !content) return;

            content.classList.remove('hidden');
            trigger.setAttribute('data-state', 'open');
            trigger.setAttribute('aria-expanded', 'true');
            content.setAttribute('data-state', 'open');
            activeItem = item;

            // Viewport edge collision detection
            const rect = content.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            if (rect.right > viewportWidth - 16) {
                const overflow = rect.right - (viewportWidth - 16);
                content.style.left = `-${overflow}px`;
            } else {
                content.style.left = '0px';
            }
        }

        function closeAllMenus() {
            menuItems.forEach(item => closeMenuItem(item));
        }

        menuItems.forEach(item => {
            const trigger = item.querySelector('.nav-menu-trigger');
            const content = item.querySelector('.nav-menu-content');
            if (!trigger || !content) return;

            // 1. Desktop Hover: enter
            item.addEventListener('mouseenter', () => {
                if (window.innerWidth >= 1024) {
                    openMenuItem(item);
                }
            });

            // 2. Desktop Hover: leave with grace buffer
            item.addEventListener('mouseleave', () => {
                if (window.innerWidth >= 1024) {
                    clearTimeout(closeTimeout);
                    closeTimeout = setTimeout(() => {
                        closeMenuItem(item);
                    }, 200);
                }
            });

            // 3. Click / Tap toggle
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = trigger.getAttribute('data-state') === 'open';
                if (isOpen) {
                    closeMenuItem(item);
                } else {
                    openMenuItem(item);
                }
            });

            // Prevent clicks inside the dropdown menu card from closing it
            content.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-menu-item')) {
                closeAllMenus();
            }
        });

        // Mobile Menu Drawer Logic
        const mobileBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const closeMobileBtn = document.getElementById('close-mobile-menu');

        if (mobileBtn && mobileMenu) {
            mobileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                mobileMenu.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            });

            if (closeMobileBtn) {
                closeMobileBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    mobileMenu.classList.add('hidden');
                    document.body.style.overflow = '';
                });
            }
        }

        // --- Theme Enforcement (Island Night Exclusive) ---
        document.documentElement.classList.add('dark');
        localStorage.removeItem('pidgin_theme');

        // Quick Search Overlay Logic
        const searchBtn = document.getElementById('nav-search-btn');
        const searchOverlay = document.getElementById('search-overlay');
        const searchInput = document.getElementById('nav-search-input');
        const closeSearch = document.getElementById('close-search');
        const searchResults = document.getElementById('search-results');
        const searchPlaceholder = document.getElementById('search-placeholder');

        if (searchBtn && searchOverlay) {
            searchBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                searchOverlay.classList.remove('hidden');
                if (searchInput) searchInput.focus();
                document.body.style.overflow = 'hidden';
                
                // Preload dictionary if not already loaded
                if (window.pidginDataLoader && !window.pidginDataLoader.loaded) {
                    window.pidginDataLoader.autoLoad();
                }
            });

            const hideSearch = () => {
                searchOverlay.classList.add('hidden');
                document.body.style.overflow = '';
            };

            if (closeSearch) closeSearch.addEventListener('click', hideSearch);
            searchOverlay.addEventListener('click', (e) => {
                if (e.target === searchOverlay) hideSearch();
            });

            // Global ESC key listener
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeAllMenus();
                    hideSearch();
                    if (mobileMenu) mobileMenu.classList.add('hidden');
                    document.body.style.overflow = '';
                }
            });

            // Live Search Implementation
            let searchTimeout;
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    const query = e.target.value.trim().toLowerCase();

                    if (query.length < 2) {
                        if (searchResults) searchResults.classList.add('hidden');
                        if (searchPlaceholder) searchPlaceholder.classList.remove('hidden');
                        return;
                    }

                    searchTimeout = setTimeout(() => {
                        performSearch(query);
                    }, 200);
                });

                // Handle Enter key
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const query = searchInput.value.trim();
                        if (query) {
                            window.location.href = `/dictionary.html?q=${encodeURIComponent(query)}`;
                        }
                    }
                });
            }

            async function performSearch(query) {
                if (!window.pidginDataLoader) return;

                if (!window.pidginDataLoader.loaded) {
                    await window.pidginDataLoader.autoLoad();
                }

                const entries = window.pidginDataLoader.getAllEntries();
                if (!entries) return;

                const matches = entries.filter(entry => {
                    const pidgin = (entry.pidgin || '').toLowerCase();
                    const english = Array.isArray(entry.english) ? entry.english.join(' ').toLowerCase() : (entry.english || '').toLowerCase();
                    return pidgin.includes(query) || english.includes(query);
                }).slice(0, 8);

                displayResults(matches, query);
            }

            function escapeHtml(s) {
                return String(s ?? '').replace(/[&<>"']/g, c => ({
                    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
                }[c]));
            }

            function displayResults(matches, query) {
                if (!searchResults || !searchPlaceholder) return;
                searchPlaceholder.classList.add('hidden');
                searchResults.classList.remove('hidden');

                if (matches.length === 0) {
                    searchResults.innerHTML = `
                        <div class="p-8 text-center text-slate-400">
                            <iconify-icon icon="lucide:frown" class="text-3xl mb-2 block mx-auto opacity-50"></iconify-icon>
                            <p>No results found for "${escapeHtml(query)}"</p>
                            <p class="text-xs mt-1 text-slate-500">Try different word, brah!</p>
                        </div>
                    `;
                    return;
                }

                searchResults.innerHTML = matches.map(entry => {
                    const slug = entry.slug || entry.pidgin.toLowerCase().replace(/['ʻ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                    const english = Array.isArray(entry.english) ? entry.english[0] : entry.english;
                    return `
                    <a href="/word/${encodeURIComponent(slug)}.html"
                       class="flex items-center justify-between p-3.5 hover:bg-slate-800 rounded-xl transition group">
                        <div>
                            <div class="font-bold text-slate-100 group-hover:text-orange-400 transition-colors">${escapeHtml(entry.pidgin)}</div>
                            <div class="text-xs text-slate-400 line-clamp-1">${escapeHtml(english)}</div>
                        </div>
                        <iconify-icon icon="lucide:chevron-right" class="text-slate-600 group-hover:text-orange-400 transition-colors"></iconify-icon>
                    </a>
                    `;
                }).join('');

                if (matches.length >= 8) {
                    searchResults.innerHTML += `
                        <a href="/dictionary.html?q=${encodeURIComponent(query)}" class="block text-center p-3 text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors">
                            View all results in dictionary
                        </a>
                    `;
                }
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavigation);
    } else {
        initNavigation();
    }
})();
