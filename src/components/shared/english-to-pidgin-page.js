/**
 * English to Pidgin Dictionary Page
 * Handles rendering and searching of English -> Pidgin translations
 */

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('english-search');
    const azNav = document.getElementById('az-nav');
    const grid = document.getElementById('translations-grid');
    const noResults = document.getElementById('no-results');
    
    let allEntries = [];
    let currentLetter = 'all';
    let searchTerm = '';

    // Initialize
    const init = () => {
        // Wait for data to be loaded
        if (window.supabaseDataLoader && window.supabaseDataLoader.loaded) {
            setup();
        } else {
            window.addEventListener('pidginDataLoaded', setup);
        }
    };

    const setup = () => {
        allEntries = window.supabaseDataLoader.getAllEntries();
        renderAZ();
        render();
        
        // Listen for search
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value.toLowerCase();
            render();
        });
    };

    const renderAZ = () => {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const html = ['all', ...alphabet].map(letter => `
            <button class="letter-btn ${currentLetter === letter.toLowerCase() ? 'active' : ''} w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center font-bold hover:border-blue-500 transition" 
                    data-letter="${letter.toLowerCase()}">
                ${letter.toUpperCase()}
            </button>
        `).join('');
        
        azNav.innerHTML = html;
        
        // Add click listeners
        azNav.querySelectorAll('.letter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                azNav.querySelectorAll('.letter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentLetter = btn.dataset.letter;
                render();
            });
        });
    };

    const render = () => {
        let filtered = allEntries.flatMap(entry => {
            if (!Array.isArray(entry.english)) return [];
            
            return entry.english.map(eng => ({
                english: eng,
                pidgin: entry.pidgin,
                category: entry.category,
                example: entry.examples?.[0] || '',
                id: entry.id
            }));
        });

        // Apply Letter Filter (on English word)
        if (currentLetter !== 'all') {
            filtered = filtered.filter(item => item.english.toLowerCase().startsWith(currentLetter));
        }

        // Apply Search Filter
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.english.toLowerCase().includes(searchTerm) || 
                item.pidgin.toLowerCase().includes(searchTerm)
            );
        }

        // Sort by English alphabetically
        filtered.sort((a, b) => a.english.localeCompare(b.english));

        if (filtered.length === 0) {
            grid.innerHTML = '';
            noResults.classList.remove('hidden');
            return;
        }

        noResults.classList.add('hidden');
        
        grid.innerHTML = filtered.map(item => `
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs font-bold text-blue-500 uppercase tracking-widest">${escapeHtml(item.category || 'general')}</span>
                </div>
                <h3 class="text-lg font-bold text-gray-400 mb-1">English: <span class="text-gray-900">${escapeHtml(item.english)}</span></h3>
                <div class="text-2xl font-black text-blue-600 mb-3">
                    <span class="text-gray-400 text-sm font-normal">Pidgin:</span> ${escapeHtml(item.pidgin)}
                </div>
                ${item.example ? `
                    <div class="bg-blue-50 p-3 rounded-lg border border-blue-100 italic text-sm text-blue-800">
                        "${escapeHtml(item.example)}"
                    </div>
                ` : ''}
                <div class="mt-4 flex justify-end">
                    <a href="/word/${slugify(item.pidgin)}.html" class="text-xs font-bold text-gray-400 hover:text-blue-600 transition flex items-center gap-1">
                        VIEW DETAILS <i class="ti ti-arrow-right"></i>
                    </a>
                </div>
            </div>
        `).join('');
    };

    const slugify = (text) => {
        return text.toLowerCase()
            .replace(/['ʻ`‘’]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    };

    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    init();
});
