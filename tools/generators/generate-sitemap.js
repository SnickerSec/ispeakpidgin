#!/usr/bin/env node

/**
 * Generate Sitemap with All Page Types
 * Creates comprehensive sitemap.xml for SEO
 * Fetches data from Supabase API
 */

const fs = require('fs');
const path = require('path');

const { createSlug, fetchFromSupabase } = require('./shared-utils');

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

// Generate sitemap XML
function generateSitemap({ dictionaryEntries, phrases, stories, pickupLines }) {
    const baseUrl = 'https://chokepidgin.com';
    const currentDate = getCurrentDate();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

    <!-- Homepage - Main landing page -->
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>

    <!-- Dictionary Page - Main feature -->
    <url>
        <loc>${baseUrl}/dictionary.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>

    <!-- Translator Page - Dedicated translator tool -->
    <url>
        <loc>${baseUrl}/translator.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>

    <!-- Phrases Page - Common Hawaiian Pidgin phrases -->
    <url>
        <loc>${baseUrl}/phrases.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>

    <!-- Games Page - Hawaiian Pidgin word games -->
    <url>
        <loc>${baseUrl}/games.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>

    <!-- Learning Hub Page - Structured lessons and progress tracking -->
    <url>
        <loc>${baseUrl}/learning-hub.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>

    <!-- Pronunciation Practice Page - Interactive speech training -->
    <url>
        <loc>${baseUrl}/pronunciation-practice.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.85</priority>
    </url>

    <!-- Pidgin Heads Up Game - Party game -->
    <url>
        <loc>${baseUrl}/pidgin-heads-up.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>

    <!-- Ask a Local Page - Community feature -->
    <url>
        <loc>${baseUrl}/ask-local.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>

    <!-- Stories Page - Cultural narratives and learning -->
    <url>
        <loc>${baseUrl}/stories.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.85</priority>
    </url>

    <!-- Pickup Lines Page - Fun and engaging content -->
    <url>
        <loc>${baseUrl}/pickup-lines.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.75</priority>
    </url>

    <!-- Blog Section -->
    <url>
        <loc>${baseUrl}/blog/</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.85</priority>
    </url>

    <url>
        <loc>${baseUrl}/blog/hawaiian-pidgin-beginners-guide.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>

    <url>
        <loc>${baseUrl}/blog/10-essential-pidgin-phrases-visitors.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>

    <url>
        <loc>${baseUrl}/blog/pidgin-vs-hawaiian-language.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>

    <url>
        <loc>${baseUrl}/blog/history-of-hawaiian-pidgin.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>

    <!-- SEO Landing Pages - What Does X Mean -->
    <url>
        <loc>${baseUrl}/what-does-da-kine-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-howzit-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-brah-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-shoots-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-pau-hana-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-grindz-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-shaka-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-broke-da-mouth-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-ono-grindz-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-pau-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-choke-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-talk-story-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-mahalo-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-no-worry-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <!-- New SEO Pages based on Search Console Data -->
    <url>
        <loc>${baseUrl}/what-does-ainokea-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-kanak-attack-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-niele-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-pilau-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-sistah-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-moopuna-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-buss-up-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-mayjah-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-poho-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-faka-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-small-kine-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-pake-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-buggah-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-rajah-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-lolo-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-hamajang-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-humbug-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <!-- High-Volume Keyword SEO Pages -->
    <url>
        <loc>${baseUrl}/what-does-aloha-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-ohana-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-haole-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-keiki-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-ono-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-kamaaina-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-wahine-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-stink-eye-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-chicken-skin-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>${baseUrl}/what-does-mauka-makai-mean.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.85</priority>
    </url>

`;

    // Track slugs to prevent duplicates across all types
    const slugSet = new Set();
    let entryCount = 0;
    let phraseCount = 0;
    let storyCount = 0;
    let pickupCount = 0;

    // Add individual dictionary entry pages
    xml += `    <!-- Individual Dictionary Entry Pages -->\n`;

    dictionaryEntries.forEach(entry => {
        const slug = createSlug(entry.pidgin);
        if (slugSet.has('word/' + slug)) return;
        slugSet.add('word/' + slug);
        entryCount++;

        let changefreq = 'monthly';
        let priority = 0.7;

        if (entry.frequency === 'high') {
            changefreq = 'weekly';
            priority = 0.8;
        } else if (entry.difficulty === 'beginner') {
            priority = 0.75;
        }

        xml += `    <url>
        <loc>${baseUrl}/word/${slug}.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>${changefreq}</changefreq>
        <priority>${priority}</priority>
    </url>
`;
    });

    // Add individual phrase pages
    xml += `\n    <!-- Individual Phrase Pages -->\n`;

    phrases.forEach(phrase => {
        const slug = createSlug(phrase.pidgin);
        if (slugSet.has('phrase/' + slug)) return;
        slugSet.add('phrase/' + slug);
        phraseCount++;

        xml += `    <url>
        <loc>${baseUrl}/phrase/${slug}.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.65</priority>
    </url>
`;
    });

    // Add individual story pages
    xml += `\n    <!-- Individual Story Pages -->\n`;

    stories.forEach(story => {
        const slug = createSlug(story.title);
        if (slugSet.has('story/' + slug)) return;
        slugSet.add('story/' + slug);
        storyCount++;

        xml += `    <url>
        <loc>${baseUrl}/story/${slug}.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.75</priority>
    </url>
`;
    });

    // Add individual pickup line pages
    xml += `\n    <!-- Individual Pickup Line Pages -->\n`;

    pickupLines.forEach(line => {
        const slug = createSlug(line.pidgin.substring(0, 50));
        if (slugSet.has('pickup/' + slug)) return;
        slugSet.add('pickup/' + slug);
        pickupCount++;

        xml += `    <url>
        <loc>${baseUrl}/pickup/${slug}.html</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
`;
    });

    xml += `
</urlset>`;

    return { xml, entryCount, phraseCount, storyCount, pickupCount };
}

// Main execution
async function main() {
    console.log('🗺️  Generating sitemap.xml...\n');

    try {
        // Fetch all content types in parallel
        const [dictionaryEntries, phrases, stories, pickupLines] = await Promise.all([
            fetchFromSupabase('dictionary_entries', 'pidgin,frequency,difficulty', 'pidgin.asc'),
            fetchFromSupabase('phrases', 'pidgin', 'pidgin.asc'),
            fetchFromSupabase('stories', 'title', 'title.asc'),
            fetchFromSupabase('pickup_lines', 'pidgin', 'pidgin.asc')
        ]);

        console.log(`📊 Fetched: ${dictionaryEntries.length} dictionary entries, ${phrases.length} phrases, ${stories.length} stories, ${pickupLines.length} pickup lines\n`);

        if (dictionaryEntries.length === 0) {
            throw new Error('No dictionary entries found in Supabase');
        }

        const { xml, entryCount, phraseCount, storyCount, pickupCount } = generateSitemap({
            dictionaryEntries,
            phrases,
            stories,
            pickupLines
        });

        // Write sitemap
        const outputPath = path.join(__dirname, '../../public/sitemap.xml');
        fs.writeFileSync(outputPath, xml, 'utf8');

        const staticPages = 57; // main pages + blog + SEO landing pages
        const totalUrls = staticPages + entryCount + phraseCount + storyCount + pickupCount;

        console.log('✅ Sitemap generated successfully!');
        console.log(`📄 Total URLs: ${totalUrls}`);
        console.log(`   - Static pages: ${staticPages}`);
        console.log(`   - Dictionary entries: ${entryCount}`);
        console.log(`   - Phrases: ${phraseCount}`);
        console.log(`   - Stories: ${storyCount}`);
        console.log(`   - Pickup lines: ${pickupCount}`);
        console.log(`📂 Output: ${outputPath}`);
        console.log(`\n🔗 Submit to search engines:`);
        console.log(`   - Google: https://search.google.com/search-console`);
        console.log(`   - Bing: https://www.bing.com/webmasters`);
        console.log(`   - Sitemap URL: https://chokepidgin.com/sitemap.xml`);

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

main();
