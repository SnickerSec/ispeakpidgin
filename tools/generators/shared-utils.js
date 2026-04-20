#!/usr/bin/env node

/**
 * Shared Utilities for Page Generators
 * Common functions used across all page generators
 */

const fs = require('fs');
const path = require('path');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

let SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fallback: If SUPABASE_URL is missing but we have a key, try to reconstruct it
if (!SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString());
        if (payload && payload.ref) {
            SUPABASE_URL = `https://${payload.ref}.supabase.co`;
            console.log(`ℹ️  Reconstructed SUPABASE_URL: ${SUPABASE_URL}`);
        }
    } catch (e) {
        // Ignore parsing errors
    }
}

// Constants
const SITE_URL = 'https://chokepidgin.com';
const SITE_NAME = 'ChokePidgin';

/**
 * Create URL-friendly slug from text
 * Handles Hawaiian characters like ʻokina and kahakō
 */
function createSlug(text, suffix = '') {
    if (!text) return 'unknown';
    
    let slug = text
        .toLowerCase()
        // Replace common okina variants with nothing
        .replace(/['ʻ`‘’]/g, '')
        // Replace kahako (long vowels) with standard vowels
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        // Replace non-alphanumeric with hyphens
        .replace(/[^a-z0-9]+/g, '-')
        // Remove leading/trailing hyphens
        .replace(/^-|-$/g, '');
        
    if (!slug) slug = 'word';
    
    return suffix ? `${slug}-${suffix}` : slug;
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
 * Converts relative paths (e.g., href="translator.html") to absolute (e.g., href="/translator.html")
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
 * Get a random Pidgin grammar tip to bulk up content for SEO
 */
function getGrammarTip() {
    const tips = [
        "Pidgin often drops the 'to be' verb. Instead of saying 'He is tired', you say 'He stay tired'.",
        "The word 'da kine' is a versatile placeholder used when you can't remember a specific word.",
        "To indicate past tense, Pidgin often uses 'wen' before the verb (e.g., 'I wen go' for 'I went').",
        "Plurals in Pidgin are often formed by adding 'them' or 'dem' after the noun (e.g., 'The boy dem').",
        "The word 'stay' is frequently used as a progressive marker, like 'He stay eating' for 'He is eating'.",
        "Negative sentences in Pidgin often use 'never' for past tense, as in 'I never see him' (I didn't see him).",
        "Questions in Pidgin often use a rising intonation at the end of a statement rather than changing word order.",
        "The word 'pau' means finished or done, and is one of the most common loanwords from Hawaiian.",
        "Using 'mo' before an adjective creates a comparative, like 'mo bettah' for 'better'.",
        "The word 'buggah' can refer to a person, a thing, or an animal depending on the context."
    ];
    return tips[Math.floor(Math.random() * tips.length)];
}

/**
 * Get a random Hawaiian cultural fact to bulk up content for SEO
 */
function getCulturalFact() {
    const facts = [
        "Hawaiian Pidgin (HWC) originated on sugar plantations as a way for diverse ethnic groups to communicate.",
        "The 'okina (ʻ) is a consonant in the Hawaiian language representing a glottal stop.",
        "The kahakō (vowel with a macron) indicates a long vowel sound in Hawaiian words.",
        "Aloha means more than just hello; it encompasses love, peace, compassion, and mercy.",
        "The shaka sign (🤙) is a common gesture in Hawaii expressing the 'Aloha Spirit'.",
        "Talk story is a local Hawaiian expression for a casual conversation or sharing experiences.",
        "Many Pidgin words have roots in Portuguese, Cantonese, Japanese, Filipino, and Hawaiian.",
        "The concept of 'Ohana' means family, but can also include close friends and the broader community.",
        "A 'Hui' is a club, association, or group of people working toward a common goal.",
        "The 'Aloha Spirit' is actually part of Hawaii state law (HRS [§ 5-7.5])."
    ];
    return facts[Math.floor(Math.random() * facts.length)];
}

/**
 * Common HTML head boilerplate for generated pages
 */
function getCommonHead({ title, metaDescription, keywords, canonicalUrl, ogType = 'article', ogTitle, ogDescription, ogImage }) {
    const finalOgImage = ogImage || `${SITE_URL}/assets/images/og-home.webp`;
    
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
    <meta property="og:image" content="${finalOgImage}">

    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(ogTitle || title)}">
    <meta name="twitter:description" content="${escapeHtml(ogDescription || metaDescription)}">
    <meta name="twitter:image" content="${finalOgImage}">

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
    <script src="/js/components/gtag.js"></script>
    <script src="/js/components/favorites-manager.js"></script>`;
}

/**
 * Common games section HTML
 * @param {string} pidginWord - Optional current word to personalize callouts
 */
function getGameLinksHtml(pidginWord = null) {
    const wordDisplay = pidginWord ? `"${pidginWord}"` : 'your Pidgin';
    const subTitle = pidginWord ? `Think you know how for use ${wordDisplay}?` : 'Test your Pidgin skills with our viral island culture quiz!';
    
    return `
        <section class="mt-12 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 mb-8 shadow-xl border-2 border-yellow-200 dark:border-slate-700 overflow-hidden relative group">
            <div class="absolute -right-10 -bottom-10 text-9xl text-yellow-500/10 dark:text-yellow-500/5 rotate-12 group-hover:scale-110 transition-transform duration-500">
                <i class="ti ti-device-gamepad-2"></i>
            </div>
            
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 relative z-10">
                <i class="ti ti-device-gamepad-2"></i> Practice Your Pidgin
            </h2>
            
            <!-- High Impact Quiz CTA for Word Pages -->
            <div class="bg-gradient-to-r from-orange-500 to-red-600 dark:from-orange-700 dark:to-red-800 rounded-2xl p-6 mb-8 text-white shadow-lg transform hover:scale-[1.02] transition-transform relative z-10">
                <div class="flex flex-col md:flex-row items-center gap-6">
                    <div class="text-5xl animate-bounce">
                        <i class="ti ti-trophy"></i>
                    </div>
                    <div class="text-center md:text-left flex-1">
                        <h3 class="text-xl md:text-2xl font-black mb-1">How Local You Stay?</h3>
                        <p class="text-white/90 dark:text-white/80 mb-4 font-medium">${subTitle}</p>
                        <a href="/how-local-you-stay.html" class="inline-block bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 px-6 py-2 rounded-xl font-black hover:bg-orange-50 dark:hover:bg-slate-700 transition shadow-md border dark:border-orange-700">
                            Take the Quiz &rarr;
                        </a>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
                <a href="/pidgin-wordle.html" class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow border-2 border-green-200 dark:border-green-900/50 hover:border-green-400 dark:hover:border-green-600">
                    <div class="text-3xl mb-2"><i class="ti ti-grid-3x3" style="color: #22c55e;"></i></div>
                    <h3 class="font-bold text-gray-800 dark:text-white">Pidgin Wordle</h3>
                    <p class="text-sm text-gray-600 dark:text-slate-400">Can you spell it?</p>
                </a>
                <a href="/pidgin-hangman.html" class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow border-2 border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-400 dark:hover:border-indigo-600">
                    <div class="text-3xl mb-2"><i class="ti ti-typography" style="color: #6366f1;"></i></div>
                    <h3 class="font-bold text-gray-800 dark:text-white">Hangman</h3>
                    <p class="text-sm text-gray-600 dark:text-slate-400">Guess da word</p>
                </a>
                <a href="/pidgin-crossword.html" class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow border-2 border-blue-200 dark:border-blue-900/50 hover:border-blue-400 dark:hover:border-blue-600">
                    <div class="text-3xl mb-2"><i class="ti ti-note" style="color: #3b82f6;"></i></div>
                    <h3 class="font-bold text-gray-800 dark:text-white">Crossword</h3>
                    <p class="text-sm text-gray-600 dark:text-slate-400">Vocabulary test</p>
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
        <section class="mt-12 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 mb-8 shadow-xl border dark:border-slate-700">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4"><i class="ti ti-rocket"></i> Quick Actions</h2>
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

/**
 * Mini Quiz placeholder HTML
 */
function getMiniQuizHtml() {
    return `
        <section class="mb-8">
            <div id="mini-quiz-container"></div>
        </section>`;
}

/**
 * Run an async handler over a list with bounded concurrency.
 * OG image generation (Sharp/libvips) is the dominant cost in the page
 * generators - running a small pool lets I/O and libvips threads overlap,
 * cutting wall-clock time on fresh builds where no OG images are cached.
 */
async function parallelForEach(items, concurrency, handler) {
    let cursor = 0;
    const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (cursor < items.length) {
            const index = cursor++;
            await handler(items[index], index);
        }
    });
    await Promise.all(workers);
}

module.exports = {
    createSlug,
    escapeHtml,
    fetchFromSupabase,
    getNavAndFooter,
    getCommonHead,
    getGameLinksHtml,
    getQuickActionsHtml,
    getMiniQuizHtml,
    getGrammarTip,
    getCulturalFact,
    parallelForEach,
    SITE_URL,
    SITE_NAME
};
