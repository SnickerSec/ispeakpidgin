#!/usr/bin/env node

/**
 * Generate Sitemap with All Dictionary Entry Pages
 * Creates comprehensive sitemap.xml for SEO
 */

const fs = require('fs');
const path = require('path');

// Load master data
const masterData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/master/pidgin-master.json'), 'utf8')
);

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

// Generate sitemap XML
function generateSitemap() {
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

`;

    // Track slugs to prevent duplicates
    const slugSet = new Set();
    let entryCount = 0;

    // Add individual dictionary entry pages
    xml += `    <!-- Individual Dictionary Entry Pages -->\n`;

    masterData.entries.forEach(entry => {
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
console.log('🗺️  Generating sitemap.xml...\n');

const { xml, entryCount } = generateSitemap();

// Write sitemap
const outputPath = path.join(__dirname, '../public/sitemap.xml');
fs.writeFileSync(outputPath, xml, 'utf8');

console.log('✅ Sitemap generated successfully!');
console.log(`📄 Total URLs: ${entryCount + 12} (7 main pages + 5 blog pages + ${entryCount} dictionary entries)`);
console.log(`📂 Output: ${outputPath}`);
console.log(`\n🔗 Submit to search engines:`);
console.log(`   - Google: https://search.google.com/search-console`);
console.log(`   - Bing: https://www.bing.com/webmasters`);
console.log(`   - Sitemap URL: https://chokepidgin.com/sitemap.xml`);
