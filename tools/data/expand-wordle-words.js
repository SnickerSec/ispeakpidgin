#!/usr/bin/env node

/**
 * expand-wordle-words.js
 *
 * Enriches and expands Supabase wordle_words:
 * 1. Backfills authentic meanings and pronunciations from dictionary_entries
 *    for existing 5-letter Pidgin words that currently have null meanings.
 * 2. Inserts 50 curated authentic 5-letter Pidgin / Hawaiian words with
 *    definitions, pronunciations, and difficulty levels.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const NEW_WORDLE_WORDS = [
  { word: "MOCHI", meaning: "Sweet chewy Japanese rice cake enjoyed across Hawaii", pronunciation: "MOH-chee", difficulty: "easy" },
  { word: "LIDIS", meaning: "Like this, in this manner ('do um lidis')", pronunciation: "lie-DIS", difficulty: "easy" },
  { word: "BOCHI", meaning: "Graveyard or cemetery (Japanese origin)", pronunciation: "BOH-chee", difficulty: "medium" },
  { word: "CHOOM", meaning: "Island slang meaning to smoke or chill with friends", pronunciation: "CHOOM", difficulty: "easy" },
  { word: "BLINE", meaning: "Blind; island expression for 'for real?' or disbelief", pronunciation: "BLINE", difficulty: "easy" },
  { word: "STEAH", meaning: "Stay; island auxiliary verb indicating location or ongoing state", pronunciation: "STEH-ah", difficulty: "easy" },
  { word: "LUMPI", meaning: "Lumpia; Filipino crispy spring roll staple in plate lunches", pronunciation: "LOOM-pyah", difficulty: "easy" },
  { word: "PUPUS", meaning: "Appetizers, hors d'oeuvres, or snacks served with drinks", pronunciation: "POO-pooz", difficulty: "easy" },
  { word: "MALAS", meaning: "Malasada; Portuguese hole-less sugar doughnut staple", pronunciation: "mah-lah-SAH-dah", difficulty: "easy" },
  { word: "MANAP", meaning: "Manapua; Hawaii baked or steamed pork bun", pronunciation: "mah-nah-POO-ah", difficulty: "easy" },
  { word: "MUSUB", meaning: "Musubi; seasoned rice block with nori (e.g. spam musubi)", pronunciation: "moo-SOO-bee", difficulty: "easy" },
  { word: "LOMIS", meaning: "Lomi salmon; salted salmon salad with tomatoes and onions", pronunciation: "LOH-mee", difficulty: "easy" },
  { word: "KAUAI", meaning: "The Garden Isle; oldest of the main Hawaiian islands", pronunciation: "kow-EYE-ee", difficulty: "easy" },
  { word: "LUAUS", meaning: "Traditional Hawaiian feasts with music, hula, and food", pronunciation: "LOO-owz", difficulty: "easy" },
  { word: "POKIS", meaning: "Poke dishes; diced marinated fresh raw fish", pronunciation: "POH-keez", difficulty: "easy" },
  { word: "TIKIS", meaning: "Carved wooden or stone Polynesian humanoid figures", pronunciation: "TEE-keez", difficulty: "easy" },
  { word: "UKULE", meaning: "Ukulele; four-stringed Hawaii musical instrument", pronunciation: "oo-koo-LEH-leh", difficulty: "easy" },
  { word: "MAHIS", meaning: "Mahi-mahi; delicious local dolphin fish / dorado", pronunciation: "MAH-heez", difficulty: "easy" },
  { word: "DAKIN", meaning: "Da kine; island placeholder for anything or anyone", pronunciation: "dah-KINE", difficulty: "easy" },
  { word: "BRAHS", meaning: "Brothers, buddies, or friends in island slang", pronunciation: "BRAHZ", difficulty: "easy" },
  { word: "FAKAS", meaning: "Guys or people; colloquial island term for folks", pronunciation: "FAH-kahz", difficulty: "medium" },
  { word: "TUTUS", meaning: "Grandmothers, elderly aunties, or beloved matriarchs", pronunciation: "TOO-tooz", difficulty: "easy" },
  { word: "UNCOS", meaning: "Uncles; older respected local men in the community", pronunciation: "UNG-kohz", difficulty: "easy" },
  { word: "POHOS", meaning: "Wasted things or situations that went out of luck", pronunciation: "POH-hohz", difficulty: "medium" },
  { word: "LUNAS", meaning: "Plantation foremen or supervisors in historic Hawaii", pronunciation: "LOO-nahz", difficulty: "medium" },
  { word: "HAPAS", meaning: "People of mixed ethnic heritage, especially Asian/Pacific", pronunciation: "HAH-pahz", difficulty: "easy" },
  { word: "LIMUS", meaning: "Edible marine algae and seaweeds used in poke", pronunciation: "LEE-mooz", difficulty: "medium" },
  { word: "MOKUS", meaning: "Islands, distinct districts, or land sections", pronunciation: "MOH-kooz", difficulty: "medium" },
  { word: "KULAS", meaning: "Open country fields, pastures, or schools", pronunciation: "KOO-lahz", difficulty: "medium" },
  { word: "KANAS", meaning: "Kanaka; Native Hawaiian people or locals", pronunciation: "KAH-nahz", difficulty: "medium" },
  { word: "AHUIS", meaning: "A hui hou; Hawaiian farewell greeting meaning until we meet", pronunciation: "ah-HOO-weez", difficulty: "medium" },
  { word: "PAINA", meaning: "Small festive party, dinner gathering, or informal meal", pronunciation: "pie-EE-nah", difficulty: "medium" },
  { word: "HOKUS", meaning: "Stars in the night sky; navigational markers for voyagers", pronunciation: "HOH-kooz", difficulty: "medium" },
  { word: "MANAS", meaning: "Spiritual energy, divine authority, and personal power", pronunciation: "MAH-nahz", difficulty: "medium" },
  { word: "MELES", meaning: "Traditional Hawaiian chants, poetic songs, and anthems", pronunciation: "MEH-lehz", difficulty: "medium" },
  { word: "MOANA", meaning: "The broad open ocean, deep sea, or expanse of waters", pronunciation: "moh-AH-nah", difficulty: "easy" },
  { word: "NALUS", meaning: "Ocean waves, surf breaks, or swells", pronunciation: "NAH-looz", difficulty: "medium" },
  { word: "HONUS", meaning: "Green sea turtles, sacred symbols of peace and longevity", pronunciation: "HOH-nooz", difficulty: "easy" },
  { word: "HOLOS", meaning: "To travel, cruise around, run, or go on an outing", pronunciation: "HOH-lohz", difficulty: "medium" },
  { word: "PAHUS", meaning: "Sacred Hawaiian hula drums carved from coconut wood", pronunciation: "PAH-hooz", difficulty: "medium" },
  { word: "ILIMA", meaning: "Native yellow-orange blossom, royal flower of Oahu", pronunciation: "ee-LEE-mah", difficulty: "medium" },
  { word: "AZUKI", meaning: "Sweet red azuki beans cooked in syrup for shave ice", pronunciation: "ah-ZOO-kee", difficulty: "easy" },
  { word: "PANKO", meaning: "Crispy Japanese breadcrumbs used for chicken katsu", pronunciation: "PAHN-koh", difficulty: "easy" },
  { word: "NORIS", meaning: "Crispy sheets of seasoned dried seaweed for musubi", pronunciation: "NOH-reez", difficulty: "easy" },
  { word: "SPAMS", meaning: "Beloved canned spiced ham staple across Hawaii kitchens", pronunciation: "SPAMZ", difficulty: "easy" },
  { word: "PALAK", meaning: "Palaka; heavy checkered cotton fabric worn by paniolo", pronunciation: "pah-LAH-kah", difficulty: "medium" },
  { word: "POHAK", meaning: "Pōhaku; stones or sacred rock formations in Hawaiian culture", pronunciation: "poh-HAH-koo", difficulty: "hard" },
  { word: "PULEA", meaning: "Pule; sacred Hawaiian prayer, chant, or spiritual blessing", pronunciation: "poo-LEH-ah", difficulty: "hard" },
  { word: "HAMAN", meaning: "Hamana Kalili; sugar mill water tender who originated the shaka", pronunciation: "hah-MAH-nah", difficulty: "hard" },
  { word: "WAHIN", meaning: "Wahine; Hawaiian word for woman, lady, or female surfer", pronunciation: "wah-HEE-neh", difficulty: "easy" }
];

async function main() {
  console.log('🌺 Expanding & Enriching Wordle Word Bank');
  console.log('=========================================');

  // Step 1: Fetch existing wordle words and dictionary entries
  const { data: existingWords, error: wErr } = await supabase.from('wordle_words').select('*');
  if (wErr) throw wErr;
  console.log(`📊 Found ${existingWords.length} existing wordle words`);

  const { data: dictEntries, error: dErr } = await supabase.from('dictionary_entries').select('pidgin, english, pronunciation, difficulty');
  if (dErr) throw dErr;
  console.log(`📖 Loaded ${dictEntries.length} dictionary entries`);

  // Build dictionary lookup by cleaned 5-letter uppercase word
  const dictMap = new Map();
  for (const entry of dictEntries) {
    const clean = entry.pidgin.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (clean.length === 5 && !dictMap.has(clean)) {
      const englishMeaning = Array.isArray(entry.english) ? entry.english.join('; ') : entry.english;
      dictMap.set(clean, {
        meaning: englishMeaning,
        pronunciation: entry.pronunciation,
        difficulty: entry.difficulty || 'medium'
      });
    }
  }

  // Step 2: Backfill meanings for existing words that lack one
  let backfilledCount = 0;
  for (const wordRow of existingWords) {
    if (!wordRow.meaning && dictMap.has(wordRow.word)) {
      const match = dictMap.get(wordRow.word);
      const { error } = await supabase
        .from('wordle_words')
        .update({
          meaning: match.meaning,
          pronunciation: match.pronunciation || wordRow.pronunciation,
          difficulty: wordRow.difficulty || match.difficulty
        })
        .eq('id', wordRow.id);

      if (!error) {
        backfilledCount++;
      }
    }
  }
  console.log(`✅ Backfilled meaning & pronunciation for ${backfilledCount} existing Pidgin words`);

  // Step 3: Insert 50 new words
  const existingSet = new Set(existingWords.map(w => w.word.toUpperCase()));
  const toInsert = NEW_WORDLE_WORDS.filter(w => !existingSet.has(w.word)).map(w => ({
    word: w.word.toUpperCase(),
    is_solution: true,
    is_valid_guess: true,
    meaning: w.meaning,
    pronunciation: w.pronunciation,
    difficulty: w.difficulty || 'medium'
  }));

  console.log(`🎯 Inserting ${toInsert.length} new authentic 5-letter words...`);
  if (toInsert.length > 0) {
    const { data: inserted, error: insErr } = await supabase
      .from('wordle_words')
      .insert(toInsert)
      .select('id, word');

    if (insErr) {
      console.error('❌ Error inserting new words:', insErr);
      process.exit(1);
    }
    console.log(`🎉 Successfully inserted ${inserted.length} words!`);
  }

  // Step 4: Final verification
  const { count: finalTotal } = await supabase.from('wordle_words').select('*', { count: 'exact', head: true });
  const { count: finalMeanings } = await supabase.from('wordle_words').select('*', { count: 'exact', head: true }).not('meaning', 'is', null);

  console.log('=========================================');
  console.log(`📈 Total Wordle Words: ${finalTotal}`);
  console.log(`📚 Words with Meanings: ${finalMeanings}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
