// Pidgin Bible Navigation and Search
// This provides navigation and deep linking to external Bible resources

// New Testament books with chapter counts
const bibleBooks = [
    { name: 'Matthew', slug: 'matthew', chapters: 28, abbrev: 'MAT' },
    { name: 'Mark', slug: 'mark', chapters: 16, abbrev: 'MRK' },
    { name: 'Luke', slug: 'luke', chapters: 24, abbrev: 'LUK' },
    { name: 'John', slug: 'john', chapters: 21, abbrev: 'JHN' },
    { name: 'Acts', slug: 'acts', chapters: 28, abbrev: 'ACT' },
    { name: 'Romans', slug: 'romans', chapters: 16, abbrev: 'ROM' },
    { name: '1 Corinthians', slug: '1-corinthians', chapters: 16, abbrev: '1CO' },
    { name: '2 Corinthians', slug: '2-corinthians', chapters: 13, abbrev: '2CO' },
    { name: 'Galatians', slug: 'galatians', chapters: 6, abbrev: 'GAL' },
    { name: 'Ephesians', slug: 'ephesians', chapters: 6, abbrev: 'EPH' },
    { name: 'Philippians', slug: 'philippians', chapters: 4, abbrev: 'PHP' },
    { name: 'Colossians', slug: 'colossians', chapters: 4, abbrev: 'COL' },
    { name: '1 Thessalonians', slug: '1-thessalonians', chapters: 5, abbrev: '1TH' },
    { name: '2 Thessalonians', slug: '2-thessalonians', chapters: 3, abbrev: '2TH' },
    { name: '1 Timothy', slug: '1-timothy', chapters: 6, abbrev: '1TI' },
    { name: '2 Timothy', slug: '2-timothy', chapters: 4, abbrev: '2TI' },
    { name: 'Titus', slug: 'titus', chapters: 3, abbrev: 'TIT' },
    { name: 'Philemon', slug: 'philemon', chapters: 1, abbrev: 'PHM' },
    { name: 'Hebrews', slug: 'hebrews', chapters: 13, abbrev: 'HEB' },
    { name: 'James', slug: 'james', chapters: 5, abbrev: 'JAS' },
    { name: '1 Peter', slug: '1-peter', chapters: 5, abbrev: '1PE' },
    { name: '2 Peter', slug: '2-peter', chapters: 3, abbrev: '2PE' },
    { name: '1 John', slug: '1-john', chapters: 5, abbrev: '1JN' },
    { name: '2 John', slug: '2-john', chapters: 1, abbrev: '2JN' },
    { name: '3 John', slug: '3-john', chapters: 1, abbrev: '3JN' },
    { name: 'Jude', slug: 'jude', chapters: 1, abbrev: 'JUD' },
    { name: 'Revelation', slug: 'revelation', chapters: 22, abbrev: 'REV' }
];

// External Bible resource URLs
const bibleResources = {
    biblecom: 'https://www.bible.com/bible/76/', // HPB version ID
    hipidginbible: 'https://hipidginbible.org/dgasb-online',
    ebible: 'https://ebible.org/hwc/', // eBible.org Hawaii Pidgin
    bibleis: 'https://live.bible.is/bible/HWCWYIN2ET' // Hawaii Pidgin Bible.is
};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializeBibleNav();
    initializeSearch();
    initializeMobileToggle();
});

// Generate book navigation
function initializeBibleNav() {
    const bookList = document.getElementById('book-list');
    if (!bookList) return;

    bookList.innerHTML = bibleBooks.map(book => `
        <button
            class="book-nav-item block w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-purple-50 transition"
            data-book="${book.slug}">
            ${book.name}
        </button>
    `).join('');

    // Add event delegation for book navigation
    bookList.addEventListener('click', (e) => {
        const bookBtn = e.target.closest('.book-nav-item');
        if (bookBtn) {
            const bookSlug = bookBtn.getAttribute('data-book');
            loadBook(bookSlug);
        }
    });
}

// Initialize mobile dropdown toggle for New Testament books
function initializeMobileToggle() {
    const toggle = document.getElementById('nt-toggle');
    const bookList = document.getElementById('book-list');
    const chevron = document.getElementById('nt-chevron');

    if (!toggle || !bookList) return;

    toggle.addEventListener('click', () => {
        const isHidden = bookList.classList.contains('hidden');

        if (isHidden) {
            // Show the list
            bookList.classList.remove('hidden');
            bookList.classList.add('block');
            if (chevron) chevron.classList.add('rotate-180');
        } else {
            // Hide the list
            bookList.classList.add('hidden');
            bookList.classList.remove('block');
            if (chevron) chevron.classList.remove('rotate-180');
        }
    });
}

// Initialize search functionality
function initializeSearch() {
    const searchInput = document.getElementById('bible-search');
    const searchBtn = document.getElementById('search-btn');

    if (!searchBtn || !searchInput) return;

    // Search button click
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            performSearch(query);
        }
    });

    // Enter key in search box
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
            }
        }
    });
}

// Perform search and redirect to external resources
function performSearch(query) {
    // Try to parse as a verse reference (e.g., "John 3:16")
    const verseMatch = query.match(/^(\d?\s*\w+)\s+(\d+):?(\d+)?/i);

    if (verseMatch) {
        const bookName = verseMatch[1].trim();
        const chapter = verseMatch[2];
        const verse = verseMatch[3];

        // Find the book
        const book = findBook(bookName);

        if (book) {
            searchVerse(`${book.name} ${chapter}${verse ? ':' + verse : ''}`);
            return;
        }
    }

    // Try to find a book name
    const book = findBook(query);
    if (book) {
        loadBook(book.slug);
        return;
    }

    // Otherwise, search on Bible.com
    window.open(`https://www.bible.com/search/bible?query=${encodeURIComponent(query)}&version_id=76`, '_blank');
}

// Find a book by name (flexible matching)
function findBook(query) {
    query = query.toLowerCase().trim();

    // Exact slug match
    let book = bibleBooks.find(b => b.slug === query);
    if (book) return book;

    // Exact name match
    book = bibleBooks.find(b => b.name.toLowerCase() === query);
    if (book) return book;

    // Starts with match
    book = bibleBooks.find(b => b.name.toLowerCase().startsWith(query));
    if (book) return book;

    // Contains match
    book = bibleBooks.find(b => b.name.toLowerCase().includes(query));
    return book;
}

// Load a book - shows chapter selector
function loadBook(slug) {
    const book = bibleBooks.find(b => b.slug === slug);
    if (!book) return;

    // Hide welcome, show reading area
    const welcomeSection = document.getElementById('welcome-section');
    const readingArea = document.getElementById('reading-area');

    if (welcomeSection) welcomeSection.classList.add('hidden');
    if (readingArea) {
        readingArea.classList.remove('hidden');
        readingArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Highlight active book in nav
    document.querySelectorAll('.book-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeBook = document.querySelector(`[data-book="${slug}"]`);
    if (activeBook) activeBook.classList.add('active');

    // Build chapter selector
    const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

    readingArea.innerHTML = `
        <div class="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-3xl font-bold text-gray-800">${book.name}</h2>
                <button id="reset-view-btn" class="text-purple-600 hover:text-purple-800 font-semibold">
                    ← Back to Home
                </button>
            </div>

            <p class="text-lg text-gray-700 mb-6">
                Select a chapter to read on Bible.com or Hawaii Pidgin Bible Ministries:
            </p>

            <div id="chapters-grid" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mb-8">
                ${chapters.map(ch => `
                    <button
                        data-book-name="${book.name}"
                        data-chapter="${ch}"
                        class="chapter-btn bg-purple-100 hover:bg-purple-600 hover:text-white text-purple-800 font-bold py-3 px-4 rounded-lg transition text-center">
                        ${ch}
                    </button>
                `).join('')}
            </div>

            <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <h3 class="font-bold text-gray-800 mb-4">📖 Read Full Book</h3>
                <div class="flex gap-4 flex-wrap">
                    <a href="${getBibleComBookUrl(book)}" target="_blank" rel="noopener"
                       class="inline-block bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition font-semibold">
                        Bible.com →
                    </a>
                    <a href="${bibleResources.hipidginbible}" target="_blank" rel="noopener"
                       class="inline-block bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold">
                        Official Site →
                    </a>
                    <a href="${bibleResources.ebible}" target="_blank" rel="noopener"
                       class="inline-block bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition font-semibold">
                        eBible.org →
                    </a>
                </div>
            </div>
        </div>
    `;

    // Add event listeners after innerHTML is set - use setTimeout to ensure DOM is ready
    setTimeout(() => {
        const resetBtn = document.getElementById('reset-view-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetView);
        }

        const chaptersGrid = document.getElementById('chapters-grid');
        if (chaptersGrid) {
            chaptersGrid.addEventListener('click', (e) => {
                const chapterBtn = e.target.closest('.chapter-btn');
                if (chapterBtn) {
                    const bookName = chapterBtn.getAttribute('data-book-name');
                    const chapter = parseInt(chapterBtn.getAttribute('data-chapter'));
                    openChapter(bookName, chapter);
                }
            });
        }
    }, 0);
}

// Open a specific chapter
function openChapter(bookName, chapter) {
    const book = bibleBooks.find(b => b.name === bookName);
    if (!book) return;

    // Create modal for choosing where to read
    showChapterModal(book, chapter);
}

// Show modal to choose reading platform
function showChapterModal(book, chapter) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.onclick = (e) => {
        if (e.target === modal) document.body.removeChild(modal);
    };

    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
            <h2 class="text-3xl font-bold text-gray-800 mb-4">
                ${book.name} ${chapter}
            </h2>
            <p class="text-lg text-gray-700 mb-6">
                Choose where you'd like to read this chapter:
            </p>

            <div class="space-y-4">
                <a href="${getBibleComChapterUrl(book, chapter)}" target="_blank" rel="noopener"
                   class="block bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-xl hover:from-purple-700 hover:to-blue-700 transition shadow-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-xl font-bold mb-2">📖 Bible.com / YouVersion</h3>
                            <p class="text-white/90">Read on the world's #1 Bible app</p>
                        </div>
                        <span class="text-3xl">→</span>
                    </div>
                </a>

                <a href="${bibleResources.hipidginbible}" target="_blank" rel="noopener"
                   class="block bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-xl hover:from-green-700 hover:to-teal-700 transition shadow-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-xl font-bold mb-2">🌐 Hawaii Pidgin Bible Ministries</h3>
                            <p class="text-white/90">Official translation website</p>
                        </div>
                        <span class="text-3xl">→</span>
                    </div>
                </a>

                <a href="${bibleResources.ebible}" target="_blank" rel="noopener"
                   class="block bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-xl hover:from-orange-700 hover:to-red-700 transition shadow-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-xl font-bold mb-2">📚 eBible.org</h3>
                            <p class="text-white/90">Free downloads (PDF, HTML, ePub, etc.)</p>
                        </div>
                        <span class="text-3xl">→</span>
                    </div>
                </a>
            </div>

            <button id="modal-cancel-btn"
                    class="mt-6 w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-300 transition font-semibold">
                Cancel
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    // Add cancel button event listener
    const cancelBtn = modal.querySelector('#modal-cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
}

// Get Bible.com book URL
function getBibleComBookUrl(book) {
    // Bible.com URL format: /bible/76/MAT.1.HPB (version/book.chapter.translation)
    return `https://www.bible.com/bible/76/${book.abbrev}.1.HPB`;
}

// Get Bible.com chapter URL
function getBibleComChapterUrl(book, chapter) {
    return `https://www.bible.com/bible/76/${book.abbrev}.${chapter}.HPB`;
}

// Search for a specific verse
function searchVerse(reference) {
    // Parse the reference
    const match = reference.match(/^([\w\s]+)\s+(\d+):?(\d+)?/);
    if (!match) {
        window.open(`https://www.bible.com/search/bible?query=${encodeURIComponent(reference)}&version_id=76`, '_blank');
        return;
    }

    const bookName = match[1].trim();
    const chapter = match[2];
    const verse = match[3];

    const book = findBook(bookName);
    if (!book) {
        window.open(`https://www.bible.com/search/bible?query=${encodeURIComponent(reference)}&version_id=76`, '_blank');
        return;
    }

    // Open verse on Bible.com
    const url = verse
        ? `https://www.bible.com/bible/76/${book.abbrev}.${chapter}.${verse}.HPB`
        : `https://www.bible.com/bible/76/${book.abbrev}.${chapter}.HPB`;

    window.open(url, '_blank');
}

// Reset view back to welcome screen
function resetView() {
    const welcomeSection = document.getElementById('welcome-section');
    const readingArea = document.getElementById('reading-area');

    if (welcomeSection) {
        welcomeSection.classList.remove('hidden');
        welcomeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (readingArea) readingArea.classList.add('hidden');

    // Clear active book
    document.querySelectorAll('.book-nav-item').forEach(item => {
        item.classList.remove('active');
    });
}

// Expose functions to global scope for external access
window.loadBook = loadBook;
window.openChapter = openChapter;
window.resetView = resetView;
window.searchVerse = searchVerse;
