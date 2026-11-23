#!/usr/bin/env node
/**
 * /word/ page snippet overrides: each must fit the SERP description budget, keep the
 * question-first hybrid shape, and actually win over the generic answer-first snippet.
 */
const assert = require('assert');
const {
    SNIPPET_OVERRIDES, META_DESCRIPTION_MAX, wordSnippet, answerFirstSnippet
} = require('../generators/generate-entry-pages');

let failures = 0;
const check = (name, fn) => {
    try { fn(); console.log(`  ✅ ${name}`); }
    catch (err) { failures++; console.log(`  ❌ ${name}: ${err.message}`); }
};

console.log('🔎 /word/ snippet overrides');
for (const [headword, { title, description }] of Object.entries(SNIPPET_OVERRIDES)) {
    check(`${headword}: description <= ${META_DESCRIPTION_MAX} chars`, () =>
        assert.ok(description.length <= META_DESCRIPTION_MAX, `${description.length} chars`));
    check(`${headword}: title and description lead with the question`, () => {
        assert.match(title, /^What Does "[^"]+" Mean\?/);
        assert.match(description, new RegExp(`^What does ${headword} mean\\?`, 'i'));
    });
    check(`${headword}: title is branded`, () => assert.match(title, /\| ChokePidgin$/));
    check(`${headword}: override wins over the generic snippet (case-insensitive)`, () => {
        const cap = headword.charAt(0).toUpperCase() + headword.slice(1);
        assert.strictEqual(wordSnippet({ pidgin: cap, english: ['x'] }, cap).title, title);
    });
}

check('entries without an override keep the answer-first snippet', () => {
    const entry = { pidgin: 'shoots', english: ['okay', 'sure'], examples: ['Shoots, see you den.'] };
    assert.deepStrictEqual(wordSnippet(entry, 'Shoots'), answerFirstSnippet(entry, 'Shoots'));
});

if (failures) {
    console.log(`\n❌ ${failures} check(s) failed`);
    process.exit(1);
}
console.log('\n✅ All /word/ snippet checks passed');
