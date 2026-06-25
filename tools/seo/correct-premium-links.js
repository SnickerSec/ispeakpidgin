#!/usr/bin/env node

/**
 * Premium Link Correction Script
 * Recursively parses built HTML files in public/ and corrects legacy /word/*.html links
 * to point directly to curated premium pages based on the build.js premiumPages map.
 */

const fs = require('fs');
const path = require('path');
const { premiumPages, getHtmlFiles } = require('../../build.js');

const publicDir = path.resolve(__dirname, '../../public');

function correctLinks() {
    console.log('\n🔗 Running automated premium link correction...');
    const startTime = Date.now();

    if (!fs.existsSync(publicDir)) {
        console.error('❌ Public directory does not exist. Skipping link correction.');
        return;
    }

    const htmlFiles = getHtmlFiles(publicDir);
    let correctedCount = 0;
    let fileModifiedCount = 0;

    for (const filePath of htmlFiles) {
        const relativeFilePath = path.relative(publicDir, filePath);
        const html = fs.readFileSync(filePath, 'utf8');
        
        let modified = false;
        
        // Find and replace href values targeting /word/slug.html
        const newHtml = html.replace(/href=["']([^"']+)["']/g, (match, link) => {
            let cleanLink = link.trim();
            
            // Skip external, anchors, mailto, tel, javascript, etc.
            if (
                cleanLink.startsWith('http://') || 
                cleanLink.startsWith('https://') || 
                cleanLink.startsWith('#') || 
                cleanLink.startsWith('mailto:') || 
                cleanLink.startsWith('tel:') || 
                cleanLink.startsWith('javascript:')
            ) {
                return match;
            }

            // Extract query parameters and hash to preserve them
            const parts = cleanLink.split('?');
            const urlPart = parts[0];
            const queryPart = parts.slice(1).join('?');
            
            const hashParts = urlPart.split('#');
            let pathPart = hashParts[0];
            const hashPart = hashParts.slice(1).join('#');

            // If the path contains 'word/' or 'phrase/'
            if (pathPart.includes('word/') || pathPart.includes('phrase/')) {
                const wordSlug = path.basename(pathPart, '.html');
                const wordKey = wordSlug.replace(/-/g, ' ');
                const premiumPage = premiumPages[wordKey];
                
                if (premiumPage) {
                    correctedCount++;
                    modified = true;
                    
                    // Construct new link (premium page is located at root-relative)
                    let newLink = '/' + premiumPage;
                    if (queryPart) {
                        newLink += '?' + queryPart;
                    }
                    if (hashPart) {
                        newLink += '#' + hashPart;
                    }
                    
                    // Determine which quotes were used
                    const quote = match.includes('"') ? '"' : "'";
                    return `href=${quote}${newLink}${quote}`;
                }
            }
            return match;
        });

        if (modified) {
            fs.writeFileSync(filePath, newHtml, 'utf8');
            fileModifiedCount++;
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Corrected ${correctedCount} links across ${fileModifiedCount} files in ${duration}s`);
}

if (require.main === module) {
    correctLinks();
}

module.exports = { correctLinks };
