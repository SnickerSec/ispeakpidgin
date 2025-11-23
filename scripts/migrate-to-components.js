#!/usr/bin/env node

/**
 * Migration script to replace navigation and footer blocks with placeholders
 * This ensures all pages use the shared component templates
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Starting migration to component placeholders...\n');

const pagesDir = 'src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    console.log(`📄 Processing: ${file}`);

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Replace navigation block with placeholder
        // Match from <nav or <!-- Navigation --> to </nav>
        const navPattern = /(<!-- Navigation -->[\s\S]*?<nav[\s\S]*?<\/nav>)/;
        if (navPattern.test(content)) {
            content = content.replace(navPattern, '<!-- NAVIGATION_PLACEHOLDER -->');
            modified = true;
            console.log('  ✅ Replaced navigation');
        } else if (!content.includes('<!-- NAVIGATION_PLACEHOLDER -->')) {
            console.log('  ⚠️  No navigation block found (might already use placeholder)');
        }

        // Replace footer block with placeholder
        // Match from <!-- Footer --> or <footer to </footer>
        const footerPattern = /(<!-- Footer -->[\s\S]*?<footer[\s\S]*?<\/footer>)/;
        if (footerPattern.test(content)) {
            content = content.replace(footerPattern, '<!-- FOOTER_PLACEHOLDER -->');
            modified = true;
            console.log('  ✅ Replaced footer');
        } else if (!content.includes('<!-- FOOTER_PLACEHOLDER -->')) {
            console.log('  ⚠️  No footer block found (might already use placeholder)');
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`  💾 Saved: ${file}\n`);
            successCount++;
        } else {
            console.log(`  ⏭️  Skipped: ${file} (already using placeholders or no nav/footer found)\n`);
            skipCount++;
        }
    } catch (error) {
        console.error(`  ❌ Error processing ${file}:`, error.message, '\n');
        errorCount++;
    }
});

console.log('━'.repeat(60));
console.log('📊 Migration Summary:');
console.log(`  ✅ Successfully migrated: ${successCount} files`);
console.log(`  ⏭️  Skipped: ${skipCount} files`);
console.log(`  ❌ Errors: ${errorCount} files`);
console.log('━'.repeat(60));

if (successCount > 0) {
    console.log('\n🎉 Migration complete!');
    console.log('📋 Next steps:');
    console.log('  1. Run: npm run build');
    console.log('  2. Test pages in public/ directory');
    console.log('  3. Commit changes if everything looks good');
} else {
    console.log('\n✨ All pages already using component placeholders!');
}
