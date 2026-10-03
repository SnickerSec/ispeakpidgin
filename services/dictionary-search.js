/**
 * Dictionary keyword search, shared by the /api/dictionary routes.
 *
 * Matching is accent- and ʻokina-insensitive: headwords are stored with kahakō and
 * ʻokina (tūtū, lūʻau, ʻōkole) but people type them plain (tutu, luau, okole). Comparing
 * raw lowercase strings made 65 of 799 headwords unreachable by their plain spelling.
 *
 * The browser keeps its own copy of this scoring in
 * src/components/shared/supabase-data-loader.js (fuzzySearch); the runtime image cannot
 * serve src/, and the browser cannot load services/. tools/testing/test-dictionary-search.js
 * runs the same cases through both so they cannot drift apart.
 */

// Lowercase, strip combining marks (kahakō, accents) and ʻokina/apostrophes, collapse spaces
function foldForSearch(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[ʻʼ'‘’`]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function scoreEntry(entry, searchTerm) {
    let score = 0;
    const pidgin = foldForSearch(entry.pidgin);

    if (pidgin === searchTerm) score = 1.0;
    else if (pidgin.startsWith(searchTerm)) score = 0.85;
    else if (pidgin.includes(searchTerm)) score = 0.7;

    const english = Array.isArray(entry.english) ? entry.english : [entry.english];
    for (const meaning of english) {
        const eng = foldForSearch(meaning);
        if (!eng) continue;
        if (eng === searchTerm) score = Math.max(score, 0.9);
        else if (eng.startsWith(searchTerm)) score = Math.max(score, 0.75);
        else if (eng.includes(searchTerm)) score = Math.max(score, 0.6);
    }
    return score;
}

/**
 * Rank entries against a search term, best match first.
 * @param {Array<object>} entries - dictionary_entries rows ({ pidgin, english[] })
 * @param {string} term - raw user input
 * @param {number} [limit] - maximum results
 */
function searchEntries(entries, term, limit = Infinity) {
    const searchTerm = foldForSearch(term);
    if (!searchTerm) return [];

    const results = [];
    for (const entry of entries || []) {
        const score = scoreEntry(entry, searchTerm);
        if (score > 0) results.push({ entry, score });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit).map(r => r.entry);
}

module.exports = { foldForSearch, searchEntries };
