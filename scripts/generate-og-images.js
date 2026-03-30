const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../public/assets/images');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function createOGImage(title, subtitle, filename) {
    console.log(`Generating ${filename}...`);
    
    const width = 1200;
    const height = 630;
    
    // Very simple SVG to avoid parsing errors
    const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#667eea" />
        
        <circle cx="1100" cy="100" r="150" fill="#ffffff" opacity="0.1" />
        <circle cx="100" cy="500" r="100" fill="#ffffff" opacity="0.1" />
        
        <text x="60" y="80" font-family="sans-serif" font-size="40" font-weight="bold" fill="#ffffff">ChokePidgin.com</text>
        
        <text x="600" y="300" font-family="sans-serif" font-size="80" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
        
        <text x="600" y="400" font-family="sans-serif" font-size="40" fill="#ffffff" text-anchor="middle">${subtitle}</text>
        
        <rect x="0" y="580" width="1200" height="50" fill="#000000" opacity="0.2" />
        <text x="600" y="615" font-family="sans-serif" font-size="24" fill="#ffffff" text-anchor="middle">Learn Hawaiian Pidgin - Authentic Local Slang and Culture</text>
    </svg>
    `;

    try {
        await sharp(Buffer.from(svg))
            .png()
            .toFile(path.join(outputDir, filename));
        console.log(`✅ Saved ${filename}`);
    } catch (e) {
        console.error(`Error saving ${filename}:`, e.message);
        throw e;
    }
}

async function main() {
    try {
        await createOGImage(
            "Hawaiian Pidgin Dictionary", 
            "660 plus Local Words and Phrases", 
            "og-home.png"
        );
        
        await createOGImage(
            "AI Pidgin Translator", 
            "English to Hawaiian Pidgin", 
            "og-translator.png"
        );
        
        console.log('\n✨ OG Images generated successfully!');
    } catch (err) {
        console.error('❌ Final Error:', err.message);
    }
}

main();
