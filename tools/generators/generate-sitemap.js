#!/usr/bin/env node

/**
 * Generate Sitemap with All Dictionary Entry Pages
 * Creates comprehensive sitemap.xml for SEO
 * Fetches data from Supabase API
 */

const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://jfzgzjgdptowfbtljvyp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmemd6amdkcHRvd2ZidGxqdnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzk0OTMsImV4cCI6MjA3OTk1NTQ5M30.xPubHKR0PFEic52CffEBVCwmfPz-AiqbwFk39ulwydM';

// Helper: Create URL-friendly slug
function createSlug(text) {
    return text
        .toLowerCase()
        .replace(/'/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

// Fetch all dictionary entries from Supabase
async function fetchDictionaryEntries() {
    console.log('🔄 Fetching dictionary entries from Supabase...');

    const allEntries = [];
    const pageSize = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const url = `${SUPABASE_URL}/rest/v1/dictionary_entries?select=pidgin,frequency,difficulty&order=pidgin.asc&offset=${offset}&limit=${pageSize}`;

        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
        }

        const entries = await response.json();

        if (entries.length === 0) {
            hasMore = false;
        } else {
            allEntries.push(...entries);
            offset += pageSize;

            if (entries.length < pageSize) {
                hasMore = false;
            }
        }
    }

    console.log(`✅ Fetched ${allEntries.length} entries from Supabase\n`);
    return allEntries;
}

// Generate sitemap XML
function generateSitemap(entries) {
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

`;

    // Track slugs to prevent duplicates
    const slugSet = new Set();
    let entryCount = 0;

    // Add individual dictionary entry pages
    xml += `    <!-- Individual Dictionary Entry Pages -->\n`;

    entries.forEach(entry => {
        const slug = createSlug(entry.pidgin);

        // Skip duplicates
        if (slugSet.has(slug)) {
            return;
        }

        slugSet.add(slug);
        entryCount++;

        // Determine frequency based on entry popularity
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

    xml += `
</urlset>`;

    return { xml, entryCount };
}

// Main execution
async function main() {
    console.log('🗺️  Generating sitemap.xml...\n');

    try {
        const entries = await fetchDictionaryEntries();

        if (entries.length === 0) {
            throw new Error('No dictionary entries found in Supabase');
        }

        const { xml, entryCount } = generateSitemap(entries);

        // Write sitemap
        const outputPath = path.join(__dirname, '../../public/sitemap.xml');
        fs.writeFileSync(outputPath, xml, 'utf8');

        console.log('✅ Sitemap generated successfully!');
        console.log(`📄 Total URLs: ${entryCount + 12} (7 main pages + 5 blog pages + ${entryCount} dictionary entries)`);
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
