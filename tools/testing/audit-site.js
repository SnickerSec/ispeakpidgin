#!/usr/bin/env node

/**
 * Site Integrity & SEO Audit Tool
 * 
 * Recursively crawls the public/ folder and verifies:
 * 1. Basic SEO (Title, Description, Canonical)
 * 2. Internal Link Integrity (No 404s)
 * 3. Asset Integrity (Images and Audio files exist)
 * 4. Social Metadata (OG Tags)
 */

const fs = require('fs');
const path = require('path');

// The sitemap generator owns the include/exclude rules; importing them means this audit checks
// that sitemap.xml matches what the current build would produce, rather than restating the rules
// and drifting from them.
const { classifyPage, readRobotsDisallows } = require('../generators/generate-sitemap');

// Configuration
const PUBLIC_DIR = path.join(__dirname, '../../public');
const SITE_URL = 'https://chokepidgin.com';
const IGNORE_PATTERNS = ['/node_modules/', '/.git/'];

const stats = {
    pagesChecked: 0,
    linksChecked: 0,
    errors: [],
    warnings: []
};

// Map to track found files to verify links/assets
const existingFiles = new Set();
const internalLinks = [];

/**
 * Recursively find all files in a directory
 */
function crawlDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const relativePath = '/' + path.relative(PUBLIC_DIR, fullPath).replace(/\\/g, '/');

        if (fs.statSync(fullPath).isDirectory()) {
            crawlDirectory(fullPath);
        } else {
            existingFiles.add(relativePath);
            // Handle index.html as root /
            if (relativePath.endsWith('/index.html')) {
                existingFiles.add(relativePath.replace('index.html', ''));
            }
            // Handle .html as clean URL
            if (relativePath.endsWith('.html')) {
                existingFiles.add(relativePath.replace('.html', ''));
            }
        }
    }
}

/**
 * Audit a single HTML file
 */
function auditHTMLFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = '/' + path.relative(PUBLIC_DIR, filePath).replace(/\\/g, '/');
    
    stats.pagesChecked++;

    const errors = [];
    const warnings = [];

    // 1. Check Title
    const titleMatch = content.match(/<title>(.*?)<\/title>/i);
    if (!titleMatch || !titleMatch[1]) {
        errors.push('Missing <title> tag');
    } else if (titleMatch[1].length < 10) {
        warnings.push(`Short title: "${titleMatch[1]}"`);
    }

    // 2. Check Description
    const descMatch = content.match(/<meta name="description" content="(.*?)"/i);
    if (!descMatch || !descMatch[1]) {
        errors.push('Missing meta description');
    } else if (descMatch[1].length < 30) {
        warnings.push(`Short description: "${descMatch[1]}"`);
    }

    // 3. Check Canonical
    const canonicalMatch = content.match(/<link rel="canonical" href="(.*?)"/i);
    if (!canonicalMatch) {
        errors.push('Missing rel="canonical" link');
    } else {
        const expectedCanonical = SITE_URL + relativePath.replace('index.html', '');
        // Loose check because our generator sometimes removes .html or adds it
        const actual = canonicalMatch[1].replace('.html', '');
        const expected = expectedCanonical.replace('.html', '').replace(/\/$/, '');
        if (actual !== expected && !actual.includes('what-does-')) { // Skip premium redirects for now
             warnings.push(`Canonical mismatch. Found: ${actual}, Expected: ${expected}`);
        }
    }

    // 4. Extract and check Assets (Images/Audio)
    const srcMatches = content.matchAll(/src="(.*?)"/g);
    for (const match of srcMatches) {
        const src = match[1];
        if (src.startsWith('/') && !src.startsWith('//')) {
            const assetPath = src.split('?')[0].split('#')[0];
            if (!existingFiles.has(assetPath)) {
                errors.push(`Missing asset: ${src}`);
            }
        }
    }

    // 5. Collect internal links for later validation
    const hrefMatches = content.matchAll(/href="(.*?)"/g);
    for (const match of hrefMatches) {
        const href = match[1].trim();
        // Skip external, anchors, mailto, tel, javascript, etc.
        if (
            href.startsWith('http://') || 
            href.startsWith('https://') || 
            href.includes('#') || 
            href.startsWith('mailto:') || 
            href.startsWith('tel:') || 
            href.startsWith('javascript:') ||
            href.startsWith('data:') ||
            href.startsWith('vbscript:') ||
            !href
        ) {
            continue;
        }

        let cleanHref = href.replace(SITE_URL, '');
        if (cleanHref.startsWith('/')) {
            internalLinks.push({ from: relativePath, to: cleanHref });
        } else {
            // Resolve relative path
            const currentDir = path.dirname(relativePath);
            const resolved = path.posix.resolve(currentDir, cleanHref);
            internalLinks.push({ from: relativePath, to: resolved });
        }
    }

    if (errors.length > 0 || warnings.length > 0) {
        return { path: relativePath, errors, warnings };
    }
    return null;
}

/**
 * Verify sitemap.xml still covers the site.
 *
 * Two failures matter and neither shows up as a broken link: an indexable page that exists in the
 * build but is missing from the sitemap (26 pages had drifted this way, including every game page
 * and the curated /what-does-sarap-mean.html), and a sitemap entry that no longer resolves to a
 * file. Both mean the sitemap was not regenerated after the build.
 */
function auditSitemap() {
    const issues = [];
    const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');

    if (!fs.existsSync(sitemapPath)) {
        issues.push('sitemap.xml is missing from public/ - run: npm run generate:sitemap');
        return issues;
    }

    const xml = fs.readFileSync(sitemapPath, 'utf8');
    const listed = new Set(
        [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m => m[1].replace(SITE_URL, '') || '/')
    );

    const disallows = readRobotsDisallows();
    const htmlFiles = Array.from(existingFiles).filter(f => f.endsWith('.html'));

    // Every indexable built page must be listed.
    const missing = [];
    for (const file of htmlFiles) {
        const page = classifyPage(file.replace(/^\//, ''), disallows);
        if (page.included && !listed.has(page.url)) missing.push(page.url);
    }

    // Every listed URL must resolve to a built file.
    const dead = [];
    for (const url of listed) {
        const asFile = url === '/' ? '/index.html'
            : url.endsWith('/') ? url + 'index.html'
            : url;
        if (!existingFiles.has(asFile)) dead.push(url);
    }

    if (missing.length > 0) {
        issues.push(`${missing.length} indexable page(s) missing from sitemap.xml: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ', ...' : ''}`);
    }
    if (dead.length > 0) {
        issues.push(`${dead.length} sitemap URL(s) do not resolve to a built page: ${dead.slice(0, 5).join(', ')}${dead.length > 5 ? ', ...' : ''}`);
    }

    return issues;
}

/**
 * Main execution
 */
async function runAudit() {
    console.log('🔍 Starting Site Integrity Audit...');
    console.log(`📂 Path: ${PUBLIC_DIR}\n`);

    // Step 1: Map all existing files
    crawlDirectory(PUBLIC_DIR);
    console.log(`📊 Found ${existingFiles.size} total files in public/\n`);

    const results = [];
    const htmlFiles = Array.from(existingFiles).filter(f => f.endsWith('.html'));

    // Step 2: Audit every HTML file
    for (const file of htmlFiles) {
        const fullPath = path.join(PUBLIC_DIR, file);
        const result = auditHTMLFile(fullPath);
        if (result) results.push(result);
    }

    // Step 3: Validate collected internal links
    console.log('🔗 Checking internal links...');
    const brokenLinks = [];
    for (const link of internalLinks) {
        stats.linksChecked++;
        // Remove trailing slash for comparison
        const target = link.to.replace(/\/$/, '');
        const targetWithHtml = target + '.html';
        
        if (!existingFiles.has(link.to) && !existingFiles.has(target) && !existingFiles.has(targetWithHtml)) {
            // Ignore common dynamic routes or those with query params
            if (!link.to.includes('?') && !link.to.includes('/api/')) {
                brokenLinks.push(link);
            }
        }
    }

    // Step 4: Validate sitemap coverage
    console.log('🗺️  Checking sitemap coverage...');
    const sitemapIssues = auditSitemap();

    // Step 5: Report
    console.log('\n=======================================');
    console.log('REPORT');
    console.log('=======================================');
    console.log(`Pages Audited:    ${stats.pagesChecked}`);
    console.log(`Links Validated:  ${stats.linksChecked}`);
    console.log(`Broken Links:     ${brokenLinks.length}`);
    console.log(`Sitemap Issues:   ${sitemapIssues.length}`);

    const totalErrors = results.reduce((acc, r) => acc + r.errors.length, 0) + brokenLinks.length + sitemapIssues.length;
    console.log(`Total Critical:   ${totalErrors}`);
    console.log('=======================================\n');

    if (sitemapIssues.length > 0) {
        console.log('❌ SITEMAP COVERAGE:');
        sitemapIssues.forEach(issue => console.log(`  - ${issue}`));
        console.log('');
    }

    if (brokenLinks.length > 0) {
        console.log('❌ BROKEN INTERNAL LINKS:');
        brokenLinks.slice(0, 20).forEach(link => {
            console.log(`  - From: ${link.from} -> To: ${link.to}`);
        });
        if (brokenLinks.length > 20) console.log(`  ... and ${brokenLinks.length - 20} more.`);
        console.log('');
    }

    const pagesWithErrors = results.filter(r => r.errors.length > 0);
    if (pagesWithErrors.length > 0) {
        console.log('❌ SEO & ASSET ERRORS:');
        pagesWithErrors.slice(0, 10).forEach(page => {
            console.log(`  [${page.path}]`);
            page.errors.forEach(err => console.log(`    - ${err}`));
        });
        if (pagesWithErrors.length > 10) console.log(`  ... and ${pagesWithErrors.length - 10} more pages.`);
    }

    if (totalErrors > 0) {
        console.log(`\n❌ Audit failed with ${totalErrors} critical issue(s).`);
        process.exitCode = 1;
        return;
    }

    console.log('\n✅ Audit complete!');
}

runAudit().catch(err => {
    console.error('Fatal error during audit:', err);
    process.exit(1);
});
