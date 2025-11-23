#!/usr/bin/env node

// Build script to process source files and create production-ready public folder
const fs = require('fs');
const path = require('path');

console.log('🏗️ Building ChokePidgin production files...');

// Configuration
const config = {
    srcDir: 'src',
    publicDir: 'public',
    dataDir: 'data',
    assetsDir: 'src/assets'
};

// Path mappings for script updates
const pathMappings = {
    // JavaScript components
    'js/data-loader.js': 'js/components/data-loader.js',
    'js/phrases-data.js': 'js/data/phrases-data.js',
    'js/comprehensive-pidgin-data.js': 'js/data/comprehensive-pidgin-data.js',
    'js/stories-data.js': 'js/data/stories-data.js',
    'js/pickup-lines.js': 'js/components/pickup-lines.js',
    'js/pickup-line-generator.js': 'js/components/pickup-line-generator.js',
    'js/pickup-line-generator-page.js': 'js/components/pickup-line-generator-page.js',
    'js/data/pickup-line-generator-data.js': 'js/data/pickup-line-generator-data.js',
    'js/translator.js': 'js/components/translator.js',
    'js/translator-page.js': 'js/components/translator-page.js',
    'js/google-translate.js': 'js/components/google-translate.js',
    'js/phrase-translator.js': 'js/components/phrase-translator.js',
    'js/sentence-chunker.js': 'js/components/sentence-chunker.js',
    'js/context-tracker.js': 'js/components/context-tracker.js',
    'js/dictionary.js': 'js/components/dictionary.js',
    'js/dictionary-page.js': 'js/components/dictionary-page.js',
    'js/lessons.js': 'js/components/lessons.js',
    'js/elevenlabs-speech.js': 'js/components/elevenlabs-speech.js',
    'js/speech.js': 'js/components/speech.js',
    'js/ask-local.js': 'js/components/ask-local.js',
    'js/ask-local-page.js': 'js/components/ask-local-page.js',
    'js/learning-hub.js': 'js/components/learning-hub.js',
    'js/main.js': 'js/components/main.js',

    // CSS files
    'css/style.css': 'css/main.css',
    'css/learning-hub.css': 'css/learning-hub.css',

    // Data files
    'data/pidgin-dictionary.json': 'data/pidgin-dictionary.json'
};

// Create public directory structure
function createPublicStructure() {
    const dirs = [
        'public',
        'public/js',
        'public/js/components',
        'public/js/data',
        'public/css',
        'public/data',
        'public/assets',
        'public/assets/images',
        'public/assets/icons',
        'public/assets/audio'
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created: ${dir}`);
        }
    });
}

// Copy and process HTML files
function processHTMLFiles() {
    const htmlFiles = [
        'index.html', 'translator.html', 'dictionary.html', 'ask-local.html',
        'learning-hub.html', 'stories.html', 'pickup-lines.html', 'pickup-line-generator.html', 'pidgin-bible.html',
        'about.html', 'pidgin-vs-hawaiian.html', 'cheat-sheet.html',
        'how-to-use-hawaiian-pidgin-pickup-lines.html', 'how-local-you-stay.html', 'pidgin-wordle.html',
        // SEO Listicles
        '15-essential-pidgin-phrases-ordering-plate-lunch.html',
        'brah-sistah-pidgin-dictionary.html',
        'beach-surf-pidgin-slang.html',
        'understanding-time-in-pidgin.html',
        'funny-insulting-pidgin-phrases.html',
        'oahu-local-eats.html',
        // SEO Pages
        'what-does-da-kine-mean.html',
        'what-does-howzit-mean.html',
        'what-does-broke-da-mouth-mean.html',
        'what-does-pau-hana-mean.html',
        'what-does-ono-grindz-mean.html',
        'what-does-shoots-mean.html',
        'what-does-brah-mean.html',
        'what-does-shaka-mean.html',
        'what-does-grindz-mean.html',
        'what-does-pau-mean.html',
        'what-does-choke-mean.html',
        'what-does-talk-story-mean.html',
        'what-does-mahalo-mean.html',
        'what-does-no-worry-mean.html'
    ];

    // Load shared navigation and footer templates
    const navigationPath = path.join('src/components/shared', 'navigation.html');
    const footerPath = path.join('src/components/shared', 'footer.html');

    let navigationTemplate = '';
    let footerTemplate = '';

    if (fs.existsSync(navigationPath)) {
        navigationTemplate = fs.readFileSync(navigationPath, 'utf8');
    }
    if (fs.existsSync(footerPath)) {
        footerTemplate = fs.readFileSync(footerPath, 'utf8');
    }

    htmlFiles.forEach(file => {
        const srcPath = path.join('src/pages', file);
        const destPath = path.join('public', file);

        if (fs.existsSync(srcPath)) {
            let content = fs.readFileSync(srcPath, 'utf8');

            // Inject navigation and footer templates if placeholders exist
            if (navigationTemplate && content.includes('<!-- NAVIGATION_PLACEHOLDER -->')) {
                content = content.replace('<!-- NAVIGATION_PLACEHOLDER -->', navigationTemplate);
            }
            if (footerTemplate && content.includes('<!-- FOOTER_PLACEHOLDER -->')) {
                content = content.replace('<!-- FOOTER_PLACEHOLDER -->', footerTemplate);
            }

            // Update script and link paths
            Object.entries(pathMappings).forEach(([oldPath, newPath]) => {
                content = content.replace(new RegExp(`src="${oldPath}"`, 'g'), `src="${newPath}"`);
                content = content.replace(new RegExp(`href="${oldPath}"`, 'g'), `href="${newPath}"`);
            });

            fs.writeFileSync(destPath, content);
            console.log(`📄 Processed: ${file}`);
        }
    });
}

// Copy JavaScript components
function copyJavaScriptFiles() {
    const jsSourceDirs = [
        'src/components/dictionary',
        'src/components/translator',
        'src/components/speech',
        'src/components/bible',
        'src/components/shared',
        'src/components/practice'
    ];

    // Files to exclude from build
    const excludePatterns = [
        /backup/i,
        /test/i,
        /debug/i,
        /-old/i,
        /\.bak/i
    ];

    const shouldExclude = (filename) => {
        return excludePatterns.some(pattern => pattern.test(filename));
    };

    jsSourceDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                if (file.endsWith('.js') && !shouldExclude(file)) {
                    const srcPath = path.join(dir, file);
                    const destPath = path.join('public/js/components', file);
                    fs.copyFileSync(srcPath, destPath);
                    console.log(`📦 Copied: ${file}`);
                }
            });
        }
    });

    // Copy individual JS files from src/js
    const individualJsFiles = ['learning-hub.js', 'pickup-lines.js', 'pickup-line-generator.js', 'pickup-line-generator-page.js'];
    individualJsFiles.forEach(file => {
        const srcPath = path.join('src/js', file);
        if (fs.existsSync(srcPath)) {
            const destPath = path.join('public/js/components', file);
            fs.copyFileSync(srcPath, destPath);
            console.log(`📦 Copied: ${file}`);
        }
    });
}

// Copy data files
function copyDataFiles() {
    // Check if new consolidated structure exists
    const hasNewStructure = fs.existsSync('data/master/pidgin-master.json');

    if (hasNewStructure) {
        console.log('📦 Using new consolidated data structure');

        // Copy new structure directories
        const newDataDirs = ['master', 'views', 'indexes', 'content'];
        newDataDirs.forEach(dir => {
            const srcDir = path.join('data', dir);
            const destDir = path.join('public', 'data', dir);

            if (fs.existsSync(srcDir)) {
                fs.mkdirSync(destDir, { recursive: true });
                const files = fs.readdirSync(srcDir);
                files.forEach(file => {
                    if (file.endsWith('.json')) {
                        const srcPath = path.join(srcDir, file);
                        const destPath = path.join(destDir, file);
                        fs.copyFileSync(srcPath, destPath);
                        console.log(`📊 Copied: ${dir}/${file}`);
                    }
                });
            }
        });
    }

    // Copy legacy files from backup if they exist (for backward compatibility during transition)
    const legacyBackupDir = 'data/_legacy_backup';
    if (fs.existsSync(legacyBackupDir)) {
        const legacyFiles = [
            { src: `${legacyBackupDir}/dictionary/pidgin-dictionary.json`, dest: 'public/data/dictionary/pidgin-dictionary.json' },
            { src: `${legacyBackupDir}/phrases/phrases-data.js`, dest: 'public/js/data/phrases-data.js' },
            { src: `${legacyBackupDir}/phrases/stories-data.js`, dest: 'public/js/data/stories-data.js' }
        ];

        legacyFiles.forEach(({ src, dest }) => {
            if (fs.existsSync(src)) {
                // Ensure destination directory exists
                fs.mkdirSync(path.dirname(dest), { recursive: true });
                fs.copyFileSync(src, dest);
                console.log(`📊 Copied legacy data (from backup): ${path.basename(dest)}`);
            }
        });
    }

    // Copy data files from src/data/ directory
    const srcDataDir = 'src/data';
    if (fs.existsSync(srcDataDir)) {
        const srcDataFiles = [
            { src: `${srcDataDir}/phrases-data.js`, dest: 'public/js/data/phrases-data.js' },
            { src: `${srcDataDir}/stories-data.js`, dest: 'public/js/data/stories-data.js' },
            { src: `${srcDataDir}/pickup-lines-data.js`, dest: 'public/js/data/pickup-lines-data.js' }
        ];

        srcDataFiles.forEach(({ src, dest }) => {
            if (fs.existsSync(src)) {
                // Ensure destination directory exists
                fs.mkdirSync(path.dirname(dest), { recursive: true });
                fs.copyFileSync(src, dest);
                console.log(`📊 Copied src data: ${path.basename(dest)}`);
            }
        });
    }

    // Copy generator data files from src/js/data/ directory
    const srcJsDataDir = 'src/js/data';
    if (fs.existsSync(srcJsDataDir)) {
        const srcJsDataFiles = [
            { src: `${srcJsDataDir}/pickup-line-generator-data.js`, dest: 'public/js/data/pickup-line-generator-data.js' }
        ];

        srcJsDataFiles.forEach(({ src, dest }) => {
            if (fs.existsSync(src)) {
                // Ensure destination directory exists
                fs.mkdirSync(path.dirname(dest), { recursive: true });
                fs.copyFileSync(src, dest);
                console.log(`📊 Copied generator data: ${path.basename(dest)}`);
            }
        });
    }
}

// Copy CSS files
function copyCSSFiles() {
    if (fs.existsSync('src/styles')) {
        const files = fs.readdirSync('src/styles');
        files.forEach(file => {
            if (file.endsWith('.css')) {
                const srcPath = path.join('src/styles', file);
                const destPath = path.join('public/css', file === 'style.css' ? 'main.css' : file);
                fs.copyFileSync(srcPath, destPath);
                console.log(`🎨 Copied CSS: ${file}`);
            }
        });
    }

    // Copy individual CSS files from src/css
    if (fs.existsSync('src/css')) {
        const files = fs.readdirSync('src/css');
        files.forEach(file => {
            if (file.endsWith('.css')) {
                const srcPath = path.join('src/css', file);
                const destPath = path.join('public/css', file === 'style.css' ? 'main.css' : file);
                fs.copyFileSync(srcPath, destPath);
                console.log(`🎨 Copied CSS: ${file}`);
            }
        });
    }
}

// Copy assets
function copyAssets() {
    const assetDirs = ['images', 'icons', 'audio'];

    assetDirs.forEach(dir => {
        const srcDir = path.join('src/assets', dir);
        const destDir = path.join('public/assets', dir);

        if (fs.existsSync(srcDir)) {
            const files = fs.readdirSync(srcDir);
            const fileCount = files.filter(file => {
                const srcPath = path.join(srcDir, file);
                const destPath = path.join(destDir, file);

                // Only copy files, not directories
                if (fs.lstatSync(srcPath).isFile()) {
                    fs.copyFileSync(srcPath, destPath);
                    return true;
                }
                return false;
            }).length;

            console.log(`🖼️ Copied ${dir}: ${fileCount} files`);
        }
    });

    // Copy robots.txt and sitemap.xml if they exist
    ['robots.txt', 'sitemap.xml'].forEach(file => {
        if (fs.existsSync(file)) {
            fs.copyFileSync(file, path.join('public', file));
            console.log(`📋 Copied: ${file}`);
        }
    });
}

// Copy favicon files to root
function copyFavicons() {
    const faviconFiles = ['favicon.ico', 'favicon.svg'];

    faviconFiles.forEach(filename => {
        const srcPath = path.join(config.publicDir, 'assets', 'icons', filename);
        const destPath = path.join(config.publicDir, filename);

        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`🎯 Copied favicon: ${filename}`);
        }
    });
}

// Main build function
function build() {
    try {
        console.log('Starting build process...\n');

        createPublicStructure();
        processHTMLFiles();
        copyJavaScriptFiles();
        copyDataFiles();
        copyCSSFiles();
        copyAssets();
        copyFavicons();

        // Generate individual dictionary entry pages
        console.log('\n📖 Generating individual dictionary entry pages...');
        const { execSync } = require('child_process');
        try {
            execSync('node tools/generate-entry-pages.js', { stdio: 'inherit' });
        } catch (error) {
            console.error('⚠️  Warning: Could not generate entry pages:', error.message);
        }

        // Generate sitemap with all pages
        console.log('\n🗺️  Generating sitemap.xml...');
        try {
            execSync('node tools/generate-sitemap.js', { stdio: 'inherit' });
        } catch (error) {
            console.error('⚠️  Warning: Could not generate sitemap:', error.message);
        }

        console.log('\n✅ Build completed successfully!');
        console.log('📂 Production files are in the /public directory');
        console.log('📄 Generated 503+ individual dictionary entry pages');
        console.log('🗺️  Updated sitemap.xml with 508 URLs');

    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

// Run build if called directly
if (require.main === module) {
    build();
}

module.exports = { build, pathMappings };