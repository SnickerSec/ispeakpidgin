#!/usr/bin/env node

// Script to update navigation across all pages with Community dropdown

const fs = require('fs');
const path = require('path');

const PAGES_DIR = 'src/pages';

// Desktop navigation template with Community dropdown
const desktopNav = `                <div class="hidden md:flex space-x-6 items-center">
                    <a href="index.html" class="nav-link text-gray-700 hover:text-green-600 transition">Home</a>
                    <a href="translator.html" class="nav-link text-gray-700 hover:text-green-600 transition">Translator</a>
                    <a href="dictionary.html" class="nav-link text-gray-700 hover:text-green-600 transition">Dictionary</a>
                    <a href="learning-hub.html" class="nav-link text-gray-700 hover:text-green-600 transition">Learning Hub</a>

                    <!-- Community Dropdown -->
                    <div class="nav-dropdown relative">
                        <button class="nav-link text-gray-700 hover:text-green-600 transition flex items-center gap-1">
                            Community
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        <div class="dropdown-menu absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 hidden">
                            <a href="stories.html" class="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 transition">Stories</a>
                            <a href="ask-local.html" class="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 transition">Ask a Local</a>
                        </div>
                    </div>

                    <!-- Pickup Lines Dropdown -->
                    <div class="nav-dropdown relative">
                        <button class="nav-link text-gray-700 hover:text-green-600 transition flex items-center gap-1">
                            Pickup Lines
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        <div class="dropdown-menu absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 hidden">
                            <a href="pickup-lines.html" class="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 transition">Browse Lines</a>
                            <a href="pickup-line-generator.html" class="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 transition">AI Generator</a>
                            <a href="how-to-use-hawaiian-pidgin-pickup-lines.html" class="block px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 transition">How-To Guide</a>
                        </div>
                    </div>

                    <a href="pidgin-bible.html" class="nav-link text-gray-700 hover:text-green-600 transition">Pidgin Bible</a>
                </div>

                <!-- Mobile menu button -->
                <div class="md:hidden">
                    <button id="mobile-menu-btn" class="text-gray-700 p-2">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </div>`;

// Mobile navigation template with Community dropdown
const mobileNav = `        <!-- Mobile Navigation -->
        <div id="mobile-menu" class="hidden md:hidden bg-white border-t">
            <div class="px-2 pt-2 pb-3 space-y-1">
                <a href="index.html" class="block px-3 py-2 text-gray-700 hover:text-green-600">Home</a>
                <a href="translator.html" class="block px-3 py-2 text-gray-700 hover:text-green-600">Translator</a>
                <a href="dictionary.html" class="block px-3 py-2 text-gray-700 hover:text-green-600">Dictionary</a>
                <a href="learning-hub.html" class="block px-3 py-2 text-gray-700 hover:text-green-600">Learning Hub</a>

                <!-- Community Submenu -->
                <div class="mobile-dropdown">
                    <button class="mobile-dropdown-btn w-full text-left px-3 py-2 text-gray-700 hover:text-green-600 flex items-center justify-between">
                        Community
                        <svg class="w-4 h-4 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    <div class="mobile-dropdown-content hidden pl-6 space-y-1">
                        <a href="stories.html" class="block px-3 py-2 text-gray-600 hover:text-green-600">Stories</a>
                        <a href="ask-local.html" class="block px-3 py-2 text-gray-600 hover:text-green-600">Ask a Local</a>
                    </div>
                </div>

                <!-- Pickup Lines Submenu -->
                <div class="mobile-dropdown">
                    <button class="mobile-dropdown-btn w-full text-left px-3 py-2 text-gray-700 hover:text-green-600 flex items-center justify-between">
                        Pickup Lines
                        <svg class="w-4 h-4 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    <div class="mobile-dropdown-content hidden pl-6 space-y-1">
                        <a href="pickup-lines.html" class="block px-3 py-2 text-gray-600 hover:text-green-600">Browse Lines</a>
                        <a href="pickup-line-generator.html" class="block px-3 py-2 text-gray-600 hover:text-green-600">AI Generator</a>
                        <a href="how-to-use-hawaiian-pidgin-pickup-lines.html" class="block px-3 py-2 text-gray-600 hover:text-green-600">How-To Guide</a>
                    </div>
                </div>

                <a href="pidgin-bible.html" class="block px-3 py-2 text-gray-700 hover:text-green-600">Pidgin Bible</a>`;

function updatePage(filePath) {
    const filename = path.basename(filePath);
    console.log(`Processing: ${filename}`);

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Update desktop navigation including mobile menu button
    // Pattern: match from opening <div class="hidden md:flex..."> through the mobile menu button
    const desktopNavPattern = /<div class="hidden md:flex[^>]*>[\s\S]*?<\/div>\s*(?=\s*<\/div>\s*<\/div>\s*(?:<!--\s*Mobile Navigation\s*-->|<div id="mobile-menu"))/;

    if (desktopNavPattern.test(content)) {
        content = content.replace(desktopNavPattern, desktopNav);
        updated = true;
        console.log(`  ✓ Updated desktop navigation`);
    }

    // Update mobile navigation
    // Pattern: match from <!-- Mobile Navigation --> to </nav>
    const mobileNavPattern = /<!--\s*Mobile Navigation\s*-->[\s\S]*?<\/div>\s*<\/div>\s*(?=\s*<\/nav>)/;

    if (mobileNavPattern.test(content)) {
        content = content.replace(mobileNavPattern, mobileNav + '\n            </div>\n        </div>');
        updated = true;
        console.log(`  ✓ Updated mobile navigation`);
    }

    if (updated) {
        fs.writeFileSync(filePath, content);
        console.log(`  ✅ Saved changes\n`);
        return true;
    } else {
        console.log(`  ⊘ No changes needed\n`);
        return false;
    }
}

// Main execution
console.log('🔄 Updating navigation across all pages...\n');

const files = fs.readdirSync(PAGES_DIR)
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(PAGES_DIR, f));

let updatedCount = 0;

files.forEach(file => {
    if (updatePage(file)) {
        updatedCount++;
    }
});

console.log(`\n✅ Complete! Updated ${updatedCount} of ${files.length} pages.`);
