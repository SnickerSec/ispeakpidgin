#!/usr/bin/env node

// Add mobile navigation to simplified SEO pages that don't use main.js

const fs = require('fs');
const path = require('path');

const PAGES_DIR = 'src/pages';

// Pages to update (those without main.js but with simplified nav)
const targetPages = [
    '15-essential-pidgin-phrases-ordering-plate-lunch.html',
    'how-to-use-hawaiian-pidgin-pickup-lines.html'
];

// Mobile menu button HTML
const mobileMenuButton = `
                <!-- Mobile menu button -->
                <button id="mobile-menu-btn" class="md:hidden text-gray-700 p-2">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>`;

// Mobile navigation menu
const mobileNav = `
        </div>
        <!-- Mobile Navigation -->
        <div id="mobile-menu" class="hidden md:hidden bg-white border-t">
            <div class="px-2 pt-2 pb-3 space-y-1">
                <a href="index.html" class="block px-3 py-2 text-gray-700 hover:text-green-600">Home</a>
                <a href="translator.html" class="block px-3 py-2 text-gray-700 hover:text-green-600">Translator</a>
                <a href="dictionary.html" class="block px-3 py-2 text-gray-700 hover:text-green-600">Dictionary</a>
                <a href="learning-hub.html" class="block px-3 py-2 text-gray-700 hover:text-green-600">Learning Hub</a>
                <a href="stories.html" class="block px-3 py-2 text-gray-700 hover:text-green-600">Stories</a>
                <a href="pickup-lines.html" class="block px-3 py-2 text-gray-700 hover:text-green-600">Pickup Lines</a>
            </div>
        </div>`;

// Mobile menu toggle script
const mobileScript = `
    <script>
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');

        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    </script>`;

function updatePage(filePath) {
    const filename = path.basename(filePath);
    console.log(`\nProcessing: ${filename}`);

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Check if mobile menu button already exists
    if (content.includes('mobile-menu-btn')) {
        console.log('  ✓ Mobile menu button already exists');
        return false;
    }

    // Step 1: Add mobile menu button after the desktop nav
    // Find the closing </div> of desktop nav and add button before the next closing </div>
    const desktopNavEndPattern = /(<div class="hidden md:flex[^>]*>[\s\S]*?<\/div>)\s*(<\/div>)/;

    if (desktopNavEndPattern.test(content)) {
        content = content.replace(desktopNavEndPattern, `$1${mobileMenuButton}\n            $2`);
        console.log('  ✓ Added mobile menu button');
        updated = true;
    }

    // Step 2: Add mobile navigation menu before closing </nav>
    // Find closing </div></div></nav> and insert mobile nav
    const navClosePattern = /(\s*<\/div>\s*<\/div>\s*<\/nav>)/;

    if (navClosePattern.test(content)) {
        content = content.replace(navClosePattern, mobileNav + '\n    </nav>');
        console.log('  ✓ Added mobile navigation menu');
        updated = true;
    }

    // Step 3: Add mobile menu script before closing </body>
    if (!content.includes('mobile-menu-btn')) {
        console.log('  ⚠️  Could not add script (button not found)');
    } else if (!content.includes('Mobile menu toggle')) {
        content = content.replace('</body>', `${mobileScript}\n</body>`);
        console.log('  ✓ Added mobile menu toggle script');
        updated = true;
    }

    if (updated) {
        fs.writeFileSync(filePath, content);
        console.log('  ✅ Saved changes');
        return true;
    } else {
        console.log('  ⊘ No changes made');
        return false;
    }
}

// Main execution
console.log('📱 Adding mobile navigation to simplified pages...\n');

let updatedCount = 0;

targetPages.forEach(filename => {
    const filePath = path.join(PAGES_DIR, filename);
    if (fs.existsSync(filePath)) {
        if (updatePage(filePath)) {
            updatedCount++;
        }
    } else {
        console.log(`\n❌ File not found: ${filename}`);
    }
});

console.log(`\n✅ Complete! Updated ${updatedCount} of ${targetPages.length} pages.`);
