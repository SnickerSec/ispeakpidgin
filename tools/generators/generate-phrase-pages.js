#!/usr/bin/env node

/**
 * Generate Individual Phrase Pages
 * Creates SEO-optimized pages for each phrase from Supabase
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
const outputDir = path.join(__dirname, '../../public/phrase');

// Create output directory
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Find related phrases by category, tags, and difficulty
 * Scoring: same category +3, each shared tag +1, same difficulty +1
 */
function findRelatedPhrases(phrase, allPhrases, limit = 6) {
    const related = allPhrases
        .filter(p => p.id !== phrase.id)
        .map(p => {
            let score = 0;
            // Same category
            if (p.category === phrase.category) score += 3;
            // Shared tags
            const phraseTags = phrase.tags || [];
            const pTags = p.tags || [];
            const sharedTags = phraseTags.filter(t => pTags.includes(t));
            score += sharedTags.length;
            // Same difficulty
            if (p.difficulty === phrase.difficulty) score += 1;
            return { phrase: p, score };
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(r => r.phrase);

    return related;
}

/**
 * Generate HTML page for a single phrase
 */
function generatePhrasePage(phrase, relatedPhrases, navigation, footer) {
    const slug = createSlug(phrase.pidgin);
    const escapedPhrase = escapeHtml(phrase.pidgin);
    const escapedEnglish = escapeHtml(phrase.english);
    const escapedCategory = escapeHtml(phrase.category || 'general');
    const escapedPronunciation = escapeHtml(phrase.pronunciation || '');
    const escapedNotes = escapeHtml(phrase.notes || '');
    const escapedDifficulty = escapeHtml(phrase.difficulty || '');

    const canonicalUrl = `${SITE_URL}/phrase/${slug}.html`;

    // Page title
    const pageTitle = `"${phrase.pidgin}" - Hawaiian Slang Meaning & Pronunciation | ${SITE_NAME}`;

    // Meta description (NO HTML tags)
    const metaDescription = `Learn what "${phrase.pidgin}" means in Hawaiian slang. Hear the pronunciation and learn when locals use this ${phrase.category || 'general'} expression.`;

    // Keywords
    const keywords = `${phrase.pidgin}, hawaiian slang, hawaiian pidgin, ${phrase.english}, pidgin phrases, hawaii language`;

    // Common head content
    const headContent = getCommonHead({
        title: pageTitle,
        metaDescription,
        keywords,
        canonicalUrl,
        ogType: 'article',
        ogTitle: pageTitle,
        ogDescription: metaDescription
    });

    // DefinedTerm structured data
    const definedTermSchema = {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "name": phrase.pidgin,
        "description": phrase.english,
        "inDefinedTermSet": {
            "@type": "DefinedTermSet",
            "name": "Hawaiian Pidgin Phrases",
            "url": `${SITE_URL}/phrases.html`
        },
        "termCode": phrase.id
    };

    if (phrase.pronunciation) {
        definedTermSchema.pronunciation = phrase.pronunciation;
    }

    // FAQ structured data (3 questions)
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": `What does "${phrase.pidgin}" mean in Hawaiian Pidgin?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `"${phrase.pidgin}" means "${phrase.english}" in Hawaiian Pidgin.${phrase.notes ? ' ' + phrase.notes : ''}`
                }
            },
            {
                "@type": "Question",
                "name": `How do you pronounce "${phrase.pidgin}"?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": phrase.pronunciation
                        ? `"${phrase.pidgin}" is pronounced "${phrase.pronunciation}".`
                        : `"${phrase.pidgin}" is pronounced phonetically as it appears.`
                }
            },
            {
                "@type": "Question",
                "name": `When do locals use "${phrase.pidgin}"?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": phrase.notes
                        ? phrase.notes
                        : `"${phrase.pidgin}" is a ${phrase.category || 'common'} expression used in everyday Hawaiian Pidgin conversation.`
                }
            }
        ]
    };

    // Breadcrumb structured data
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": `${SITE_URL}/`
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Phrases",
                "item": `${SITE_URL}/phrases.html`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": phrase.pidgin,
                "item": canonicalUrl
            }
        ]
    };

    // Build related phrases HTML
    const relatedHtml = relatedPhrases.length > 0 ? `
        <section class="mt-12">
            <h2 class="text-2xl font-bold text-gray-800 mb-6"><i class="ti ti-flower"></i> Related Phrases</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                ${relatedPhrases.map(related => `
                    <a href="/phrase/${createSlug(related.pidgin)}.html"
                       class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 hover:shadow-lg transition-shadow border-2 border-blue-200">
                        <h3 class="font-bold text-lg text-purple-600 mb-1">${escapeHtml(related.pidgin)}</h3>
                        <p class="text-sm text-gray-600">${escapeHtml(related.english)}</p>
                    </a>
                `).join('')}
            </div>
        </section>
    ` : '';

    // Quick actions
    const quickActionsHtml = getQuickActionsHtml(phrase.pidgin);

    // Game links
    const gameLinksHtml = getGameLinksHtml();

    // Tags HTML
    const tagsArray = Array.isArray(phrase.tags) ? phrase.tags : [];
    const tagsHtml = tagsArray.length > 0 ? `
            <div class="flex flex-wrap gap-2 mt-4">
                ${tagsArray.map(tag => `
                    <span class="inline-block bg-white/60 text-gray-700 rounded-full px-4 py-1 text-sm font-medium">
                        <i class="ti ti-tag"></i> ${escapeHtml(tag)}
                    </span>
                `).join('')}
            </div>
    ` : '';

    // Escaped phrase for JS string literal
    const jsEscapedPhrase = phrase.pidgin.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
${headContent}

    <!-- Structured Data -->
    <script type="application/ld+json">
    ${JSON.stringify(definedTermSchema, null, 2)}
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

    <!-- Back to Phrases -->
    <div class="bg-white border-b">
        <div class="container mx-auto px-4 py-4">
            <a href="/phrases.html" class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-semibold">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Phrases
            </a>
        </div>
    </div>

    <main class="container mx-auto px-4 py-8 max-w-4xl">
        <!-- Phrase Header -->
        <div class="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-3xl p-8 mb-8 shadow-2xl border-2 border-purple-200">
            <h1 class="text-4xl md:text-5xl font-bold text-gray-800 mb-2">${escapedPhrase}</h1>
            <p class="text-xl text-gray-600 mb-4">Meaning: <span class="font-semibold text-purple-700">${escapedEnglish}</span></p>

            ${phrase.pronunciation ? `
            <div class="mb-4">
                <span class="inline-block bg-white/80 rounded-full px-6 py-2 text-lg text-gray-700">
                    <i class="ti ti-speakerphone"></i> <strong>Pronunciation:</strong> ${escapedPronunciation}
                </span>
            </div>
            ` : ''}

            <div class="mb-4">
                <span class="inline-block bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full px-6 py-2 text-lg font-semibold">
                    ${escapedCategory}
                </span>
                ${phrase.difficulty ? `
                <span class="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full px-6 py-2 text-lg font-semibold ml-2">
                    ${escapedDifficulty}
                </span>
                ` : ''}
            </div>

            ${tagsHtml}

            <button id="speak-phrase" class="mt-4 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-8 py-3 rounded-full hover:scale-105 transition-transform font-bold shadow-lg">
                <i class="ti ti-volume"></i> Hear Pronunciation
            </button>
        </div>

        <!-- Meaning Section -->
        <section class="bg-white rounded-2xl p-8 mb-8 shadow-xl">
            <h2 class="text-2xl font-bold text-gray-800 mb-4"><i class="ti ti-book"></i> Meaning</h2>
            <div class="space-y-3">
                <div class="flex items-start">
                    <span class="text-green-500 mr-2 text-xl">&bull;</span>
                    <span class="text-xl text-gray-700">${escapedEnglish}</span>
                </div>
            </div>

            ${phrase.notes ? `
            <div class="mt-6 bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                <p class="text-gray-700"><strong>Usage Notes:</strong> ${escapedNotes}</p>
            </div>
            ` : ''}
        </section>

        <!-- FAQ Section -->
        <section class="bg-white rounded-2xl p-8 mb-8 shadow-xl">
            <h2 class="text-2xl font-bold text-gray-800 mb-6"><i class="ti ti-question-mark"></i> Frequently Asked Questions</h2>
            <div class="space-y-4">
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-l-4 border-blue-500">
                    <h3 class="font-bold text-lg text-gray-800 mb-2">What does "${escapedPhrase}" mean in Hawaiian Pidgin?</h3>
                    <p class="text-gray-700">"${escapedPhrase}" means "${escapedEnglish}" in Hawaiian Pidgin.${phrase.notes ? ' ' + escapedNotes : ''}</p>
                </div>
                <div class="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-5 border-l-4 border-green-500">
                    <h3 class="font-bold text-lg text-gray-800 mb-2">How do you pronounce "${escapedPhrase}"?</h3>
                    <p class="text-gray-700">${phrase.pronunciation ? `"${escapedPhrase}" is pronounced "${escapedPronunciation}". Click the "Hear Pronunciation" button above to listen!` : `"${escapedPhrase}" is pronounced phonetically as it appears. Click the "Hear Pronunciation" button above to listen!`}</p>
                </div>
                <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border-l-4 border-purple-500">
                    <h3 class="font-bold text-lg text-gray-800 mb-2">When do locals use "${escapedPhrase}"?</h3>
                    <p class="text-gray-700">${phrase.notes ? escapedNotes : `"${escapedPhrase}" is a ${escapedCategory} expression used in everyday Hawaiian Pidgin conversation.`}</p>
                </div>
            </div>
        </section>

        <!-- Related Phrases -->
        ${relatedHtml}

        <!-- Quick Actions -->
        ${quickActionsHtml}

        <!-- Practice with Games -->
        ${gameLinksHtml}
    </main>

    ${footer}

    <script src="/js/components/elevenlabs-speech.js"></script>
    <script src="/js/components/speech.js"></script>
    <script>
        // TTS button handler
        document.getElementById('speak-phrase')?.addEventListener('click', async () => {
            const text = "${jsEscapedPhrase}";
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
    console.log('🏗️  Generating individual phrase pages...\n');

    try {
        // Fetch phrases from Supabase
        console.log('🔄 Fetching phrases from Supabase...');
        const phrases = await fetchFromSupabase('phrases', '*', 'pidgin.asc');
        console.log(`✅ Fetched ${phrases.length} total phrases from Supabase\n`);

        if (phrases.length === 0) {
            throw new Error('No phrases found in Supabase');
        }

        // Load shared navigation and footer
        const { navigation, footer } = getNavAndFooter();

        let generatedCount = 0;
        let skippedCount = 0;
        const slugMap = new Map(); // Track slugs to prevent duplicates

        for (const phrase of phrases) {
            try {
                const slug = createSlug(phrase.pidgin);

                // Skip if slug already exists (duplicate handling)
                if (slugMap.has(slug)) {
                    console.log(`⚠️  Skipping duplicate slug: ${slug} (${phrase.pidgin})`);
                    skippedCount++;
                    continue;
                }

                slugMap.set(slug, phrase);

                // Find related phrases
                const relatedPhrases = findRelatedPhrases(phrase, phrases);

                // Generate HTML
                const html = generatePhrasePage(phrase, relatedPhrases, navigation, footer);

                // Write file
                const filename = `${slug}.html`;
                const filepath = path.join(outputDir, filename);
                fs.writeFileSync(filepath, html, 'utf8');

                generatedCount++;

                if (generatedCount % 50 === 0) {
                    console.log(`✅ Generated ${generatedCount} pages...`);
                }
            } catch (error) {
                console.error(`❌ Error generating page for "${phrase.pidgin}":`, error.message);
                skippedCount++;
            }
        }

        console.log('\n✨ Generation complete!');
        console.log(`📄 Generated: ${generatedCount} pages`);
        console.log(`⚠️  Skipped: ${skippedCount} entries`);
        console.log(`📂 Output directory: ${outputDir}`);
        console.log(`\n🔗 Example URLs:`);
        console.log(`   - /phrase/howzit.html`);
        console.log(`   - /phrase/da-kine.html`);
        console.log(`   - /phrase/no-worry.html`);

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

main();
