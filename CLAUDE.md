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

### Testing and Deployment
```bash
# Create deployment package
./scripts/deploy.sh

# Test migration system
open tools/testing/test-migration.html
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
The project uses a **hybrid data system**:
- **Primary**: Enhanced JSON format in `data/dictionary/pidgin-dictionary.json`
- **Fallback**: Legacy JavaScript format in `data/dictionary/legacy/comprehensive-pidgin-data.js`
- **Migration**: Automatic detection and switching between formats
- **Data loader**: `src/components/shared/data-loader.js` handles both formats

### Component Structure
```
src/components/
├── dictionary/     # Dictionary functionality
├── translator/     # Translation engine with fuzzy matching
├── speech/         # ElevenLabs TTS + Web Speech API fallback
└── shared/         # Common utilities (data-loader, main logic)
```

### Build System Details
- **Entry point**: `build.js` (root level, Railway compatible)
- **Alternative**: `tools/build/build.js` (original, used by shell scripts)
- **Path mapping**: Automatically updates import paths during build
- **Asset copying**: Handles JS, CSS, data files, and static assets

### Key Data Flow
1. **Enhanced JSON**: Modern structured format with metadata, categories, and 428+ entries
2. **Legacy compatibility**: Falls back to original JavaScript object format
3. **Runtime detection**: `pidginDataLoader.isNewSystem` indicates which system is active
4. **Fuzzy search**: Advanced translation with confidence scoring and typo tolerance

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

### Data Updates
- **Dictionary entries**: Edit `data/dictionary/pidgin-dictionary.json`
- **Phrase data**: Edit `data/phrases/phrases-data.js` or `stories-data.js`
- **Update metadata**: Increment `totalEntries` count after adding dictionary words

### Testing Workflow
1. Make changes in `src/`
2. Run `npm run build`
3. Start development server: `npm run dev`
4. Test at http://localhost:8080
5. For production testing: `npm start` → http://localhost:3000

### Migration System
- **Test page**: `tools/testing/test-migration.html`
- **Migration tool**: `tools/migration/migrate-data.html`
- **Automatic detection**: System detects and uses appropriate data format
- **Backward compatibility**: Legacy data remains functional

### Build System Path Mappings
The build system automatically updates these paths:
- `js/data-loader.js` → `js/components/data-loader.js`
- `js/phrases-data.js` → `js/data/phrases-data.js`
- And other component relocations

When adding new components, update the `pathMappings` object in `build.js`.