#!/usr/bin/env node

/**
 * Generate Individual Pickup Line Pages
 * Creates SEO-optimized pages for each pickup line from Supabase
 */

const fs = require('fs');
const path = require('path');
const { createSlug, escapeHtml, fetchFromSupabase, getNavAndFooter, getCommonHead, getGameLinksHtml, getQuickActionsHtml, SITE_URL, SITE_NAME } = require('./shared-utils');

// Output directory
const outputDir = path.join(__dirname, '../../public/pickup');

/**
 * Find related pickup lines by category and tags
 */
function findRelatedLines(line, allLines, limit = 6) {
    return allLines
        .filter(l => l.id !== line.id)
        .map(l => {
            let score = 0;
            // Same category
            if (l.category === line.category) score += 3;
            // Shared tags
            const lineTags = line.tags || [];
            const lTags = l.tags || [];
            const sharedTags = lineTags.filter(t => lTags.includes(t));
            score += sharedTags.length;
            return { line: l, score };
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(r => r.line);
}

/**
 * Generate HTML page for a single pickup line
 */
function generatePickupPage(line, relatedLines) {
    const slug = createSlug(line.pidgin.substring(0, 50));
    const shortDisplay = line.pidgin.length > 40 ? line.pidgin.substring(0, 40) + '...' : line.pidgin;
    const canonicalUrl = `${SITE_URL}/pickup/${slug}.html`;

    // Page title
    const title = `"${shortDisplay}" - Hawaiian Slang Pickup Line | ${SITE_NAME}`;

    // Meta description (no HTML) - truncate pidgin/english to stay under 155 chars
    const metaPidgin = line.pidgin.length > 60 ? line.pidgin.substring(0, 60) + '...' : line.pidgin;
    const metaEnglish = line.english.length > 60 ? line.english.substring(0, 60) + '...' : line.english;
    const metaDescription = `"${metaPidgin}" means "${metaEnglish}" - a ${line.category || 'classic'} Hawaiian slang pickup line. Learn to flirt island style with authentic Pidgin.`;

    // Keywords
    const keywords = `hawaiian slang pickup lines, hawaiian pidgin pickup lines, ${line.category || 'classic'} pickup lines, pidgin flirting, hawaii love phrases`;

    // Spiciness display
    const spicyHtml = line.spiciness ? Array(Math.min(line.spiciness, 5)).fill('<i class="ti ti-flame" style="color: #ef4444;"></i>').join('') : '';

    // Structured data - CreativeWork
    const creativeWorkSchema = {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "text": line.pidgin,
        "abstract": line.english,
        "genre": "Pickup Line",
        "inLanguage": "en-US",
        "url": canonicalUrl
    };

    // Structured data - FAQPage
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": `What does "${shortDisplay}" mean in English?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `This Hawaiian Pidgin pickup line "${line.pidgin}" means "${line.english}" in English. It's a ${line.category || 'classic'} style line used for flirting island style.`
                }
            },
            {
                "@type": "Question",
                "name": `How do you say "${shortDisplay}" in Hawaiian Pidgin?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `You say it just like it reads: "${line.pidgin}". Click the "Hear It" button on the page to listen to the pronunciation. Pidgin is spoken with a relaxed, melodic tone.`
                }
            },
            {
                "@type": "Question",
                "name": `When should you use this Pidgin pickup line?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `This ${line.category || 'classic'} pickup line works best in casual, fun settings. ${line.spiciness && line.spiciness >= 4 ? 'This is a spicier line, so make sure you know the person well enough!' : 'It\'s a lighthearted line that\'s great for breaking the ice.'} Always deliver it with a smile and good vibes.`
                }
            }
        ]
    };

    // Structured data - BreadcrumbList
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
                "name": "Pickup Lines",
                "item": `${SITE_URL}/pickup-lines.html`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": shortDisplay,
                "item": canonicalUrl
            }
        ]
    };

    // Related lines HTML
    const relatedHtml = relatedLines.length > 0 ? `
        <section class="bg-white rounded-2xl p-8 mb-8 shadow-xl">
            <h2 class="text-2xl font-bold text-gray-800 mb-6"><i class="ti ti-heart"></i> Related Pickup Lines</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${relatedLines.map(related => {
                    const relSlug = createSlug(related.pidgin.substring(0, 50));
                    const relShort = related.pidgin.length > 50 ? related.pidgin.substring(0, 50) + '...' : related.pidgin;
                    const relSpicy = related.spiciness ? Array(Math.min(related.spiciness, 5)).fill('<i class="ti ti-flame" style="color: #ef4444;"></i>').join('') : '';
                    return `
                    <a href="/pickup/${relSlug}.html"
                       class="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-4 hover:shadow-lg transition-shadow border-2 border-pink-200 hover:border-pink-400">
                        <p class="font-bold text-gray-800 mb-1">"${escapeHtml(relShort)}"</p>
                        <p class="text-sm text-gray-600 mb-2">${escapeHtml(related.english)}</p>
                        <div class="flex items-center gap-2">
                            <span class="inline-block bg-pink-100 text-pink-700 text-xs font-semibold px-2 py-1 rounded-full">${escapeHtml(related.category || 'classic')}</span>
                            ${relSpicy ? `<span class="text-sm">${relSpicy}</span>` : ''}
                        </div>
                    </a>`;
                }).join('')}
            </div>
        </section>` : '';

    // Get nav and footer
    const { navigation, footer } = getNavAndFooter();

    // Build common head
    const headContent = getCommonHead({
        title,
        metaDescription,
        keywords,
        canonicalUrl,
        ogType: 'article',
        ogTitle: title,
        ogDescription: metaDescription
    });

    // Escape pidgin text for JS string
    const pidginForJs = line.pidgin.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
${headContent}

    <!-- CreativeWork Schema -->
    <script type="application/ld+json">
    ${JSON.stringify(creativeWorkSchema, null, 2)}
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

    <!-- Back to Pickup Lines -->
    <div class="bg-white border-b">
        <div class="container mx-auto px-4 py-4">
            <a href="/pickup-lines.html" class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-full hover:from-pink-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl font-semibold">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Pickup Lines
            </a>
        </div>
    </div>

    <main class="container mx-auto px-4 py-8 max-w-4xl">
        <!-- Line Header Card -->
        <div class="bg-gradient-to-br from-pink-100 via-red-100 to-orange-100 rounded-3xl p-8 mb-8 shadow-2xl border-2 border-pink-200">
            <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">"${escapeHtml(line.pidgin)}"</h1>
            <p class="text-xl text-gray-600 mb-4">
                <i class="ti ti-language"></i> <span class="font-semibold text-pink-700">${escapeHtml(line.english)}</span>
            </p>

            <div class="flex flex-wrap items-center gap-3 mb-4">
                <span class="inline-block bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full px-6 py-2 text-lg font-semibold">
                    ${escapeHtml(line.category || 'classic')}
                </span>
                ${spicyHtml ? `
                <span class="inline-flex items-center gap-1 bg-white/80 rounded-full px-4 py-2 text-lg">
                    <strong class="text-gray-700 mr-1">Spice:</strong> ${spicyHtml}
                </span>` : ''}
            </div>

            <button id="speak-line" class="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-8 py-3 rounded-full hover:scale-105 transition-transform font-bold shadow-lg">
                <i class="ti ti-volume"></i> Hear It
            </button>
        </div>

        <!-- Pronunciation & Delivery Tips -->
        <section class="bg-white rounded-2xl p-8 mb-8 shadow-xl">
            <h2 class="text-2xl font-bold text-gray-800 mb-4"><i class="ti ti-speakerphone"></i> Pronunciation & Delivery</h2>
            <div class="space-y-4">
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-l-4 border-blue-500">
                    <h3 class="font-bold text-lg text-gray-800 mb-2">How to Say It</h3>
                    <p class="text-gray-700">Read it just as it looks - Pidgin is phonetic. Speak with a relaxed, island rhythm. Don't rush it; let the words flow naturally like you're talking story with friends.</p>
                </div>
                <div class="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-5 border-l-4 border-green-500">
                    <h3 class="font-bold text-lg text-gray-800 mb-2">Delivery Tips</h3>
                    <p class="text-gray-700">Confidence is key, but keep it playful. Smile when you say it - Pidgin pickup lines are meant to be fun and lighthearted. ${line.spiciness && line.spiciness >= 4 ? 'This one\'s on the spicier side, so make sure the vibe is right before you drop it!' : 'This is a great icebreaker that works in casual settings.'}</p>
                </div>
            </div>
        </section>

        <!-- Context / When to Use -->
        <section class="bg-white rounded-2xl p-8 mb-8 shadow-xl">
            <h2 class="text-2xl font-bold text-gray-800 mb-4"><i class="ti ti-map-pin"></i> When to Use This Line</h2>
            <div class="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border-l-4 border-orange-500">
                <p class="text-gray-700 mb-3">This <strong>${escapeHtml(line.category || 'classic')}</strong> pickup line is perfect for casual, fun moments. ${line.spiciness && line.spiciness >= 3 ? 'With a spice level of ' + line.spiciness + '/5, save this one for when you\'re feeling bold and the mood is right.' : 'It\'s a lighthearted line that works great as an icebreaker.'}</p>
                <p class="text-gray-700">Best settings: beach hangouts, local parties, pau hana gatherings, or anytime you want to bring some island charm to the conversation. Remember - the key to any good Pidgin line is delivering it with genuine aloha spirit!</p>
            </div>
        </section>

        <!-- FAQ Section -->
        <section class="bg-white rounded-2xl p-8 mb-8 shadow-xl">
            <h2 class="text-2xl font-bold text-gray-800 mb-6"><i class="ti ti-question-mark"></i> Frequently Asked Questions</h2>
            <div class="space-y-4">
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-l-4 border-blue-500">
                    <h3 class="font-bold text-lg text-gray-800 mb-2">What does "${escapeHtml(shortDisplay)}" mean in English?</h3>
                    <p class="text-gray-700">This Hawaiian Pidgin pickup line "${escapeHtml(line.pidgin)}" means "${escapeHtml(line.english)}" in English. It's a ${escapeHtml(line.category || 'classic')} style line used for flirting island style.</p>
                </div>
                <div class="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-5 border-l-4 border-green-500">
                    <h3 class="font-bold text-lg text-gray-800 mb-2">How do you say "${escapeHtml(shortDisplay)}" in Hawaiian Pidgin?</h3>
                    <p class="text-gray-700">You say it just like it reads: "${escapeHtml(line.pidgin)}". Click the "Hear It" button above to listen to the pronunciation. Pidgin is spoken with a relaxed, melodic tone.</p>
                </div>
                <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border-l-4 border-purple-500">
                    <h3 class="font-bold text-lg text-gray-800 mb-2">When should you use this Pidgin pickup line?</h3>
                    <p class="text-gray-700">${line.spiciness && line.spiciness >= 4 ? 'This is a spicier line, so make sure you know the person well enough!' : 'It\'s a lighthearted line that\'s great for breaking the ice.'} Always deliver it with a smile and good vibes.</p>
                </div>
            </div>
        </section>

        <!-- Related Pickup Lines -->
        ${relatedHtml}

        <!-- Quick Actions -->
        ${getQuickActionsHtml(line.pidgin)}

        <!-- Game Links -->
        ${getGameLinksHtml()}
    </main>

    ${footer}

    <script src="/js/components/elevenlabs-speech.js"></script>
    <script src="/js/components/speech.js"></script>
    <script>
        // TTS handler for speak-line button
        document.getElementById('speak-line')?.addEventListener('click', async () => {
            const text = "${pidginForJs}";
            if (window.pidginSpeech) {
                await window.pidginSpeech.speak(text);
            } else {
                console.error('Pidgin speech not initialized');
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
    console.log('Generate individual pickup line pages...\n');

    try {
        // Create output directory
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Fetch pickup lines from Supabase
        console.log('Fetching pickup lines from Supabase...');
        const lines = await fetchFromSupabase('pickup_lines', '*', 'pidgin.asc');
        console.log(`Fetched ${lines.length} pickup lines from Supabase\n`);

        if (lines.length === 0) {
            throw new Error('No pickup lines found in Supabase');
        }

        let generatedCount = 0;
        let skippedCount = 0;
        const slugMap = new Map();

        for (const line of lines) {
            try {
                const slug = createSlug(line.pidgin.substring(0, 50));

                // Skip if slug already exists (duplicate handling)
                if (slugMap.has(slug)) {
                    console.log(`Skipping duplicate slug: ${slug} (${line.pidgin.substring(0, 40)})`);
                    skippedCount++;
                    continue;
                }

                slugMap.set(slug, line);

                // Find related lines
                const relatedLines = findRelatedLines(line, lines);

                // Generate HTML
                const html = generatePickupPage(line, relatedLines);

                // Write file
                const filename = `${slug}.html`;
                const filepath = path.join(outputDir, filename);
                fs.writeFileSync(filepath, html, 'utf8');

                generatedCount++;

                if (generatedCount % 10 === 0) {
                    console.log(`Generated ${generatedCount} pages...`);
                }
            } catch (error) {
                console.error(`Error generating page for "${line.pidgin?.substring(0, 40)}":`, error.message);
                skippedCount++;
            }
        }

        console.log('\nGeneration complete!');
        console.log(`Generated: ${generatedCount} pages`);
        console.log(`Skipped: ${skippedCount} entries`);
        console.log(`Output directory: ${outputDir}`);

    } catch (error) {
        console.error('Fatal error:', error.message);
        process.exit(1);
    }
}

main();
