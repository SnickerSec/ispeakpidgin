// Navigation JavaScript - automatically included on all pages
document.addEventListener('DOMContentLoaded', function() {
    // Dropdown Logic (Desktop)
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    let activeDropdown = null;

    dropdowns.forEach(dropdown => {
        const btn = dropdown.querySelector('button');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = menu.classList.contains('hidden');
            
            // Close all others
            closeAllDropdowns();
            
            if (isHidden) {
                menu.classList.remove('hidden');
                activeDropdown = menu;
            }
        });

        // Hover support for desktop
        dropdown.addEventListener('mouseenter', () => {
            if (window.innerWidth >= 1024) {
                closeAllDropdowns();
                menu.classList.remove('hidden');
                activeDropdown = menu;
            }
        });
    });

    function closeAllDropdowns() {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.add('hidden'));
        activeDropdown = null;
    }

    // Close on outside click
    document.addEventListener('click', () => closeAllDropdowns());

    // Mobile Menu Logic
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMobileBtn = document.getElementById('close-mobile-menu');

    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });

        if (closeMobileBtn) {
            closeMobileBtn.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                document.body.style.overflow = '';
            });
        }
    }

    // Quick Search Logic
    const searchBtn = document.getElementById('nav-search-btn');
    const searchOverlay = document.getElementById('search-overlay');
    const searchInput = document.getElementById('nav-search-input');
    const closeSearch = document.getElementById('close-search');
    const searchResults = document.getElementById('search-results');
    const searchPlaceholder = document.getElementById('search-placeholder');

    if (searchBtn && searchOverlay) {
        searchBtn.addEventListener('click', () => {
            searchOverlay.classList.remove('hidden');
            searchInput.focus();
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

        closeSearch.addEventListener('click', hideSearch);
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) hideSearch();
        });

        // Handle ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideSearch();
                if (mobileMenu) mobileMenu.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });

        // Live Search Implementation
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim().toLowerCase();

            if (query.length < 2) {
                searchResults.classList.add('hidden');
                searchPlaceholder.classList.remove('hidden');
                return;
            }

            searchTimeout = setTimeout(() => {
                performSearch(query);
            }, 200);
        });

        async function performSearch(query) {
            if (!window.pidginDataLoader) return;

            // Wait for data if it's still loading
            if (!window.pidginDataLoader.loaded) {
                await window.pidginDataLoader.autoLoad();
            }

            const entries = window.pidginDataLoader.getAllEntries();
            if (!entries) return;

            const matches = entries.filter(entry => {
                const pidgin = (entry.pidgin || '').toLowerCase();
                const english = Array.isArray(entry.english) ? entry.english.join(' ').toLowerCase() : (entry.english || '').toLowerCase();
                return pidgin.includes(query) || english.includes(query);
            }).slice(0, 8); // Limit to top 8 results

            displayResults(matches, query);
        }

        function displayResults(matches, query) {
            searchPlaceholder.classList.add('hidden');
            searchResults.classList.remove('hidden');

            if (matches.length === 0) {
                searchResults.innerHTML = `
                    <div class="p-8 text-center text-gray-500">
                        <i class="ti ti-mood-empty text-3xl mb-2 block"></i>
                        <p>No results found for "${query}"</p>
                        <p class="text-xs mt-1">Try different word, brah!</p>
                    </div>
                `;
                return;
            }

            searchResults.innerHTML = matches.map(entry => {
                const slug = entry.slug || entry.pidgin.toLowerCase().replace(/['ʻ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                return `
                <a href="/word/${slug}.html" 
                   class="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition group">
                    <div>
                        <div class="font-bold text-gray-800 group-hover:text-green-600">${entry.pidgin}</div>
                        <div class="text-sm text-gray-500 line-clamp-1">${Array.isArray(entry.english) ? entry.english[0] : entry.english}</div>
                    </div>
                    <i class="ti ti-chevron-right text-gray-300 group-hover:text-green-400"></i>
                </a>
                `;
            }).join('');

            // Add "See all" link if many results
            if (matches.length >= 8) {
                searchResults.innerHTML += `
                    <a href="/dictionary.html?q=${encodeURIComponent(query)}" class="block text-center p-3 text-sm font-bold text-blue-500 hover:text-blue-700">
                        View all results in dictionary
                    </a>
                `;
            }
        }

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
});
