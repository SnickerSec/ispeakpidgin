// Pukui-Elbert Hawaiian orthoepy -> deterministic English respelling.
//
// This exists because the tuned map was systematically wrong about Hawaiian in ways no
// individual word review would have caught: short 'e' was rendered "ay" when it is "eh"
// (poke was spoken "poh-kay", not "POH-keh"), the moraic sequence "oe" was collapsed to the
// diphthong "oy" (pahoehoe came out "pah-hoy-hoy"), the w -> v rule fired word-initially
// where it must not (wahine as "vah-hee-nay"), and "au" produced the malformed "laow".
// Encoding the standard once, and deriving the respellings from it, replaces a hundred
// individual judgement calls with one reviewable rule set.
//
// Three rules are implied by the spec's worked examples rather than stated in its prose:
//   1. "ai"/"ae" render as "eye" standing alone but "ye" after a consonant -- the spec's own
//      "kai -> KYE / eye" and "mae -> MYE" would otherwise come out "KEYE"/"MEYE".
//   2. A stressed nucleus spanning two morae uppercases only its first: "niu -> NEE-oo".
//   3. Stress is penultimate EXCEPT when the final syllable carries a diphthong, which pulls
//      it: "ʻeleu -> eh-LEH-oo", "hana hou -> ... HOH-oo". A final long vowel does not pull
//      stress ("nēnē -> NAY-nay", "pūpū -> POO-poo", "mōʻī -> MOH-ee").
// Reduplication (holoholo, pāhoehoe) stresses each half, but only when each half is itself
// polysyllabic -- which is why "nēnē" is NAY-nay and not NAY-NAY.
const OKINA_RE = /[ʻ'`‘’ʻ‘’]/;
const LONG = { 'ā':'a', 'ē':'e', 'ī':'i', 'ō':'o', 'ū':'u' };
const SHORT_V = { a:'ah', e:'eh', i:'ee', o:'oh', u:'oo' };
const LONG_V  = { a:'ah', e:'ay', i:'ee', o:'oh', u:'oo' };
const DIPH = {
    ai: { alone:'eye', after:'ye' }, ae: { alone:'eye', after:'ye' },
    ao: { alone:'ow', after:'ow' },  au: { alone:'ow', after:'ow' },
    ei: { alone:'ay', after:'ay' },  oi: { alone:'oy', after:'oy' },
    eu: { alone:'eh-oo', after:'eh-oo' }, iu: { alone:'ee-oo', after:'ee-oo' },
    ou: { alone:'oh-oo', after:'oh-oo' }
};
// oe and ea are moraic sequences, never diphthongs: they must not collapse to "oy"/"air".
const CONS = 'hklmnpw';

function syllabify(word) {
    const chars = [];
    for (const ch of String(word).toLowerCase()) {
        if (OKINA_RE.test(ch)) { chars.push({ t:'okina' }); continue; }
        if (LONG[ch]) chars.push({ t:'v', v:LONG[ch], long:true, src:ch });
        else if ('aeiou'.includes(ch)) chars.push({ t:'v', v:ch, long:false, src:ch });
        else if (CONS.includes(ch)) chars.push({ t:'c', c:ch });
        else return null;
    }
    const syls = [];
    let i = 0, cons = null, prevVowel = null;
    while (i < chars.length) {
        const ch = chars[i];
        if (ch.t === 'okina') { cons = 'okina'; i++; continue; }
        if (ch.t === 'c') { cons = ch.c; i++; continue; }
        const next = chars[i + 1];
        const pair = next && next.t === 'v' && !ch.long && !next.long ? ch.v + next.v : null;
        let nucleus, diph = false, src;
        if (pair && DIPH[pair]) {
            diph = true;
            nucleus = cons && cons !== 'okina' ? DIPH[pair].after : DIPH[pair].alone;
            src = pair; i += 2;
        } else {
            nucleus = ch.long ? LONG_V[ch.v] : SHORT_V[ch.v];
            src = ch.src; i += 1;
        }
        syls.push({ cons, nucleus, diph, long: ch.long, prevVowel, src: (cons || '') + src });
        prevVowel = ch.v; cons = null;
    }
    return syls;
}

// Largest reduplicated tail whose halves are polysyllabic.
function reduplicationStress(syls) {
    for (let start = 0; start <= syls.length - 4; start++) {
        const tail = syls.slice(start);
        if (tail.length % 2) continue;
        const half = tail.length / 2;
        if (half < 2) continue;
        const a = tail.slice(0, half).map(s => s.src).join('');
        const b = tail.slice(half).map(s => s.src).join('');
        if (a === b) return [start + half - 2, start + tail.length - 2];
    }
    return null;
}

function respell(word) {
    const syls = syllabify(word);
    if (!syls || !syls.length) return null;
    let stressed = reduplicationStress(syls);
    if (!stressed) {
        const last = syls.length - 1;
        stressed = [syls.length >= 2 && !syls[last].diph ? last - 1 : last];
    }
    const set = new Set(stressed);
    return syls.map((s, idx) => {
        let c = s.cons;
        if (!c || c === 'okina') c = '';
        else if (c === 'w') c = (s.prevVowel === 'i' || s.prevVowel === 'e') ? 'v' : 'w';
        const token = c + s.nucleus;
        if (!set.has(idx)) return token;
        const parts = token.split('-');           // uppercase only the first mora
        parts[0] = parts[0].toUpperCase();
        return parts.join('-');
    }).join('-');
}

const respellPhrase = phrase => String(phrase).trim().split(/\s+/).map(respell).some(r => r === null)
    ? null : String(phrase).trim().split(/\s+/).map(respell).join(' ');

module.exports = { respell, respellPhrase, syllabify };
