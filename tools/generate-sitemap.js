#!/usr/bin/env node

// Generate sitemap.xml for ChokePidgin.com
const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://chokepidgin.com';
const OUTPUT_FILE = 'public/sitemap.xml';

// Define all pages with their priorities and update frequencies
const pages = [
    // Core pages - highest priority
    { url: '/', priority: 1.0, changefreq: 'weekly' },
    { url: '/translator.html', priority: 0.9, changefreq: 'weekly' },
    { url: '/dictionary.html', priority: 0.9, changefreq: 'weekly' },

    // Interactive tools
    { url: '/pickup-line-generator.html', priority: 0.8, changefreq: 'weekly' },
    { url: '/learning-hub.html', priority: 0.8, changefreq: 'weekly' },
    { url: '/ask-local.html', priority: 0.7, changefreq: 'monthly' },

    // Content pages
    { url: '/stories.html', priority: 0.7, changefreq: 'monthly' },
    { url: '/pickup-lines.html', priority: 0.7, changefreq: 'monthly' },
    { url: '/pidgin-bible.html', priority: 0.6, changefreq: 'yearly' },
    { url: '/about.html', priority: 0.5, changefreq: 'monthly' },

    // Educational content
    { url: '/pidgin-vs-hawaiian.html', priority: 0.6, changefreq: 'monthly' },
    { url: '/cheat-sheet.html', priority: 0.7, changefreq: 'monthly' },
    { url: '/how-to-use-hawaiian-pidgin-pickup-lines.html', priority: 0.8, changefreq: 'monthly' },

    // SEO Listicles - high-value content pages
    { url: '/15-essential-pidgin-phrases-ordering-plate-lunch.html', priority: 0.8, changefreq: 'monthly' },
    { url: '/brah-sistah-pidgin-dictionary.html', priority: 0.8, changefreq: 'monthly' },
    { url: '/beach-surf-pidgin-slang.html', priority: 0.8, changefreq: 'monthly' },
    { url: '/understanding-time-in-pidgin.html', priority: 0.8, changefreq: 'monthly' },
    { url: '/funny-insulting-pidgin-phrases.html', priority: 0.7, changefreq: 'monthly' },
    { url: '/oahu-local-eats.html', priority: 0.9, changefreq: 'monthly' },

    // Games
    { url: '/how-local-you-stay.html', priority: 0.7, changefreq: 'monthly' },
    { url: '/pidgin-wordle.html', priority: 0.7, changefreq: 'monthly' },
    { url: '/pidgin-crossword.html', priority: 0.7, changefreq: 'monthly' },

    // Blog section
    { url: '/blog/', priority: 0.85, changefreq: 'weekly' },
    { url: '/blog/hawaiian-pidgin-beginners-guide.html', priority: 0.8, changefreq: 'monthly' },
    { url: '/blog/10-essential-pidgin-phrases-visitors.html', priority: 0.8, changefreq: 'monthly' },
    { url: '/blog/pidgin-vs-hawaiian-language.html', priority: 0.8, changefreq: 'monthly' },
    { url: '/blog/history-of-hawaiian-pidgin.html', priority: 0.8, changefreq: 'monthly' },

    // SEO pages - phrase explanations
    { url: '/what-does-da-kine-mean.html', priority: 0.6, changefreq: 'monthly' },
    { url: '/what-does-howzit-mean.html', priority: 0.6, changefreq: 'monthly' },
    { url: '/what-does-broke-da-mouth-mean.html', priority: 0.6, changefreq: 'monthly' },
    { url: '/what-does-pau-hana-mean.html', priority: 0.6, changefreq: 'monthly' },
    { url: '/what-does-ono-grindz-mean.html', priority: 0.6, changefreq: 'monthly' },
    { url: '/what-does-shoots-mean.html', priority: 0.6, changefreq: 'monthly' },
    { url: '/what-does-brah-mean.html', priority: 0.6, changefreq: 'monthly' },
    { url: '/what-does-shaka-mean.html', priority: 0.6, changefreq: 'monthly' },
    { url: '/what-does-grindz-mean.html', priority: 0.6, changefreq: 'monthly' },
    { url: '/what-does-pau-mean.html', priority: 0.6, changefreq: 'monthly' },
    { url: '/what-does-choke-mean.html', priority: 0.6, changefreq: 'monthly' },
    { url: '/what-does-talk-story-mean.html', priority: 0.6, changefreq: 'monthly' },
    { url: '/what-does-mahalo-mean.html', priority: 0.6, changefreq: 'monthly' },
    { url: '/what-does-no-worry-mean.html', priority: 0.6, changefreq: 'monthly' }
];

// Get word pages from the actual /word/ directory
function getWordPages() {
    const entries = [];
    const wordDir = 'public/word';

    if (fs.existsSync(wordDir)) {
        try {
            const files = fs.readdirSync(wordDir);
            files.forEach(file => {
                if (file.endsWith('.html')) {
                    entries.push({
                        url: `/word/${file}`,
                        priority: 0.5,
                        changefreq: 'monthly'
                    });
                }
            });
        } catch (error) {
            console.error('Error reading word pages:', error.message);
        }
    }

    return entries;
}

// Generate XML
function generateSitemap() {
    const now = new Date().toISOString().split('T')[0];

    // Combine static pages with word pages
    const allPages = [...pages];

    // Add word pages from /word/ directory
    const wordPages = getWordPages();
    console.log(`📖 Found ${wordPages.length} word pages`);
    allPages.push(...wordPages);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    allPages.forEach(page => {
        xml += '  <url>\n';
        xml += `    <loc>${DOMAIN}${page.url}</loc>\n`;
        xml += `    <lastmod>${now}</lastmod>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += '  </url>\n';
    });

    xml += '</urlset>\n';

    return xml;
}

// Main execution
try {
    console.log('🗺️  Generating sitemap.xml...');

    const sitemap = generateSitemap();

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write sitemap
    fs.writeFileSync(OUTPUT_FILE, sitemap);

    console.log(`✅ Sitemap generated successfully!`);
    console.log(`📍 Location: ${OUTPUT_FILE}`);
    console.log(`📊 Total URLs: ${sitemap.split('<url>').length - 1}`);

} catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
}
