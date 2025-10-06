// Dictionary Page Specialized JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initDictionaryPage();
});

async function initDictionaryPage() {
    // Initialize all dictionary page components
    setupSearch();
    setupFilters();
    setupBackToTop();

    // Wait for dictionary data to be fully loaded
    await waitForDictionaryLoad();

    // Now set up alphabet browser with loaded data
    setupAlphabetBrowser();
    loadInitialEntries();

    const actualCount = pidginDictionary.getTotalCount();
    console.log('🌺 Dictionary page initialized with', actualCount, 'unique entries');

    // Update the page header with accurate count
    const headerText = document.querySelector('.dictionary-search-container p');
    if (headerText) {
        headerText.textContent = `Explore over ${actualCount} Hawaiian Pidgin terms with pronunciations, examples, and cultural context`;
    }
}

// Helper function to wait for dictionary to load
async function waitForDictionaryLoad() {
    // Check if already loaded
    if (pidginDictionary && pidginDictionary.dataLoader && pidginDictionary.dataLoader.loaded) {
        return;
    }

    // Wait for the pidginDataLoaded event
    return new Promise((resolve) => {
        const checkLoaded = () => {
            if (pidginDictionary && pidginDictionary.dataLoader && pidginDictionary.dataLoader.loaded) {
                resolve();
            } else {
                setTimeout(checkLoaded, 100);
            }
        };

        // Also listen for the custom event
        window.addEventListener('pidginDataLoaded', resolve, { once: true });

        // Start checking
        checkLoaded();
    });
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
                const letter = btn.dataset.letter;
                const isActive = btn.classList.contains('active');

                // If clicking the same letter again, clear the filter
                if (isActive) {
                    alphabetBtns.forEach(b => {
                        b.classList.remove('active');
                        b.style.removeProperty('background');
                        b.style.removeProperty('color');
                        b.style.removeProperty('transform');
                    });
                    // Force reset to original state by adding no-hover class temporarily
                    btn.classList.add('no-hover');
                    btn.blur();
                    setTimeout(() => btn.classList.remove('no-hover'), 300);
                    loadInitialEntries(); // Show all entries
                    updateSearchStats(pidginDictionary.getTotalCount(), '', 'All Entries');
                    return;
                }

                // Update button styles
                alphabetBtns.forEach(b => {
                    b.classList.remove('active');
                    b.style.removeProperty('background');
                    b.style.removeProperty('color');
                    b.style.removeProperty('transform');
                });
                btn.classList.add('active');

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
    if (pidginDictionary.isNewSystem && pidginDictionary.dataLoader && pidginDictionary.dataLoader.loaded) {
        return pidginDictionary.dataLoader.getByLetter(letter).length;
    }
    return 0;
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
        grid.style.display = 'none';
        if (noResults) noResults.classList.remove('hidden');
        return;
    }

    // Show grid and hide no results
    grid.style.display = ''; // Remove inline display: none
    if (noResults) noResults.classList.add('hidden');

    // Sort entries alphabetically
    entries.sort((a, b) => a.pidgin.localeCompare(b.pidgin));

    grid.innerHTML = entries.map(entry => {
        // Handle both new and legacy data formats
        const englishText = Array.isArray(entry.english) ? entry.english.join(', ') : entry.english;
        const exampleText = Array.isArray(entry.examples) ? entry.examples[0] || entry.example || '' : entry.example || '';
        const pronunciationText = entry.pronunciation || '';
        const audioText = entry.audioExample || exampleText;

        return `
        <div class="dictionary-entry-card bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-transparent"
             data-word="${entry.key}">
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-xl font-bold text-purple-700">${entry.pidgin}</h3>
                <span class="text-xs px-3 py-1 bg-purple-100 text-purple-600 rounded-full font-medium">
                    ${entry.category}
                </span>
            </div>

            <p class="text-gray-700 mb-3 font-medium">${englishText}</p>

            ${exampleText ? `
            <div class="mb-4">
                <p class="text-sm text-gray-600 italic">"${exampleText}"</p>
            </div>
            ` : ''}

            ${pronunciationText ? `
            <div class="mb-4 bg-yellow-50 rounded-lg p-3">
                <div class="text-xs text-yellow-800 font-semibold mb-1">Pronunciation:</div>
                <div class="text-sm text-yellow-700">${pronunciationText}</div>
            </div>
            ` : ''}

            <div class="flex gap-2 flex-wrap">
                <button class="dict-speak-btn text-xs px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition font-medium"
                        data-text="${audioText}">
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
        `;
    }).join('');

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
    // Get entry from enhanced data system
    let entry = null;

    if (pidginDictionary.isNewSystem) {
        entry = pidginDictionary.dataLoader.getById(wordKey);
    }

    if (!entry) return;

    // Normalize entry format for display
    const displayEntry = {
        pidgin: entry.pidgin,
        english: Array.isArray(entry.english) ? entry.english.join(', ') : entry.english,
        pronunciation: entry.pronunciation || '',
        examples: Array.isArray(entry.examples) ? entry.examples : [entry.example || ''],
        usage: entry.usage || '',
        origin: entry.origin || '',
        category: entry.category || '',
        audioExample: entry.audioExample || entry.examples?.[0] || entry.example || ''
    };

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';

    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <!-- Header -->
            <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 rounded-t-2xl">
                <div class="flex justify-between items-start">
                    <div>
                        <h2 class="text-4xl font-bold mb-2">${displayEntry.pidgin}</h2>
                        <p class="text-xl text-purple-100">${displayEntry.english}</p>
                    </div>
                    <button class="close-modal text-white hover:text-purple-200 text-3xl font-bold">×</button>
                </div>
            </div>

            <!-- Content -->
            <div class="p-8 space-y-6">
                ${displayEntry.pronunciation ? `
                <!-- Pronunciation -->
                <div class="bg-purple-50 rounded-xl p-6">
                    <h3 class="font-bold text-purple-800 mb-3 text-lg flex items-center">
                        🗣️ Pronunciation
                    </h3>
                    <p class="text-2xl text-purple-700 font-mono">${displayEntry.pronunciation}</p>
                    <button class="mt-3 px-6 py-3 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition speak-word">
                        🔊 Hear Pronunciation
                    </button>
                </div>
                ` : ''}

                ${displayEntry.examples.filter(ex => ex).length > 0 ? `
                <!-- Examples -->
                <div class="bg-blue-50 rounded-xl p-6">
                    <h3 class="font-bold text-blue-800 mb-3 text-lg flex items-center">
                        💬 Examples
                    </h3>
                    ${displayEntry.examples.filter(ex => ex).map(example => `
                        <p class="text-xl italic text-blue-700 mb-3">"${example}"</p>
                    `).join('')}
                    <button class="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition speak-example">
                        🔊 Listen to Example
                    </button>
                </div>
                ` : ''}

                ${displayEntry.usage ? `
                <!-- Usage & Context -->
                <div class="bg-green-50 rounded-xl p-6">
                    <h3 class="font-bold text-green-800 mb-3 text-lg flex items-center">
                        📚 Usage & Context
                    </h3>
                    <p class="text-green-700 text-lg">${displayEntry.usage}</p>
                </div>
                ` : ''}

                ${displayEntry.origin ? `
                <!-- Cultural Origin -->
                <div class="bg-yellow-50 rounded-xl p-6">
                    <h3 class="font-bold text-yellow-800 mb-3 text-lg flex items-center">
                        🌺 Cultural Origin
                    </h3>
                    <p class="text-yellow-700 text-lg">${displayEntry.origin}</p>
                </div>
                ` : ''}

                <!-- Category -->
                <div class="bg-gray-50 rounded-xl p-6">
                    <h3 class="font-bold text-gray-800 mb-3 text-lg flex items-center">
                        🏷️ Category
                    </h3>
                    <span class="inline-block px-4 py-2 bg-purple-200 text-purple-800 rounded-full font-medium">
                        ${displayEntry.category}
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
    speakWordBtn.addEventListener('click', () => speakText(displayEntry.pidgin));
    speakExampleBtn.addEventListener('click', () => speakText(displayEntry.audioExample));

    // Practice action
    practiceBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
        startWordPractice(wordKey);
    });

    // Translate action
    translateBtn.addEventListener('click', () => {
        window.location.href = `index.html#translator?word=${encodeURIComponent(displayEntry.pidgin)}`;
    });
}

// Start word practice
function startWordPractice(wordKey) {
    // Use the new interactive practice system
    if (window.practiceSession) {
        window.practiceSession.start(wordKey, 'flashcard');
    } else {
        // Fallback to old system if practice session not loaded
        console.error('Practice session not available');

        // Get entry from enhanced data system
        let entry = null;
        if (pidginDictionary.isNewSystem) {
            entry = pidginDictionary.dataLoader.getById(wordKey);
        }

        if (!entry) return;

        const pidgin = entry.pidgin;
        const english = Array.isArray(entry.english) ? entry.english.join(', ') : entry.english;
        const example = Array.isArray(entry.examples) ? entry.examples[0] : entry.example || '';

        alert(`🎯 Practice Session Starting!

Word: ${pidgin}
Meaning: ${english}

Try using "${pidgin}" in a sentence!
${example ? `Example: "${example}"` : ''}

Practice speaking it out loud and use it in conversation today! 🌺`);
    }
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
    // No delay needed - dictionary is already loaded
    const allEntries = pidginDictionary.getByCategory('all');
    displayResults(allEntries);
    updateSearchStats(allEntries.length);
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
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        // Remove any existing listeners to avoid duplicates
        const newBtn = mobileMenuBtn.cloneNode(true);
        mobileMenuBtn.parentNode.replaceChild(newBtn, mobileMenuBtn);

        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            mobileMenu.classList.toggle('hidden');

            // Toggle aria-expanded for accessibility
            const isExpanded = !mobileMenu.classList.contains('hidden');
            newBtn.setAttribute('aria-expanded', isExpanded);
        });

        // Close mobile menu when clicking a link
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                newBtn.setAttribute('aria-expanded', 'false');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!newBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.add('hidden');
                newBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }
}

// Initialize mobile menu when DOM is ready or immediately if already ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
} else {
    // DOM is already ready
    initMobileMenu();
}

// Enhanced text-to-speech functionality (reuse from main.js)
function speakText(text, options = {}) {
    if ('speechSynthesis' in window && typeof pidginSpeech !== 'undefined') {
        // Use the enhanced Pidgin speech synthesizer (handles all fallbacks internally)
        pidginSpeech.speak(text, options).catch(err => {
            console.error('All speech methods failed:', err);
            alert('Sorry, speech synthesis is not available right now.');
        });
    } else {
        // Basic fallback only if pidginSpeech is not available
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
    }
}