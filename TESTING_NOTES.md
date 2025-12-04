# Testing Notes - Supabase Migration

## Migration Status

**Date:** December 2025
**Status:** COMPLETE

All data has been migrated to Supabase and local JSON files have been removed.

## Architecture

- **Data Source:** Supabase (single source of truth)
- **API Server:** Express.js (`server.js`)
- **Local Data:** None (all removed)

## API Endpoints

All game and feature data is served via the Express API:

| Endpoint | Description |
|----------|-------------|
| `/api/dictionary` | Dictionary entries |
| `/api/stories` | Story content |
| `/api/phrases` | Common phrases |
| `/api/quiz/questions` | Quiz questions |
| `/api/wordle/daily` | Daily Wordle word |
| `/api/wordle/validate/:word` | Validate Wordle guess |
| `/api/crossword/daily` | Daily crossword puzzle |
| `/api/pickup-lines` | Pickup lines |
| `/api/pickup-components` | Generator components |

## Game Integration

All games fetch data from Supabase API:

- **Crossword:** `/api/crossword/daily`
- **Quiz:** `/api/quiz/questions`
- **Pickup Generator:** `/api/pickup-components`
- **Wordle:** `/api/wordle/daily` and `/api/wordle/validate/:word`

## Build-Time Data Access

The build scripts (sitemap, entry page generators) fetch directly from Supabase REST API using the anon key.

## Testing Checklist

- [ ] Dictionary loads and searches work
- [ ] Stories load on homepage
- [ ] Quiz game functions correctly
- [ ] Wordle game loads daily word
- [ ] Crossword loads puzzles
- [ ] Pickup line generator works
- [ ] Translator functions properly
