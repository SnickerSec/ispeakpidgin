#!/usr/bin/env node

/**
 * Shared Utilities for Page Generators
 * Common functions used across all page generators
 */

const fs = require('fs');
const path = require('path');

// Load environment
require('dotenv').config();
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Constants
const SITE_URL = 'https://chokepidgin.com';
const SITE_NAME = 'ChokePidgin';

/**
 * Create URL-friendly slug from text
 */
function createSlug(text) {
    return text
        .toLowerCase()
        .replace(/'/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Fetch all rows from a Supabase table with pagination
 * @param {string} tableName - Table to fetch from
 * @param {string} selectFields - Fields to select (default '*')
 * @param {string} orderBy - Column to order by (e.g., 'pidgin.asc')
 * @returns {Promise<Array>} All rows
 */
async function fetchFromSupabase(tableName, selectFields = '*', orderBy = null) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY');
    }

    const allRows = [];
    const pageSize = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        let url = `${SUPABASE_URL}/rest/v1/${tableName}?select=${encodeURIComponent(selectFields)}&offset=${offset}&limit=${pageSize}`;
        if (orderBy) {
            url += `&order=${encodeURIComponent(orderBy)}`;
        }

        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Supabase API error for ${tableName}: ${response.status} ${response.statusText}`);
        }

        const rows = await response.json();

        if (rows.length === 0) {
            hasMore = false;
        } else {
            allRows.push(...rows);
            offset += pageSize;
            if (rows.length < pageSize) {
                hasMore = false;
            }
        }
    }

    return allRows;
}

/**
 * Read navigation and footer templates with absolute paths
 * Converts relative paths (href="index.html") to absolute (href="/index.html")
 * @returns {{ navigation: string, footer: string }}
 */
function getNavAndFooter() {
    const navPath = path.join(__dirname, '../../src/components/shared/navigation.html');
    const footerPath = path.join(__dirname, '../../src/components/shared/footer.html');

    let navigation = '';
    let footer = '';

    if (fs.existsSync(navPath)) {
        navigation = fs.readFileSync(navPath, 'utf8');
    }
    if (fs.existsSync(footerPath)) {
        footer = fs.readFileSync(footerPath, 'utf8');
    }

    // Convert relative paths to absolute for subdir pages
    function makeAbsolute(html) {
        return html
            .replace(/href="(?!http|\/|#|mailto)([^"]+)"/g, 'href="/$1"')
            .replace(/src="(?!http|\/|#|data:)([^"]+)"/g, 'src="/$1"');
    }

    navigation = makeAbsolute(navigation);
    footer = makeAbsolute(footer);

    return { navigation, footer };
}

/**
 * Common HTML head boilerplate for generated pages
 */
function getCommonHead({ title, metaDescription, keywords, canonicalUrl, ogType = 'article', ogTitle, ogDescription }) {
    return `    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>

    <!-- SEO Meta Tags -->
    <meta name="description" content="${escapeHtml(metaDescription)}">
    <meta name="keywords" content="${escapeHtml(keywords)}">
    <meta name="author" content="ChokePidgin.com">
    <meta name="robots" content="index, follow">

    <!-- Open Graph Tags -->
    <meta property="og:title" content="${escapeHtml(ogTitle || title)}">
    <meta property="og:description" content="${escapeHtml(ogDescription || metaDescription)}">
    <meta property="og:type" content="${ogType}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:site_name" content="ChokePidgin.com">

    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(ogTitle || title)}">
    <meta name="twitter:description" content="${escapeHtml(ogDescription || metaDescription)}">

    <!-- Canonical URL -->
    <link rel="canonical" href="${canonicalUrl}">

    <!-- Favicons -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="alternate icon" href="/favicon.ico">

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Pacifico&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Tailwind CSS -->
    <link rel="stylesheet" href="/css/tailwind.css">
    <link rel="stylesheet" href="/css/main.css">

    <!-- Tabler Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">

    <style>
        .brand-font { font-family: 'Pacifico', cursive; }
        body, h1, h2, h3, h4, h5, h6 { font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    </style>

    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-RB7YYDVDXD"></script>
    <script src="/js/components/gtag.js"></script>`;
}

/**
 * Common games section HTML
 */
function getGameLinksHtml() {
    return `
        <section class="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-8 mb-8 shadow-xl">
            <h2 class="text-2xl font-bold text-gray-800 mb-4"><i class="ti ti-device-gamepad-2"></i> Practice Your Pidgin</h2>
            <p class="text-gray-600 mb-6">Test your knowledge with our fun Hawaiian Pidgin games!</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <a href="/pidgin-wordle.html" class="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow border-2 border-green-200 hover:border-green-400">
                    <div class="text-3xl mb-2"><i class="ti ti-grid-3x3" style="color: #22c55e;"></i></div>
                    <h3 class="font-bold text-gray-800">Pidgin Wordle</h3>
                    <p class="text-sm text-gray-600">Daily word puzzle</p>
                </a>
                <a href="/pidgin-hangman.html" class="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow border-2 border-indigo-200 hover:border-indigo-400">
                    <div class="text-3xl mb-2"><i class="ti ti-typography"></i></div>
                    <h3 class="font-bold text-gray-800">Hangman</h3>
                    <p class="text-sm text-gray-600">Guess the word</p>
                </a>
                <a href="/pidgin-crossword.html" class="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow border-2 border-blue-200 hover:border-blue-400">
                    <div class="text-3xl mb-2"><i class="ti ti-note"></i></div>
                    <h3 class="font-bold text-gray-800">Crossword</h3>
                    <p class="text-sm text-gray-600">Test your vocabulary</p>
                </a>
                <a href="/how-local-you-stay.html" class="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow border-2 border-purple-200 hover:border-purple-400">
                    <div class="text-3xl mb-2"><i class="ti ti-hand-love-you"></i></div>
                    <h3 class="font-bold text-gray-800">How Local?</h3>
                    <p class="text-sm text-gray-600">Take the quiz</p>
                </a>
            </div>
        </section>`;
}

/**
 * Quick action links HTML
 */
function getQuickActionsHtml(translateText) {
    const encoded = encodeURIComponent(translateText || '');
    return `
        <section class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-8 mb-8 shadow-xl">
            <h2 class="text-2xl font-bold text-gray-800 mb-4"><i class="ti ti-rocket"></i> Quick Actions</h2>
            <div class="flex flex-wrap gap-4">
                <a href="/translator.html${encoded ? '?text=' + encoded : ''}"
                   class="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full hover:scale-105 transition-transform font-bold shadow-lg">
                    <i class="ti ti-refresh"></i> Translate
                </a>
                <a href="/dictionary.html"
                   class="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-full hover:scale-105 transition-transform font-bold shadow-lg">
                    <i class="ti ti-books"></i> Browse Dictionary
                </a>
                <a href="/phrases.html"
                   class="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full hover:scale-105 transition-transform font-bold shadow-lg">
                    <i class="ti ti-message"></i> Browse Phrases
                </a>
            </div>
        </section>`;
}

module.exports = {
    createSlug,
    escapeHtml,
    fetchFromSupabase,
    getNavAndFooter,
    getCommonHead,
    getGameLinksHtml,
    getQuickActionsHtml,
    SITE_URL,
    SITE_NAME
};
