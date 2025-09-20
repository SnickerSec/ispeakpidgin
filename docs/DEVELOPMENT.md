# 🛠️ ChokePidgin Development Guide

## 📋 Quick Start

### Prerequisites
- **Node.js** (v16+ recommended)
- **Python 3** (for development server)
- **Git** (for version control)

### Setup
```bash
# Clone and setup
git clone [repository-url]
cd ispeakpidgin

# Install dependencies
npm install

# Build production files
./scripts/build.sh

# Start development server
./scripts/dev-server.sh
```

## 🏗️ Project Structure

```
ispeakpidgin/
├── 📁 src/                          # Source code (edit these)
│   ├── 📁 pages/                    # HTML pages
│   ├── 📁 components/               # JavaScript modules
│   ├── 📁 styles/                   # CSS files
│   └── 📁 assets/                   # Images, icons, audio
├── 📁 data/                         # Data files
│   ├── 📁 dictionary/               # Dictionary data
│   ├── 📁 phrases/                  # Phrase data
│   └── 📁 generated/                # Auto-generated files
├── 📁 public/                       # Built production files (auto-generated)
├── 📁 tools/                        # Development tools
├── 📁 scripts/                      # Build and deploy scripts
├── 📁 docs/                         # Documentation
└── 📁 config/                       # Configuration files
```

## 🔄 Development Workflow

### 1. Making Changes
- **Edit files in `src/`** - Never edit files in `public/` directly
- **HTML pages**: Edit in `src/pages/`
- **JavaScript**: Edit in `src/components/`
- **CSS**: Edit in `src/styles/`
- **Data**: Edit in `data/`

### 2. Building
```bash
# Build production files
./scripts/build.sh

# This creates/updates the public/ folder
```

### 3. Testing
```bash
# Start development server
./scripts/dev-server.sh

# Visit http://localhost:8080
```

### 4. Deploying
```bash
# Create deployment package
./scripts/deploy.sh

# Upload contents of public/ folder to web server
```

## 📦 Component Architecture

### JavaScript Components

#### **Dictionary Components** (`src/components/dictionary/`)
- `dictionary.js` - Core dictionary functionality
- `dictionary-page.js` - Dictionary page UI logic

#### **Translator Components** (`src/components/translator/`)
- `translator.js` - Translation engine with enhanced features

#### **Speech Components** (`src/components/speech/`)
- `speech.js` - Web Speech API fallback
- `elevenlabs-speech.js` - ElevenLabs TTS integration

#### **Shared Components** (`src/components/shared/`)
- `data-loader.js` - Enhanced JSON data loading system
- `main.js` - Global application logic
- `lessons.js` - Learning functionality
- `ask-local.js` / `ask-local-page.js` - Community Q&A

### Data Structure

#### **Dictionary Data** (`data/dictionary/`)
- `pidgin-dictionary.json` - Enhanced JSON format with metadata
- `legacy/comprehensive-pidgin-data.js` - Original format (fallback)

#### **Phrase Data** (`data/phrases/`)
- `phrases-data.js` - Common phrases and translations
- `stories-data.js` - Story content

## 🔧 Development Commands

### Build Commands
```bash
# Full build
./scripts/build.sh

# Custom build (Node.js)
node tools/build/build.js
```

### Server Commands
```bash
# Development server
./scripts/dev-server.sh

# Custom server
cd public && python3 -m http.server 8080
```

### Data Tools
```bash
# Migration analysis
open tools/migration/migrate-data.html

# Test migration
open tools/testing/test-migration.html
```

## 📝 Adding New Features

### Adding a New Page
1. **Create HTML** in `src/pages/new-page.html`
2. **Add scripts** in appropriate `src/components/` folders
3. **Run build**: `./scripts/build.sh`
4. **Test**: `./scripts/dev-server.sh`

### Adding New Dictionary Words
1. **Edit** `data/dictionary/pidgin-dictionary.json`
2. **Add entry** to `entries` array:
   ```json
   {
     "id": "newword_001",
     "pidgin": "newword",
     "english": ["translation"],
     "category": "expressions",
     "pronunciation": "NEW-word",
     "examples": ["Example usage"],
     "usage": "How it's used",
     "origin": "Word origin",
     "difficulty": "beginner",
     "frequency": "medium",
     "tags": ["tag1", "tag2"],
     "audioExample": "Audio example"
   }
   ```
3. **Update** `metadata.totalEntries` count
4. **Build and test**

### Adding New Components
1. **Create** in appropriate `src/components/` subfolder
2. **Export** functions/classes using `module.exports` or similar
3. **Import** in HTML pages or other components
4. **Build and test**

## 🧪 Testing

### Automated Tests
```bash
# Run migration tests
open http://localhost:8080/../tools/testing/test-migration.html
```

### Manual Testing Checklist
- [ ] Dictionary search works
- [ ] Translator functions properly
- [ ] Speech synthesis works
- [ ] Mobile responsive
- [ ] All navigation links work
- [ ] Data loads correctly

### Performance Testing
- [ ] Page load speed
- [ ] Search response time
- [ ] Memory usage
- [ ] Mobile performance

## 🚀 Deployment

### Production Build
```bash
# Create production files
./scripts/deploy.sh
```

### Deploy to Web Server
1. **Build** production files
2. **Upload** contents of `public/` folder
3. **Configure** web server to serve static files
4. **Test** live site

### Environment Variables
```bash
# .env file (copy from .env.example)
ELEVENLABS_API_KEY=your_api_key_here
```

## 📊 File Size Guidelines

### Optimal Sizes
- **HTML pages**: < 50KB each
- **JavaScript files**: < 100KB each
- **CSS files**: < 50KB each
- **JSON data**: < 500KB each
- **Images**: < 200KB each

### Optimization Tips
- **Minify** CSS and JavaScript for production
- **Compress** images
- **Use** efficient data formats
- **Cache** frequently accessed files

## 🐛 Troubleshooting

### Common Issues

#### Build Fails
- Check file paths in HTML pages
- Verify all referenced files exist
- Check console for specific errors

#### Features Not Working
- Verify build completed successfully
- Check browser console for JavaScript errors
- Ensure data files are accessible

#### Performance Issues
- Check file sizes
- Verify data loading efficiency
- Test on different devices/browsers

### Debug Mode
```javascript
// Enable debug logging
localStorage.setItem('debug', 'true');

// Check data system
console.log('Dictionary system:', pidginDictionary.isNewSystem);
console.log('Data loader:', pidginDataLoader.loaded);
```

## 📞 Support

### Development Resources
- **Code Structure**: See `docs/CODEBASE-REORGANIZATION.md`
- **Migration Guide**: See `docs/MIGRATION-GUIDE.md`
- **Component Tests**: Use `tools/testing/test-migration.html`

### Getting Help
1. **Check documentation** in `docs/` folder
2. **Run tests** to identify issues
3. **Check browser console** for errors
4. **Review recent changes** in Git history

---

**Happy coding! 🌺** This organized structure makes ChokePidgin much easier to develop and maintain!