#!/usr/bin/env node

// Add dropdown initialization scripts to pages without main.js

const fs = require('fs');
const path = require('path');

const PAGES_DIR = 'src/pages';

// Pages that have dropdowns but don't use main.js
const targetPages = [
    'about.html',
    'cheat-sheet.html',
    'learning-hub.html',
    'pickup-line-generator.html',
    'pickup-lines.html',
    'pidgin-bible.html',
    'stories.html'
];

// Dropdown initialization script
const dropdownScript = `
    <script>
        // Desktop dropdown functionality
        document.addEventListener('DOMContentLoaded', function() {
            const desktopDropdowns = document.querySelectorAll('.nav-dropdown');

            desktopDropdowns.forEach(dropdown => {
                const button = dropdown.querySelector('button');
                const menu = dropdown.querySelector('.dropdown-menu');

                if (button && menu) {
                    // Toggle on click
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        // Close other dropdowns
                        desktopDropdowns.forEach(other => {
                            if (other !== dropdown) {
                                const otherMenu = other.querySelector('.dropdown-menu');
                                if (otherMenu) {
                                    otherMenu.classList.remove('show');
                                }
                            }
                        });

                        // Toggle this dropdown
                        menu.classList.toggle('show');
                    });
                }
            });

            // Close dropdowns when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.nav-dropdown')) {
                    desktopDropdowns.forEach(dropdown => {
                        const menu = dropdown.querySelector('.dropdown-menu');
                        if (menu) {
                            menu.classList.remove('show');
                        }
                    });
                }
            });

            // Mobile menu and dropdown functionality
            const mobileMenuBtn = document.getElementById('mobile-menu-btn');
            const mobileMenu = document.getElementById('mobile-menu');

            if (mobileMenuBtn && mobileMenu) {
                mobileMenuBtn.addEventListener('click', () => {
                    mobileMenu.classList.toggle('hidden');
                });

                // Mobile dropdown functionality
                mobileMenu.addEventListener('click', (e) => {
                    const btn = e.target.closest('.mobile-dropdown-btn');
                    if (btn) {
                        e.preventDefault();
                        e.stopPropagation();

                        const dropdown = btn.closest('.mobile-dropdown');
                        const content = dropdown.querySelector('.mobile-dropdown-content');
                        const icon = btn.querySelector('svg');

                        content.classList.toggle('hidden');
                        if (icon) icon.classList.toggle('rotate-180');
                    }
                });
            }
        });
    </script>`;

function updatePage(filePath) {
    const filename = path.basename(filePath);
    console.log(`\nProcessing: ${filename}`);

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if script already exists
    if (content.includes('Desktop dropdown functionality')) {
        console.log('  ✓ Dropdown script already exists');
        return false;
    }

    // Add script before closing </body> tag
    if (content.includes('</body>')) {
        content = content.replace('</body>', `${dropdownScript}\n</body>`);
        fs.writeFileSync(filePath, content);
        console.log('  ✅ Added dropdown initialization script');
        return true;
    } else {
        console.log('  ⚠️  Could not find </body> tag');
        return false;
    }
}

// Main execution
console.log('🎯 Adding dropdown scripts to pages without main.js...\n');

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

console.log(`\n✅ Complete! Added scripts to ${updatedCount} of ${targetPages.length} pages.`);
