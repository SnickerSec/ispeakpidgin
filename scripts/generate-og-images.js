const path = require('path');
const fs = require('fs');
const { generateOgImage } = require('../tools/generators/og-image-generator');

const outputDir = path.join(__dirname, '../public/assets/images');

async function main() {
    try {
        console.log('🖼️ Generating main site OG images...');
        
        // Home Page
        await generateOgImage({
            title: "Hawaiian Pidgin Dictionary",
            subtitle: "The Most Authentic Guide to Island Slang & Culture",
            category: "culture",
            outputDir: outputDir,
            filename: "og-home.webp"
        });
        
        // Translator Page
        await generateOgImage({
            title: "AI Pidgin Translator",
            subtitle: "English to Hawaiian Pidgin powered by AI",
            category: "slang",
            outputDir: outputDir,
            filename: "og-translator.webp"
        });
        
        console.log('\n✨ Main OG Images generated successfully!');
    } catch (err) {
        console.error('❌ Error generating main OG images:', err.message);
    }
}

main();
