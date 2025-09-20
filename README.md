# 🌺 ChokePidgin - Hawaiian Pidgin Learning Platform

A comprehensive web application for learning and exploring Hawaiian Pidgin (Hawaii Creole English) with authentic pronunciations, cultural context, and modern features.

## ✨ Features

- **📚 Comprehensive Dictionary** - 428+ terms with pronunciations and examples
- **🔄 Bidirectional Translator** - English ↔ Pidgin with confidence scoring
- **🔊 Speech Synthesis** - ElevenLabs TTS integration with web fallback
- **🏝️ Ask a Local** - Community Q&A platform
- **📱 Mobile Responsive** - Works perfectly on all devices
- **🌐 PWA Ready** - Offline capabilities and fast loading

## 🚀 Quick Start

### For Users
Visit the live site: [ChokePidgin.com](https://chokepidgin.com)

### For Developers

```bash
# Clone the repository
git clone [repository-url]
cd ispeakpidgin

# Install dependencies
npm install

# Build the project
./scripts/build.sh

# Start development server
./scripts/dev-server.sh

# Visit http://localhost:8080
```

## 🏗️ Project Structure

```
📁 src/                     # Source code (edit these files)
├── pages/                  # HTML pages
├── components/             # JavaScript modules
├── styles/                 # CSS files
└── assets/                 # Images, icons, audio

📁 data/                    # Data files
├── dictionary/             # Dictionary data (JSON + legacy)
├── phrases/                # Phrase data
└── generated/              # Auto-generated content

📁 public/                  # Built production files (auto-generated)
📁 tools/                   # Development and migration tools
📁 scripts/                 # Build and deployment scripts
📁 docs/                    # Documentation
```

## 🛠️ Development

### Building
```bash
./scripts/build.sh          # Build production files
./scripts/dev-server.sh     # Start development server
./scripts/deploy.sh         # Create deployment package
```

### Key Components
- **Enhanced JSON Data System** - Modern, efficient data storage
- **Hybrid Compatibility** - Works with both new and legacy data
- **Component Architecture** - Modular, maintainable code
- **Build System** - Automated processing and optimization

## 📊 Data Structure

### Enhanced JSON Format
```json
{
  "metadata": {
    "version": "2.0",
    "totalEntries": 428,
    "lastUpdated": "2024-01-20"
  },
  "categories": { "greetings": {...}, "food": {...} },
  "entries": [
    {
      "id": "howzit_001",
      "pidgin": "howzit",
      "english": ["how are you", "hello"],
      "category": "greetings",
      "pronunciation": "HOW-zit",
      "examples": ["Howzit brah!"],
      "difficulty": "beginner",
      "frequency": "very_high",
      "tags": ["greeting", "casual"]
    }
  ]
}
```

## 🧪 Testing

### Automated Testing
```bash
# Open migration test page
open http://localhost:8080/../tools/testing/test-migration.html
```

### Manual Testing
- Dictionary search and filtering
- Translator functionality
- Speech synthesis
- Mobile responsiveness
- Cross-browser compatibility

## 🌟 Recent Improvements

### ✅ Enhanced JSON Data System
- **No duplicates** - Clean, unique data structure
- **Better organization** - Structured with metadata
- **Improved performance** - Faster loading and searching
- **Easier maintenance** - JSON editing vs complex JS objects

### ✅ Codebase Reorganization
- **Component architecture** - Modular, maintainable code
- **Clear separation** - Source vs production vs tools
- **Build system** - Automated processing and optimization
- **Development workflow** - Scripts for common tasks

### ✅ Advanced Features
- **Fuzzy search** - Handles typos and variations
- **Confidence scoring** - Translation quality indicators
- **Context awareness** - Smart suggestions and enhancements
- **Multiple examples** - Rich content with arrays

## 📱 Technology Stack

- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **Styling**: Tailwind CSS (CDN)
- **Data**: JSON with structured schema
- **Speech**: ElevenLabs TTS + Web Speech API
- **Build**: Node.js scripts
- **Server**: Python HTTP server (development)

## 🌐 Deployment

### Production Deployment
1. Run `./scripts/deploy.sh`
2. Upload contents of `public/` folder to web server
3. Configure server for static file serving
4. Set up SSL certificate

### Hosting Options
- **Static hosts**: Netlify, Vercel, GitHub Pages
- **CDN**: Cloudflare, AWS CloudFront
- **Traditional**: Apache, Nginx, Railway

## 📝 Contributing

### Adding Dictionary Words
1. Edit `data/dictionary/pidgin-dictionary.json`
2. Add new entry to `entries` array
3. Update `metadata.totalEntries`
4. Run build and test

### Development Guidelines
- Edit files in `src/` only
- Run build after changes
- Test on multiple devices
- Follow existing code patterns
- Update documentation

## 📚 Documentation

- **[Development Guide](docs/DEVELOPMENT.md)** - Complete development workflow
- **[Migration Guide](docs/MIGRATION-GUIDE.md)** - Data system migration
- **[Reorganization Plan](docs/CODEBASE-REORGANIZATION.md)** - Structure improvements

## 🎯 Roadmap

### Planned Features
- [ ] User accounts and progress tracking
- [ ] Community word submissions
- [ ] Advanced learning modules
- [ ] API for third-party integration
- [ ] Mobile app (PWA)

### Technical Improvements
- [ ] Automated testing suite
- [ ] CSS/JS minification
- [ ] Image optimization
- [ ] Performance monitoring

## 📞 Support

### Resources
- **Documentation**: See `docs/` folder
- **Testing Tools**: See `tools/` folder
- **Development Scripts**: See `scripts/` folder

### Getting Help
1. Check documentation in `docs/`
2. Run test suite for diagnostics
3. Review browser console for errors
4. Check Git history for recent changes

## 📜 License

Open Source - See LICENSE file for details

## 🌺 About

ChokePidgin preserves and shares Hawaiian Pidgin culture through modern technology, making this unique language accessible to learners worldwide while respecting its cultural significance.

**Made with aloha in Hawaii** 🏝️

---

**Live Site**: [ChokePidgin.com](https://chokepidgin.com)
**Development**: See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
**Current Version**: 2.0 (Enhanced JSON System)