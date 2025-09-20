#!/usr/bin/env node

// Migration script to convert legacy data to enhanced JSON format
const fs = require('fs');
const path = require('path');

console.log('🌺 Starting Hawaiian Pidgin Data Migration...');

// Read the legacy data file
const legacyDataPath = path.join(__dirname, 'js/comprehensive-pidgin-data.js');
const legacyData = fs.readFileSync(legacyDataPath, 'utf8');

// Extract the data object using eval (safe since it's our own data)
let comprehensivePidginData;
try {
    // Create a safe execution context
    const script = legacyData.replace('if (typeof module !== \'undefined\' && module.exports)', 'if (false)');
    eval(script);

    if (!comprehensivePidginData) {
        // Try alternative parsing
        const dataMatch = script.match(/const comprehensivePidginData = ({[\s\S]*?});/);
        if (dataMatch) {
            eval('comprehensivePidginData = ' + dataMatch[1]);
        }
    }
} catch (error) {
    console.error('Error evaluating legacy data:', error.message);
}

if (!comprehensivePidginData) {
    console.error('❌ Failed to load legacy data');
    process.exit(1);
}

console.log(`📊 Found ${Object.keys(comprehensivePidginData).length} raw entries`);

// Migration logic
function migrateData(legacyData) {
    const entries = [];
    const seenPidgin = new Map(); // Track duplicates
    let idCounter = 1;
    let duplicatesCount = 0;

    // Categories mapping
    const categories = {
        greetings: { name: "Greetings", description: "Ways to say hello and greet people", icon: "🙋‍♂️" },
        food: { name: "Food & Eating", description: "Food, eating, and dining terms", icon: "🍽️" },
        expressions: { name: "Expressions", description: "Common expressions and phrases", icon: "💬" },
        slang: { name: "Slang", description: "Casual and street language", icon: "🤙" },
        emotions: { name: "Emotions", description: "Feelings and emotional expressions", icon: "😊" },
        actions: { name: "Actions", description: "Verbs and action words", icon: "⚡" },
        directions: { name: "Directions", description: "Location and direction terms", icon: "🧭" },
        nature: { name: "Nature", description: "Natural world and environment", icon: "🌿" },
        cultural: { name: "Cultural", description: "Cultural and traditional terms", icon: "🌺" },
        family: { name: "Family", description: "Family and relationship terms", icon: "👨‍👩‍👧‍👦" },
        people: { name: "People", description: "Terms for people and relationships", icon: "👥" },
        descriptions: { name: "Descriptions", description: "Descriptive words and adjectives", icon: "📝" },
        grammar: { name: "Grammar", description: "Grammar and sentence structure", icon: "📚" },
        concepts: { name: "Concepts", description: "Abstract concepts and ideas", icon: "💭" },
        clothing: { name: "Clothing", description: "Clothing and accessories", icon: "👕" },
        animals: { name: "Animals", description: "Animals and creatures", icon: "🐾" },
        games: { name: "Games", description: "Games and activities", icon: "🎮" },
        architecture: { name: "Architecture", description: "Buildings and structures", icon: "🏗️" },
        numbers: { name: "Numbers", description: "Numbers and counting", icon: "🔢" },
        questions: { name: "Questions", description: "Question words and phrases", icon: "❓" }
    };

    // Helper functions
    function inferDifficulty(pidgin, english) {
        const commonWords = ['howzit', 'brah', 'ono', 'pau', 'shoots', 'stay', 'da', 'grindz', 'mahalo', 'aloha'];
        const intermediateWords = ['da kine', 'broke da mouth', 'talk story', 'pau hana', 'chee hoo', 'hana hou'];

        const pidginLower = pidgin.toLowerCase();
        if (commonWords.includes(pidginLower)) return 'beginner';
        if (intermediateWords.includes(pidginLower)) return 'intermediate';
        if (pidgin.includes(' ') && pidgin.split(' ').length > 2) return 'advanced';
        if (pidgin.length > 12) return 'intermediate';
        return 'beginner';
    }

    function inferFrequency(pidgin) {
        const veryHigh = ['howzit', 'brah', 'da', 'stay', 'pau', 'shoots', 'ono', 'aloha', 'mahalo'];
        const high = ['grindz', 'da kine', 'choke', 'no can', 'like', 'wat', 'dis', 'dat'];

        const pidginLower = pidgin.toLowerCase();
        if (veryHigh.includes(pidginLower)) return 'very_high';
        if (high.includes(pidginLower)) return 'high';
        return 'medium';
    }

    function generateTags(entry) {
        const tags = [];

        if (entry.category) tags.push(entry.category);
        if (entry.origin) {
            if (entry.origin.toLowerCase().includes('hawaiian')) tags.push('hawaiian');
            if (entry.origin.toLowerCase().includes('english')) tags.push('english');
            if (entry.origin.toLowerCase().includes('chinese')) tags.push('chinese');
            if (entry.origin.toLowerCase().includes('portuguese')) tags.push('portuguese');
            if (entry.origin.toLowerCase().includes('japanese')) tags.push('japanese');
            if (entry.origin.toLowerCase().includes('filipino')) tags.push('filipino');
            if (entry.origin.toLowerCase().includes('samoan')) tags.push('samoan');
        }

        const englishLower = entry.english.toLowerCase();
        if (englishLower.includes('food') || entry.category === 'food') tags.push('food');
        if (englishLower.includes('greeting') || entry.category === 'greetings') tags.push('greeting');
        if (englishLower.includes('family') || entry.category === 'family') tags.push('family');

        return [...new Set(tags)]; // Remove duplicates
    }

    function createSafeId(pidgin, counter) {
        return pidgin.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove special chars
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .substring(0, 20) + '_' + counter.toString().padStart(3, '0');
    }

    // Process each entry
    for (const [key, entry] of Object.entries(legacyData)) {
        // Skip invalid entries
        if (!entry || !entry.pidgin || !entry.english) {
            console.log(`⚠️ Skipping invalid entry: ${key}`);
            continue;
        }

        const pidginLower = entry.pidgin.toLowerCase();

        // Handle duplicates by merging
        if (seenPidgin.has(pidginLower)) {
            duplicatesCount++;
            const existingEntry = seenPidgin.get(pidginLower);

            // Merge English translations
            const existingEnglish = Array.isArray(existingEntry.english) ? existingEntry.english : [existingEntry.english];
            const newEnglish = entry.english;

            if (!existingEnglish.includes(newEnglish)) {
                existingEntry.english.push(newEnglish);
            }

            // Merge examples
            if (entry.example && !existingEntry.examples.includes(entry.example)) {
                existingEntry.examples.push(entry.example);
            }

            // Update other fields if they're better/more complete
            if (!existingEntry.pronunciation && entry.pronunciation) {
                existingEntry.pronunciation = entry.pronunciation;
            }
            if (!existingEntry.usage && entry.usage) {
                existingEntry.usage = entry.usage;
            }
            if (!existingEntry.origin && entry.origin) {
                existingEntry.origin = entry.origin;
            }

            continue;
        }

        // Create new entry
        const newEntry = {
            id: createSafeId(entry.pidgin, idCounter),
            pidgin: entry.pidgin,
            english: Array.isArray(entry.english) ? entry.english : [entry.english],
            category: entry.category || 'expressions',
            pronunciation: entry.pronunciation || '',
            examples: entry.example ? [entry.example] : [],
            usage: entry.usage || '',
            origin: entry.origin || '',
            difficulty: inferDifficulty(entry.pidgin, entry.english),
            frequency: inferFrequency(entry.pidgin),
            tags: generateTags(entry),
            audioExample: entry.audioExample || entry.example || ''
        };

        // Handle multiple English meanings
        if (entry.english.includes('/')) {
            newEntry.english = entry.english.split('/').map(e => e.trim());
        }

        entries.push(newEntry);
        seenPidgin.set(pidginLower, newEntry);
        idCounter++;
    }

    // Sort entries alphabetically
    entries.sort((a, b) => a.pidgin.localeCompare(b.pidgin));

    const result = {
        metadata: {
            version: "2.0",
            lastUpdated: new Date().toISOString().split('T')[0],
            totalEntries: entries.length,
            description: "Comprehensive Hawaiian Pidgin Dictionary",
            contributors: ["ChokePidgin.com"],
            license: "Open Source",
            migrationInfo: {
                sourceEntries: Object.keys(legacyData).length,
                duplicatesRemoved: duplicatesCount,
                migratedAt: new Date().toISOString()
            }
        },
        categories,
        entries
    };

    console.log(`✅ Migration complete:`);
    console.log(`   Source entries: ${Object.keys(legacyData).length}`);
    console.log(`   Unique entries: ${entries.length}`);
    console.log(`   Duplicates merged: ${duplicatesCount}`);
    console.log(`   Categories: ${Object.keys(categories).length}`);

    return result;
}

// Perform migration
const migratedData = migrateData(comprehensivePidginData);

// Write the new JSON file
const outputPath = path.join(__dirname, 'data/pidgin-dictionary.json');
fs.writeFileSync(outputPath, JSON.stringify(migratedData, null, 2));

console.log(`💾 Saved migrated data to: ${outputPath}`);

// Generate summary report
const summaryPath = path.join(__dirname, 'data/migration-report.txt');
const summary = `Hawaiian Pidgin Dictionary Migration Report
Generated: ${new Date().toISOString()}

Migration Results:
- Source file: js/comprehensive-pidgin-data.js
- Target file: data/pidgin-dictionary.json
- Original entries: ${migratedData.metadata.migrationInfo.sourceEntries}
- Unique entries: ${migratedData.metadata.totalEntries}
- Duplicates merged: ${migratedData.metadata.migrationInfo.duplicatesRemoved}
- Categories: ${Object.keys(migratedData.categories).length}

File Sizes:
- Original: ${fs.statSync(legacyDataPath).size} bytes
- New JSON: ${fs.statSync(outputPath).size} bytes

Next Steps:
1. Review data/pidgin-dictionary.json
2. Test with new data loader
3. Update HTML files to use new system
4. Deploy updated site

Migration Status: ✅ COMPLETE
`;

fs.writeFileSync(summaryPath, summary);
console.log(`📋 Migration report saved to: ${summaryPath}`);

console.log('\n🎉 Migration completed successfully!');
console.log('\nNext steps:');
console.log('1. Review the generated data/pidgin-dictionary.json file');
console.log('2. Test the new data loader');
console.log('3. Update your site to use the new system');