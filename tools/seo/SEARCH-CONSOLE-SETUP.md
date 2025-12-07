# Google Search Console API Setup

This guide explains how to set up the Google Search Console API integration for SEO analytics and optimization suggestions.

## Prerequisites

- Google account with access to Search Console for chokepidgin.com
- Access to Google Cloud Console

## Setup Steps

### 1. Enable the Search Console API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to **APIs & Services > Library**
4. Search for "Google Search Console API"
5. Click **Enable**

### 2. Create a Service Account

1. In Google Cloud Console, go to **APIs & Services > Credentials**
2. Click **Create Credentials > Service Account**
3. Name: `search-console-api` (or any name)
4. Click **Create and Continue**
5. Skip the optional steps, click **Done**
6. Click on the service account you just created
7. Go to **Keys** tab
8. Click **Add Key > Create new key**
9. Choose **JSON** format
10. Save the downloaded file as `google-search-console-key.json` in the project root

### 3. Add Service Account to Search Console

1. Copy the service account email (looks like: `search-console-api@project-id.iam.gserviceaccount.com`)
2. Go to [Google Search Console](https://search.google.com/search-console/)
3. Select your property (chokepidgin.com)
4. Go to **Settings > Users and permissions**
5. Click **Add User**
6. Paste the service account email
7. Set permission to **Full** or **Restricted** (read-only is fine for analytics)
8. Click **Add**

### 4. Configure Environment

Add to your `.env` file:

```env
GOOGLE_SEARCH_CONSOLE_KEY_PATH=./google-search-console-key.json
SITE_URL=https://chokepidgin.com
```

Or for Railway deployment, you can base64 encode the key:

```bash
cat google-search-console-key.json | base64 -w 0
```

Then set `GOOGLE_SEARCH_CONSOLE_KEY_BASE64` environment variable.

## Usage

### CLI Commands

```bash
# View top search queries
npm run seo:queries

# View top performing pages
npm run seo:pages

# Generate optimization suggestions
npm run seo:optimize

# Generate full report
npm run seo:report

# Start API server (port 3001)
npm run seo:api
```

### CLI Options

```bash
# Specify time period (default: 28 days)
node tools/seo/search-console.js queries --days 7

# Limit results
node tools/seo/search-console.js pages --limit 50

# Save to file
node tools/seo/search-console.js report --output seo-report.json

# Use different key file
node tools/seo/search-console.js queries --key-file /path/to/key.json
```

### API Endpoints

When running `npm run seo:api`:

| Endpoint | Description |
|----------|-------------|
| `GET /api/search-console/queries?days=28&limit=100` | Top search queries |
| `GET /api/search-console/pages?days=28&limit=100` | Top performing pages |
| `GET /api/search-console/optimize?days=28` | Optimization suggestions |
| `GET /api/search-console/report?days=28` | Full analytics report |

## Optimization Categories

The tool generates suggestions in these categories:

1. **Low CTR, High Impressions** - Queries getting views but few clicks. Improve titles/descriptions.

2. **Almost Page 1** - Keywords ranking 4-20. Small improvements could reach page 1.

3. **Top Performers** - Your best pages. Create similar content or improve internal linking.

4. **Underperforming Pages** - High visibility, low engagement. Need content improvements.

5. **Content Gaps** - Popular queries without dedicated pages. Create new content.

6. **Quick Wins** - Already ranking well but low CTR. Add schema, improve meta, add FAQ.

## Data Delay

Google Search Console data has a 2-3 day delay. The tool automatically accounts for this.

## Troubleshooting

### "Permission denied" error
- Ensure the service account email is added to Search Console
- Verify the Search Console API is enabled in Google Cloud Console

### "Key file not found" error
- Check the path in GOOGLE_SEARCH_CONSOLE_KEY_PATH
- Ensure the JSON key file exists and is readable

### Empty results
- Data may not be available yet for new sites
- Try a longer time period (--days 90)
