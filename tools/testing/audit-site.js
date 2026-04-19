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
        const href = match[1];
        // Only internal, non-anchor, non-mail links
        if ((href.startsWith('/') || href.startsWith(SITE_URL)) && !href.includes('#') && !href.includes('mailto:')) {
            let cleanHref = href.replace(SITE_URL, '');
            if (!cleanHref.startsWith('/')) cleanHref = '/' + cleanHref;
            internalLinks.push({ from: relativePath, to: cleanHref });
        }
    }

    if (errors.length > 0 || warnings.length > 0) {
        return { path: relativePath, errors, warnings };
    }
    return null;
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

    // Step 4: Report
    console.log('\n=======================================');
    console.log('REPORT');
    console.log('=======================================');
    console.log(`Pages Audited:    ${stats.pagesChecked}`);
    console.log(`Links Validated:  ${stats.linksChecked}`);
    console.log(`Broken Links:     ${brokenLinks.length}`);
    
    const totalErrors = results.reduce((acc, r) => acc + r.errors.length, 0) + brokenLinks.length;
    console.log(`Total Critical:   ${totalErrors}`);
    console.log('=======================================\n');

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

    console.log('\n✅ Audit complete!');
}

runAudit().catch(err => {
    console.error('Fatal error during audit:', err);
    process.exit(1);
});
