const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Supabase config (same as main site)
const supabaseUrl = 'https://jfzgzjgdptowfbtljvyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmemd6amdkcHRvd2ZidGxqdnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzk0OTMsImV4cCI6MjA3OTk1NTQ5M30.xPubHKR0PFEic52CffEBVCwmfPz-AiqbwFk39ulwydM';

const supabase = createClient(supabaseUrl, supabaseKey);

// Keyword templates for generating search queries
const KEYWORD_TEMPLATES = {
  definition: [
    'what does {word} mean',
    'what does {word} mean in hawaiian',
    'what does {word} mean in pidgin',
    '{word} meaning',
    '{word} definition',
    '{word} hawaiian meaning',
    'define {word} hawaiian'
  ],
  howTo: [
    'how to say {word} in hawaiian',
    'how to pronounce {word}',
    'how to use {word} in a sentence',
    'when to say {word}'
  ],
  comparison: [
    '{word} vs {word2}',
    'difference between {word} and {word2}'
  ],
  general: [
    'hawaiian pidgin {word}',
    'hawaii slang {word}',
    'local hawaii {word}'
  ]
};

// High-priority seed keywords for Hawaiian Pidgin
const SEED_KEYWORDS = [
  'hawaiian pidgin phrases',
  'hawaiian pidgin words',
  'hawaiian slang words',
  'hawaii local slang',
  'pidgin english hawaii',
  'hawaiian pidgin translator',
  'pidgin dictionary',
  'how to speak pidgin',
  'common hawaiian phrases',
  'hawaii local expressions',
  'pidgin wordle',
  'hawaiian word games',
  'learn hawaiian pidgin',
  'pidgin greetings',
  'hawaiian pickup lines',
  'hawaii beach slang',
  'surf slang hawaii',
  'hawaiian food words',
  'aloha meaning',
  'mahalo meaning',
  'ohana meaning',
  'shaka meaning',
  'howzit meaning',
  'da kine meaning',
  'pau hana meaning',
  'brah meaning hawaii',
  'broke da mouth meaning',
  'ono grindz meaning',
  'talk story meaning',
  'shoots meaning hawaii'
];

/**
 * Generate keywords from site content
 * @param {number} limit - Maximum keywords to return
 * @param {string} category - Filter by category
 * @returns {Array} - Array of keyword objects
 */
async function generateKeywords(limit = 50, category = null) {
  const keywords = [];

  // Add seed keywords first (highest priority)
  SEED_KEYWORDS.forEach((kw, index) => {
    keywords.push({
      keyword: kw,
      type: 'seed',
      priority: 1,
      source: 'manual'
    });
  });

  // Fetch dictionary entries from Supabase
  try {
    const { data: entries, error } = await supabase
      .from('dictionary_entries')
      .select('pidgin, category')
      .order('pidgin');

    if (error) throw error;

    // Generate keywords from dictionary entries
    if (entries) {
      // Sort by likely popularity (shorter words often more common)
      const sorted = entries.sort((a, b) => a.pidgin.length - b.pidgin.length);

      sorted.forEach((entry, index) => {
        const word = entry.pidgin.toLowerCase();

        // Skip very short words
        if (word.length < 3) return;

        // "What does X mean" format (high value for SEO)
        keywords.push({
          keyword: `what does ${word} mean`,
          type: 'definition',
          priority: 2,
          source: 'dictionary',
          word: word
        });

        // Hawaiian specific
        keywords.push({
          keyword: `${word} hawaiian meaning`,
          type: 'definition',
          priority: 3,
          source: 'dictionary',
          word: word
        });

        // Pidgin specific
        keywords.push({
          keyword: `${word} pidgin`,
          type: 'general',
          priority: 3,
          source: 'dictionary',
          word: word
        });

        // How to pronounce (good for voice search)
        keywords.push({
          keyword: `how to pronounce ${word}`,
          type: 'howTo',
          priority: 4,
          source: 'dictionary',
          word: word
        });
      });
    }
  } catch (err) {
    console.error('Error fetching dictionary:', err.message);
  }

  // Fetch phrases for additional keywords
  try {
    const { data: phrases, error } = await supabase
      .from('phrases')
      .select('pidgin, english, category')
      .limit(100);

    if (!error && phrases) {
      phrases.forEach(phrase => {
        // Extract key words from phrases
        const words = phrase.pidgin.toLowerCase().split(' ').filter(w => w.length > 3);
        words.slice(0, 2).forEach(word => {
          keywords.push({
            keyword: `${word} meaning hawaii`,
            type: 'phrase',
            priority: 4,
            source: 'phrases'
          });
        });
      });
    }
  } catch (err) {
    // Ignore phrase errors
  }

  // Add topic-based keywords
  const topics = [
    { topic: 'greetings', keywords: ['hawaiian greetings', 'how to greet in hawaii', 'aloha greetings'] },
    { topic: 'food', keywords: ['hawaiian food words', 'hawaii food slang', 'local food hawaii'] },
    { topic: 'beach', keywords: ['beach slang hawaii', 'surf terms hawaii', 'ocean words hawaiian'] },
    { topic: 'family', keywords: ['hawaiian family words', 'ohana meaning', 'hawaii family terms'] },
    { topic: 'culture', keywords: ['hawaiian culture words', 'local hawaii culture', 'hawaii traditions'] }
  ];

  topics.forEach(t => {
    t.keywords.forEach(kw => {
      keywords.push({
        keyword: kw,
        type: 'topic',
        priority: 2,
        source: 'topics',
        topic: t.topic
      });
    });
  });

  // Deduplicate keywords
  const seen = new Set();
  const unique = keywords.filter(kw => {
    const key = kw.keyword.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by priority
  unique.sort((a, b) => a.priority - b.priority);

  // Apply category filter if specified
  let filtered = unique;
  if (category) {
    filtered = unique.filter(kw => kw.source === category || kw.type === category);
  }

  return filtered.slice(0, limit);
}

/**
 * Get competitor keywords (keywords they rank for that we might not)
 */
async function getCompetitorKeywords() {
  // These would typically come from a paid API like Ahrefs/SEMrush
  // For now, return common competitor-style keywords
  return [
    'hawaiian pidgin dictionary',
    'pidgin translator',
    'hawaii slang dictionary',
    'hawaiian words and meanings',
    'pidgin english phrases',
    'hawaii local language',
    'hawaiian creole english',
    'pidgin vocabulary',
    'speak like a local hawaii'
  ];
}

module.exports = { generateKeywords, getCompetitorKeywords };
