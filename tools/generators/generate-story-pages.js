#!/usr/bin/env node

/**
 * Generate Individual Story Pages
 * Creates SEO-optimized pages for each Pidgin story from Supabase
 * Outputs to public/story/{slug}.html
 */

const fs = require('fs');
const path = require('path');
const { createSlug, escapeHtml, fetchFromSupabase, getNavAndFooter, getCommonHead, getGameLinksHtml, getQuickActionsHtml, SITE_URL, SITE_NAME } = require('./shared-utils');

// Output directory
const outputDir = path.join(__dirname, '../../public/story');

/**
 * Find related stories based on shared difficulty and tags
 * Scoring: same difficulty +2, each shared tag +1
 */
function findRelatedStories(story, allStories, limit = 4) {
    return allStories
        .filter(s => s.id !== story.id)
        .map(s => {
            let score = 0;
            // Same difficulty
            if (s.difficulty && s.difficulty === story.difficulty) score += 2;
            // Shared tags
            const storyTags = story.tags || [];
            const sTags = s.tags || [];
            const sharedTags = storyTags.filter(t => sTags.includes(t));
            score += sharedTags.length;
            return { story: s, score };
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(r => r.story);
}

/**
 * Get difficulty badge color classes
 */
function getDifficultyColor(difficulty) {
    switch ((difficulty || '').toLowerCase()) {
        case 'beginner': return 'from-green-500 to-teal-500';
        case 'intermediate': return 'from-yellow-500 to-orange-500';
        case 'advanced': return 'from-red-500 to-pink-500';
        default: return 'from-blue-500 to-purple-500';
    }
}

/**
 * Generate HTML page for a single story
 */
function generateStoryPage(story, allStories, navigation, footer) {
    const slug = createSlug(story.title);
    const capitalizedTitle = story.title;
    const pageTitle = `${capitalizedTitle} - Hawaiian Pidgin Story with Translation | ${SITE_NAME}`;
    const metaDescription = `Read "${capitalizedTitle}" - an authentic Hawaiian Pidgin story. Includes English translation, vocabulary list, cultural notes, and pronunciation guide.`;
    const keywords = `${capitalizedTitle}, hawaiian pidgin story, hawaiian slang, pidgin stories, hawaii culture, pidgin translation`;
    const canonicalUrl = `${SITE_URL}/story/${slug}.html`;

    const headContent = getCommonHead({
        title: pageTitle,
        metaDescription,
        keywords,
        canonicalUrl,
        ogType: 'article',
        ogTitle: pageTitle,
        ogDescription: metaDescription
    });

    // Vocabulary array (parse if string)
    let vocabulary = [];
    if (story.vocabulary) {
        if (typeof story.vocabulary === 'string') {
            try { vocabulary = JSON.parse(story.vocabulary); } catch (e) { vocabulary = []; }
        } else if (Array.isArray(story.vocabulary)) {
            vocabulary = story.vocabulary;
        }
    }

    // Tags array
    const tags = Array.isArray(story.tags) ? story.tags : [];

    // Build vocabulary answer text for FAQ schema
    const vocabWords = vocabulary.map(v => v.pidgin).filter(Boolean);
    const vocabAnswerText = vocabWords.length > 0
        ? `This story features the following Pidgin words: ${vocabWords.join(', ')}. Each word includes its English meaning and pronunciation guide.`
        : `This story contains authentic Hawaiian Pidgin vocabulary. Read the full story to discover the words used.`;

    // Article schema
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": capitalizedTitle,
        "description": metaDescription,
        "url": canonicalUrl,
        "inLanguage": "en",
        "publisher": {
            "@type": "Organization",
            "name": SITE_NAME,
            "url": SITE_URL
        }
    };

    // FAQ schema
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": `What is the story "${capitalizedTitle}" about?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `"${capitalizedTitle}" is an authentic Hawaiian Pidgin story that showcases the local language and culture of Hawaii. It includes both the original Pidgin text and an English translation.`
                }
            },
            {
                "@type": "Question",
                "name": `What Pidgin words are in the story "${capitalizedTitle}"?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": vocabAnswerText
                }
            },
            {
                "@type": "Question",
                "name": `What difficulty level is the story "${capitalizedTitle}"?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": story.difficulty
                        ? `"${capitalizedTitle}" is rated as ${story.difficulty} level. ${story.difficulty.toLowerCase() === 'beginner' ? 'It is great for those just starting to learn Hawaiian Pidgin.' : story.difficulty.toLowerCase() === 'intermediate' ? 'It is suited for learners with some familiarity with Pidgin.' : 'It is designed for those with a strong understanding of Hawaiian Pidgin.'}`
                        : `"${capitalizedTitle}" is a Hawaiian Pidgin story suitable for all learners.`
                }
            }
        ]
    };

    // Breadcrumb schema
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
                "name": "Stories",
                "item": `${SITE_URL}/stories.html`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": capitalizedTitle,
                "item": canonicalUrl
            }
        ]
    };

    // Related stories
    const relatedStories = findRelatedStories(story, allStories);
    const relatedHtml = relatedStories.length > 0 ? `
        <section class="bg-white rounded-2xl p-8 mb-8 shadow-xl">
            <h2 class="text-2xl font-bold text-gray-800 mb-6"><i class="ti ti-books"></i> Related Stories</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${relatedStories.map(rs => {
                    const rsSlug = createSlug(rs.title);
                    const rsTags = Array.isArray(rs.tags) ? rs.tags : [];
                    return `
                    <a href="/story/${rsSlug}.html"
                       class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 hover:shadow-lg transition-shadow border-2 border-blue-200 hover:border-blue-400">
                        <h3 class="font-bold text-lg text-purple-600 mb-2">${escapeHtml(rs.title)}</h3>
                        <div class="flex flex-wrap gap-2">
                            ${rs.difficulty ? `<span class="text-xs bg-gradient-to-r ${getDifficultyColor(rs.difficulty)} text-white rounded-full px-3 py-1 font-semibold">${escapeHtml(rs.difficulty)}</span>` : ''}
                            ${rsTags.slice(0, 3).map(t => `<span class="text-xs bg-gray-200 text-gray-700 rounded-full px-3 py-1">${escapeHtml(t)}</span>`).join('')}
                        </div>
                    </a>`;
                }).join('')}
            </div>
        </section>` : '';

    // Vocabulary grid HTML
    const vocabularyHtml = vocabulary.length > 0 ? `
        <section class="bg-white rounded-2xl p-8 mb-8 shadow-xl">
            <h2 class="text-2xl font-bold text-gray-800 mb-6"><i class="ti ti-vocabulary"></i> Vocabulary</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                ${vocabulary.map(v => `
                    <div class="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-4 border-2 border-green-200">
                        <h3 class="font-bold text-lg text-green-700 mb-1">${escapeHtml(v.pidgin || '')}</h3>
                        <p class="text-gray-700 mb-1">${escapeHtml(v.english || '')}</p>
                        ${v.pronunciation ? `<p class="text-sm text-gray-500 italic"><i class="ti ti-speakerphone"></i> ${escapeHtml(v.pronunciation)}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        </section>` : '';

    // Cultural notes HTML
    const culturalNotesHtml = story.cultural_notes ? `
        <section class="bg-white rounded-2xl p-8 mb-8 shadow-xl">
            <h2 class="text-2xl font-bold text-gray-800 mb-4"><i class="ti ti-flower"></i> Cultural Notes</h2>
            <div class="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-6 border-l-4 border-orange-500">
                <p class="text-lg text-gray-700">${escapeHtml(story.cultural_notes)}</p>
            </div>
        </section>` : '';

    // Tags badges HTML
    const tagsBadgesHtml = tags.length > 0 ? `
            <div class="flex flex-wrap gap-2 mb-4">
                ${tags.map(t => `<span class="inline-block bg-white/80 text-gray-700 rounded-full px-4 py-1 text-sm font-medium">${escapeHtml(t)}</span>`).join('')}
            </div>` : '';

    // Escaped title for JS
    const jsSafeTitle = story.title.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    // Build the full page
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
${headContent}

    <!-- Article Schema -->
    <script type="application/ld+json">
    ${JSON.stringify(articleSchema, null, 2)}
    </script>

    <!-- FAQ Schema -->
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

    <!-- Back to Stories -->
    <div class="bg-white border-b">
        <div class="container mx-auto px-4 py-4">
            <a href="/stories.html" class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-semibold">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Stories
            </a>
        </div>
    </div>

    <main class="container mx-auto px-4 py-8 max-w-4xl">
        <!-- Story Header -->
        <div class="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-3xl p-8 mb-8 shadow-2xl border-2 border-purple-200">
            <h1 class="text-4xl md:text-5xl font-bold text-gray-800 mb-4">${escapeHtml(capitalizedTitle)}</h1>

            <div class="flex flex-wrap items-center gap-3 mb-4">
                ${story.difficulty ? `<span class="inline-block bg-gradient-to-r ${getDifficultyColor(story.difficulty)} text-white rounded-full px-6 py-2 text-lg font-semibold">${escapeHtml(story.difficulty)}</span>` : ''}
            </div>

${tagsBadgesHtml}

            <button id="speak-title" class="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-8 py-3 rounded-full hover:scale-105 transition-transform font-bold shadow-lg">
                <i class="ti ti-volume"></i> Listen to Story Title
            </button>
        </div>

        <!-- Pidgin Story Text -->
        <section class="bg-white rounded-2xl p-8 mb-8 shadow-xl">
            <h2 class="text-2xl font-bold text-gray-800 mb-4"><i class="ti ti-book"></i> Story in Pidgin</h2>
            <blockquote class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-500">
                <p class="text-lg text-gray-800 leading-relaxed whitespace-pre-line">${escapeHtml(story.content_pidgin || '')}</p>
            </blockquote>
        </section>

        <!-- English Translation (Collapsible) -->
        <section class="bg-white rounded-2xl p-8 mb-8 shadow-xl">
            <h2 class="text-2xl font-bold text-gray-800 mb-4"><i class="ti ti-language"></i> English Translation</h2>
            <button id="toggle-translation" class="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-full hover:scale-105 transition-transform font-bold shadow-lg mb-4">
                Show English Translation
            </button>
            <div id="translation-content" class="hidden">
                <div class="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border-l-4 border-green-500">
                    <p class="text-lg text-gray-800 leading-relaxed whitespace-pre-line">${escapeHtml(story.content_english || '')}</p>
                </div>
            </div>
        </section>

        <!-- Vocabulary Grid -->
${vocabularyHtml}

        <!-- Cultural Notes -->
${culturalNotesHtml}

        <!-- FAQ Section -->
        <section class="bg-white rounded-2xl p-8 mb-8 shadow-xl">
            <h2 class="text-2xl font-bold text-gray-800 mb-6"><i class="ti ti-question-mark"></i> Frequently Asked Questions</h2>
            <div class="space-y-4">
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-l-4 border-blue-500">
                    <h3 class="font-bold text-lg text-gray-800 mb-2">What is the story "${escapeHtml(capitalizedTitle)}" about?</h3>
                    <p class="text-gray-700">"${escapeHtml(capitalizedTitle)}" is an authentic Hawaiian Pidgin story that showcases the local language and culture of Hawaii. It includes both the original Pidgin text and an English translation.</p>
                </div>
                <div class="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-5 border-l-4 border-green-500">
                    <h3 class="font-bold text-lg text-gray-800 mb-2">What Pidgin words are in this story?</h3>
                    <p class="text-gray-700">${vocabWords.length > 0 ? `This story features the following Pidgin words: ${vocabWords.map(w => escapeHtml(w)).join(', ')}. Each word includes its English meaning and pronunciation guide.` : `This story contains authentic Hawaiian Pidgin vocabulary. Read the full story to discover the words used.`}</p>
                </div>
                <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border-l-4 border-purple-500">
                    <h3 class="font-bold text-lg text-gray-800 mb-2">What difficulty level is this story?</h3>
                    <p class="text-gray-700">${story.difficulty ? `This story is rated as ${escapeHtml(story.difficulty)} level. ${story.difficulty.toLowerCase() === 'beginner' ? 'It is great for those just starting to learn Hawaiian Pidgin.' : story.difficulty.toLowerCase() === 'intermediate' ? 'It is suited for learners with some familiarity with Pidgin.' : 'It is designed for those with a strong understanding of Hawaiian Pidgin.'}` : 'This story is suitable for all learners of Hawaiian Pidgin.'}</p>
                </div>
            </div>
        </section>

        <!-- Related Stories -->
${relatedHtml}

        <!-- Game Links -->
${getGameLinksHtml()}
    </main>

    ${footer}

    <script src="/js/components/elevenlabs-speech.js"></script>
    <script src="/js/components/speech.js"></script>
    <script>
        // TTS for story title
        document.getElementById('speak-title')?.addEventListener('click', async () => {
            const text = "${jsSafeTitle}";
            if (window.pidginSpeech) {
                await window.pidginSpeech.speak(text);
            } else {
                console.error('Pidgin speech not initialized');
            }
        });

        // Collapsible translation toggle
        document.getElementById('toggle-translation')?.addEventListener('click', () => {
            const content = document.getElementById('translation-content');
            const btn = document.getElementById('toggle-translation');
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                btn.textContent = 'Hide English Translation';
            } else {
                content.classList.add('hidden');
                btn.textContent = 'Show English Translation';
            }
        });
    </script>
</body>
</html>`;

    return html;
}

/**
 * Main execution
 */
async function main() {
    console.log('🏗️  Generating individual story pages...\n');

    try {
        // Fetch stories from Supabase
        console.log('🔄 Fetching stories from Supabase...');
        const stories = await fetchFromSupabase('stories', '*', 'title.asc');
        console.log(`✅ Fetched ${stories.length} stories from Supabase\n`);

        if (stories.length === 0) {
            throw new Error('No stories found in Supabase');
        }

        // Create output directory
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Load navigation and footer
        const { navigation, footer } = getNavAndFooter();

        let generatedCount = 0;
        let skippedCount = 0;
        const slugMap = new Map(); // Track slugs to prevent duplicates

        for (const story of stories) {
            try {
                const slug = createSlug(story.title);

                // Skip if slug already exists (duplicate handling)
                if (slugMap.has(slug)) {
                    console.log(`⚠️  Skipping duplicate slug: ${slug} (${story.title})`);
                    skippedCount++;
                    continue;
                }

                slugMap.set(slug, story);

                // Generate HTML
                const html = generateStoryPage(story, stories, navigation, footer);

                // Write file
                const filename = `${slug}.html`;
                const filepath = path.join(outputDir, filename);
                fs.writeFileSync(filepath, html, 'utf8');

                generatedCount++;

                if (generatedCount % 5 === 0) {
                    console.log(`✅ Generated ${generatedCount} pages...`);
                }
            } catch (error) {
                console.error(`❌ Error generating page for "${story.title}":`, error.message);
                skippedCount++;
            }
        }

        console.log('\n✨ Generation complete!');
        console.log(`📄 Generated: ${generatedCount} pages`);
        console.log(`⚠️  Skipped: ${skippedCount} entries`);
        console.log(`📂 Output directory: ${outputDir}`);

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

main();
