#!/usr/bin/env node

/**
 * Data Consolidation Script
 * Merges all existing data sources into a unified master file
 * and generates optimized views for different use cases
 */

const fs = require('fs');
const path = require('path');

// Paths
const dataDir = path.join(__dirname, '..', 'data');
const dictionaryPath = path.join(dataDir, 'dictionary', 'pidgin-dictionary.json');
const phrasesPath = path.join(dataDir, 'phrases', 'phrases-data.js');
const storiesPath = path.join(dataDir, 'phrases', 'stories-data.js');
const masterPath = path.join(dataDir, 'master', 'pidgin-master.json');

// Helper function to safely require JS files
function requireDataFile(filePath) {
    try {
        // Read the file as text
        const content = fs.readFileSync(filePath, 'utf8');
        // Create a temporary file with module.exports
        const tempPath = filePath + '.temp.js';
        fs.writeFileSync(tempPath, content);
        const data = require(tempPath);
        fs.unlinkSync(tempPath);
        return data;
    } catch (error) {
        console.error(`Error loading ${filePath}:`, error.message);
        return null;
    }
}

// Load existing data
console.log('📚 Loading existing data sources...');

// 1. Load dictionary data (JSON)
const dictionaryData = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
console.log(`✅ Loaded ${dictionaryData.metadata.totalEntries} dictionary entries`);

// 2. Load phrases data (JS)
const phrasesContent = fs.readFileSync(phrasesPath, 'utf8');
// Extract the pidginPhrases object
const phrasesMatch = phrasesContent.match(/const pidginPhrases = ({[\s\S]*?^};)/m);
let phrasesData = null;
if (phrasesMatch) {
    try {
        // Use eval to parse the object (safe since it's our own data)
        eval('phrasesData = ' + phrasesMatch[1]);
        console.log(`✅ Loaded ${phrasesData.dailyPhrases.length} daily phrases`);
        console.log(`✅ Loaded ${Object.keys(phrasesData.translationDict).length} translation mappings`);
    } catch (error) {
        console.error('Error parsing phrases data:', error.message);
    }
}

// 3. Load stories data
const storiesContent = fs.readFileSync(storiesPath, 'utf8');
const storiesMatch = storiesContent.match(/const pidginStories = ({[\s\S]*?^};)/m);
let storiesData = null;
if (storiesMatch) {
    try {
        eval('storiesData = ' + storiesMatch[1]);
        console.log(`✅ Loaded ${storiesData.stories.length} cultural stories`);
    } catch (error) {
        console.error('Error parsing stories data:', error.message);
    }
}

// Create master data structure
console.log('\n🔨 Creating master data structure...');

const masterData = {
    metadata: {
        version: "3.0",
        lastUpdated: new Date().toISOString().split('T')[0],
        totalEntries: 0,
        totalPhrases: 0,
        totalStories: 0,
        description: "Unified Hawaiian Pidgin Master Database",
        sources: [
            "pidgin-dictionary.json",
            "phrases-data.js",
            "stories-data.js"
        ]
    },

    // All dictionary entries with enhanced data
    entries: [],

    // All phrases organized by category
    phrases: {
        daily: [],
        greetings: [],
        food: [],
        emotions: [],
        expressions: [],
        directions: [],
        slang: [],
        questions: [],
        culture: []
    },

    // Translation mappings
    translations: {
        englishToPidgin: {},
        pidginToEnglish: {}
    },

    // Stories and cultural content
    content: {
        stories: [],
        lessons: [],
        culturalNotes: []
    },

    // Categories and tags
    taxonomy: {
        categories: {},
        tags: new Set(),
        difficulty: ["beginner", "intermediate", "advanced"],
        frequency: ["very_high", "high", "medium", "low", "rare"]
    }
};

// 1. Process dictionary entries
console.log('Processing dictionary entries...');
masterData.entries = dictionaryData.entries.map(entry => {
    // Add to taxonomy
    if (!masterData.taxonomy.categories[entry.category]) {
        masterData.taxonomy.categories[entry.category] = {
            name: entry.category,
            count: 0,
            description: dictionaryData.categories[entry.category]?.description || ""
        };
    }
    masterData.taxonomy.categories[entry.category].count++;

    // Add tags to set
    if (entry.tags) {
        entry.tags.forEach(tag => masterData.taxonomy.tags.add(tag));
    }

    // Add to translation mappings
    entry.english.forEach(eng => {
        const engLower = eng.toLowerCase();
        if (!masterData.translations.englishToPidgin[engLower]) {
            masterData.translations.englishToPidgin[engLower] = [];
        }
        masterData.translations.englishToPidgin[engLower].push({
            pidgin: entry.pidgin,
            confidence: 1.0,
            id: entry.id
        });
    });

    const pidginLower = entry.pidgin.toLowerCase();
    if (!masterData.translations.pidginToEnglish[pidginLower]) {
        masterData.translations.pidginToEnglish[pidginLower] = entry.english;
    }

    return entry;
});

// 2. Process phrases
console.log('Processing phrases...');
if (phrasesData) {
    // Daily phrases
    phrasesData.dailyPhrases.forEach(phrase => {
        const enhancedPhrase = {
            pidgin: phrase.pidgin,
            english: phrase.english,
            usage: phrase.usage,
            category: "daily",
            source: "phrases-data.js"
        };
        masterData.phrases.daily.push(enhancedPhrase);

        // Also add to translation mappings if not already there
        const engLower = phrase.english.toLowerCase();
        const pidginLower = phrase.pidgin.toLowerCase();

        if (!masterData.translations.englishToPidgin[engLower]) {
            masterData.translations.englishToPidgin[engLower] = [];
        }

        // Check if this translation doesn't already exist
        const exists = masterData.translations.englishToPidgin[engLower].some(
            t => t.pidgin.toLowerCase() === pidginLower
        );

        if (!exists) {
            masterData.translations.englishToPidgin[engLower].push({
                pidgin: phrase.pidgin,
                confidence: 0.9,
                source: "phrases"
            });
        }
    });

    // Process other phrase categories
    ['greetings', 'foodPhrases', 'emotions', 'expressions', 'directions', 'slang', 'questions'].forEach(category => {
        if (phrasesData[category]) {
            const targetCategory = category.replace('Phrases', '').toLowerCase();
            phrasesData[category].forEach(item => {
                masterData.phrases[targetCategory] = masterData.phrases[targetCategory] || [];
                masterData.phrases[targetCategory].push({
                    pidgin: item.pidgin,
                    english: item.english,
                    context: item.context || item.usage,
                    source: "phrases-data.js"
                });
            });
        }
    });

    // Add translation dictionary entries
    Object.entries(phrasesData.translationDict).forEach(([english, pidgin]) => {
        const engLower = english.toLowerCase();
        if (!masterData.translations.englishToPidgin[engLower]) {
            masterData.translations.englishToPidgin[engLower] = [];
        }

        const exists = masterData.translations.englishToPidgin[engLower].some(
            t => t.pidgin.toLowerCase() === pidgin.toLowerCase()
        );

        if (!exists) {
            masterData.translations.englishToPidgin[engLower].push({
                pidgin: pidgin,
                confidence: 0.85,
                source: "translationDict"
            });
        }

        // Add reverse mapping
        const pidginLower = pidgin.toLowerCase();
        if (!masterData.translations.pidginToEnglish[pidginLower]) {
            masterData.translations.pidginToEnglish[pidginLower] = [english];
        }
    });
}

// 3. Process stories
console.log('Processing stories...');
if (storiesData && storiesData.stories) {
    masterData.content.stories = storiesData.stories.map(story => ({
        ...story,
        source: "stories-data.js"
    }));
}

// Update metadata counts
masterData.metadata.totalEntries = masterData.entries.length;
masterData.metadata.totalPhrases = Object.values(masterData.phrases).reduce((sum, arr) => sum + arr.length, 0);
masterData.metadata.totalStories = masterData.content.stories.length;
masterData.taxonomy.tags = Array.from(masterData.taxonomy.tags).sort();

// Write master file
console.log('\n💾 Writing master data file...');
fs.writeFileSync(masterPath, JSON.stringify(masterData, null, 2));
console.log(`✅ Created ${masterPath}`);

// Generate statistics
console.log('\n📊 Master Data Statistics:');
console.log(`   Total entries: ${masterData.metadata.totalEntries}`);
console.log(`   Total phrases: ${masterData.metadata.totalPhrases}`);
console.log(`   Total stories: ${masterData.metadata.totalStories}`);
console.log(`   English→Pidgin mappings: ${Object.keys(masterData.translations.englishToPidgin).length}`);
console.log(`   Pidgin→English mappings: ${Object.keys(masterData.translations.pidginToEnglish).length}`);
console.log(`   Categories: ${Object.keys(masterData.taxonomy.categories).length}`);
console.log(`   Unique tags: ${masterData.taxonomy.tags.length}`);

// Create optimized views
console.log('\n🎯 Generating optimized views...');

// 1. Dictionary view (for browsing)
const dictionaryView = {
    metadata: {
        ...masterData.metadata,
        viewType: "dictionary"
    },
    categories: dictionaryData.categories,
    entries: masterData.entries
};
fs.writeFileSync(path.join(dataDir, 'views', 'dictionary.json'), JSON.stringify(dictionaryView, null, 2));
console.log('✅ Created dictionary view');

// 2. Translator view (lightweight for fast translation)
const translatorView = {
    metadata: {
        version: masterData.metadata.version,
        viewType: "translator",
        lastUpdated: masterData.metadata.lastUpdated
    },
    translations: masterData.translations
};
fs.writeFileSync(path.join(dataDir, 'views', 'translator.json'), JSON.stringify(translatorView, null, 2));
console.log('✅ Created translator view');

// 3. Learning view (organized by difficulty and category)
const learningView = {
    metadata: {
        version: masterData.metadata.version,
        viewType: "learning",
        lastUpdated: masterData.metadata.lastUpdated
    },
    phrases: masterData.phrases,
    stories: masterData.content.stories,
    beginnerContent: masterData.entries.filter(e => e.difficulty === "beginner").slice(0, 50),
    intermediateContent: masterData.entries.filter(e => e.difficulty === "intermediate").slice(0, 50),
    advancedContent: masterData.entries.filter(e => e.difficulty === "advanced").slice(0, 50)
};
fs.writeFileSync(path.join(dataDir, 'views', 'learning.json'), JSON.stringify(learningView, null, 2));
console.log('✅ Created learning view');

// 4. Search index
const searchIndex = {
    metadata: {
        version: masterData.metadata.version,
        viewType: "search",
        lastUpdated: masterData.metadata.lastUpdated
    },
    terms: {}
};

// Build search index
masterData.entries.forEach(entry => {
    // Index by pidgin term
    const pidginLower = entry.pidgin.toLowerCase();
    if (!searchIndex.terms[pidginLower]) {
        searchIndex.terms[pidginLower] = [];
    }
    searchIndex.terms[pidginLower].push({
        id: entry.id,
        type: "entry",
        english: entry.english[0]
    });

    // Index by english terms
    entry.english.forEach(eng => {
        const engLower = eng.toLowerCase();
        if (!searchIndex.terms[engLower]) {
            searchIndex.terms[engLower] = [];
        }
        searchIndex.terms[engLower].push({
            id: entry.id,
            type: "entry",
            pidgin: entry.pidgin
        });
    });
});

fs.writeFileSync(path.join(dataDir, 'indexes', 'search-index.json'), JSON.stringify(searchIndex, null, 2));
console.log('✅ Created search index');

// 5. Pronunciation map
const pronunciationMap = {};
masterData.entries.forEach(entry => {
    if (entry.pronunciation) {
        pronunciationMap[entry.pidgin.toLowerCase()] = entry.pronunciation;
    }
});

fs.writeFileSync(
    path.join(dataDir, 'indexes', 'pronunciation-map.json'),
    JSON.stringify(pronunciationMap, null, 2)
);
console.log('✅ Created pronunciation map');

console.log('\n✨ Data consolidation complete!');
console.log('📁 New structure created in data/ directory');
console.log('\nNext steps:');
console.log('1. Update data-loader.js to use new structure');
console.log('2. Test all components with new data');
console.log('3. Remove old data files once verified');