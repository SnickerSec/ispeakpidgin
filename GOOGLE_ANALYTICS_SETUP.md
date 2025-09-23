# Google Analytics Setup Guide

## Overview
Google Analytics has been integrated into the ChokePidgin.com website. The tracking code is already added to all pages, but you need to replace the placeholder ID with your actual Google Analytics Measurement ID.

## Setup Steps

### 1. Create a Google Analytics Account
1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click "Start measuring"
4. Set up your account:
   - Account name: ChokePidgin
   - Leave data sharing settings as default

### 2. Create a Property
1. Property name: ChokePidgin.com
2. Reporting time zone: Hawaii (UTC-10:00)
3. Currency: United States Dollar (USD)
4. Click "Next"

### 3. About Your Business
1. Industry category: Education
2. Business size: Small
3. How you intend to use Google Analytics:
   - Measure content engagement
   - Examine user behavior
   - Improve the user experience

### 4. Create a Web Data Stream
1. Platform: Web
2. Website URL: https://chokepidgin.com
3. Stream name: ChokePidgin Main Site
4. Leave Enhanced measurement enabled

### 5. Get Your Measurement ID
After creating the data stream, you'll see your Measurement ID (format: G-XXXXXXXXXX)

### 6. Update the Website

#### Method 1: Update All HTML Files (Recommended)
Replace `G-XXXXXXXXXX` with your actual Measurement ID in these files:
- `src/pages/index.html` (lines 81 and 86)
- `src/pages/dictionary.html` (lines 81 and 86)
- `src/pages/ask-local.html` (lines 67 and 72)

#### Method 2: Use Find and Replace
In your code editor, do a project-wide find and replace:
- Find: `G-XXXXXXXXXX`
- Replace with: Your actual Measurement ID (e.g., `G-ABC123DEF4`)

### 7. Build and Deploy
```bash
# Build the project
npm run build

# Commit changes
git add -A
git commit -m "Add Google Analytics tracking ID"
git push
```

## Verify Installation

### 1. Real-time Reports
1. Go to Google Analytics
2. Navigate to Reports → Real-time
3. Visit your website in another tab
4. You should see yourself as an active user

### 2. Using Browser Extensions
Install the [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension to verify tracking is working.

### 3. Check Network Tab
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Filter by "google"
4. Reload your page
5. You should see requests to:
   - `www.googletagmanager.com/gtag/js`
   - `www.google-analytics.com/g/collect`

## Important Features Configured

### Content Security Policy (CSP)
The Express server (`server.js`) has been updated to allow Google Analytics domains in the CSP headers:
- Script sources for googletagmanager.com and google-analytics.com
- Connect sources for analytics data collection
- Image sources for tracking pixels

### Pages Tracked
All main pages have Google Analytics installed:
- Homepage (`index.html`)
- Dictionary (`dictionary.html`)
- Ask a Local (`ask-local.html`)

### Events Tracked (Default)
With Enhanced Measurement enabled, Google Analytics automatically tracks:
- Page views
- Scrolls
- Outbound clicks
- Site search
- Video engagement
- File downloads

## Custom Events (Future Enhancement)
You can add custom events for specific user actions:

```javascript
// Example: Track dictionary word lookup
gtag('event', 'word_lookup', {
    'event_category': 'engagement',
    'event_label': wordKey,
    'value': 1
});

// Example: Track translation
gtag('event', 'translate', {
    'event_category': 'tool_usage',
    'event_label': 'english_to_pidgin',
    'value': textLength
});

// Example: Track practice session
gtag('event', 'practice_start', {
    'event_category': 'learning',
    'event_label': practiceMode,
    'value': wordCount
});
```

## Privacy Considerations
Consider adding:
1. Cookie consent banner
2. Privacy policy page
3. Option to opt-out of analytics

## Support
For Google Analytics help: [Google Analytics Help Center](https://support.google.com/analytics)

## Notes
- The placeholder `G-XXXXXXXXXX` is used until you provide your actual Measurement ID
- Analytics data typically takes 24-48 hours to fully populate in reports
- Real-time data should appear immediately