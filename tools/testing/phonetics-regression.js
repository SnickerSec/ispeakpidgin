#!/usr/bin/env node
/**
 * Phonetic transform regression tests.
 *
 * These are the defects that survived to production because the pronunciation audit only ever
 * ran against 88 mock fixtures and reported "Problematic: 0". Each case below was observed on
 * real dictionary content.
 */
const { applyPronunciationCorrections: f } = require('../../src/components/speech/elevenlabs-speech.js');

const cases = [
    // --- English words must not be run through Hawaiian vowel rules -----------------
    // "our" hit the `ou` trigger and the u->oo rule, becoming "ooor".
    ['our', 'our'], ['Our', 'our'], ['sour', 'sour'], ['hour', 'hour'],
    ['flour', 'flour'], ['tour', 'tour'], ['four', 'four'], ['pour', 'pour'],
    ['your', 'your'],

    // --- Hawaiian words carrying a diacritic must be syllabified, not passed through -
    // These reached ElevenLabs with macrons intact, or with the okina simply deleted.
    ["'āina", 'ah-ee-nah'], ["'ōkole", 'oh-koh-leh'], ["'ahi", 'ah-hee'],
    ["'ae", 'ah-eh'], ["'aumakua", 'ow-mah-koo-ah'],

    // --- The vocative pause must not lead with a comma or stack on re-application ----
    ['brah', 'brah'],
    ['shoots brah', 'shoots, brah'],

    // --- Regressions guard: these were already correct and must stay correct ---------
    ['da kine', 'dah kyne'], ['pau', 'pow'], ['mauka', 'mow-kah'],
    ['keiki', 'kay-kee'], ['wikiwiki', 'vee-kee-vee-kee'], ['ono', 'oh-noh'],
    ["bust 'em up", 'bust em up'],
];

let failed = 0;
console.log('🔤 Phonetic transform regression\n');
for (const [input, expected] of cases) {
    const actual = f(input);
    const ok = actual === expected;
    if (!ok) failed++;
    console.log(`  ${ok ? '✅' : '❌'} ${JSON.stringify(input).padEnd(16)} -> ${JSON.stringify(actual)}${ok ? '' : `  (expected ${JSON.stringify(expected)})`}`);
}

// The transform runs once at the TTS boundary, but a caller that double-applies must not
// compound damage -- that is what the old `brah` rule did.
const idempotent = ['shoots brah', 'eh brah', 'da kine', "'āina"];
console.log('\n  idempotency (f(f(x)) === f(x)):');
for (const t of idempotent) {
    const once = f(t), twice = f(once);
    const ok = once === twice;
    if (!ok) failed++;
    console.log(`  ${ok ? '✅' : '❌'} ${JSON.stringify(t).padEnd(16)} ${JSON.stringify(once)}${ok ? '' : ` -> ${JSON.stringify(twice)}`}`);
}

console.log(failed ? `\n❌ ${failed} failing\n` : '\n🎉 All phonetic regression cases passed\n');
process.exit(failed ? 1 : 0);
