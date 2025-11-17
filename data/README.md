# Data Directory Structure

This directory contains all data files for the ChokePidgin application.

## Directory Organization

### `/master/`
**Source of Truth** - Manual edits go here
- `pidgin-master.json` (528KB) - Complete dictionary with 453+ entries

### `/views/`
**Optimized Views** - Auto-generated from master data
- `dictionary.json` (221KB) - Optimized for browsing
- `translator.json` (168KB) - Lightweight for translation
- `learning.json` (82KB) - Organized by difficulty
- `phrases.json` - Common phrase translations

### `/indexes/`
**Search Indexes** - Pre-built for fast lookups
- `search-index.json` (136KB) - Fast search lookup
- `pronunciation-map.json` (12KB) - Quick pronunciation access

### `/training/`
**Machine Learning Training Data** - For development/research only
- `phrase-lookup.json` (265KB) - Phrase lookup tables
- `phrase-training-data.json` (345KB) - Phrase training examples
- `sentence-lookup.json` (288KB) - Sentence lookup tables
- `sentence-training-data.json` (233KB) - Sentence training examples
- `story-examples.json` (12KB) - Story-based examples
- `story-sentences.json` (14KB) - Extracted sentences

## Data Flow

```
pidgin-master.json (MANUAL EDITS)
       ↓
   consolidate-data.js (npm run data:consolidate)
       ↓
   ├─→ views/*.json (optimized)
   └─→ indexes/*.json (search indexes)
```

## Update Procedures

### Adding/Editing Dictionary Entries

1. Edit `master/pidgin-master.json` directly
2. Run `npm run data:consolidate` to regenerate views
3. Run `npm run build` to update public files
4. Test changes locally

### Regenerating Training Data

Training data is generated from master data using tools in `/tools/training/`:
- `create-story-examples.js`
- `extract-phrase-training-data.js`
- `extract-sentence-examples.js`

**Note:** Training data is for development only and not deployed to production.

## Data Schema

See individual JSON files for schema. Key structure:

```json
{
  "id": "unique_id",
  "pidgin": "da kine",
  "english": ["the thing", "that thing"],
  "pronunciation": "dah KYNE",
  "category": "expressions",
  "difficulty": "beginner",
  "frequency": "high"
}
```

## File Sizes

- **Master data:** ~528KB
- **Views (total):** ~471KB
- **Indexes (total):** ~148KB
- **Training (total):** ~1.1MB (not in production)
