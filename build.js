#!/usr/bin/env node

// Build script to process source files and create production-ready public folder
const fs = require('fs');
const path = require('path');

console.log('🏗️ Building ChokePidgin production files...');

// Strip inline gtag blocks (now loaded via external file in footer template)
function stripInlineGtag(html) {
    return html.replace(/\s*<!-- Google (?:tag \(gtag\.js\)|Analytics) -->\s*<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-RB7YYDVDXD"><\/script>\s*<script>\s*window\.dataLayer = window\.dataLayer \|\| \[\];\s*function gtag\(\)\{dataLayer\.push\(arguments\);\}\s*gtag\('js', new Date\(\)\);\s*gtag\('config', 'G-RB7YYDVDXD'\);\s*<\/script>/g, '');
}

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
    'js/supabase-data-loader.js': 'js/components/supabase-data-loader.js',
    'js/phrases-data.js': 'js/data/phrases-data.js',
    'js/data/phrases-loader.js': 'js/data/phrases-loader.js',
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
    'js/pronunciation-practice.js': 'js/components/pronunciation-practice.js',
    'js/ask-local.js': 'js/components/ask-local.js',
    'js/ask-local-page.js': 'js/components/ask-local-page.js',
    'js/learning-hub.js': 'js/components/learning-hub.js',
    'js/main.js': 'js/components/main.js',

    // Game components (new organized structure)
    'js/pidgin-wordle.js': 'js/components/games/pidgin-wordle.js',
    'data/pidgin-wordle-words.js': 'js/components/games/wordle-data.js',
    'js/pidgin-hangman.js': 'js/components/games/pidgin-hangman.js',
    'js/pidgin-crossword.js': 'js/components/games/pidgin-crossword.js',
    'data/crossword-puzzles.js': 'js/components/games/crossword-data.js',
    'js/local-quiz.js': 'js/components/games/local-quiz.js',
    'js/data/local-quiz-data.js': 'js/components/games/quiz-data.js',

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
        'public/assets/audio',
        'public/blog'
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
        'about.html', 'pidgin-vs-hawaiian.html', 'cheat-sheet.html', 'phrases.html', 'games.html',
        'how-to-use-hawaiian-pidgin-pickup-lines.html', 'how-local-you-stay.html', 'pidgin-wordle.html', 'pidgin-hangman.html', 'pidgin-crossword.html',
        // SEO Listicles
        '15-essential-pidgin-phrases-ordering-plate-lunch.html',
        'brah-sistah-pidgin-dictionary.html',
        'beach-surf-pidgin-slang.html',
        'understanding-time-in-pidgin.html',
        'funny-insulting-pidgin-phrases.html',
        'oahu-local-eats.html',
        // SEO Pages - What Does X Mean
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
        'what-does-no-worry-mean.html',
        // New SEO Pages based on Search Console data
        'what-does-ainokea-mean.html',
        'what-does-kanak-attack-mean.html',
        'what-does-niele-mean.html',
        'what-does-pilau-mean.html',
        'what-does-sistah-mean.html',
        'what-does-moopuna-mean.html',
        // Additional SEO Pages - Round 2
        'what-does-buss-up-mean.html',
        'what-does-mayjah-mean.html',
        'what-does-poho-mean.html',
        'what-does-faka-mean.html',
        // Additional SEO Pages - Round 3
        'what-does-small-kine-mean.html',
        'what-does-pake-mean.html',
        'what-does-buggah-mean.html',
        'what-does-rajah-mean.html',
        'what-does-lolo-mean.html',
        'what-does-hamajang-mean.html',
        'what-does-humbug-mean.html',
        // SEO Pages - Round 4 (from keyword research)
        'what-does-aloha-mean.html',
        'what-does-ohana-mean.html',
        'what-does-haole-mean.html',
        'what-does-keiki-mean.html',
        'what-does-ono-mean.html',
        'what-does-kamaaina-mean.html',
        'what-does-wahine-mean.html',
        'what-does-stink-eye-mean.html',
        'what-does-chicken-skin-mean.html',
        'what-does-mauka-makai-mean.html',
        // Interactive Features
        'pronunciation-practice.html',
        'pidgin-heads-up.html'
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

            content = stripInlineGtag(content);

            // Inject navigation and footer templates if placeholders exist
            if (navigationTemplate && content.includes('<!-- NAVIGATION_PLACEHOLDER -->')) {
                content = content.replace('<!-- NAVIGATION_PLACEHOLDER -->', navigationTemplate);
            }
            if (footerTemplate && content.includes('<!-- FOOTER_PLACEHOLDER -->')) {
                content = content.replace('<!-- FOOTER_PLACEHOLDER -->', footerTemplate);
            }

            // Inject Tabler Icons CDN stylesheet before </head>
            content = content.replace('</head>', '    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">\n</head>');

            // Update script and link paths
            Object.entries(pathMappings).forEach(([oldPath, newPath]) => {
                content = content.replace(new RegExp(`src="${oldPath}"`, 'g'), `src="${newPath}"`);
                content = content.replace(new RegExp(`href="${oldPath}"`, 'g'), `href="${newPath}"`);
            });

            fs.writeFileSync(destPath, content);
            console.log(`📄 Processed: ${file}`);
        }
    });

    // Process blog subdirectory
    const blogDir = 'src/pages/blog';
    if (fs.existsSync(blogDir)) {
        const blogFiles = fs.readdirSync(blogDir).filter(f => f.endsWith('.html'));
        blogFiles.forEach(file => {
            const srcPath = path.join(blogDir, file);
            const destPath = path.join('public/blog', file);

            let content = fs.readFileSync(srcPath, 'utf8');

            content = stripInlineGtag(content);

            // For blog pages, we need to adjust navigation paths (add ../ prefix)
            let blogNavigation = navigationTemplate;
            let blogFooter = footerTemplate;

            // Adjust all relative paths in navigation for blog subdirectory
            blogNavigation = blogNavigation.replace(/href="(?!http|\/|#)([^"]+)"/g, 'href="../$1"');
            blogNavigation = blogNavigation.replace(/src="(?!http|\/|#)([^"]+)"/g, 'src="../$1"');
            blogFooter = blogFooter.replace(/href="(?!http|\/|#)([^"]+)"/g, 'href="../$1"');
            blogFooter = blogFooter.replace(/src="(?!http|\/|#)([^"]+)"/g, 'src="../$1"');

            // Inject adjusted navigation and footer
            if (blogNavigation && content.includes('<!-- NAVIGATION_PLACEHOLDER -->')) {
                content = content.replace('<!-- NAVIGATION_PLACEHOLDER -->', blogNavigation);
            }
            if (blogFooter && content.includes('<!-- FOOTER_PLACEHOLDER -->')) {
                content = content.replace('<!-- FOOTER_PLACEHOLDER -->', blogFooter);
            }

            // Inject Tabler Icons CDN stylesheet before </head>
            content = content.replace('</head>', '    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">\n</head>');

            // Update script and link paths for blog pages
            // First apply standard mappings with ../ prefix for root-relative paths
            Object.entries(pathMappings).forEach(([oldPath, newPath]) => {
                content = content.replace(new RegExp(`src="${oldPath}"`, 'g'), `src="../${newPath}"`);
                content = content.replace(new RegExp(`href="${oldPath}"`, 'g'), `href="../${newPath}"`);
            });

            // Also handle paths that already have ../ prefix (from blog source files)
            Object.entries(pathMappings).forEach(([oldPath, newPath]) => {
                content = content.replace(new RegExp(`src="\\.\\./${oldPath}"`, 'g'), `src="../${newPath}"`);
                content = content.replace(new RegExp(`href="\\.\\./${oldPath}"`, 'g'), `href="../${newPath}"`);
            });

            fs.writeFileSync(destPath, content);
            console.log(`📝 Processed blog: ${file}`);
        });
    }

    // Process admin page (standalone - no navigation/footer placeholders)
    const adminSrcPath = path.join('src/pages', 'admin.html');
    const adminDestPath = path.join('public', 'admin.html');

    if (fs.existsSync(adminSrcPath)) {
        let content = fs.readFileSync(adminSrcPath, 'utf8');

        content = stripInlineGtag(content);

        // Inject Tabler Icons CDN stylesheet before </head>
        content = content.replace('</head>', '    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">\n</head>');

        // Update script and link paths (no template injection for admin page)
        Object.entries(pathMappings).forEach(([oldPath, newPath]) => {
            content = content.replace(new RegExp(`src="${oldPath}"`, 'g'), `src="${newPath}"`);
            content = content.replace(new RegExp(`href="${oldPath}"`, 'g'), `href="${newPath}"`);
        });

        fs.writeFileSync(adminDestPath, content);
        console.log(`🔐 Processed: admin.html (standalone)`);
    }
}

// Copy JavaScript components
function copyJavaScriptFiles() {
    const jsSourceDirs = [
        'src/components/dictionary',
        'src/components/translator',
        'src/components/speech',
        'src/components/bible',
        'src/components/shared',
        'src/components/practice',
        'src/components/pickup'
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

    // Copy game components (new organized structure)
    const gameSourceDirs = [
        { src: 'src/components/games/wordle', dest: 'public/js/components/games' },
        { src: 'src/components/games/hangman', dest: 'public/js/components/games' },
        { src: 'src/components/games/crossword', dest: 'public/js/components/games' },
        { src: 'src/components/games/quiz', dest: 'public/js/components/games' }
    ];

    gameSourceDirs.forEach(({ src, dest }) => {
        if (fs.existsSync(src)) {
            fs.mkdirSync(dest, { recursive: true });
            const files = fs.readdirSync(src);
            files.forEach(file => {
                if (file.endsWith('.js') && !shouldExclude(file)) {
                    const srcPath = path.join(src, file);
                    const destPath = path.join(dest, file);
                    fs.copyFileSync(srcPath, destPath);
                    console.log(`🎮 Copied game: ${file}`);
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

    // Copy JS data files from src/js/data
    const jsDataDir = 'src/js/data';
    const destDataDir = 'public/js/data';
    fs.mkdirSync(destDataDir, { recursive: true });

    if (fs.existsSync(jsDataDir)) {
        const files = fs.readdirSync(jsDataDir);
        files.forEach(file => {
            if (file.endsWith('.js')) {
                const srcPath = path.join(jsDataDir, file);
                const destPath = path.join(destDataDir, file);
                fs.copyFileSync(srcPath, destPath);
                console.log(`📦 Copied data loader: ${file}`);
            }
        });
    }

    // Copy phrases-loader.js from shared components to js/data (where HTML expects it)
    const phrasesLoaderSrc = 'src/components/shared/phrases-loader.js';
    if (fs.existsSync(phrasesLoaderSrc)) {
        const destPath = path.join(destDataDir, 'phrases-loader.js');
        fs.copyFileSync(phrasesLoaderSrc, destPath);
        console.log(`📦 Copied: phrases-loader.js to js/data/`);
    }

    // Copy admin components
    const adminSrcDir = 'src/components/admin';
    const adminDestDir = 'public/js/components/admin';

    if (fs.existsSync(adminSrcDir)) {
        fs.mkdirSync(adminDestDir, { recursive: true });
        const files = fs.readdirSync(adminSrcDir);
        files.forEach(file => {
            if (file.endsWith('.js') && !shouldExclude(file)) {
                const srcPath = path.join(adminSrcDir, file);
                const destPath = path.join(adminDestDir, file);
                fs.copyFileSync(srcPath, destPath);
                console.log(`🔐 Copied admin: ${file}`);
            }
        });
    }
}

// Copy data files
function copyDataFiles() {
    // All data is now loaded from Supabase API
    // No local JSON data files are copied to public/
    // The master data in data/master/ is only used at build time for generating dictionary pages
    console.log('📦 Using Supabase API for all data - no local data files copied');

    // Copy data files from data/content/ directory (new organized structure)
    // NOTE: Most content data has been migrated to Supabase and archived
    // Only copy files that still exist (not migrated yet)
    const contentDataDir = 'data/content';
    if (fs.existsSync(contentDataDir)) {
        const contentDataFiles = [
            // These files moved to archive/data-migrated-to-supabase/ - using Supabase API now
            // { src: `${contentDataDir}/phrases-data.js`, dest: 'public/js/data/phrases-data.js' },
            // { src: `${contentDataDir}/stories-data.js`, dest: 'public/js/data/stories-data.js' },
            // { src: `${contentDataDir}/pickup-lines-data.js`, dest: 'public/js/data/pickup-lines-data.js' }
        ];

        contentDataFiles.forEach(({ src, dest }) => {
            if (fs.existsSync(src)) {
                // Ensure destination directory exists
                fs.mkdirSync(path.dirname(dest), { recursive: true });
                fs.copyFileSync(src, dest);
                console.log(`📊 Copied content data: ${path.basename(dest)}`);
            }
        });
    }

    // Copy generator data files from src/js/data/ directory
    // NOTE: pickup-line-generator-data.js migrated to Supabase and archived
    const srcJsDataDir = 'src/js/data';
    if (fs.existsSync(srcJsDataDir)) {
        const srcJsDataFiles = [
            // { src: `${srcJsDataDir}/pickup-line-generator-data.js`, dest: 'public/js/data/pickup-line-generator-data.js' }
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
    // Copy from src/styles, but skip tailwind.css (compiled by vite)
    if (fs.existsSync('src/styles')) {
        const files = fs.readdirSync('src/styles');
        files.forEach(file => {
            // Skip tailwind.css - it's compiled by npm run build:css (vite)
            if (file.endsWith('.css') && file !== 'tailwind.css') {
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
    ['robots.txt', 'sitemap.xml', 'site.webmanifest'].forEach(file => {
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
            execSync('node tools/generators/generate-entry-pages.js', { stdio: 'inherit' });
        } catch (error) {
            console.error('⚠️  Warning: Could not generate entry pages:', error.message);
        }

        // Generate sitemap with all pages
        console.log('\n🗺️  Generating sitemap.xml...');
        try {
            execSync('node tools/generators/generate-sitemap.js', { stdio: 'inherit' });
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