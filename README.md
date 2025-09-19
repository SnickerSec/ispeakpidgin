# Pidgin Pal - Learn Hawaiian Pidgin English

Welcome to Pidgin Pal, an interactive web application designed to help you learn Hawaiian Pidgin English through daily phrases, practical translation tools, and structured lessons.

## Features

### 🌺 Daily Pidgin Phrase
- New phrase every day with English translation
- Usage context and cultural notes
- Text-to-speech pronunciation

### 🔄 Pidgin Translator
- Real-time English to Pidgin translation
- Common phrases and expressions
- Pronunciation guides

### 📚 Learning Hub
- Structured lessons (Beginner, Intermediate, Advanced)
- Topics include:
  - Basic Greetings & Introductions
  - Food & Eating
  - Directions & Places
  - Emotions & Feelings
  - Time Expressions
  - Common Slang
- Interactive quizzes to test your knowledge

### 🤝 Community Section
- Pidgin Story Corner
- "Ask a Local" Q&A forum
- Cultural insights and history

## Getting Started

1. Open `index.html` in your web browser
2. No installation or server required - runs entirely in the browser
3. Works on desktop and mobile devices

## Project Structure

```
ispeakpidgin/
├── index.html          # Main HTML file
├── css/
│   └── style.css      # Custom styles and animations
├── js/
│   ├── main.js        # Main application logic
│   ├── phrases-data.js # Pidgin phrases database
│   ├── translator.js   # Translation engine
│   └── lessons.js     # Learning content and quizzes
└── README.md          # This file
```

## How to Use

### For Beginners
1. Start with the Daily Phrase on the home page
2. Explore Essential Pidgin Phrases
3. Visit the Learning Hub and start with Beginner lessons
4. Practice with the Translator

### For Practice
- Use the Translator to convert English phrases to Pidgin
- Take quizzes in the Learning Hub
- Read stories in the Community section
- Submit questions to "Ask a Local"

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS (via CDN) + custom CSS
- **Features**:
  - Responsive design (mobile-first)
  - Text-to-speech functionality
  - Local storage for progress tracking (future feature)
  - No backend required

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Deployment on Railway

### Prerequisites
- A [Railway](https://railway.app) account
- Git installed on your machine
- Node.js 16+ (for local testing)

### Quick Deploy to Railway

1. **Initialize Git repository** (if not already done):
```bash
git init
git add .
git commit -m "Initial commit - Pidgin Pal website"
```

2. **Deploy using Railway CLI**:
```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize new Railway project
railway init

# Deploy to Railway
railway up
```

3. **Alternative: Deploy via GitHub**:
   - Push your code to a GitHub repository
   - Connect your GitHub account to Railway
   - Create a new project in Railway dashboard
   - Select your repository
   - Railway will automatically detect and deploy

### Environment Configuration

The app will automatically use the PORT provided by Railway. No additional environment variables are required.

### Post-Deployment

Once deployed, Railway will provide you with a URL like:
- `https://your-app-name.up.railway.app`

The site will be live and accessible immediately.

### Local Development

To run the application locally:

```bash
# Install dependencies
npm install

# Start the server
npm start

# Visit http://localhost:3000
```

### Monitoring

Railway provides built-in monitoring for:
- Deployment logs
- Runtime logs
- Resource usage
- Custom domains (optional)

## Contributing

Feel free to contribute to this educational project by:
- Adding more Pidgin phrases and translations
- Improving the translation algorithm
- Adding more lessons and cultural content
- Reporting bugs or suggesting features

## Cultural Respect

This project is created with respect for Hawaiian Pidgin English and its speakers. Pidgin is a legitimate language with its own grammar and cultural significance. We encourage learners to approach it with respect and understanding of its historical and cultural context.

## License

This is an educational project intended to promote understanding and appreciation of Hawaiian Pidgin English.

## Acknowledgments

- Hawaiian Pidgin English speakers and cultural advisors
- The Hawaiian community for preserving this unique language
- All contributors to this educational resource

---

**Mahalo for learning Pidgin! E komo mai (Welcome) to the Pidgin Pal ohana!** 🌺