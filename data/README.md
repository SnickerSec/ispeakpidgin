# Data Directory

All data for ChokePidgin is now stored in **Supabase**.

## Supabase Tables

| Table | Description |
|-------|-------------|
| `dictionary_entries` | 655 Pidgin words with definitions, examples, pronunciation |
| `stories` | 14 Pidgin stories with translations |
| `phrases` | 1,000 common phrases |
| `pickup_lines` | 20 pickup lines |
| `pickup_line_components` | 48 components for generator |
| `quiz_questions` | 66 quiz questions |
| `wordle_words` | 409 words for Pidgin Wordle |
| `crossword_words` | 624 words for crosswords |
| `crossword_puzzles` | 30 pre-built puzzles |

## API Endpoints

All data is accessed via the Express server API:
- `/api/dictionary` - Dictionary entries
- `/api/stories` - Stories
- `/api/phrases` - Phrases
- `/api/pickup-lines` - Pickup lines
- `/api/pickup-components` - Pickup line components
- `/api/quiz/questions` - Quiz questions
- `/api/wordle/*` - Wordle words
- `/api/crossword/*` - Crossword data

## Build Process

The build process (`npm run build`) fetches data directly from Supabase to generate:
- Individual dictionary entry pages (`/word/*.html`)
- Sitemap (`sitemap.xml`)

No local data files are used at runtime or build time.
