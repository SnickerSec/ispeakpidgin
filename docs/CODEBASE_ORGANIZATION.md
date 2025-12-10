# Codebase Organization

This document explains the organized structure of the ChokePidgin codebase (updated Dec 2025).

## Directory Structure Overview

```
ispeakpidgin/
├── src/                    # Source files (edit these)
│   ├── components/        # Reusable components
│   │   ├── games/        # Game components (wordle, crossword, quiz)
│   │   ├── dictionary/   # Dictionary features
│   │   ├── translator/   # Translation engine
│   │   ├── speech/       # Text-to-speech
│   │   ├── bible/        # Pidgin Bible
│   │   ├── shared/       # Shared utilities & data loaders
│   │   ├── pickup/       # Pickup line generator
│   │   ├── learning/     # Learning hub
│   │   └── practice/     # Practice exercises
│   ├── pages/            # HTML page templates
│   ├── styles/           # CSS files
│   └── assets/           # Images, icons
│
├── data/                  # Data documentation (all data in Supabase)
│   └── README.md         # Supabase table documentation
│
├── public/               # Built production files (auto-generated)
│   └── [mirrors src structure]
│
├── tools/                # Build and utility scripts
│   ├── audio/            # Audio generation tools
│   ├── data/             # Data utility scripts
│   ├── generators/       # Sitemap & entry page generators
│   ├── seo/              # SEO tools
│   ├── testing/          # Test scripts
│   └── training/         # Training data extraction
│
├── scripts/              # Shell scripts
│   ├── build.sh          # Build script
│   ├── deploy.sh         # Deployment script
│   └── dev-server.sh     # Development server
│
├── config/               # Configuration files
│   ├── supabase.js       # Supabase client config
│   ├── ga-config.js      # Google Analytics
│   └── railway.json      # Railway deployment
│
└── audio/                # Audio assets
```

## Data Architecture (Supabase)

**All data is stored in Supabase** - no local JSON files are used.

### Supabase Tables
| Table | Description |
|-------|-------------|
| `dictionary_entries` | 655 Pidgin words with definitions, examples |
| `stories` | 14 Pidgin stories with translations |
| `phrases` | 1,000 common phrases |
| `pickup_lines` | 20 pickup lines |
| `pickup_line_components` | 48 components for generator |
| `quiz_questions` | 66 quiz questions |
| `wordle_words` | 409 words for Pidgin Wordle |
| `crossword_words` | 624 words for crosswords |
| `crossword_puzzles` | 30 pre-built puzzles |

### API Endpoints
Data is accessed via the Express server API:
- `/api/dictionary` - Dictionary entries
- `/api/stories` - Stories
- `/api/phrases` - Phrases
- `/api/pickup-lines` - Pickup lines
- `/api/pickup-components` - Pickup line components
- `/api/quiz/questions` - Quiz questions
- `/api/wordle/*` - Wordle words
- `/api/crossword/*` - Crossword data

### Build-Time Data Access
Build scripts (sitemap, entry page generators) fetch directly from Supabase REST API.

## Component Organization

### Games (`src/components/games/`)
- **wordle/** - Pidgin Wordle game
- **crossword/** - Crossword puzzles
- **quiz/** - Quiz game

### Feature Components
- **dictionary/** - Dictionary browsing and search
- **translator/** - Translation engine with fuzzy matching
- **speech/** - ElevenLabs TTS + Web Speech API
- **pickup/** - Pickup line generator
- **learning/** - Learning hub
- **practice/** - Practice exercises

### Shared (`src/components/shared/`)
- **supabase-api-loader.js** - API loader for stories, phrases, games
- **supabase-data-loader.js** - Dictionary data loader
- **navigation.html** - Site-wide navigation
- **footer.html** - Site-wide footer
- **main.js** - Main application logic

## Build System

### Build Command
```bash
npm run build     # Build production files
npm start         # Start Express server
npm run dev       # Development server (port 8080)
```

### What the Build Does
1. **Template Injection**: Injects navigation and footer into all pages
2. **Component Processing**: Copies from `src/components/` to `public/js/components/`
3. **Path Mappings**: Auto-updates script paths in HTML files
4. **Asset Copying**: Handles JS, CSS, images, audio

### Path Mappings
The build system maps old paths to new organized paths - see `build.js` for details.

## Development Workflow

1. **Edit source files** in `src/` directories
2. **Run build**: `npm run build`
3. **Test locally**: `npm run dev` (port 8080)
4. **Deploy**: Push to Railway (auto-deploys from main branch)

## Root Directory Files

### Key Files
- **build.js** - Main build script (Railway compatible)
- **server.js** - Express server for production
- **tailwind.config.js** - Tailwind CSS configuration
- **package.json** - Dependencies and scripts

### Documentation
- **README.md** - Project overview
- **CLAUDE.md** - Instructions for Claude Code
- **CODEBASE_ORGANIZATION.md** - This file
- **COMPONENT-SYSTEM.md** - Component system documentation

## Configuration

### Environment Variables
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `ELEVENLABS_API_KEY` - For TTS functionality
- `PORT` - Server port (Railway sets automatically)

### Config Files
- `config/supabase.js` - Supabase client initialization
- `config/ga-config.js` - Google Analytics tracking ID
- `config/railway.json` - Railway deployment settings

## Adding New Features

### New Component
1. Create directory in `src/components/`
2. Add JS file(s)
3. Update `build.js` if path mappings needed
4. Create HTML page in `src/pages/`
5. Build and test

### New Data
1. Add to appropriate Supabase table
2. Create/update API endpoint in `server.js`
3. Update data loader if needed
