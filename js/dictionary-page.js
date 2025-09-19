// Dictionary Page Specialized JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initDictionaryPage();
});

function initDictionaryPage() {
    // Initialize all dictionary page components
    setupSearch();
    setupFilters();
    setupAlphabetBrowser();
    setupBackToTop();
    loadInitialEntries();

    console.log('🌺 Dictionary page initialized with', Object.keys(comprehensivePidginData).length, 'entries');
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('dictionary-search');
    const searchBtn = document.getElementById('dictionary-search-btn');
    const quickSearchBtns = document.querySelectorAll('.quick-search');

    // Main search
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // Real-time search
        searchInput.addEventListener('input', debounce(performSearch, 300));
    }

    // Quick search buttons
    quickSearchBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const word = btn.dataset.word;
            searchInput.value = word;
            performSearch();

            // Scroll to results
            document.getElementById('dictionary-grid').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    });

    function performSearch() {
        const term = searchInput.value.trim();
        let results;

        if (term) {
            results = pidginDictionary.searchDictionary(term);
        } else {
            results = pidginDictionary.getByCategory('all');
        }

        displayResults(results);
        updateSearchStats(results.length, term);
    }
}

// Filter functionality
function setupFilters() {
    const categoryBtns = document.querySelectorAll('.dict-category');
    const showAllBtn = document.getElementById('show-all-btn');

    // Category filtering
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update button styles
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Load entries for selected category
            const category = btn.dataset.category;
            const results = pidginDictionary.getByCategory(category);
            displayResults(results);
            updateSearchStats(results.length, '', category);

            // Clear search input
            document.getElementById('dictionary-search').value = '';
        });
    });

    // Show all button
    if (showAllBtn) {
        showAllBtn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            categoryBtns[0].classList.add('active'); // "All Categories"

            const results = pidginDictionary.getByCategory('all');
            displayResults(results);
            updateSearchStats(results.length);

            document.getElementById('dictionary-search').value = '';
        });
    }
}

// Alphabet browser
function setupAlphabetBrowser() {
    const alphabetBrowser = document.getElementById('alphabet-browser');

    if (alphabetBrowser) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        alphabetBrowser.innerHTML = alphabet.map(letter => {
            const count = getLetterCount(letter);
            return `<button class="alphabet-btn px-3 py-2 bg-gray-100 hover:bg-yellow-200 rounded-lg transition font-semibold text-sm ${count === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
                     data-letter="${letter}"
                     ${count === 0 ? 'disabled' : ''}>
                     ${letter}<span class="text-xs block">${count}</span>
                   </button>`;
        }).join('');

        // Add click handlers for alphabet buttons
        const alphabetBtns = alphabetBrowser.querySelectorAll('.alphabet-btn:not([disabled])');
        alphabetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update button styles
                alphabetBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const letter = btn.dataset.letter;
                const results = pidginDictionary.getByLetter(letter.toLowerCase());
                displayResults(results);
                updateSearchStats(results.length, '', `Letter "${letter}"`);

                // Clear search and category filters
                document.getElementById('dictionary-search').value = '';
                document.querySelectorAll('.dict-category').forEach(b => b.classList.remove('active'));
            });
        });
    }
}

// Get count of words starting with a letter
function getLetterCount(letter) {
    return Object.keys(comprehensivePidginData).filter(key =>
        key.charAt(0).toLowerCase() === letter.toLowerCase()
    ).length;
}

// Display search results
function displayResults(entries) {
    const grid = document.getElementById('dictionary-grid');
    const loadingState = document.getElementById('loading-state');
    const noResults = document.getElementById('no-results');

    // Hide loading state
    if (loadingState) loadingState.style.display = 'none';

    if (entries.length === 0) {
        grid.innerHTML = '';
        if (noResults) noResults.classList.remove('hidden');
        return;
    }

    // Hide no results
    if (noResults) noResults.classList.add('hidden');

    // Sort entries alphabetically
    entries.sort((a, b) => a.pidgin.localeCompare(b.pidgin));

    grid.innerHTML = entries.map(entry => `
        <div class="dictionary-entry-card bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-transparent"
             data-word="${entry.key}">
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-xl font-bold text-purple-700">${entry.pidgin}</h3>
                <span class="text-xs px-3 py-1 bg-purple-100 text-purple-600 rounded-full font-medium">
                    ${entry.category}
                </span>
            </div>

            <p class="text-gray-700 mb-3 font-medium">${entry.english}</p>

            <div class="mb-4">
                <p class="text-sm text-gray-600 italic">"${entry.example}"</p>
            </div>

            <div class="mb-4 bg-yellow-50 rounded-lg p-3">
                <div class="text-xs text-yellow-800 font-semibold mb-1">Pronunciation:</div>
                <div class="text-sm text-yellow-700">${entry.pronunciation}</div>
            </div>

            <div class="flex gap-2 flex-wrap">
                <button class="dict-speak-btn text-xs px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition font-medium"
                        data-text="${entry.audioExample}">
                    🔊 Listen
                </button>
                <button class="dict-details-btn text-xs px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-full transition font-medium"
                        data-word="${entry.key}">
                    📖 Details
                </button>
                <button class="dict-practice-btn text-xs px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full transition font-medium"
                        data-word="${entry.key}">
                    🎯 Practice
                </button>
            </div>
        </div>
    `).join('');

    // Add event listeners
    addEntryEventListeners();
}

// Add event listeners to dictionary entries
function addEntryEventListeners() {
    const grid = document.getElementById('dictionary-grid');

    // Speak buttons
    const speakBtns = grid.querySelectorAll('.dict-speak-btn');
    speakBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const text = btn.dataset.text;
            speakText(text);

            // Visual feedback
            btn.innerHTML = '🔊 Playing...';
            setTimeout(() => {
                btn.innerHTML = '🔊 Listen';
            }, 2000);
        });
    });

    // Details buttons
    const detailsBtns = grid.querySelectorAll('.dict-details-btn');
    detailsBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const word = btn.dataset.word;
            showWordDetails(word);
        });
    });

    // Practice buttons
    const practiceBtns = grid.querySelectorAll('.dict-practice-btn');
    practiceBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const word = btn.dataset.word;
            startWordPractice(word);
        });
    });

    // Card click for details
    const entries = grid.querySelectorAll('.dictionary-entry-card');
    entries.forEach(entry => {
        entry.addEventListener('click', () => {
            const word = entry.dataset.word;
            showWordDetails(word);
        });
    });
}

// Show detailed word information
function showWordDetails(wordKey) {
    const entry = comprehensivePidginData[wordKey];
    if (!entry) return;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';

    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <!-- Header -->
            <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 rounded-t-2xl">
                <div class="flex justify-between items-start">
                    <div>
                        <h2 class="text-4xl font-bold mb-2">${entry.pidgin}</h2>
                        <p class="text-xl text-purple-100">${entry.english}</p>
                    </div>
                    <button class="close-modal text-white hover:text-purple-200 text-3xl font-bold">×</button>
                </div>
            </div>

            <!-- Content -->
            <div class="p-8 space-y-6">
                <!-- Pronunciation -->
                <div class="bg-purple-50 rounded-xl p-6">
                    <h3 class="font-bold text-purple-800 mb-3 text-lg flex items-center">
                        🗣️ Pronunciation
                    </h3>
                    <p class="text-2xl text-purple-700 font-mono">${entry.pronunciation}</p>
                    <button class="mt-3 px-6 py-3 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition speak-word">
                        🔊 Hear Pronunciation
                    </button>
                </div>

                <!-- Example -->
                <div class="bg-blue-50 rounded-xl p-6">
                    <h3 class="font-bold text-blue-800 mb-3 text-lg flex items-center">
                        💬 Example
                    </h3>
                    <p class="text-xl italic text-blue-700 mb-3">"${entry.example}"</p>
                    <button class="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition speak-example">
                        🔊 Listen to Example
                    </button>
                </div>

                <!-- Usage & Context -->
                <div class="bg-green-50 rounded-xl p-6">
                    <h3 class="font-bold text-green-800 mb-3 text-lg flex items-center">
                        📚 Usage & Context
                    </h3>
                    <p class="text-green-700 text-lg">${entry.usage}</p>
                </div>

                <!-- Cultural Origin -->
                <div class="bg-yellow-50 rounded-xl p-6">
                    <h3 class="font-bold text-yellow-800 mb-3 text-lg flex items-center">
                        🌺 Cultural Origin
                    </h3>
                    <p class="text-yellow-700 text-lg">${entry.origin}</p>
                </div>

                <!-- Category -->
                <div class="bg-gray-50 rounded-xl p-6">
                    <h3 class="font-bold text-gray-800 mb-3 text-lg flex items-center">
                        🏷️ Category
                    </h3>
                    <span class="inline-block px-4 py-2 bg-purple-200 text-purple-800 rounded-full font-medium">
                        ${entry.category}
                    </span>
                </div>
            </div>

            <!-- Actions -->
            <div class="p-8 border-t bg-gray-50 rounded-b-2xl">
                <div class="flex gap-4 justify-center flex-wrap">
                    <button class="px-8 py-4 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition font-semibold practice-word">
                        🎯 Practice This Word
                    </button>
                    <button class="px-8 py-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition font-semibold translate-word">
                        🔄 Use in Translator
                    </button>
                    <button class="px-8 py-4 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition font-semibold close-btn">
                        ✓ Got It!
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Event handlers
    const closeBtn = modal.querySelector('.close-modal');
    const gotItBtn = modal.querySelector('.close-btn');
    const speakWordBtn = modal.querySelector('.speak-word');
    const speakExampleBtn = modal.querySelector('.speak-example');
    const practiceBtn = modal.querySelector('.practice-word');
    const translateBtn = modal.querySelector('.translate-word');

    // Close modal
    [closeBtn, gotItBtn].forEach(btn => {
        btn.addEventListener('click', () => document.body.removeChild(modal));
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) document.body.removeChild(modal);
    });

    // Audio actions
    speakWordBtn.addEventListener('click', () => speakText(entry.pidgin));
    speakExampleBtn.addEventListener('click', () => speakText(entry.audioExample));

    // Practice action
    practiceBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
        startWordPractice(wordKey);
    });

    // Translate action
    translateBtn.addEventListener('click', () => {
        window.location.href = `index.html#translator?word=${encodeURIComponent(entry.pidgin)}`;
    });
}

// Start word practice
function startWordPractice(wordKey) {
    const entry = comprehensivePidginData[wordKey];
    if (!entry) return;

    alert(`🎯 Practice Session Starting!

Word: ${entry.pidgin}
Meaning: ${entry.english}

Try using "${entry.pidgin}" in a sentence!
Example: "${entry.example}"

Practice speaking it out loud and use it in conversation today! 🌺`);
}

// Update search statistics
function updateSearchStats(count, searchTerm = '', category = '') {
    const statsEl = document.getElementById('search-results-count');
    if (!statsEl) return;

    let message = '';
    if (searchTerm) {
        message = `Found ${count} result${count !== 1 ? 's' : ''} for "${searchTerm}"`;
    } else if (category) {
        message = `Showing ${count} word${count !== 1 ? 's' : ''} in ${category}`;
    } else {
        message = `Showing all ${count} dictionary entries`;
    }

    statsEl.textContent = message;
}

// Load initial entries
function loadInitialEntries() {
    setTimeout(() => {
        const allEntries = pidginDictionary.getByCategory('all');
        displayResults(allEntries);
        updateSearchStats(allEntries.length);
    }, 100);
}

// Back to top functionality
function setupBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');

    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.style.opacity = '1';
                backToTopBtn.style.pointerEvents = 'auto';
            } else {
                backToTopBtn.style.opacity = '0';
                backToTopBtn.style.pointerEvents = 'none';
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// Utility: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Close mobile menu when clicking a link
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }
});

// Enhanced text-to-speech functionality (reuse from main.js)
function speakText(text, options = {}) {
    if ('speechSynthesis' in window && typeof pidginSpeech !== 'undefined') {
        pidginSpeech.speak(text, options).catch(err => {
            console.error('Speech error:', err);
            // Fallback to basic speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        });
    } else {
        // Basic fallback
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
    }
}