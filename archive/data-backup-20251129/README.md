# Data Backup - November 29, 2025

## Why This Backup Exists
All data has been migrated to Supabase. These files are archived for reference and potential restoration if needed.

## Supabase Tables (Current Production Data)
| Table | Records |
|-------|---------|
| dictionary_entries | 655 |
| phrases | 1,150 |
| stories | 9 |
| crossword_words | 624 |
| pickup_lines | 20 |
| quiz_questions | 12 |

## Archived Files

### /views/ - Optimized data views
- dictionary.json - Dictionary entries for browsing
- phrases.json - Phrase data
- translator.json - Translator lookup data
- learning.json - Learning organized by difficulty

### /indexes/ - Search indexes
- search-index.json - Pre-built search index
- pronunciation-map.json - Quick pronunciation lookup

### /games/ - Game data
- crossword-words.json - Words for crossword puzzles

### /master/ - Source of truth
- pidgin-master.json - Master data file (453 entries)

### /training/ - ML training data (not used in production)
- phrase-lookup.json
- phrase-training-data.json
- sentence-lookup.json
- sentence-training-data.json
- story-examples.json
- story-sentences.json

### /public-js-data/ - Frontend JS data files
- stories-data.js - Stories for stories page
- pickup-lines-data.js - Pickup lines
- local-quiz-data.js - Quiz questions
- pickup-line-generator-data.js - Generator components
- phrases-data.js - Phrases

### /public-data/ - Other public data
- crossword-puzzles.js - Pre-built crossword puzzles
- pidgin-wordle-words.js - Wordle word list

## Restoration
To restore any file, copy it back to its original location:
```bash
cp archive/data-backup-20251129/views/dictionary.json data/views/
```

## Supabase Connection
- URL: https://jfzgzjgdptowfbtljvyp.supabase.co
- See server.js for API endpoints
