#!/usr/bin/env node

/**
 * Generate Individual Dictionary Entry Pages
 * Creates SEO-optimized pages for each dictionary entry
 * Uses shared utilities for consistent styling and data fetching
 */

const fs = require('fs');
const path = require('path');
const {
    createSlug,
    escapeHtml,
    fetchFromSupabase,
    getNavAndFooter,
    getCommonHead,
    getGameLinksHtml,
    getQuickActionsHtml,
    SITE_URL,
    SITE_NAME
} = require('./shared-utils');

// Output directory
const outputDir = path.join(__dirname, '../../public/word');

// Create output directory
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Helper: Find related terms (same category or similar tags)
function findRelatedTerms(entry, allEntries, limit = 6) {
    const related = allEntries
        .filter(e => e.id !== entry.id)
        .map(e => {
            let score = 0;
            // Same category
            if (e.category === entry.category) score += 3;
            // Shared tags
            const entryTags = entry.tags || [];
            const eTags = e.tags || [];
            const sharedTags = entryTags.filter(t => eTags.includes(t));
            score += sharedTags.length;
            // Same difficulty
            if (e.difficulty === entry.difficulty) score += 1;
            return { entry: e, score };
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(r => r.entry);

    return related;
}

// Generate HTML template for entry page
function generateEntryPage(entry, relatedTerms, navigation, footer) {
    const slug = createSlug(entry.pidgin);
    const englishArray = Array.isArray(entry.english) ? entry.english : [entry.english];
    const englishMeanings = englishArray.join(', ');
    const primaryMeaning = englishArray[0] || '';

    // SEO-optimized title: Match exact search query "X meaning" with compelling format
    // Capitalize the word properly for display
    const capitalizedWord = entry.pidgin.charAt(0).toUpperCase() + entry.pidgin.slice(1);
    const pageTitle = `${capitalizedWord} Meaning: "${primaryMeaning}" - Hawaiian Slang Dictionary`;

    // Create a more compelling, action-oriented meta description
    const shortMeaning = primaryMeaning.length > 30 ? primaryMeaning.substring(0, 30) + '...' : primaryMeaning;
    const metaDescription = `${capitalizedWord} means "${shortMeaning}" in Hawaiian slang. Hear the pronunciation, see examples, and learn how locals really use this word!`;

    const canonicalUrl = `${SITE_URL}/word/${slug}.html`;

    // Common head content
    const headContent = getCommonHead({
        title: pageTitle,
        metaDescription,
        keywords: `${entry.pidgin}, hawaiian slang, hawaiian pidgin, ${englishMeanings}, pidgin dictionary, hawaii language`,
        canonicalUrl,
        ogType: 'article',
        ogTitle: `${capitalizedWord} Meaning: ${shortMeaning} | Hawaiian Pidgin`,
        ogDescription: metaDescription
    });

    // Create schema markup
    const schema = {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "name": entry.pidgin,
        "description": entry.usage || englishMeanings,
        "inDefinedTermSet": {
            "@type": "DefinedTermSet",
            "name": "Hawaiian Pidgin Dictionary",
            "url": `${SITE_URL}/dictionary.html`
        },
        "termCode": entry.id
    };

    if (entry.pronunciation) {
        schema.pronunciation = entry.pronunciation;
    }

    // Create FAQ schema for rich snippets
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": `What does "${entry.pidgin}" mean in Hawaiian Pidgin?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `"${entry.pidgin}" means "${primaryMeaning}" in Hawaiian Pidgin.${entry.usage ? ' ' + entry.usage + '.' : ''}`
                }
            },
            {
                "@type": "Question",
                "name": `How do you pronounce "${entry.pidgin}"?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": entry.pronunciation ? `"${entry.pidgin}" is pronounced "${entry.pronunciation}".` : `"${entry.pidgin}" is pronounced phonetically as it appears.`
                }
            },
            {
                "@type": "Question",
                "name": `How do you use "${entry.pidgin}" in a sentence?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": Array.isArray(entry.examples) && entry.examples.length > 0
                        ? `Example: "${entry.examples[0]}"`
                        : `"${entry.pidgin}" is commonly used in casual Hawaiian conversation.`
                }
            }
        ]
    };

    // Breadcrumb schema
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
            { "@type": "ListItem", "position": 2, "name": "Dictionary", "item": `${SITE_URL}/dictionary.html` },
            { "@type": "ListItem", "position": 3, "name": entry.pidgin, "item": canonicalUrl }
        ]
    };

    // Build related terms HTML
    const relatedHtml = relatedTerms.length > 0 ? `
        <section class="mt-12">
            <h2 class="text-2xl font-bold text-gray-800 mb-6"><i class="ti ti-flower"></i> Related Words</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                ${relatedTerms.map(related => {
                    const relatedEnglish = Array.isArray(related.english) ? related.english : [related.english];
                    return `
                    <a href="/word/${createSlug(related.pidgin)}.html"
                       class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 hover:shadow-lg transition-shadow border-2 border-blue-200">
                        <h3 class="font-bold text-lg text-purple-600 mb-1">${escapeHtml(related.pidgin)}</h3>
                        <p class="text-sm text-gray-600">${escapeHtml(relatedEnglish.slice(0, 2).join(', '))}</p>
                    </a>
                `}).join('')}
            </div>
        </section>
    ` : '';

    const examplesArray = Array.isArray(entry.examples) ? entry.examples : (entry.examples ? [entry.examples] : []);
    const jsEscapedWord = entry.pidgin.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const quickActionsHtml = getQuickActionsHtml(entry.pidgin);
    const gameLinksHtml = getGameLinksHtml();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    ${headContent}

    <!-- Structured Data -->
    <script type="application/ld+json">
    ${JSON.stringify(schema, null, 2)}
    </script>

    <!-- FAQ Schema for Rich Snippets -->
    <script type="application/ld+json">
    ${JSON.stringify(faqSchema, null, 2)}
    </script>

    <!-- Breadcrumb Schema -->
    <script type="application/ld+json">
    ${JSON.stringify(breadcrumbSchema, null, 2)}
    </script>
</head>
<body class="min-h-screen bg-gray-50">
    ${navigation}

    <!-- Back to Dictionary Button -->
    <div class="bg-white border-b">
        <div class="container mx-auto px-4 py-4">
            <a href="/dictionary.html" class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-semibold">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Dictionary
            </a>
        </div>
    </div>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8 max-w-4xl">
        <!-- Word Header -->
        <div class="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-3xl p-8 mb-8 shadow-2xl border-2 border-purple-200">
            <h1 class="text-4xl md:text-5xl font-bold text-gray-800 mb-2">${escapeHtml(entry.pidgin)}</h1>
            <p class="text-xl text-gray-600 mb-4">Meaning: <span class="font-semibold text-purple-700">${escapeHtml(primaryMeaning)}</span></p>

            ${entry.pronunciation ? `
            <div class="mb-4">
                <span class="inline-block bg-white/80 rounded-full px-6 py-2 text-lg text-gray-700">
                    <i class="ti ti-speakerphone"></i> <strong>Pronunciation:</strong> ${escapeHtml(entry.pronunciation)}
                </span>
            </div>
            ` : ''}

            <div class="mb-4">
                <span class="inline-block bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full px-6 py-2 text-lg font-semibold">
                    ${escapeHtml(entry.category || 'general')}
                </span>
                ${entry.difficulty ? `
                <span class="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full px-6 py-2 text-lg font-semibold ml-2">
                    ${escapeHtml(entry.difficulty)}
                </span>
                ` : ''}
            </div>

            <button id="speak-word" class="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-8 py-3 rounded-full hover:scale-105 transition-transform font-bold shadow-lg">
                <i class="ti ti-volume"></i> Hear Pronunciation
            </button>
        </div>

        <!-- Meaning Section -->
        <section class="bg-white rounded-2xl p-8 mb-8 shadow-xl">
            <h2 class="text-2xl font-bold text-gray-800 mb-4"><i class="ti ti-book"></i> Meaning</h2>
            <div class="space-y-3">
                ${englishArray.map(meaning => `
                    <div class="flex items-start">
                        <span class="text-green-500 mr-2 text-xl">&bull;</span>
                        <span class="text-xl text-gray-700">${escapeHtml(meaning)}</span>
                    </div>
                `).join('')}
            </div>

            ${entry.usage ? `
            <div class="mt-6 bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                <p class="text-gray-700"><strong>Usage:</strong> ${escapeHtml(entry.usage)}</p>
            </div>
            ` : ''}
        </section>

        <!-- Examples Section -->
        ${examplesArray.length > 0 ? `
        <section class="bg-white rounded-2xl p-8 mb-8 shadow-xl">
            <h2 class="text-2xl font-bold text-gray-800 mb-4"><i class="ti ti-message"></i> Examples</h2>
            <div class="space-y-4">
                ${examplesArray.map(example => `
                    <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border-l-4 border-green-500">
                        <p class="text-lg text-gray-800 italic">"${escapeHtml(example)}"</p>
                    </div>
                `).join('')}
            </div>
        </section>
        ` : ''}

        <!-- Origin & Cultural Context -->
        ${entry.origin ? `
        <section class="bg-white rounded-2xl p-8 mb-8 shadow-xl">
            <h2 class="text-2xl font-bold text-gray-800 mb-4"><i class="ti ti-flower"></i> Origin & Cultural Context</h2>
            <div class="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-6">
                <p class="text-lg text-gray-700 mb-2">
                    <strong>Origin:</strong> ${escapeHtml(entry.origin)}
                </p>
                ${entry.cultural_notes ? `
                <p class="text-gray-700 mt-4">${escapeHtml(entry.cultural_notes)}</p>
                ` : ''}
            </div>
        </section>
        ` : ''}

        <!-- FAQ Section for Engagement -->
        <section class="bg-white rounded-2xl p-8 mb-8 shadow-xl">
            <h2 class="text-2xl font-bold text-gray-800 mb-6"><i class="ti ti-question-mark"></i> Frequently Asked Questions</h2>
            <div class="space-y-4">
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-l-4 border-blue-500">
                    <h3 class="font-bold text-lg text-gray-800 mb-2">What does "${escapeHtml(entry.pidgin)}" mean in Hawaiian Pidgin?</h3>
                    <p class="text-gray-700">"${escapeHtml(entry.pidgin)}" means "${escapeHtml(primaryMeaning)}" in Hawaiian Pidgin.${entry.usage ? ' ' + escapeHtml(entry.usage) + '.' : ''}</p>
                </div>
                <div class="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-5 border-l-4 border-green-500">
                    <h3 class="font-bold text-lg text-gray-800 mb-2">How do you pronounce "${escapeHtml(entry.pidgin)}"?</h3>
                    <p class="text-gray-700">${entry.pronunciation ? `"${escapeHtml(entry.pidgin)}" is pronounced "${escapeHtml(entry.pronunciation)}". Click the "Hear Pronunciation" button above to listen!` : `"${escapeHtml(entry.pidgin)}" is pronounced phonetically as it appears. Click the "Hear Pronunciation" button above to listen!`}</p>
                </div>
                <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border-l-4 border-purple-500">
                    <h3 class="font-bold text-lg text-gray-800 mb-2">How do you use "${escapeHtml(entry.pidgin)}" in a sentence?</h3>
                    <p class="text-gray-700">${examplesArray.length > 0 ? `Example: "${escapeHtml(examplesArray[0])}"` : `"${escapeHtml(entry.pidgin)}" is commonly used in casual Hawaiian conversation.`}</p>
                </div>
            </div>
        </section>

        <!-- Quick Actions -->
        ${quickActionsHtml}

        <!-- Practice with Games -->
        ${gameLinksHtml}

        ${relatedHtml}
    </main>

    ${footer}

    <script src="/js/components/elevenlabs-speech.js"></script>
    <script src="/js/components/speech.js"></script>
    <script>
        // TTS button handler
        document.getElementById('speak-word')?.addEventListener('click', async () => {
            const text = "${jsEscapedWord}";
            if (window.pidginSpeech) {
                await window.pidginSpeech.speak(text);
            }
        });
    </script>
</body>
</html>`;

    return html;
}

// Main execution
async function main() {
    console.log('🏗️  Generating individual dictionary entry pages...\n');

    try {
        // Fetch entries from Supabase
        console.log('🔄 Fetching dictionary entries from Supabase...');
        const entries = await fetchFromSupabase('dictionary_entries', '*', 'pidgin.asc');
        console.log(`✅ Fetched ${entries.length} entries from Supabase\n`);

        if (entries.length === 0) {
            throw new Error('No dictionary entries found in Supabase');
        }

        // Load shared navigation and footer templates
        const { navigation, footer } = getNavAndFooter();

        let generatedCount = 0;
        let skippedCount = 0;
        const slugMap = new Map(); // Track slugs to prevent duplicates

        for (const entry of entries) {
            try {
                const slug = createSlug(entry.pidgin);

                // Skip if slug already exists (duplicate handling)
                if (slugMap.has(slug)) {
                    console.log(`⚠️  Skipping duplicate slug: ${slug} (${entry.pidgin})`);
                    skippedCount++;
                    continue;
                }

                slugMap.set(slug, entry);

                // Find related terms
                const relatedTerms = findRelatedTerms(entry, entries);

                // Generate HTML
                const html = generateEntryPage(entry, relatedTerms, navigation, footer);

                // Write file
                const filename = `${slug}.html`;
                const filepath = path.join(outputDir, filename);
                fs.writeFileSync(filepath, html, 'utf8');

                generatedCount++;

                if (generatedCount % 50 === 0) {
                    console.log(`✅ Generated ${generatedCount} pages...`);
                }
            } catch (error) {
                console.error(`❌ Error generating page for "${entry.pidgin}":`, error.message);
                skippedCount++;
            }
        }

        console.log('\n✨ Generation complete!');
        console.log(`📄 Generated: ${generatedCount} pages`);
        console.log(`⚠️  Skipped: ${skippedCount} entries`);
        console.log(`📂 Output directory: ${outputDir}`);
        console.log(`\n🔗 Example URLs:`);
        console.log(`   - /word/aloha.html`);
        console.log(`   - /word/da-kine.html`);
        console.log(`   - /word/howzit.html`);

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

main();
