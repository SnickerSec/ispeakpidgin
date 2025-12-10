# Google Analytics 4 CLI Setup Guide

This guide shows how to set up the GA4 CLI tool to fetch analytics data and generate reports for Claude analysis.

## Prerequisites

- Node.js 18+ installed
- Existing Google Cloud project (from Search Console setup)
- GA4 property for your website

## Step 1: Enable the Google Analytics Data API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your existing project (`choke-pidgin`)
3. Go to **APIs & Services > Library**
4. Search for "Google Analytics Data API"
5. Click **Enable**

## Step 2: Grant Service Account Access to GA4

Use the same service account from Search Console:

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property (ChokePidgin)
3. Go to **Admin** (gear icon) → **Property Access Management**
4. Click **+ Add users**
5. Enter the service account email:
   ```
   choke-pidgin@choke-pidgin.iam.gserviceaccount.com
   ```
6. Select **Viewer** role (minimum required)
7. Click **Add**

## Step 3: Find Your GA4 Property ID

1. In GA4, go to **Admin** → **Property Details**
2. Find the **Property ID** (a number like `123456789`)
3. The full format needed is: `properties/123456789`

## Step 4: Configure Environment Variables

Add to your `.env` file:

```bash
# GA4 Configuration
GA4_PROPERTY_ID=properties/YOUR_PROPERTY_ID

# Uses same key as Search Console (already set)
# GOOGLE_SEARCH_CONSOLE_KEY_PATH=./google-search-console-key.json
```

Or set via command line:
```bash
export GA4_PROPERTY_ID=properties/123456789
```

## Usage

### Quick Commands

```bash
# Top performing pages
npm run ga:top-pages

# Traffic sources
npm run ga:traffic

# Device breakdown
npm run ga:devices

# Page engagement metrics
npm run ga:engagement

# Low engagement pages (need improvement)
npm run ga:low-engagement

# Event/conversion tracking
npm run ga:events

# Real-time active users
npm run ga:realtime

# Full insights report for Claude
npm run ga:insights
```

### Command Options

```bash
# Specify date range
node tools/seo/google-analytics.js top-pages --days 7

# Limit results
node tools/seo/google-analytics.js top-pages --limit 20

# Output to file
node tools/seo/google-analytics.js insights --output ga-report.md

# Different output formats
node tools/seo/google-analytics.js top-pages --format json
node tools/seo/google-analytics.js top-pages --format markdown
node tools/seo/google-analytics.js top-pages --format claude
```

### Custom Reports

```bash
# Custom metrics and dimensions
node tools/seo/google-analytics.js report \
  --metrics "sessions,screenPageViews,bounceRate" \
  --dimensions "pagePath,deviceCategory" \
  --days 14
```

### Available Metrics

Common metrics you can use:
- `sessions` - Number of sessions
- `totalUsers` - Total users
- `newUsers` - New users
- `screenPageViews` - Page views
- `averageSessionDuration` - Avg session length
- `bounceRate` - Bounce rate (0-1)
- `engagementRate` - Engagement rate (0-1)
- `userEngagementDuration` - Total engagement time
- `eventCount` - Event count

### Available Dimensions

Common dimensions:
- `date` - Date
- `pagePath` - Page URL path
- `pageTitle` - Page title
- `sessionDefaultChannelGroup` - Traffic source
- `deviceCategory` - Device type
- `country` - Country
- `city` - City
- `eventName` - Event name

## Generating Reports for Claude

The `insights` command generates a comprehensive report formatted for Claude analysis:

```bash
# Generate and save to file
npm run ga:insights -- --output reports/ga-insights-$(date +%Y%m%d).md

# Or directly:
node tools/seo/google-analytics.js insights --format claude --output ga-report.md
```

This creates a markdown file with:
- Traffic overview (daily breakdown)
- Top pages with metrics
- Traffic sources
- Device breakdown
- Geographic data
- Pre-written analysis prompts for Claude

### Example Workflow: Feed to Claude

```bash
# 1. Generate the report
npm run ga:insights -- --output /tmp/ga-report.md

# 2. Feed to Claude (via Claude Code)
# Simply ask Claude to analyze the report:
# "Analyze the GA report in /tmp/ga-report.md and suggest improvements"
```

## Combining with Search Console Data

For comprehensive SEO analysis, combine both tools:

```bash
# Get Search Console optimization suggestions
npm run seo:optimize

# Get GA4 insights
npm run ga:insights -- --output ga-insights.md

# Then ask Claude to correlate:
# "Compare the Search Console data with GA4 insights.
#  Which high-impression keywords have low engagement?"
```

## Troubleshooting

### "Property ID not set"
Set the GA4_PROPERTY_ID environment variable or use `--property` flag.

### "Permission denied"
Make sure the service account email has Viewer access in GA4 Admin.

### "API not enabled"
Enable the Google Analytics Data API in Cloud Console.

### No data returned
- Check the date range (data may take 24-48 hours to appear)
- Verify the property ID is correct
- Ensure the property has traffic

## Rate Limits

The GA4 API has quotas:
- 10,000 requests per day per project
- 10 requests per second

The CLI is designed to stay well within these limits for normal usage.
