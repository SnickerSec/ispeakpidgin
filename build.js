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
    'js/translator.js': 'js/components/translator.js',
    'js/dictionary.js': 'js/components/dictionary.js',
    'js/dictionary-page.js': 'js/components/dictionary-page.js',
    'js/lessons.js': 'js/components/lessons.js',
    'js/elevenlabs-speech.js': 'js/components/elevenlabs-speech.js',
    'js/speech.js': 'js/components/speech.js',
    'js/ask-local.js': 'js/components/ask-local.js',
    'js/ask-local-page.js': 'js/components/ask-local-page.js',
    'js/main.js': 'js/components/main.js',

    // CSS files
    'css/style.css': 'css/main.css',

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
    const htmlFiles = ['index.html', 'dictionary.html', 'ask-local.html'];

    htmlFiles.forEach(file => {
        const srcPath = path.join('src/pages', file);
        const destPath = path.join('public', file);

        if (fs.existsSync(srcPath)) {
            let content = fs.readFileSync(srcPath, 'utf8');

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
        'src/components/shared'
    ];

    jsSourceDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                if (file.endsWith('.js')) {
                    const srcPath = path.join(dir, file);
                    const destPath = path.join('public/js/components', file);
                    fs.copyFileSync(srcPath, destPath);
                    console.log(`📦 Copied: ${file}`);
                }
            });
        }
    });
}

// Copy data files
function copyDataFiles() {
    const dataFiles = [
        { src: 'data/dictionary/pidgin-dictionary.json', dest: 'public/data/pidgin-dictionary.json' },
        { src: 'data/dictionary/legacy/comprehensive-pidgin-data.js', dest: 'public/js/data/comprehensive-pidgin-data.js' },
        { src: 'data/phrases/phrases-data.js', dest: 'public/js/data/phrases-data.js' },
        { src: 'data/phrases/stories-data.js', dest: 'public/js/data/stories-data.js' }
    ];

    dataFiles.forEach(({ src, dest }) => {
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`📊 Copied data: ${path.basename(dest)}`);
        }
    });
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

        console.log('\n✅ Build completed successfully!');
        console.log('📂 Production files are in the /public directory');

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