# Testing Notes - Supabase Migration

## Issue Found During Testing

**Date:** December 1, 2025

### Problem
After migrating game data to Supabase and archiving local files, discovered that game pages still reference the old local JavaScript files:

- `pidgin-crossword.html` → references `data/crossword-puzzles.js` (archived)
- `how-local-you-stay.html` → references quiz data file (archived)
- `pidgin-wordle.html` → may reference wordle-data.js (archived)
- `pickup-line-generator.html` → references pickup-line-generator-data.js (archived)

### Required Fix
These pages need to be updated to use Supabase API loaders instead of local data files:

1. Replace direct data file includes with API loaders
2. Update game initialization code to fetch from Supabase
3. Add fallback handling if API is unavailable
4. Test each game works with Supabase data

### Files to Update
- [ ] src/pages/pidgin-crossword.html
- [ ] src/pages/how-local-you-stay.html
- [ ] src/pages/pidgin-wordle.html
- [ ] src/pages/pickup-line-generator.html

### Next Steps
1. Update pages to use supabase-api-loader.js
2. Modify game JavaScript to fetch data from API
3. Test all games work correctly
4. Remove old data file references
5. Rebuild and verify

## Status
**IN PROGRESS** - Testing phase identified these issues
