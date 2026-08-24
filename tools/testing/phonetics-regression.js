#!/usr/bin/env node
/**
 * Phonetic transform regression tests.
 *
 * These are the defects that survived to production because the pronunciation audit only ever
 * ran against 88 mock fixtures and reported "Problematic: 0". Each case below was observed on
 * real dictionary content.
 */
const {
    applyPronunciationCorrections: f,
    PIDGIN_PRONUNCIATION_MAP: map
} = require('../../src/components/speech/elevenlabs-speech.js');
const { respell } = require('../../src/components/speech/hawaiian-orthoepy.js');

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

    // --- Multi-word map entries must survive the per-word rules ---------------------
    // The word-level pass ran before the multi-word sweep, so by the time a phrase key was
    // looked up its own words had already been rewritten and it no longer matched itself.
    // 15 of the 65 multi-word entries were unreachable: the map said one thing, users heard
    // another.
    ['pau hana', 'pow hah-nah'], ['hana hou', 'hah-nah hoh-oo'],
    ['kau kau', 'cow-cow'], ['a hui hou', 'ah hoo-ee hoh-oo'],   // ou is two morae: superseded the old 'hoh'
    ['broke da mouth', 'broke dah mowt'], ['kanak attack', 'kah-nahk ah-tack'],
    ['no ka oi', 'noh kah oy'], ['shred da gnar', 'shred dah nahr'],
    ['poke bowl', 'poh-kay bohl'], ['tūtū kāne', 'too-too kah-nay'],

    // --- A map value must never be re-substituted by a later pass -------------------
    // These stacked their own tail on every sweep, and 'hoaloha' had the 'ho' inside its own
    // replacement rewritten to 'hoh'.
    ['chee hu', 'chee-hoo!'], ['chee-hoo', 'chee-hoo!'], ['cheehoo', 'chee-hoo!'],
    ['kay den', 'kay den...'], ['hoaloha', 'ho-ah-low-hah'],

    // --- Terms whose only pronunciation guide carried no phonetic information --------
    // Authored guides that just restate the spelling in capitals ("MAKA PIAPIA") are dropped
    // as no-ops, which left these Hawaiian words going to ElevenLabs as raw English spelling.
    ['braddah', 'brah-dah'], ['okole', 'oh-koh-leh'],
    ['okole hao', 'oh-koh-leh how'], ['maka piapia', 'mah-kah pee-ah-pee-ah'],
    // Cantonese 粉 is "foon"; read as the English word "fun" the dish is simply wrong.
    ['chow fun', 'chow foon'],
    // Hawaiian ai/au. The page used to display these as "KAI"/"WAI"/"LAU", which an
    // English-first reader says "kay"/"way"/"law" -- the guide taught the wrong sound.
    ['kai', 'kye'], ['wai', 'wye'], ['lau', 'low'], ['gai', 'guy'],
    ['uku pau', 'oo-koo pow'], ['pipi kaula', 'pee-pee kow-lah'],

    // --- Hawaiian, per Pukui-Elbert ---------------------------------------------------
    // Short 'e' is "eh"; only the kahako 'e' is "ay". The map had these the wrong way round,
    // so poke was spoken "poh-kay" and nene "neh-neh".
    ['poke', 'poh-keh'], ['pupule', 'poo-poo-leh'], ['kolohe', 'koh-loh-heh'],
    ['nēnē', 'nay-nay'],
    // "oe" is two morae and must never collapse to the diphthong "oy".
    ['moemoe', 'moh-eh-moh-eh'], ['pāhoehoe', 'pah-hoh-eh-hoh-eh'],
    // w -> v only after i or e; word-initial w stays w.
    ['wahine', 'wah-hee-neh'], ['wikiwiki', 'wee-kee-vee-kee'], ['wana', 'wah-nah'],
    // "au" is "ow", not the malformed "aow".
    ['laulau', 'low-low'], ['halau', 'hah-low'],
    // The Hawaiian particle "e" must not be punctuated as the Pidgin interjection "eh".
    ['e komo mai', 'eh koh-moh mye'], ['e kala mai', 'eh kah-lah mye'],

    // --- Pidgin words that merely LOOK Hawaiian must not be respelled as Hawaiian -----
    // Every one of these is Hawaiian-legal spelling; a letter test calls them Hawaiian and
    // turns them into nonsense ("MOH-keh", "EE LEE-keh", "hah-wye-EE-ah").
    ['moke', 'mohk'], ['I like', 'i like'], ['all pau', 'all pow'],
    ['mean kine', 'mean kyne'], ['pow', 'pow'],

    // --- Regressions guard: these were already correct and must stay correct ---------
    ['da kine', 'dah kyne'], ['pau', 'pow'], ['mauka', 'mow-kah'],
    ['keiki', 'kay-kee'], ['ono', 'oh-noh'],
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

// The orthoepy module must reproduce every worked example in the standard it encodes.
const SPEC_EXAMPLES = [
    ['aloha', 'ah-LOH-hah'], ['kāne', 'KAH-neh'], ['hale', 'HAH-leh'], ['nēnē', 'NAY-nay'],
    ['iki', 'EE-kee'], ['pono', 'POH-noh'], ['kupu', 'KOO-poo'], ['pūpū', 'POO-poo'],
    ['kai', 'KYE'], ['mae', 'MYE'], ['mauka', 'MOW-kah'], ['lei', 'LAY'], ['poi', 'POY'],
    ['niu', 'NEE-oo'], ['mōʻī', 'MOH-ee'], ['ʻohana', 'oh-HAH-nah'],
    ['pāhoehoe', 'pah-HOH-eh-HOH-eh'], ['wahine', 'wah-HEE-neh'], ['ʻeleu', 'eh-LEH-oo']
];
console.log(`\n  Pukui-Elbert worked examples (${SPEC_EXAMPLES.length}):`);
let specBad = 0;
for (const [word, expected] of SPEC_EXAMPLES) {
    const actual = respell(word);
    const ok = actual === expected;
    if (!ok) { specBad++; failed++; }
    console.log(`  ${ok ? '✅' : '❌'} ${JSON.stringify(word).padEnd(14)} -> ${JSON.stringify(actual)}${ok ? '' : `  (expected ${JSON.stringify(expected)})`}`);
}

// Structural invariant, worth more than any list of examples above: every key in the map must
// transform to exactly the value the map gives it. An entry that cannot reach the output is a
// silent lie about what users hear, and enumerated cases only ever catch the ones somebody
// happened to notice.
const unreachable = Object.keys(map).filter(key => f(key) !== map[key]);
console.log(`\n  map round-trip (${Object.keys(map).length} keys):`);
if (unreachable.length) {
    failed += unreachable.length;
    unreachable.forEach(key => console.log(
        `  ❌ ${JSON.stringify(key).padEnd(16)} -> ${JSON.stringify(f(key))}  (map says ${JSON.stringify(map[key])})`));
} else {
    console.log('  ✅ every map entry reaches the output unchanged');
}

console.log(failed ? `\n❌ ${failed} failing\n` : '\n🎉 All phonetic regression cases passed\n');
process.exit(failed ? 1 : 0);
