// ElevenLabs Text-to-Speech Integration
// Pidgin -> phonetic spelling for TTS, tuned for ElevenLabs voices.
//
// SINGLE SOURCE OF TRUTH. This map is what users actually hear, and it is also what
// tools/testing/pronunciation-audit.js scores -- that tool requires this constant rather
// than keeping its own copy. The two used to be hand-synced literals and silently drifted
// by 10 mappings, which made the audit report coverage for a map nobody was listening to.
// Add new pronunciations here and both the runtime and the audit pick them up.
const PIDGIN_PRONUNCIATION_MAP = {
    // "kine" should rhyme with "nine"
    'kine': 'kyne',
    'da kine': 'dah kyne',
    'da': 'dah',
    'any kine': 'any kyne',
    'small kine': 'small kyne',
    'funny kine': 'funny kyne',
    'fast kine': 'fast kyne',
    'faskine': 'fas-kyne',

    // Core Hawaiian/Pidgin words with specific phonetic needs
    'pau': 'pow',
    'pau hana': 'pow hah-nah',
    'mauka': 'mow-kah',
    'makai': 'mah-kye',
    'ono': 'oh-noh',
    'oe': 'oh-eh',
    'ʻoe': 'oh-eh',
    'auwe': 'ow-way',
    'wahine': 'vah-hee-nay',
    'kane': 'kah-nay',
    'keiki': 'kay-kee',
    'tutu': 'too-too',
    'lanai': 'lah-nye',
    'mahalo': 'mah-hah-low',
    'aloha': 'ah-low-hah',
    'ohana': 'oh-hah-nah',
    'kokua': 'koh-koo-ah',
    'malama': 'mah-lah-mah',
    'kapu': 'kah-poo',
    'wiki': 'vee-kee',
    'wikiwiki': 'vee-kee-vee-kee',
    'pupus': 'poo-poos',
    'pupu': 'poo-poo',
    'gou': 'gow',
    'hale': 'hah-leh',
    'hele': 'heh-leh',
    'kupuna': 'koo-poo-nah',
    'lolo': 'low-low',
    'pilau': 'pee-lau',
    'puka': 'poo-kah',
    'humbug': 'hum-bug',
    'ho': 'hoh',
    'howzit': 'how-zit',
    'hana hou': 'hah-nah hoh-oo',
    'hanahou': 'hah-nah-hoh-oo',
    'wassamattayou': 'wah-sah-mah-tah-yoo',
    'whaddsdascoops': 'whah-dah-dah-skoops',
    'shaka': 'shah-kah',
    'slippahs': 'slippahz',
    'still': 'steel',
    'brah': 'brah',
    'bruddah': 'bruh-dah',
    'braddah': 'brah-dah',
    'sistah': 'sis-tah',
    'cuz': 'kuz',
    'sole': 'so-leh',
    'pake': 'pah-keh',
    'haole': 'how-lee',
    'poke': 'poh-kay',
    'musubi': 'moo-soo-bee',
    'shoyu': 'show-yoo',
    'mochi': 'mo-chee',
    'manapua': 'mah-nah-poo-ah',
    'malasada': 'mah-lah-sah-dah',
    'malasadas': 'mah-lah-sah-dahz',
    'kanak': 'kah-nahk',
    'grindz': 'gryndz',
    'grind': 'grynd',
    'kaukau': 'cow-cow',
    'kau kau': 'cow-cow',
    'cheehoo': 'chee-hoo!',
    'chee-hoo': 'chee-hoo!',
    'rajah': 'rah-jah',
    'shoots': 'shoots',
    'choke': 'choke',
    'bamboocha': 'bam-boo-chah',
    'akamai': 'ah-kah-my',
    'buggah': 'buh-gah',
    'niele': 'nee-eh-leh',
    'pilikia': 'pee-lee-kee-ah',
    'chee hu': 'chee-hoo!',
    'bust \'em up': 'bust em up',
    'bust em up': 'bust em up',
    'buss up': 'bus up',
    'fakafied': 'fah-kah-fyde',
    'ainokea': 'eye-no-kay-ah',
    'mo bettah': 'mo beh-tah',
    'kay den': 'kay den...',
    'aurite': 'ah-rye-t',
    'stink eye': 'stink eye',
    'chicken skin': 'chicken skin',
    'talk story': 'talk story',
    'broke da mouth': 'broke dah mowt',
    'broke da mout': 'broke dah mowt',
    'kanak attack': 'kah-nahk ah-tack',
    'mālama da ʻāina': 'mah-lah-mah dah eye-nah',
    'nō ka ʻoi': 'noh kah oy',
    'no ka oi': 'noh kah oy',
    'a hui hou': 'ah-hoo-ee-hoh',
    'aʻole pilikia': 'ah-oh-leh pee-lee-kee-ah',
    'aole pilikia': 'ah-oh-leh pee-lee-kee-ah',
    'moopuna': 'mo-poo-nah',
    'li hing mui': 'lee hing moo-ee',
    'lilikoi': 'lee-lee-koy',
    'shave ice': 'shave ice',
    'okole': 'oh-koh-leh',
    // Cantonese 粉, not the English word: the dish is "chow foon".
    'chow fun': 'chow foon',
    'ʻōkole': 'oh-koh-leh',
    'okole hao': 'oh-koh-leh how',
    'ʻōkolehao': 'oh-koh-leh how',
    'okolehao': 'oh-koh-leh how',
    'maka piapia': 'mah-kah pee-ah-pee-ah',
    'piapia': 'pee-ah-pee-ah',
    'plate lunch': 'plate lunch',
    'loco moco': 'low-coh moh-coh',
    'ballah': 'bal-lah',
    'rubbah': 'rub-bah',
    'punani': 'poo-nah-nee',
    'boto': 'boh-toh',
    'faka': 'fah-kah',
    'hamajang': 'hah-mah-jahng',
    'mayjah': 'may-jah',
    'poho': 'poh-hoh',
    'rajah dat': 'rah-jah dat',
    'yobo': 'yo-boh',
    'wit\'': 'wit',
    'wit': 'wit',
    'yesterday': 'yes-tah-deh',
    'no make body': 'no make bah-dee',
    'if can can': 'if can, can',
    'if can, can': 'if can, can',
    'if no can no can': 'if no can, no can',
    'if no can, no can': 'if no can, no can',
    'gotta': 'got-tah',
    'heavies': 'heh-veez',
    'in da pit': 'in dah pit',
    'junk surf': 'junk surf',
    'shred da gnar': 'shred dah nahr',
    'guans': 'gwahnz',
    'habut': 'hah-boot',
    'gee vum': 'jee vum',
    'solid bro': 'solid bro',
    'too much style': 'too much style',
    'point break': 'point brayk',
    'dawn patrol': 'dawn pah-trohl',
    'close out': 'klohz owt',
    'drop in': 'drop een',
    'talk stink': 'talk steenk',
    'shave head': 'shayv hed',
    'spam musubi': 'spam moo-soo-bee',
    'poke bowl': 'poh-kay bohl',
    'choke grindz': 'choke gryndz',

    // Culture, Food & Nature
    'poi': 'poy',
    'luau': 'loo-ow',
    'laulau': 'laow-laow',
    'pipikaula': 'pee-pee-kow-lah',
    'haupia': 'how-pee-ah',
    'lomilomi': 'low-mee-low-mee',
    'lomi lomi': 'low-mee-low-mee',
    'kiawe': 'kee-ah-veh',
    'hula': 'hoo-lah',
    'halau': 'hah-laow',
    'hālau': 'hah-laow',
    'kumu': 'koo-moo',
    'malo': 'mah-low',
    'ti': 'tee',
    'lei': 'lay',
    'heiau': 'hay-ow',
    'menehune': 'meh-neh-hoo-neh',
    'alii': 'ah-lee-ee',
    'ali\'i': 'ah-lee-ee',
    'aliʻi': 'ah-lee-ee',
    'imu': 'ee-moo',
    'mo\'o': 'moh-oh',
    'moʻo': 'moh-oh',
    'pueo': 'poo-eh-oh',
    'nene': 'neh-neh',
    'nēnē': 'neh-neh',
    'hapa': 'hah-pah',
    'hapa haole': 'hah-pah how-lee',
    'mana': 'mah-nah',
    'pono': 'poh-noh',
    'lanakila': 'lah-nah-kee-lah',
    'kamaaina': 'kah-mah-eye-nah',
    'kama\'aina': 'kah-mah-eye-nah',
    'kamaʻāina': 'kah-mah-eye-nah',
    'makana': 'mah-kah-nah',
    'pualani': 'poo-ah-lah-nee',
    'kealoha': 'kay-ah-low-hah',
    'hoaloha': 'ho-ah-low-hah',
    'luana': 'loo-ah-nah',
    'huhu': 'hoo-hoo',
    'hūhū': 'hoo-hoo',
    'pupule': 'poo-poo-lay',
    'muliwai': 'moo-lee-vye',
    'moemoe': 'moy-moy',
    'nani': 'nah-nee',
    'ua': 'oo-ah',
    'bumbye': 'bum-bye',
    'bumbai': 'bum-bye',
    'latah': 'lay-tah',
    'latahs': 'lay-tahz',
    'later': 'lay-tah',
    'fo\'': 'foh',
    'fo': 'foh',
    'mahimahi': 'mah-hee-mah-hee',
    'mahi-mahi': 'mah-hee-mah-hee',
    'opihi': 'oh-pee-hee',
    'ʻopihi': 'oh-pee-hee',
    'limu': 'lee-moo',
    'hapai': 'hah-pye',
    'hāpai': 'hah-pye',
    'haumana': 'how-mah-nah',
    'haumāna': 'how-mah-nah',
    'holoholo': 'hoh-low-hoh-low',
    'huli huli': 'hoo-lee hoo-lee',
    'hulihuli': 'hoo-lee-hoo-lee',
    'kulolo': 'koo-low-low',
    'kūlolo': 'koo-low-low',
    'kahuna': 'kah-hoo-nah',
    'pikake': 'pee-kah-kay',
    'pīkake': 'pee-kah-kay',
    'pohaku': 'poh-hah-koo',
    'pōhaku': 'poh-hah-koo',
    'pua': 'poo-ah',
    'ukulele': 'oo-koo-lay-lay',
    'ʻukulele': 'oo-koo-lay-lay',
    'mana\'o': 'mah-nah-oh',
    'manaʻo': 'mah-nah-oh',
    'pali': 'pah-lee',
    'pahoehoe': 'pah-hoy-hoy',
    'pāhoehoe': 'pah-hoy-hoy',
    'tutu kane': 'too-too kah-nay',
    'tūtū kāne': 'too-too kah-nay',
    'hanabada': 'hah-nah-bah-dah',
    'obake': 'oh-bah-keh',
    'malihini': 'mah-lee-hee-nee',
    'aina': 'eye-nah',
    'ʻāina': 'eye-nah',
    'kai': 'kye',
    'mauna': 'mow-nah',
    'all pau': 'all pow',
    'kolohe': 'koh-low-hay',
    'no worry': 'no worry',
    'neva': 'neh-vah',
    'no can': 'no can',

    // Island Place Names
    'kailua': 'kye-loo-ah',
    'kaneohe': 'kah-nay-oh-hay',
    'kāneʻohe': 'kah-nay-oh-hay',
    'waikiki': 'wye-kee-kee',
    'waikīkī': 'wye-kee-kee',
    'haleiwa': 'hah-lay-ee-vah',
    'haleʻiwa': 'hah-lay-ee-vah',
    'waianae': 'wye-ah-nye',
    'waiʻanae': 'wye-ah-nye',
    'waimanalo': 'wye-mah-nah-low',
    'waimānalo': 'wye-mah-nah-low',
    'molokai': 'moh-loh-kye',
    'molokaʻi': 'moh-loh-kye',
    'kahului': 'kah-hoo-loo-ee',
    'hilo': 'hee-low',
    'kona': 'koh-nah',
    'punaluu': 'poo-nah-loo-oo',
    'punaluʻu': 'poo-nah-loo-oo',
    'kakaako': 'kah-kah-ah-koh',
    'kakaʻako': 'kah-kah-ah-koh',
    'kahala': 'kah-hah-lah',
    'kāhala': 'kah-hah-lah',
    'kapolei': 'kah-poh-lay',
    'mililani': 'mee-lee-lah-nee',
    'aiea': 'eye-eh-ah',
    'ʻaiea': 'eye-eh-ah',
    'makaha': 'mah-kah-hah',
    'mākaha': 'mah-kah-hah',
    'makawao': 'mah-kah-wow',
    'pukalani': 'poo-kah-lah-nee',
    'waimea': 'wye-may-ah',
    'hanalei': 'hah-nah-lay',
    'lahaina': 'lah-hye-nah',
    'lāhainā': 'lah-hye-nah',
    'ewa': 'eh-vah',
    'ʻewa': 'eh-vah',
    'honolulu': 'hoh-noh-loo-loo',
    'ala moana': 'ah-lah moh-ah-nah',
    'kapiolani': 'kah-pee-oh-lah-nee',
    'kapiʻolani': 'kah-pee-oh-lah-nee',
    'kalakaua': 'kah-lah-cow-ah',
    'kalākaua': 'kah-lah-cow-ah',
    'kuhio': 'koo-hee-oh',
    'kūhiō': 'koo-hee-oh',
    'waipahu': 'wye-pah-hoo',
    'kahuku': 'kah-hoo-koo',
    'laie': 'lah-ee-eh',
    'lāʻie': 'lah-ee-eh',
    'hanauma': 'hah-now-mah',
    'lanikai': 'lah-nee-kye',
    'koolau': 'koh-oh-laow',
    'koʻolau': 'koh-oh-laow',

    // Expanded Modern Slang & Food Expressions
    'kefe': 'keh-feh',
    'sukebe': 'soo-keh-beh',
    'hukilau': 'hoo-kee-laow',
    'tita': 'tee-tah',
    'menpachi': 'men-pah-chee',
    'menpachi eyes': 'men-pah-chee eyes',
    'chawan': 'chah-wahn',
    'moke': 'mohk',
    'two scoops': 'two skoops',
    'mac salad': 'mack salad'
};

// Multi-word map entries, precomputed longest-first.
//
// These are applied BEFORE every other rule. They used to be applied only in the final map
// sweep, which runs after the word-level pass has already rewritten the individual words -- so
// "maka piapia" reached that sweep as "maka pee-ah-pee-ah" and no longer matched its own key.
// 15 of the 65 multi-word entries were unreachable that way, "broke da mouth", "hana hou",
// "kau kau" and "shred da gnar" among them: the map said one thing and users heard another.
// A phrase is more specific evidence than any per-word rule, so it wins outright, the same way
// an authored guide does.
const PIDGIN_PHRASE_KEYS = Object.keys(PIDGIN_PRONUNCIATION_MAP)
    .filter(key => /\s/.test(key))
    .sort((a, b) => b.length - a.length);

// \b is unreliable here: several keys carry an okina or a macron, and \b sees those as word
// boundaries themselves. Letter/number lookarounds under the u flag treat them as part of the
// word, which is what "nō ka ʻoi" needs.
const escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PIDGIN_PHRASE_PATTERNS = PIDGIN_PHRASE_KEYS.map(key => ({
    key,
    regex: new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(key)}(?![\\p{L}\\p{N}])`, 'giu')
}));

// Every map key as ONE alternation, longest key first.
//
// The final map sweep used to be a loop of ~700 separate replaces over the accumulating text,
// so each key was matched against the output of every key before it. Replacements that contain
// their own key restacked on each pass -- 'chee-hoo' -> 'chee-hoo!' came out "chee-hoo!!" and
// 'kay den' -> 'kay den...' came out "kay den......" -- and values could be re-substituted
// mid-word, which is why 'hoaloha' -> 'ho-ah-low-hah' was delivered as "hoh-ah-low-hah".
// A single left-to-right pass never rescans what it just inserted, so each occurrence is
// substituted exactly once. Longest-first ordering preserves the loop's longest-match-wins
// behaviour, since alternation takes the first branch that matches at a position.
const PIDGIN_MAP_SWEEP = new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${Object.keys(PIDGIN_PRONUNCIATION_MAP)
        .sort((a, b) => b.length - a.length)
        .map(escapeRegExp)
        .join('|')})(?![\\p{L}\\p{N}])`,
    'giu'
);

// Th-fronting (th -> d/t), applied after the map above. Kept separate because it is a
// rule class rather than a lookup, and restricted to common words so real English is not
// mangled. pronunciation-audit.js imports this too, so the audit models the same two
// stages the runtime applies.
const PIDGIN_TH_WORDS = {
    'the': 'dah',
    'that': 'daht',
    'this': 'dis',
    'them': 'dehm',
    'there': 'dea',
    'then': 'dehn',
    'their': 'dea',
    'they': 'dey',
    'with': 'wit',
    'mother': 'mah-dah',
    'father': 'fah-dah',
    'brother': 'bruh-dah'
};

// Synthesis settings shared by every path that calls ElevenLabs. These used to differ between
// live TTS (eleven_multilingual_v2 / 0.75) and the offline generators (eleven_flash_v2_5 / 0.8),
// so the same word could sound different depending on how it was produced. Standardized on
// eleven_flash_v2_5.
const ELEVENLABS_SYNTHESIS = {
    model_id: 'eleven_flash_v2_5',
    voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.0,
        use_speaker_boost: true
    }
};

// ---------------------------------------------------------------------------------------------
// Hawaiian syllabification, used only for words carrying a diacritic.
//
// A word written with an okina or a kahako is unambiguously Hawaiian, which is what makes this
// safe: no English word and no general Pidgin spelling carries one. Restricting the rule to
// those words avoids the trap of guessing from letters alone -- "moke" and "poke" are spelled
// with Hawaiian-legal letters but are not pronounced as Hawaiian.
//
// Before this existed, diacritic words fell through every rule: the okina was deleted and the
// macron passed to ElevenLabs verbatim, so 'aina was sent as "aina" and 'aumakua as "owmakua".
const HAWAIIAN_VOWEL_SOUNDS = { a: 'ah', e: 'eh', i: 'ee', o: 'oh', u: 'oo' };
const HAWAIIAN_DIPHTHONGS = { ai: 'eye', au: 'ow', ei: 'ay', oi: 'oy', ou: 'oh' };
const MACRON_TO_PLAIN = { 'ā': 'a', 'ē': 'e', 'ī': 'i', 'ō': 'o', 'ū': 'u' };

/** Hawaiian orthography: only h k l m n p w plus vowels, and every word ends in a vowel. */
function isHawaiianShaped(word) {
    const bare = String(word).replace(/['ʻ]/g, '').replace(/[^a-zāēīōū]/gi, '');
    return bare.length > 0
        && /^[aeiouāēīōūhklmnpw]+$/i.test(bare)
        && /[aeiouāēīōū]$/i.test(bare);
}

/**
 * True when the ASCII apostrophe at `index` is an okina rather than English punctuation.
 * Okina: word-initial before a vowel ('ahi), or between two vowels (a'ole).
 * Not an okina: possessives, contractions, or a trailing apostrophe (watchin').
 *
 * The word-initial case additionally requires the rest of the word to be Hawaiian-shaped,
 * because English clippings look identical otherwise -- 'em begins with an apostrophe and a
 * vowel too, and was being syllabified into "eh-m".
 */
function isOkinaAt(word, index) {
    const prev = word[index - 1];
    const next = word[index + 1];
    if (!next) return false;
    const isVowel = ch => ch && /[aeiouāēīōū]/i.test(ch);
    if (index === 0) return isVowel(next) && isHawaiianShaped(word.slice(1));
    return isVowel(prev) && isVowel(next);
}

function hasHawaiianDiacritic(word) {
    if (/[ʻāēīōū]/i.test(word)) return true;
    for (let i = 0; i < word.length; i++) {
        if (word[i] === "'" && isOkinaAt(word, i)) return true;
    }
    return false;
}

// Hawaiian words are short; anything longer than this is not a word we can usefully syllabify,
// and iterating it character-by-character on the server is just attacker-controlled work
// (CodeQL js/loop-bound-injection). Real entries top out well under this.
const MAX_SYLLABIFY_LENGTH = 64;

/** Split a Hawaiian word into (C)V syllables and render each phonetically. */
function hawaiianPhonetics(word) {
    if (word.length > MAX_SYLLABIFY_LENGTH) return word;
    // Okina marks a glottal stop, i.e. a syllable boundary; drop it and let the split handle it.
    let w = '';
    for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        if (ch === 'ʻ' || (ch === "'" && isOkinaAt(word, i))) continue;
        w += ch;
    }

    const syllables = [];
    let i = 0;
    while (i < w.length) {
        const ch = w[i];
        // Trailing punctuation rides along on the last syllable.
        if (!/[a-zāēīōū]/i.test(ch)) {
            if (syllables.length) syllables[syllables.length - 1] += ch; else syllables.push(ch);
            i++;
            continue;
        }
        let consonant = '';
        if (!/[aeiouāēīōū]/i.test(ch)) { consonant = ch; i++; }
        if (i >= w.length) { if (consonant) syllables.push(consonant); break; }

        const raw = w[i];
        const isLong = raw in MACRON_TO_PLAIN;
        const plain = (MACRON_TO_PLAIN[raw] || raw).toLowerCase();
        const nextRaw = w[i + 1];
        const pair = nextRaw ? plain + (MACRON_TO_PLAIN[nextRaw] || nextRaw).toLowerCase() : '';

        // A long vowel never joins the following vowel into a diphthong -- that is precisely
        // why 'aina is "ah-ee-nah" and not "eye-nah".
        if (!isLong && nextRaw && !(nextRaw in MACRON_TO_PLAIN) && HAWAIIAN_DIPHTHONGS[pair]) {
            syllables.push(consonant + HAWAIIAN_DIPHTHONGS[pair]);
            i += 2;
        } else {
            syllables.push(consonant + (HAWAIIAN_VOWEL_SOUNDS[plain] || plain));
            i += 1;
        }
    }
    return syllables.join('-');
}

// ---------------------------------------------------------------------------------------------
// Dictionary pronunciation guides.
//
// dictionary_entries.pronunciation already holds a human-authored respelling for most entries
// ("SHEE-shee", "ah-kah-MY", "OW-mah-koo-ah"). That is better evidence than any rule we can
// infer, so when the text being spoken IS a dictionary term, the guide wins outright.
//
// The guides live in Supabase rather than in this file on purpose: the dictionary is the system
// of record for content, and copying 679 respellings into source would recreate exactly the
// hand-synced duplication this module was refactored to eliminate. Callers inject them; the
// transform degrades to its algorithmic path when nothing has been injected.
let pronunciationGuides = new Map();

const normalizeSpokenKey = text => String(text).trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * @param {Array<{pidgin: string, pronunciation: string}>|Map|Object} entries
 * Guides are lowercased: the source data uses capitals to mark stress, but the map in this file
 * was tuned lowercase, and shouting at a TTS engine is not the same as stressing a syllable.
 */
function setPronunciationGuides(entries) {
    const next = new Map();
    const add = (term, guide) => {
        if (!term || !guide) return;
        const key = normalizeSpokenKey(term);
        const value = String(guide).trim().toLowerCase().replace(/\s+/g, ' ');
        // A guide that only restates the term adds nothing and costs a lookup.
        if (!key || !value || key === value) return;

        // The tuned map wins. It was tuned by ear against ElevenLabs specifically, whereas the
        // guides are reader-facing notation of mixed quality: for 73 terms the two disagree, and
        // the guide is often the worse choice for a TTS engine -- "small kine" loses the tuned
        // "kyne", "grindz" loses "gryndz", "mauka" reverts to "mau-kah" where "mow-kah" is the
        // whole point. Skipping these lets the term fall through to the map.
        if (PIDGIN_PRONUNCIATION_MAP[key] !== undefined) return;

        // Guides are authored for humans and some use IPA (bruddah is written "brə-də").
        // Characters outside a plain respelling alphabet are worse than no guide at all.
        if (!/^[a-z0-9 '\-,.!?]+$/.test(value)) return;

        next.set(key, value);
    };
    if (Array.isArray(entries)) entries.forEach(e => e && add(e.pidgin, e.pronunciation));
    else if (entries instanceof Map) entries.forEach((v, k) => add(k, v));
    else if (entries && typeof entries === 'object') Object.entries(entries).forEach(([k, v]) => add(k, v));
    pronunciationGuides = next;
    return next.size;
}

function getPronunciationGuideCount() { return pronunciationGuides.size; }

// Canonical phonetic transform: map substitution, th-fronting, vowel rules and the prosody
// pauses. Exported so the SERVER applies it at the /api/text-to-speech boundary; every caller
// therefore gets identical pronunciation instead of each re-implementing it. Do not fork this.
function applyPronunciationCorrections(text) {
    // An authored guide for the exact phrase beats every rule below it.
    const guide = pronunciationGuides.get(normalizeSpokenKey(text));
    if (guide) return guide;

        // Map of Pidgin words to phonetic spelling for better TTS pronunciation
        // Optimized specifically for ElevenLabs voices
        const pronunciationMap = PIDGIN_PRONUNCIATION_MAP;

        let correctedText = text.toLowerCase();

        // 0. Remove emojis - ElevenLabs can sometimes error on complex emojis 
        // or treat them as characters that exceed length limits
        correctedText = correctedText.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F3FB}-\u{1F3FF}\u{1F170}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F201}\u{1F202}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F23A}\u{1F250}\u{1F251}\u{1F300}-\u{1F321}\u{1F324}-\u{1F393}\u{1F396}-\u{1F39B}\u{1F39E}-\u{1F3F0}\u{1F3F3}-\u{1F3F5}\u{1F3F7}-\u{1F4FD}\u{1F4FF}-\u{1F53D}\u{1F549}-\u{1F54E}\u{1F550}-\u{1F567}\u{1F56F}\u{1F570}\u{1F573}-\u{1F579}\u{1F57B}-\u{1F5A3}\u{1F5A5}-\u{1F5FA}\u{1F600}-\u{1F6D2}\u{1F6E0}-\u{1F6EC}\u{1F6F0}-\u{1F6F3}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D4}\u{1F800}-\u{1F80B}\u{1F810}-\u{1F847}\u{1F850}-\u{1F859}\u{1F860}-\u{1F887}\u{1F890}-\u{1F8AD}\u{1F900}-\u{1F93A}\u{1F93C}-\u{1F945}\u{1F947}-\u{1F970}\u{1F973}-\u{1F976}\u{1F97A}\u{1F97C}-\u{1F9A2}\u{1F9B0}-\u{1F9B9}\u{1F9C0}-\u{1F9C2}\u{1F9D0}-\u{1F9FF}]/gu, '');

        // Advanced Phonetic Rules for ElevenLabs
        // These rules catch patterns that the map might miss

        // Map hits are settled: parked in a placeholder so no later rule can revise them.
        // Without this, a value containing its own key is matched again by the sweep further
        // down and stacks another copy of its tail ('chee-hoo' -> 'chee-hoo!' came out
        // "chee-hoo!!"), and a value can be re-substituted mid-word ('hoaloha' ->
        // 'ho-ah-low-hah' was delivered as "hoh-ah-low-hah", the leading 'ho' having been
        // rewritten inside the result). The map is the most specific evidence there is; once it
        // has spoken, the rule passes have nothing left to decide.
        const mapSlots = [];
        const settle = value => `\u0000${mapSlots.push(value) - 1}\u0000`;

        // 0b. Multi-word map entries. See PIDGIN_PHRASE_PATTERNS: these must be substituted
        // before any per-word rule gets a chance to rewrite the words they are made of.
        PIDGIN_PHRASE_PATTERNS.forEach(({ key, regex }) => {
            correctedText = correctedText.replace(regex, () => settle(pronunciationMap[key]));
        });

        // 1. Th-fronting (th -> d or t) - very characteristic of Pidgin
        // Only apply to common words to avoid mangling actual English
        const thWords = PIDGIN_TH_WORDS;
        
        Object.entries(thWords).forEach(([word, replacement]) => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            correctedText = correctedText.replace(regex, replacement);
        });

        // 2. Final 'r' dropping (non-rhoticity)
        // car -> cah, water -> watah
        //
        // Lookbehind rather than a capture group: /(\w+)er\b/ is polynomial (CodeQL
        // js/polynomial-redos). The engine retries the \w+ prefix from every start position, so
        // a long run of word characters costs O(n^2) -- measured at 0.9ms for 2k chars but 56ms
        // for 16k. That became server-side exposure when phonetics moved to routes/tts.js.
        // The lookbehind form is flat (~0.03ms at 16k) and produces identical output.
        correctedText = correctedText.replace(/(?<=\w)er\b/g, 'ah');
        correctedText = correctedText.replace(/(?<=\w)ar\b/g, 'ah');
        correctedText = correctedText.replace(/(?<=\w)or\b/g, 'oh');

        // 3. Vowel Adjustments for Hawaiian words
        // 'ai' usually sounds like 'eye'
        // 'au' usually sounds like 'ow' (as in cow)
        
        // Helper to check if a word is likely Hawaiian/Pidgin (contains unique patterns)
        const isPidginLike = (word) => {
            // Exclude common English words that might trigger false positives
            const commonEnglish = [
                'you', 'your', 'out', 'about', 'around', 'sound', 'house', 'mouth', 'stout', 'shout',
                'friend', 'believe', 'field', 'piece', 'view', 'die', 'lie', 'tie', 'tried',
                'cousin', 'jealous', 'touch', 'enough', 'rough', 'tough', 'young', 'country', 'should', 'would', 'could',
                'lunch', 'just', 'much', 'such', 'but', 'bus', 'up', 'us', 'under', 'until', 'uncle',
                'buss', 'buggah', 'bust', 'cuz', 'humbug', 'funny', 'rub', 'rubbah', 'surf', 'brush', 'crush', 'must', 'trust',
                'chance', 'dance', 'lance', 'glance', 'france', 'stance', 'bruddah', 'laff', 'chawan', 'stay', 'broke',
                'aunty', 'going', 'nails', 'worries', 'wait', 'bait', 'shark', 'choice', 'goin', 'townie', 'point', 'noise',
                'voice', 'boil', 'oil', 'soil', 'join', 'coin', 'enjoy', 'boy', 'toy', 'joy',
                'cut', 'joke', 'um', 'them', 'then', 'than', 'that', 'this', 'there', 'their', 'they', 'with', 'jealous',
                'mout', 'bout', 'bust', 'pilau', 'up', 'em'
            ];
            if (commonEnglish.includes(word.toLowerCase())) return false;

            // Substring hints like 'ou' or 'ai' are far too loose on their own: they matched
            // our, sour, hour, flour, tour, four and pour, all of which the u->oo rule then
            // turned into "ooor", "sooor" and so on. The allowlist above only ever caught the
            // ones somebody noticed. Require the word to be shaped like Hawaiian as well --
            // Hawaiian uses only h k l m n p w and the vowels, and every word ends in a vowel.
            return /['ʻ]/.test(word) || pronunciationMap[word.replace(/['ʻ]/g, '')] ||
                   ['ka', 'la', 'ma', 'na', 'ha', 'ke', 'le', 'me', 'ne', 'he', 'oi', 'ai', 'au', 'ei', 'ie', 'ou', 'lua', 'pua', 'hua'].some(s => word.includes(s));
        };
        const words = correctedText.split(/\s+/);
        const processedWords = words.map(word => {
            // Check map with and without okinas
            const cleanWord = word.replace(/['ʻ]/g, '');
            if (pronunciationMap[word]) return settle(pronunciationMap[word]);
            if (pronunciationMap[cleanWord]) return settle(pronunciationMap[cleanWord]);
            
            // A diacritic makes the word unambiguously Hawaiian; syllabify rather than guess.
            if (hasHawaiianDiacritic(word)) {
                return hawaiianPhonetics(word);
            }

            if (isPidginLike(word)) {
                let w = word.replace(/['ʻ]/g, '-'); // Pause for okinas
                w = w.replace(/ai/g, 'eye');
                w = w.replace(/au/g, 'ow');
                w = w.replace(/oi/g, 'oy');
                w = w.replace(/ei/g, 'ay');
                w = w.replace(/ie/g, 'ee-eh');
                // Hawaiian 'u' sounds like 'oo' (as in hula, pupule)
                // But only if it's likely a Hawaiian word and not English/Pidgin
                // The u->oo rule is Hawaiian, so it only applies to vowel-final words. Without
                // that guard it fired on English 'ou' words -- our, sour, hour, flour, tour,
                // four, pour all became "ooor", "sooor" and so on. Gating the rule rather than
                // the whole branch keeps the diphthong rules working for non-Hawaiian Pidgin
                // and loanwords (katsu, bambucha, aiyah), which end in a vowel too.
                const vowelFinal = /[aeiouāēīōū]$/i.test(w.replace(/[^a-zāēīōū]/gi, ''));
                if (vowelFinal && !w.includes('oo') && !w.includes('ow')) {
                    w = w.replace(/\bu\b/g, 'oo');
                    w = w.replace(/u(?![nstp])/g, 'oo');
                }
                // Clean up leading/trailing hyphens from okinas
                w = w.replace(/^-/, '').replace(/-$/, '');
                return w;
            }
            return word;
        });
        
        correctedText = processedWords.join(' ');

        // 4. Apply hardcoded corrections (multi-word and high-priority) in one pass.
        // See PIDGIN_MAP_SWEEP for why this is a single alternation rather than a loop.
        correctedText = correctedText.replace(PIDGIN_MAP_SWEEP,
            match => pronunciationMap[match.toLowerCase()] ?? match);

        // Settled map values return to the text only now that every rule that could have
        // rewritten them has run. The rhythm rules below still see them, which is what
        // "..., brah" needs.
        if (mapSlots.length) {
            correctedText = correctedText.replace(/\u0000(\d+)\u0000/g,
                (whole, index) => mapSlots[Number(index)] ?? whole);
        }

        // 5. Add natural pauses for Pidgin rhythm
        // Each of these inserts a comma for rhythm. They must only fire when there is something
        // to pause *between*, and must not fire again on their own output: the old `brah` rule
        // turned "brah" into ", brah" and stacked another comma every time it was reapplied.
        correctedText = correctedText
            .replace(/(?<![\w-])eh(?![\w-])(?!\s*,)(?!\.\.\.)/gi, 'eh,')
            .replace(/(?<![\w-])hoh(?![\w-])(?!\s*,)(?!\.\.\.)/gi, 'hoh,')
            .replace(/([^\s,])\s+brah(?![-\w])(?!\.\.\.)/gi, '$1, brah')
            .replace(/([^\s,])\s*\byeah\b\?/gi, '$1, yeah?')
            .replace(/([^\s,])\s*\bo wat\b\?/gi, '$1, or wat?')
            .replace(/\s{2,}/g, ' ')
            .replace(/,\s*$/, '')
            .trim();

        return correctedText;
    }

class ElevenLabsSpeech {
    constructor() {
        this.isPlaying = false;
        this.currentAudio = null;
        this.cache = new Map(); // In-memory cache
        this.pregeneratedIndex = new Map(); // Index of pre-generated local audio files
        this.dbName = 'PidginAudioCache';
        this.storeName = 'audioCache';
        this.initializationPromise = this.initialize();
    }

    async initialize() {
        await Promise.all([
            this.initIndexedDB(),
            this.loadCacheFromDB(),
            this.loadPregeneratedIndex()
        ]);
        return true;
    }

    async loadPregeneratedIndex() {
        try {
            const supabaseStorageUrl = 'https://jfzgzjgdptowfbtljvyp.supabase.co/storage/v1/object/public/audio-assets';
            const response = await fetch(`${supabaseStorageUrl}/index.json`);
            if (response.ok) {
                const data = await response.json();
                Object.entries(data).forEach(([text, filename]) => {
                    this.pregeneratedIndex.set(text.toLowerCase(), filename);
                });
                console.log(`SW: Loaded ${this.pregeneratedIndex.size} pre-generated audio terms from Supabase`);
            }
        } catch (e) {
            // Silently fail if index doesn't exist yet
        }
    }

    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => {
                console.warn('IndexedDB not available, using memory cache only');
                resolve();
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'text' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    async loadCacheFromDB() {
        if (!this.db) return;

        try {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            return new Promise((resolve) => {
                request.onsuccess = (event) => {
                    const cachedItems = event.target.result;
                    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

                    cachedItems.forEach(item => {
                        // Only load items from the last week
                        if (item.timestamp > oneWeekAgo) {
                            this.cache.set(item.text, item.blob);
                        }
                    });

                    resolve();
                };

                request.onerror = () => {
                    console.warn('Failed to load cache from IndexedDB');
                    resolve();
                };
            });
        } catch (error) {
            console.warn('Error loading cache from IndexedDB:', error);
        }
    }

    async saveToDB(text, blob) {
        if (!this.db) return;

        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            store.put({
                text: text,
                blob: blob,
                timestamp: Date.now()
            });

            // Clean up old entries (older than 1 week)
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            const index = store.index('timestamp');
            const range = IDBKeyRange.upperBound(oneWeekAgo);

            index.openCursor(range).onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    store.delete(cursor.primaryKey);
                    cursor.continue();
                }
            };
        } catch (error) {
            console.warn('Failed to save to IndexedDB:', error);
        }
    }

    // Pidgin pronunciation corrections for TTS
    applyPronunciationCorrections(text) {
        return applyPronunciationCorrections(text);
    }

    async speak(text, options = {}) {
        const maxRetries = 2; // Retry failed API calls
        let attempt = 0;

        // Prevent concurrent speak attempts
        if (this.currentSpeakPromise) {
            this.stop();
            // Wait a bit for cleanup
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Store current speak promise to prevent concurrent calls
        const speakPromise = (async () => {
            while (attempt <= maxRetries) {
                try {
                    // Wait for initialization
                    await this.initializationPromise;

                    // Detect if text is a direct URL (Supabase audio or pre-recorded)
                    const isUrl = text.startsWith('http') || text.startsWith('/') || text.endsWith('.mp3');
                    if (isUrl) {
                        try {
                            const response = await fetch(text);
                            if (response.ok) {
                                const audioBlob = await response.blob();
                                if (!options.silent) {
                                    const success = await this.playAudioBlobWithRetry(audioBlob, text, text);
                                    if (success) return;
                                } else {
                                    return;
                                }
                            }
                        } catch (e) {
                            console.warn('Direct URL audio fetch failed:', e);
                        }
                    }

                    // Only stop if we're going to play new audio (not during retries)
                    if (attempt === 0) {
                        this.stop();
                    }

                    // Apply pronunciation corrections for Pidgin words
                    const correctedText = this.applyPronunciationCorrections(text);

                    // Normalize text and partition cache by voice ID
                    const normalizedText = text.trim().toLowerCase();
                    const voiceId = options.voiceId || 'f0ODjLMfcJmlKfs7dFCW';
                    const cacheKey = `${voiceId}_${normalizedText}`;

                    // Check cache first (voice-specific with fallback)
                    const cachedBlob = this.cache.get(cacheKey) || this.cache.get(normalizedText);
                    if (cachedBlob) {
                        if (!options.silent) {
                            window.dispatchEvent(new CustomEvent('pidginSpeechStart'));
                            if (options.onStart) options.onStart();

                            // Try to play cached audio with retry fallback
                            const success = await this.playAudioBlobWithRetry(cachedBlob, correctedText, cacheKey);
                            
                            if (options.onEnd) options.onEnd();
                            
                            if (success) return;

                            // If cached audio failed, remove from cache and retry API
                            this.cache.delete(cacheKey);
                            this.cache.delete(normalizedText);
                            // Continue to API call below
                        } else {
                            return; // Silent mode, don't play
                        }
                    }

                    // Check pre-generated index for local file
                    if (this.pregeneratedIndex.has(normalizedText)) {
                        try {
                            const supabaseStorageUrl = 'https://jfzgzjgdptowfbtljvyp.supabase.co/storage/v1/object/public/audio-assets';
                            const filename = this.pregeneratedIndex.get(normalizedText);
                            const response = await fetch(`${supabaseStorageUrl}/${filename}`);
                            if (response.ok) {
                                const audioBlob = await response.blob();
                                // Cache it for next time
                                this.cache.set(cacheKey, audioBlob);
                                
                                if (!options.silent) {
                                    window.dispatchEvent(new CustomEvent('pidginSpeechStart'));
                                    const success = await this.playAudioBlobWithRetry(audioBlob, correctedText, cacheKey);
                                    if (options.onEnd) options.onEnd();
                                    if (success) return;
                                } else {
                                    return;
                                }
                            }
                        } catch (e) {
                            console.warn('Local audio fetch failed, falling back to API:', e);
                        }
                    }

                    // Show loading state if callback provided
                    if (options.onStart) options.onStart();

                    // Make request to our backend API with corrected pronunciation
                    const response = await fetch('/api/text-to-speech', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            text: correctedText,  // Use corrected text for better pronunciation
                            originalText: text,   // Keep original for reference
                            voiceId: voiceId      // Pass through the requested voiceId
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`TTS request failed: ${response.status} ${response.statusText}`);
                    }

                    // Get audio blob from response
                    const audioBlob = await response.blob();

                    // Validate blob
                    if (!audioBlob || audioBlob.size === 0) {
                        throw new Error('Received empty audio blob from API');
                    }

                    // Cache the audio for future use (per voice)
                    this.cache.set(cacheKey, audioBlob);

                    // Also save to IndexedDB for persistent storage
                    await this.saveToDB(cacheKey, audioBlob);

                    // Play the audio (unless silent mode for preloading)
                    if (!options.silent) {
                        window.dispatchEvent(new CustomEvent('pidginSpeechStart'));
                        const success = await this.playAudioBlobWithRetry(audioBlob, correctedText, normalizedText);
                        if (options.onEnd) options.onEnd();
                        
                        // If it failed but didn't actually start playing, we might want to retry
                        // But if it started playing and just timed out later, we definitely DON'T want to retry (causes double playback)
                        if (!success && attempt < maxRetries) {
                            // Only retry if it was a real failure, not a blocked playback or a timeout after starting
                            throw new Error('Audio playback failed or never started, retrying API call');
                        }
                    }

                    if (options.onSuccess) {
                        options.onSuccess();
                    }

                return; // Success, exit retry loop

            } catch (error) {
                console.error(`ElevenLabs TTS error (attempt ${attempt + 1}):`, error);

                attempt++;

                if (attempt <= maxRetries) {
                    // Wait before retry (exponential backoff)
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // All retries exhausted

                    if (options.onError) {
                        options.onError(error);
                    }

                    // Fallback to browser speech synthesis
                    this.fallbackToWebSpeech(text);
                    return;
                }
        }
            }
        })();

        // Store the promise to prevent concurrent calls
        this.currentSpeakPromise = speakPromise;

        try {
            await speakPromise;
        } finally {
            // Clear the promise when done
            if (this.currentSpeakPromise === speakPromise) {
                this.currentSpeakPromise = null;
            }
        }
    }

    // New method with retry logic and better error handling
    async playAudioBlobWithRetry(audioBlob, fallbackText = '', cacheKey = '', maxRetries = 1) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            let audioUrl = null;
            let audio = null;

            try {
                // Ensure we have a valid blob
                if (!audioBlob || !(audioBlob instanceof Blob)) {
                    console.error('Invalid audio blob');
                    return false;
                }

                // Create fresh audio URL from blob for each attempt
                audioUrl = URL.createObjectURL(audioBlob);
                audio = new Audio(audioUrl);

                // Don't interrupt existing audio during retries
                if (attempt === 0) {
                    // Only set current audio on first attempt
                    this.currentAudio = audio;
                    this.currentAudioUrl = audioUrl;
                    this.isPlaying = true;
                }

                // Return a promise that resolves when audio starts playing successfully
                const playResult = await new Promise((resolve, reject) => {
                    let resolved = false;
                    let cleanupDone = false;
                    let playbackStarted = false;

                    const cleanup = () => {
                        if (cleanupDone) return;
                        cleanupDone = true;

                        if (audioUrl && (attempt === maxRetries || !resolved)) {
                            // Revoke URL on final attempt or if we're done with this attempt
                            setTimeout(() => URL.revokeObjectURL(audioUrl), 1000);
                        }

                        if (attempt === 0) {
                            // Only clean main references on first attempt
                            this.isPlaying = false;
                            if (this.currentAudio === audio) {
                                this.currentAudio = null;
                                this.currentAudioUrl = null;
                            }
                        }
                    };

                    // Timer for starting playback
                    const startTimeout = setTimeout(() => {
                        if (!playbackStarted && !resolved) {
                            console.warn(`SW: Audio failed to start within 10s for: ${cacheKey}`);
                            resolved = true;
                            cleanup();
                            reject(new Error('Audio play timeout (never started)'));
                        }
                    }, 10000);

                    // Long timer for total playback (safety measure)
                    const finishTimeout = setTimeout(() => {
                        if (!resolved) {
                            console.warn(`SW: Audio exceeded maximum playback time (5m) for: ${cacheKey}`);
                            if (audio) audio.pause();
                            resolved = true;
                            cleanup();
                            reject(new Error('Audio play timeout (took too long)'));
                        }
                    }, 300000);

                    // Set up event listeners
                    const onEnded = () => {
                        if (!resolved) {
                            clearTimeout(startTimeout);
                            clearTimeout(finishTimeout);
                            window.dispatchEvent(new CustomEvent('pidginSpeechEnd'));
                            resolved = true;
                            resolve(true);
                        }
                        cleanup();
                    };

                    const onError = (e) => {
                        if (!resolved) {
                            clearTimeout(startTimeout);
                            clearTimeout(finishTimeout);
                            window.dispatchEvent(new CustomEvent('pidginSpeechEnd'));
                            console.error('Audio playback error:', e);
                            resolved = true;
                            reject(e);
                        }
                        cleanup();
                    };

                    // Add listeners
                    audio.addEventListener('ended', onEnded, { once: true });
                    audio.addEventListener('error', onError, { once: true });

                    // Attempt to play
                    audio.play().then(() => {
                        playbackStarted = true;
                        // We don't clear the finishTimeout here, as we still want to resolve on 'ended'
                    }).catch(error => {
                        clearTimeout(startTimeout);
                        clearTimeout(finishTimeout);
                        
                        if (error.name === 'NotAllowedError') {
                            if (!resolved) {
                                resolved = true;
                                resolve(false); // Not really a failure, just blocked
                            }
                        } else if (error.name === 'AbortError') {
                            if (!resolved) {
                                resolved = true;
                                resolve(false);
                            }
                        } else {
                            console.error('Audio play error:', error);
                            if (!resolved) {
                                window.dispatchEvent(new CustomEvent('pidginSpeechEnd'));
                                resolved = true;
                                reject(error);
                            }
                        }
                        cleanup();
                    });
                });

                return playResult;

            } catch (error) {
                console.error(`Audio play attempt ${attempt + 1} failed:`, error);
                
                // Ensure audio is stopped on error
                if (audio) {
                    try { audio.pause(); } catch(e) {}
                }

                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                } else {
                    return false;
                }
            }
        }

        return false;
    }

    // Legacy method for backward compatibility
    playAudioBlob(audioBlob, fallbackText = '') {
        this.playAudioBlobWithRetry(audioBlob, fallbackText).then(success => {
            if (!success && fallbackText) {
                this.fallbackToWebSpeech(fallbackText);
            }
        }).catch(error => {
            console.error('Error playing audio blob:', error);
            if (fallbackText) {
                this.fallbackToWebSpeech(fallbackText);
            }
        });
    }

    // Helper method for cleanup
    cleanup() {
        this.isPlaying = false;
        if (this.currentAudioUrl) {
            URL.revokeObjectURL(this.currentAudioUrl);
            this.currentAudioUrl = null;
        }
        this.currentAudio = null;
    }

    fallbackToWebSpeech(text) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.dispatchEvent(new CustomEvent('pidginSpeechStart'));
            
            // Apply pronunciation corrections for better Web Speech API pronunciation
            const correctedText = this.applyPronunciationCorrections(text);
            const utterance = new window.SpeechSynthesisUtterance(correctedText);
            
            utterance.onend = () => window.dispatchEvent(new CustomEvent('pidginSpeechEnd'));
            utterance.onerror = () => window.dispatchEvent(new CustomEvent('pidginSpeechEnd'));
 
            utterance.rate = 0.85; // Slightly slower for pidgin
            utterance.pitch = 0.95; // Slightly lower pitch
            utterance.volume = 0.9;
 
            // Try to find the best available voice
            const voices = window.speechSynthesis.getVoices();
 
            // Priority order for voices
            const voicePreferences = [
                voice => voice.name.includes('Samantha'), // macOS natural voice
                voice => voice.name.includes('Daniel'), // British accent
                voice => voice.name.includes('Karen'), // Australian accent
                voice => voice.name.includes('Natural'),
                voice => voice.name.includes('Enhanced'),
                voice => voice.lang === 'en-US',
                voice => voice.lang.startsWith('en')
            ];
 
            let selectedVoice = null;
            for (const preference of voicePreferences) {
                selectedVoice = voices.find(preference);
                if (selectedVoice) break;
            }
 
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
 
            // Add slight pauses for better pronunciation
            const modifiedText = correctedText
                .replace(/([.!?])/g, '$1 ')  // Add pause after punctuation
                .replace(/,/g, ', ');         // Add pause after commas
 
            utterance.text = modifiedText;
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('Speech synthesis not supported');
            alert('Text-to-speech is not available. Please try a different browser.');
        }
    }
 
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
 
        this.cleanup();
 
        // Also stop web speech synthesis
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    isSupported() {
        // ElevenLabs is server-side, so always supported if fetch is available
        return typeof fetch !== 'undefined';
    }

    getVoiceInfo() {
        return {
            name: 'Hawaiian Local Voice (ElevenLabs)',
            description: 'Authentic Hawaiian Pidgin pronunciation powered by AI',
            provider: 'ElevenLabs',
            language: 'Hawaiian Pidgin English',
            quality: 'Premium'
        };
    }

    // Method to preload common terms
    async preloadCommonTerms(terms = []) {
        const commonPidginTerms = [
            'aloha', 'mahalo', 'pau', 'grindz', 'da kine', 'brah', 'shoots',
            'howzit', 'talk story', 'broke da mouth', 'chicken skin', 'stink eye',
            ...terms
        ];

        // Preload in batches to avoid overwhelming the API
        const batchSize = 3;
        for (let i = 0; i < commonPidginTerms.length; i += batchSize) {
            const batch = commonPidginTerms.slice(i, i + batchSize);

            const promises = batch.map(async (term) => {
                if (!this.cache.has(term.toLowerCase())) {
                    try {
                        await this.speak(term, { silent: true });
                        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
                    } catch (error) {
                        console.warn(`Failed to preload "${term}":`, error);
                    }
                }
            });

            await Promise.all(promises);

            // Delay between batches
            if (i + batchSize < commonPidginTerms.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

    }

    // Get cache statistics
    getCacheStats() {
        return {
            cachedTerms: this.cache.size,
            memoryUsage: Array.from(this.cache.values()).reduce((total, blob) => total + blob.size, 0)
        };
    }

    // Clear cache to free memory
    clearCache() {
        this.cache.clear();

        // Also clear IndexedDB
        if (this.db) {
            try {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                store.clear();
            } catch (error) {
                console.warn('Failed to clear IndexedDB cache:', error);
            }
        }

    }
}

// Create global instance (browser only -- the constructor touches IndexedDB, so Node
// consumers such as the pronunciation audit must be able to require this file without it).
if (typeof window !== 'undefined') {
    const elevenLabsSpeech = new ElevenLabsSpeech();
    window.elevenLabsSpeech = elevenLabsSpeech;
}

// Export for use in other modules (Node/Bundlers). The default export stays the class for
// backward compatibility; the map rides along as a property.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElevenLabsSpeech;
    module.exports.PIDGIN_PRONUNCIATION_MAP = PIDGIN_PRONUNCIATION_MAP;
    module.exports.PIDGIN_TH_WORDS = PIDGIN_TH_WORDS;
    module.exports.applyPronunciationCorrections = applyPronunciationCorrections;
    module.exports.ELEVENLABS_SYNTHESIS = ELEVENLABS_SYNTHESIS;
    module.exports.setPronunciationGuides = setPronunciationGuides;
    module.exports.getPronunciationGuideCount = getPronunciationGuideCount;
}