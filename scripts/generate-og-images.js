const path = require('path');
const fs = require('fs');
const { generateOgImage } = require('../tools/generators/og-image-generator');

const publicOutputDir = path.join(__dirname, '../public/assets/images');
const srcOutputDir = path.join(__dirname, '../src/assets/images');

const ogImagesToGenerate = [
    {
        title: "Hawaiian Pidgin Dictionary",
        subtitle: "The Most Authentic Guide to Island Slang & Culture",
        category: "culture",
        filenames: ["og-home.webp", "og-home.png"]
    },
    {
        title: "AI Pidgin Translator",
        subtitle: "English to Hawaiian Pidgin powered by Google Gemini",
        category: "slang",
        filenames: ["og-translator.webp", "og-translator.png"]
    },
    {
        title: "Hawaiian Pidgin Dictionary",
        subtitle: "700+ Island Words, Meanings, and Audio Pronunciations",
        category: "culture",
        filenames: ["og-dictionary.webp", "og-dictionary.png"]
    },
    {
        title: "Pidgin vs Hawaiian",
        subtitle: "The Crucial Differences Explained for Visitors & Locals",
        category: "culture",
        filenames: ["og-comparison.png", "og-comparison.webp"]
    },
    {
        title: "Hawaiian Pidgin Bible",
        subtitle: "Da Jesus Book - Read & Listen to Scripture in Pidgin",
        category: "culture",
        filenames: ["og-bible.png", "og-bible.webp"]
    },
    {
        title: "Pidgin vs Singlish",
        subtitle: "Two Famous Creoles: Hawaii vs Singapore Compared",
        category: "slang",
        filenames: ["og-singlish.png", "og-singlish.webp"]
    },
    {
        title: "About ChokePidgin",
        subtitle: "Preserving and Celebrating Hawaiian Creole English",
        category: "general",
        filenames: ["og-about.png", "og-about.webp"]
    },
    {
        title: "Hawaii Local Food Guide",
        subtitle: "Essential Food Slang, Plate Lunch, and Island Grindz",
        category: "food",
        filenames: ["og-food-guide.png", "og-food-guide.webp", "oahu-food-guide.jpg", "plate-lunch-guide.png"]
    },
    {
        title: "Hawaiian Surf Slang Guide",
        subtitle: "Surf Terminology, Wave Slang, and Lineup Etiquette",
        category: "nature",
        filenames: ["og-surf-guide.png", "og-surf-guide.webp", "beach-surf-guide.jpg"]
    },
    {
        title: "Pidgin Cheat Sheet",
        subtitle: "Quick Reference Guide to Everyday Hawaiian Slang",
        category: "slang",
        filenames: ["pidgin-cheat-sheet-og.png", "pidgin-cheat-sheet-og.webp"]
    },
    {
        title: "Pidgin Pickup Lines",
        subtitle: "Funny & Smooth Local Hawaiian Lines with Audio",
        category: "action",
        filenames: ["pickup-lines-guide.png", "pickup-lines-guide.webp"]
    },
    {
        title: "Funny Pidgin Phrases",
        subtitle: "Hilarious Insults and Local Comebacks Explained",
        category: "slang",
        filenames: ["funny-phrases-guide.jpg", "funny-phrases-guide.webp"]
    },
    {
        title: "Brah & Sistah Dictionary",
        subtitle: "The Ultimate Guide to Local Relationships & Terms",
        category: "greeting",
        filenames: ["brah-sistah-guide.jpg", "brah-sistah-guide.webp"]
    },
    {
        title: "Understanding Time in Pidgin",
        subtitle: "Hawaiian Time, Bumbai, and Island Pacing",
        category: "general",
        filenames: ["time-guide.jpg", "time-guide.webp"]
    },
    {
        title: "What Does 'Da Kine' Mean?",
        subtitle: "The Meaning, Origin, and Universal Usage of Da Kine",
        category: "culture",
        filenames: ["og-da-kine.png", "og-da-kine.webp"]
    }
];

async function main() {
    try {
        console.log('🖼️ Generating main site OG images...');
        
        for (const item of ogImagesToGenerate) {
            for (const filename of item.filenames) {
                // Generate into public
                await generateOgImage({
                    title: item.title,
                    subtitle: item.subtitle,
                    category: item.category,
                    outputDir: publicOutputDir,
                    filename
                });
                // Also mirror to src/assets/images
                await generateOgImage({
                    title: item.title,
                    subtitle: item.subtitle,
                    category: item.category,
                    outputDir: srcOutputDir,
                    filename
                });
            }
        }
        
        console.log('✨ Main OG Images generated successfully!');
    } catch (err) {
        console.error('❌ Error generating main OG images:', err.message);
    }
}

main();
