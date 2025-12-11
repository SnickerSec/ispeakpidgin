# Pidgin SEO CLI

CLI tool for scraping PAA (People Also Ask), PASF (People Also Search For), and SERP data for ChokePidgin SEO optimization.

Uses [Botasaurus](https://github.com/omkarcloud/botasaurus) for anti-detection web scraping.

## Installation

```bash
cd tools/seo-cli

# Install Node.js dependencies
npm install

# Set up Python virtual environment with Botasaurus
python3 -m venv venv
source venv/bin/activate
pip install botasaurus
```

**Note**: Requires Chrome/Chromium. The scraper auto-detects Puppeteer's Chrome from `~/.cache/puppeteer/chrome/`.

## Usage

### Generate Keywords

Generate keyword suggestions from site content (dictionary, phrases):

```bash
# Generate top 50 keywords
node index.js keywords --limit 50

# Export to JSON
node index.js keywords --limit 100 --output json

# Export to CSV
node index.js keywords --limit 100 --output csv
```

### Scrape SERP Data

Scrape Google for PAA, PASF, and ranking data:

```bash
# Single keyword
node index.js scrape -k "hawaiian pidgin phrases"

# Auto-generate keywords and scrape
node index.js scrape --auto --limit 10

# From file (one keyword per line)
node index.js scrape -f keywords.txt --limit 20

# Export to JSON
node index.js scrape --auto --limit 10 --output json
```

### Quick PAA Lookup

Get "People Also Ask" questions for a single keyword:

```bash
node index.js paa "what does aloha mean"
```

### Quick PASF Lookup

Get "People Also Search For" suggestions:

```bash
node index.js pasf "hawaiian slang"
```

### Analyze Rankings

Check current SERP positions for site keywords:

```bash
node index.js analyze --limit 20
```

## Options

### Global Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Display help |
| `-V, --version` | Display version |

### Scrape Options

| Option | Description | Default |
|--------|-------------|---------|
| `-k, --keyword` | Single keyword to search | - |
| `-f, --file` | File with keywords (one per line) | - |
| `-a, --auto` | Auto-generate keywords from site content | false |
| `-l, --limit` | Max keywords to process | 10 |
| `-o, --output` | Output format: json, csv, console | console |
| `-d, --delay` | Delay between requests (ms) | 2000 |
| `--no-paa` | Skip PAA extraction | false |
| `--no-pasf` | Skip PASF extraction | false |
| `--headless` | Run browser headless | true |

### Keywords Options

| Option | Description | Default |
|--------|-------------|---------|
| `-l, --limit` | Number of keywords to generate | 50 |
| `-c, --category` | Filter by category | - |
| `-o, --output` | Output format: json, csv, console | console |

## Output

Results are saved to the `output/` directory with timestamps:

- `serp-2024-01-15.json` - SERP scrape results
- `keywords-2024-01-15.csv` - Keyword suggestions

## Architecture

```
tools/seo-cli/
├── index.js           # CLI entry point (Commander.js)
├── lib/
│   ├── serp-scraper.js    # Node.js wrapper for Python scraper
│   ├── scraper.py         # Botasaurus-based Google scraper
│   ├── keyword-generator.js # Generates keywords from Supabase
│   ├── exporter.js        # JSON/CSV export utilities
│   └── config.js          # Configuration management
├── venv/              # Python virtual environment (gitignored)
├── output/            # Scrape results (gitignored)
└── package.json
```

## Anti-Detection

The scraper uses Botasaurus which provides:
- Human-like browser fingerprinting
- `google_get()` method for Google-specific anti-detection
- Automatic cookie consent handling
- Realistic delays and interactions

## Data Sources

Keywords are generated from:
1. **Seed keywords**: High-value Hawaiian Pidgin terms
2. **Dictionary entries**: Words from Supabase dictionary_entries table
3. **Phrases**: Common phrases from Supabase phrases table
4. **Topic keywords**: Category-based keyword templates

## Example Workflow

```bash
# 1. Generate keyword list
node index.js keywords --limit 100 --output json

# 2. Scrape top keywords
node index.js scrape --auto --limit 20 --output json --delay 3000

# 3. Review PAA questions for content ideas
node index.js paa "hawaiian pidgin phrases"

# 4. Check rankings
node index.js analyze --limit 10
```

## Troubleshooting

### "Chrome not found" error
The scraper looks for Chrome in Puppeteer's cache. Run `npx puppeteer browsers install chrome` to install it.

### CAPTCHA issues
Botasaurus handles most anti-bot measures, but if you encounter CAPTCHAs:
- Increase delay between requests (`--delay 5000`)
- Use a residential proxy (configure in scraper.py)
- Try non-headless mode for debugging
