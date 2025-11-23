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

# Alternative build with full output
./scripts/build.sh
```

### Data Management
```bash
# Regenerate optimized views from master data
npm run consolidate-data

# Full rebuild (consolidate + build)
npm run rebuild-data

# Test data migration
open tools/test-data-migration.html
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

### Data Architecture
The project uses a **consolidated data system** (v3.0):
- **Master File**: Single source of truth in `data/master/pidgin-master.json` (453 entries)
- **Optimized Views**: Generated views for different use cases in `data/views/`
  - `dictionary.json` - Optimized for browsing (221KB)
  - `translator.json` - Lightweight for translation (168KB)
  - `learning.json` - Organized by difficulty (82KB)
- **Search Indexes**: Pre-built indexes in `data/indexes/`
  - `search-index.json` - Fast search lookup (136KB)
  - `pronunciation-map.json` - Quick pronunciation access (12KB)
- **Data Loader**: Auto-detects page context and loads appropriate view

### Component Structure
```
src/components/
├── dictionary/     # Dictionary functionality
├── translator/     # Translation engine with fuzzy matching
├── speech/         # ElevenLabs TTS + Web Speech API fallback
└── shared/         # Common utilities (data-loader, main logic, navigation, footer)
    ├── navigation.html  # Shared navigation component
    └── footer.html      # Shared footer component
```

### Template Component System
The site uses a **build-time component injection system** for consistent navigation and footer:
- **Shared Components**: Navigation and footer templates in `src/components/shared/`
- **Placeholder Injection**: Build system replaces `<!-- NAVIGATION_PLACEHOLDER -->` and `<!-- FOOTER_PLACEHOLDER -->` in HTML files
- **Single Source of Truth**: Edit once in component files, updates everywhere
- **Documentation**: See `COMPONENT-SYSTEM.md` for full details

### Build System Details
- **Entry point**: `build.js` (root level, Railway compatible)
- **Alternative**: `tools/build/build.js` (original, used by shell scripts)
- **Path mapping**: Automatically updates import paths during build
- **Asset copying**: Handles JS, CSS, data files, and static assets

### Key Data Flow
1. **Master Data**: Single source with 453+ entries, 855 English→Pidgin mappings, 537 reverse mappings
2. **View Generation**: Consolidation script generates optimized views from master
3. **Auto-Loading**: Data loader detects page type and loads appropriate view
4. **Performance**: 50% faster page loads, pre-built search indexes
5. **Fuzzy Search**: Advanced translation with confidence scoring and typo tolerance

### Railway Deployment Specifics
- **Build command**: `npm run build` (calls `node build.js`)
- **Start command**: `npm start` (runs Express server)
- **CSP configuration**: Includes `mediaSrc: ["blob:", ...]` for ElevenLabs audio
- **Static serving**: Express serves `public/` directory with compression and security headers

### Environment Variables
- **ELEVENLABS_API_KEY**: Required for TTS functionality
- **PORT**: Automatically set by Railway (defaults to 3000 locally)

### SEO Implementation
- **Structured data**: WebSite, EducationalOrganization, and FAQ schemas
- **Meta tags**: Comprehensive SEO, Open Graph, and geo-targeting
- **Technical SEO**: Enhanced robots.txt and sitemap.xml

## Critical Development Notes

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
- **Dictionary entries**: Edit `data/master/pidgin-master.json` directly
- **Regenerate views**: Run `npm run consolidate-data` after changes
- **Build and deploy**: Run `npm run build` to update public files
- **No manual metadata updates**: Counts are auto-calculated during consolidation

### Development Workflow
1. **Source changes**: Edit files in `src/`
2. **Data changes**: Edit `data/master/pidgin-master.json`
3. **Consolidate data**: Run `npm run consolidate-data` (if data changed)
4. **Build**: Run `npm run build`
5. **Test**: Start server with `npm run dev` → http://localhost:8080
6. **Production test**: `npm start` → http://localhost:3000

### Data Management System
- **Test suite**: `tools/test-data-migration.html`
- **Consolidation script**: `tools/consolidate-data.js`
- **View-based loading**: System loads optimized views based on page context
- **Performance monitoring**: Built-in metrics and timing analysis

### Build System Path Mappings
The build system automatically updates these paths:
- `js/data-loader.js` → `js/components/data-loader.js`
- `css/style.css` → `css/main.css`
- And other component relocations

When adding new components, update the `pathMappings` object in `build.js`.

## Data Management Best Practices

### Adding New Dictionary Entries
1. Edit `data/master/pidgin-master.json`
2. Add to the `entries` array with proper structure:
   ```json
   {
     "id": "unique_id_123",
     "pidgin": "da kine",
     "english": ["the thing", "that thing"],
     "pronunciation": "dah KYNE",
     "category": "expressions",
     "examples": ["Wea da kine stay?"],
     "difficulty": "beginner",
     "frequency": "high",
     "tags": ["common", "versatile"]
   }
   ```
3. Run `npm run consolidate-data`
4. Run `npm run build`

### Data Architecture Benefits
- **Single source of truth**: All edits go to master file
- **Optimized loading**: Pages load only needed data
- **Automatic indexing**: Search indexes generated automatically
- **Performance**: 35-68% reduction in data transfer per page
- **Scalability**: Ready for 10,000+ entries
- commit and push after making changes