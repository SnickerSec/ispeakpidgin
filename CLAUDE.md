# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Build production files (Railway compatible)
npm run build

# Start production server (Railway/Express)
npm start

# Development server (Python, port 8080)
npm run dev
# OR
./scripts/dev-server.sh
```

### Testing and Deployment
```bash
# Create deployment package
./scripts/deploy.sh
```

## Architecture Overview

### Dual Development Setup
This project supports **two server environments**:
1. **Development**: Python HTTP server (`./scripts/dev-server.sh`) on port 8080
2. **Production**: Express.js server (`npm start`) on port 3000 (Railway-compatible)

### Source-to-Production Build System
- **Source files**: Edit in `src/` directory only
- **Production files**: Auto-generated in `public/` directory
- **Build process**: `build.js` processes source files and outputs to `public/`
- **Never edit `public/` directly** - changes will be overwritten

### Data Architecture (Supabase)
**All data is stored in Supabase** - no local JSON files are used.

#### Supabase Tables
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

#### API Endpoints
Data is accessed via the Express server API:
- `/api/dictionary` - Dictionary entries
- `/api/stories` - Stories
- `/api/phrases` - Phrases
- `/api/pickup-lines` - Pickup lines
- `/api/pickup-components` - Pickup line components
- `/api/quiz/questions` - Quiz questions
- `/api/wordle/*` - Wordle words
- `/api/crossword/*` - Crossword data

### Component Structure
```
src/components/
├── games/          # Game components (wordle, crossword, quiz)
├── dictionary/     # Dictionary functionality
├── translator/     # Translation engine with fuzzy matching
├── speech/         # ElevenLabs TTS + Web Speech API fallback
├── pickup/         # Pickup line generator
├── learning/       # Learning hub
├── bible/          # Pidgin Bible
├── practice/       # Practice exercises
└── shared/         # Common utilities
    ├── supabase-api-loader.js   # API loader for stories, phrases, games
    ├── supabase-data-loader.js  # Dictionary data loader
    ├── navigation.html          # Shared navigation component
    ├── footer.html              # Shared footer component
    └── main.js                  # Main application logic
```

### Template Component System - CRITICAL
The site uses a **build-time component injection system** for consistent navigation and footer across ALL pages:

**ALWAYS USE TEMPLATES - NEVER HARDCODE:**
- **Navigation**: `<!-- NAVIGATION_PLACEHOLDER -->` in every HTML page
- **Footer**: `<!-- FOOTER_PLACEHOLDER -->` in every HTML page
- **Shared Components**: Located in `src/components/shared/`
  - `navigation.html` - Site-wide navigation with mobile menu
  - `footer.html` - Site-wide footer

**Critical Rules:**
1. **NEVER hardcode navigation or footer HTML** directly in page files
2. **ALWAYS use placeholders** in `src/pages/*.html` files
3. **NEVER add duplicate JavaScript** for navigation/footer functionality
4. **Edit shared components** to change navigation/footer site-wide
5. **Build system auto-injects** templates during build process

**Why This Matters:**
- Single source of truth ensures consistency across all pages
- Bug fixes and updates apply to all pages automatically
- No duplicate code or conflicting implementations
- Mobile menu, dropdowns, and footer work identically everywhere

**Example Page Structure:**
```html
<body>
    <!-- NAVIGATION_PLACEHOLDER -->

    <!-- Your page content here -->

    <!-- FOOTER_PLACEHOLDER -->
    <script src="js/components/main.js"></script>
</body>
```

**Documentation**: See `CODEBASE_ORGANIZATION.md` for component details

### Build System Details
- **Entry point**: `build.js` (root level, Railway compatible)
- **Path mapping**: Automatically updates import paths during build
- **Asset copying**: Handles JS, CSS, and static assets

### Railway Deployment Specifics
- **Build command**: `npm run build` (calls `node build.js`)
- **Start command**: `npm start` (runs Express server)
- **CSP configuration**: Includes `mediaSrc: ["blob:", ...]` for ElevenLabs audio
- **Static serving**: Express serves `public/` directory with compression and security headers

### Environment Variables
- **SUPABASE_URL**: Supabase project URL
- **SUPABASE_ANON_KEY**: Supabase anonymous key
- **ELEVENLABS_API_KEY**: Required for TTS functionality
- **PORT**: Automatically set by Railway (defaults to 3000 locally)

### SEO Implementation
- **Structured data**: WebSite, EducationalOrganization, and FAQ schemas
- **Meta tags**: Comprehensive SEO, Open Graph, and geo-targeting
- **Technical SEO**: Enhanced robots.txt and sitemap.xml

## Critical Development Notes

### TEMPLATE SYSTEM - MUST FOLLOW
**NEVER hardcode navigation, footer, or other shared components in individual pages!**

When creating or editing pages:
1. **ALWAYS use placeholders**: `<!-- NAVIGATION_PLACEHOLDER -->` and `<!-- FOOTER_PLACEHOLDER -->`
2. **NEVER copy/paste** navigation or footer HTML into page files
3. **NEVER add duplicate JavaScript** for mobile menu or shared functionality
4. **Edit shared components** (`src/components/shared/navigation.html`, `footer.html`) to update ALL pages
5. **Build after component changes** to apply across all pages

**Why:** Ensures consistency, prevents duplicate code conflicts, single source of truth for all pages.

### File Editing Rules
- **Edit source**: `src/` directory only
- **Build required**: Run `npm run build` after changes
- **Server restart**: Required after `server.js` changes

### Navigation and Footer Updates
- **Shared components**: Edit `src/components/shared/navigation.html` or `footer.html`
- **Single source**: Changes automatically apply to ALL pages after build
- **Don't edit**: Never edit navigation/footer in individual page files
- **Build required**: Run `npm run build` to apply changes across all pages

### Data Updates
All data is in Supabase. To update:
1. Use Supabase dashboard or SQL to modify data
2. API endpoints serve data automatically
3. Build scripts fetch from Supabase for static page generation

### Development Workflow
1. **Source changes**: Edit files in `src/`
2. **Build**: Run `npm run build`
3. **Test**: Start server with `npm run dev` → http://localhost:8080
4. **Production test**: `npm start` → http://localhost:3000
5. **Commit and push** after making changes

### Build System Path Mappings
The build system automatically updates these paths:
- `js/data-loader.js` → `js/components/data-loader.js`
- `css/style.css` → `css/main.css`
- And other component relocations

When adding new components, update the `pathMappings` object in `build.js`.
