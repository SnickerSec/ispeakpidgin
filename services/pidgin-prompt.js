/**
 * How every model prompt names the site's language.
 *
 * "Hawaiian Pidgin" alone is not enough: gemini-2.5-flash-lite answered translator questions in
 * ʻōlelo Hawaiʻi ("Where are you going?" -> "Kōhea ʻoe e hele ai?"), and an assistant asked about
 * "Hawaiian words" in Pidgin answered from Hawaiian-language dictionaries. Naming the language as
 * Hawaiʻi Creole English and saying outright that it is not the Hawaiian language fixes both.
 * Use this in any prompt that asks a model to write, translate or judge Pidgin.
 */
const PIDGIN_DEFINITION =
    'Hawaiian Pidgin (Hawaiʻi Creole English, HCE) is the English-based creole spoken by locals in Hawaiʻi. ' +
    'It is NOT the Hawaiian language (ʻōlelo Hawaiʻi). Write Pidgin, never Hawaiian-language sentences; ' +
    'only use the Hawaiian loanwords locals mix into Pidgin (mahalo, pau, ono, keiki, etc.).';

module.exports = { PIDGIN_DEFINITION };
