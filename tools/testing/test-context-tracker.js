#!/usr/bin/env node

/**
 * Unit Tests for Context Tracker & Multi-Sentence Paragraph Translation
 */

const assert = require('assert').strict;
const ContextTracker = require('../../src/components/translator/context-tracker');

// Mock Sentence Chunker for standalone testing
class MockChunker {
    constructor() {
        this.loaded = true;
    }

    translateSentence(sentence, direction = 'eng-to-pidgin') {
        const s = sentence.trim();
        if (direction === 'eng-to-pidgin') {
            let pidgin = s
                .replace(/\bwent to the beach\b/gi, 'wen go beach')
                .replace(/\bwas surfing\b/gi, 'stay surfing')
                .replace(/\bate some food\b/gi, 'wen grind ono food')
                .replace(/\bthe food was delicious\b/gi, 'da food was so ono')
                .replace(/\bwent to the store\b/gi, 'wen go store');

            return {
                translation: pidgin,
                confidence: 0.9,
                method: 'mock_chunker'
            };
        } else {
            let eng = s
                .replace(/\bwen go beach\b/gi, 'went to the beach')
                .replace(/\bstay surfing\b/gi, 'was surfing')
                .replace(/\bwen grind ono food\b/gi, 'ate delicious food');

            return {
                translation: eng,
                confidence: 0.9,
                method: 'mock_chunker'
            };
        }
    }
}

async function runTests() {
    console.log('🧪 Testing Context Tracker & Paragraph Translation...\n');

    const mockChunker = new MockChunker();
    const tracker = new ContextTracker(mockChunker);

    // 1. Test Sentence Splitting with Abbreviations
    console.log('1. Testing sentence splitting with abbreviations...');
    const paragraphWithAbbrev = 'Dr. Keanu drove down H-1 yesterday. Mrs. Wong was waiting at the beach. He went to the beach!';
    const sentences = tracker.splitIntoSentences(paragraphWithAbbrev);
    assert.strictEqual(sentences.length, 3);
    assert.strictEqual(sentences[0], 'Dr. Keanu drove down H-1 yesterday.');
    assert.strictEqual(sentences[1], 'Mrs. Wong was waiting at the beach.');
    assert.strictEqual(sentences[2], 'He went to the beach!');

    // 2. Test Paragraph Detection
    console.log('2. Testing isParagraph detection...');
    assert.strictEqual(tracker.isParagraph('Just one short sentence.'), false);
    assert.strictEqual(tracker.isParagraph('Sentence one. Sentence two! Sentence three?'), true);
    assert.strictEqual(tracker.isParagraph('This is a much longer single sentence with lots of extra words meant to easily exceed the twenty five word count threshold for conversational paragraph detection in our tests.'), true);

    // 3. Test Discourse Marker Transitions (English -> Pidgin)
    console.log('3. Testing English to Pidgin discourse transitions...');
    const textWithTransitions = 'My uncle went to the beach. After that, he was surfing. Therefore, he ate some food.';
    const engResult = tracker.translateParagraph(textWithTransitions, 'eng-to-pidgin');
    
    assert.ok(engResult);
    assert.strictEqual(engResult.sentenceCount, 3);
    assert.match(engResult.translation, /Aftah dat/i);
    assert.match(engResult.translation, /Das why/i);
    assert.match(engResult.translation, /wen go beach/i);

    // 4. Test Pronoun Resolution with Male Context
    console.log('4. Testing pronoun resolution with male subject context...');
    tracker.resetContext();
    tracker.updateContext('My uncle was at the beach yesterday.', 'My uncle stay beach yesterday.', 'eng-to-pidgin');
    assert.strictEqual(tracker.context.lastSubjectGender, 'male');
    assert.strictEqual(tracker.context.currentTense, 'past');

    const maleNextSentence = tracker.applyContextToEnglish('He went to the store.', 1);
    assert.match(maleNextSentence, /He wen go/i);

    // 5. Test Pronoun Resolution with Female Context
    console.log('5. Testing pronoun resolution with female subject context...');
    tracker.resetContext();
    tracker.updateContext('My aunty was cooking in the kitchen.', 'My aunty stay cooking in da kitchen.', 'eng-to-pidgin');
    assert.strictEqual(tracker.context.lastSubjectGender, 'female');

    const femaleNextSentence = tracker.applyContextToEnglish('She was surfing.', 1);
    assert.match(femaleNextSentence, /She stay/i);

    // 6. Test Discourse Transitions (Pidgin -> English)
    console.log('6. Testing Pidgin to English discourse transitions...');
    const pidginParagraph = 'My braddah wen go beach. Aftah dat, he stay surfing. Das why had choke fun.';
    const pidginResult = tracker.translateParagraph(pidginParagraph, 'pidgin-to-eng');

    assert.ok(pidginResult);
    assert.strictEqual(pidginResult.sentenceCount, 3);
    assert.match(pidginResult.translation, /After that/i);
    assert.match(pidginResult.translation, /That is why/i);

    // 7. Test Context Summary Metadata
    console.log('7. Testing context summary metadata...');
    const summary = tracker.getContextSummary();
    assert.ok(typeof summary.sentencesInHistory === 'number');
    assert.ok(typeof summary.entitiesTracked === 'number');

    console.log('\n🎉 All Context Tracker tests passed successfully!\n');
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
