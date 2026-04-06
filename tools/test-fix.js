const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { supabase } = require('../config/supabase');
const vm = require('vm');

global.window = { addEventListener: () => {}, dispatchEvent: () => {} };
global.performance = { now: () => Date.now() };
global.navigator = { userAgent: 'node' };
global.contextTracker = { isParagraph: () => false };
global.sentenceChunker = { loaded: false };
global.phraseTranslator = { loaded: false };
global.settingsManager = { get: () => 'false' };

const mockDataLoader = {
    loaded: true,
    data: { translations: { englishToPidgin: {}, pidginToEnglish: {} } },
    entries: [],
    getTranslations: function() { return this.data.translations; },
    getAllEntries: function() { return this.entries; }
};
global.pidginDataLoader = mockDataLoader;

function loadTranslatorClass() {
    const translatorPath = path.join(__dirname, '../src/components/translator/translator.js');
    const code = fs.readFileSync(translatorPath, 'utf8');
    const lines = code.split('\n');
    let classEndLine = lines.findIndex(line => line.includes('const translator = new PidginTranslator()'));
    if (classEndLine === -1) classEndLine = lines.length;
    let classCode = lines.slice(0, classEndLine).join('\n');
    classCode += '\nthis.PidginTranslator = PidginTranslator;';
    const script = new vm.Script(classCode);
    const context = { ...global };
    script.runInNewContext(context);
    return context.PidginTranslator;
}

async function testFix() {
    const PidginTranslator = loadTranslatorClass();
    const { data: entries } = await supabase.from('dictionary_entries').select('*');
    mockDataLoader.entries = entries;
    entries.forEach(entry => {
        const engArr = Array.isArray(entry.english) ? entry.english : [entry.english];
        engArr.forEach(eng => {
            const engLower = eng.toLowerCase().trim();
            if (!mockDataLoader.data.translations.englishToPidgin[engLower]) {
                mockDataLoader.data.translations.englishToPidgin[engLower] = [];
            }
            mockDataLoader.data.translations.englishToPidgin[engLower].push({ pidgin: entry.pidgin, id: entry.id });
        });
    });

    const translator = new PidginTranslator();
    translator.tryInitialize();

    const testCase = "the land";
    console.log(`Input: "${testCase}"`);
    
    // Original behavior
    const resultOriginal = await translator.translate(testCase, 'eng-to-pidgin');
    console.log('Original Translation:', resultOriginal.text);

    // Simulated Fix: Try dictionary first
    let resultFixed;
    const directMatch = translator.translateEnglishToPidginEnhanced(testCase);
    if (directMatch.text !== testCase) {
        resultFixed = directMatch.text;
        console.log('Fixed Translation (Dictionary Match):', resultFixed);
    } else {
        console.log('No direct dictionary match found.');
    }
}

testFix();
