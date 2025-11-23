# Codebase Organization

This document explains the organized structure of the ChokePidgin codebase (updated Nov 2025).

## Directory Structure Overview

```
ispeakpidgin/
├── src/                    # Source files (edit these)
│   ├── components/        # Reusable components
│   │   ├── games/        # Game components (NEW)
│   │   │   ├── wordle/
│   │   │   ├── crossword/
│   │   │   └── quiz/
│   │   ├── dictionary/   # Dictionary features
│   │   ├── translator/   # Translation engine
│   │   ├── speech/       # Text-to-speech
│   │   ├── bible/        # Pidgin Bible
│   │   ├── shared/       # Shared utilities
│   │   └── practice/     # Practice exercises
│   ├── pages/            # HTML page templates
│   ├── styles/           # CSS files
│   ├── css/              # Additional CSS
│   ├── assets/           # Images, icons, audio
│   └── js/               # Non-component JS files
│
├── data/                  # Data files
│   ├── master/           # Single source of truth
│   ├── views/            # Optimized data views
│   ├── indexes/          # Search indexes
│   ├── games/            # Game data (NEW)
│   └── content/          # Content data (NEW)
│
├── public/               # Built production files (auto-generated)
│   └── [mirrors src structure]
│
└── tools/                # Build and utility scripts
```

## New Game Organization (v2.0)

### Before (Scattered)
```
src/js/pidgin-wordle.js
src/js/pidgin-crossword.js
src/js/local-quiz.js
src/data/pidgin-wordle-words.js
src/data/crossword-puzzles.js
src/data/local-quiz-data.js
```

### After (Organized)
```
src/components/games/
├── wordle/
│   ├── pidgin-wordle.js      # Game logic
│   └── wordle-data.js         # Word lists
├── crossword/
│   ├── pidgin-crossword.js    # Game logic
│   └── crossword-data.js      # Puzzle data
└── quiz/
    ├── local-quiz.js          # Game logic
    └── quiz-data.js           # Quiz questions

data/games/
└── crossword-words.json       # Large word database
```

## Data Organization (v3.0)

### Master Data
- **Location**: `data/master/pidgin-master.json`
- **Purpose**: Single source of truth for all dictionary entries
- **Never**: Edit data anywhere else

### Content Data
- **Location**: `data/content/`
- **Files**:
  - `phrases-data.js` - Common phrases
  - `stories-data.js` - User stories
  - `pickup-lines-data.js` - Pickup lines database
- **Purpose**: Content for various features

### Game Data
- **Location**: `data/games/`
- **Files**:
  - `crossword-words.json` - Crossword-suitable words extracted from dictionary
- **Purpose**: Game-specific data files

## Build System

The build system automatically handles the new structure:

1. **Game Components**: Copies from `src/components/games/` to `public/js/components/games/`
2. **Path Mappings**: Auto-updates script paths in HTML files
3. **Data Files**: Copies from organized data directories

### Path Mappings
```javascript
// Old paths → New paths
'js/pidgin-wordle.js' → 'js/components/games/pidgin-wordle.js'
'data/pidgin-wordle-words.js' → 'js/components/games/wordle-data.js'
'js/pidgin-crossword.js' → 'js/components/games/pidgin-crossword.js'
'data/crossword-puzzles.js' → 'js/components/games/crossword-data.js'
'js/local-quiz.js' → 'js/components/games/local-quiz.js'
'js/data/local-quiz-data.js' → 'js/components/games/quiz-data.js'
```

## Component Organization

### Games (`src/components/games/`)
Each game has its own directory with:
- Game logic file (e.g., `pidgin-wordle.js`)
- Data file (e.g., `wordle-data.js`)

### Other Components
- **Dictionary** (`src/components/dictionary/`): Dictionary browsing and search
- **Translator** (`src/components/translator/`): Translation engine with fuzzy matching
- **Speech** (`src/components/speech/`): ElevenLabs TTS + Web Speech API
- **Shared** (`src/components/shared/`): Navigation, footer, data loader

## Development Workflow

1. **Edit source files** in `src/` directories
2. **Run build**: `npm run build`
3. **Test locally**: `npm run dev` (port 8080)
4. **Deploy**: Build files in `public/` are served by Railway

## Benefits of This Organization

1. **Logical Grouping**: Related files together (game logic + game data)
2. **Clear Separation**: Games separate from general components
3. **Scalability**: Easy to add new games or features
4. **Maintainability**: Know exactly where to find files
5. **Build System**: Automatic path management

## Adding a New Game

1. Create directory: `src/components/games/mygame/`
2. Add files:
   - `mygame.js` (game logic)
   - `mygame-data.js` (game data)
3. Update build.js:
   - Add to `gameSourceDirs` array
   - Add path mappings if needed
4. Create HTML page in `src/pages/`
5. Build and test

## Migration Notes

- All game files have been moved to new structure
- Build system updated to handle new paths
- Old `src/data/` and scattered game files removed
- Path mappings ensure HTML pages reference correct locations
- No breaking changes to production site
