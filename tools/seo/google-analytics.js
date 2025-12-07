#!/usr/bin/env node
/**
 * Google Analytics 4 (GA4) CLI Tool
 *
 * Fetches analytics data and generates insights for feeding into Claude.
 * Outputs in JSON, Markdown, or table format for easy AI analysis.
 *
 * Setup:
 * 1. Use the same service account from Search Console
 * 2. Go to GA4 Admin > Property Access Management
 * 3. Add the service account email with Viewer role
 * 4. Set GA4_PROPERTY_ID in .env (format: properties/XXXXXXXXX)
 *
 * Usage:
 *   node tools/seo/google-analytics.js --help
 *   node tools/seo/google-analytics.js report --days 7
 *   node tools/seo/google-analytics.js top-pages --limit 20
 *   node tools/seo/google-analytics.js insights --format markdown
 */

const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const PROPERTY_ID = process.env.GA4_PROPERTY_ID || '';
const KEY_PATH = process.env.GOOGLE_ANALYTICS_KEY_PATH ||
                 process.env.GOOGLE_SEARCH_CONSOLE_KEY_PATH ||
                 './google-search-console-key.json';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const options = parseArgs(args.slice(1));

function parseArgs(args) {
    const opts = {
        days: 28,
        limit: 50,
        output: null,
        format: 'table', // table, json, markdown, claude
        keyFile: KEY_PATH,
        propertyId: PROPERTY_ID,
        metrics: null,
        dimensions: null,
        help: false
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--days':
            case '-d':
                opts.days = parseInt(args[++i], 10);
                break;
            case '--limit':
            case '-l':
                opts.limit = parseInt(args[++i], 10);
                break;
            case '--output':
            case '-o':
                opts.output = args[++i];
                break;
            case '--format':
            case '-f':
                opts.format = args[++i];
                break;
            case '--key-file':
            case '-k':
                opts.keyFile = args[++i];
                break;
            case '--property':
            case '-p':
                opts.propertyId = args[++i];
                break;
            case '--metrics':
            case '-m':
                opts.metrics = args[++i].split(',');
                break;
            case '--dimensions':
                opts.dimensions = args[++i].split(',');
                break;
            case '--help':
            case '-h':
                opts.help = true;
                break;
        }
    }

    return opts;
}

function showHelp() {
    console.log(`
Google Analytics 4 CLI Tool
============================

Commands:
  report          Flexible custom report with any metrics/dimensions
  top-pages       Top performing pages by views
  traffic         Traffic sources and channels
  devices         Device breakdown (mobile/desktop/tablet)
  engagement      Engagement metrics by page
  low-engagement  Pages with lowest engagement (needs improvement)
  conversions     Event/conversion performance
  realtime        Real-time active users
  insights        Full analysis report for Claude

Options:
  --days, -d       Number of days to analyze (default: 28)
  --limit, -l      Max results to return (default: 50)
  --output, -o     Output file path
  --format, -f     Output format: table, json, markdown, claude (default: table)
  --property, -p   GA4 Property ID (format: properties/XXXXXXXXX)
  --key-file, -k   Path to service account key file
  --metrics, -m    Comma-separated metrics (for custom report)
  --dimensions     Comma-separated dimensions (for custom report)
  --help, -h       Show this help message

Examples:
  node tools/seo/google-analytics.js top-pages --days 7
  node tools/seo/google-analytics.js traffic --format markdown
  node tools/seo/google-analytics.js insights --format claude --output ga-insights.md
  node tools/seo/google-analytics.js report --metrics "sessions,screenPageViews" --dimensions "pagePath"

Output Formats:
  table     - Pretty printed table (default)
  json      - Raw JSON for programmatic use
  markdown  - Markdown tables for documentation
  claude    - Structured prompt-ready format for Claude analysis

Setup:
  1. Enable Google Analytics Data API in Cloud Console
  2. Use existing service account (from Search Console) or create new one
  3. Add service account email to GA4 Property > Admin > Property Access Management
  4. Set GA4_PROPERTY_ID environment variable (find in GA4 Admin > Property Details)
`);
}

// Initialize GA4 client
function createClient() {
    if (!fs.existsSync(options.keyFile)) {
        console.error(`❌ Service account key file not found: ${options.keyFile}`);
        console.error('   Set GOOGLE_ANALYTICS_KEY_PATH or use --key-file option');
        process.exit(1);
    }

    return new BetaAnalyticsDataClient({
        keyFilename: options.keyFile
    });
}

// Get date range
function getDateRange(days) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
    };
}

// Run a GA4 report
async function runReport(client, { metrics, dimensions, limit = 50, days = 28, orderBy = null }) {
    const propertyId = options.propertyId;

    if (!propertyId) {
        console.error('❌ GA4 Property ID not set');
        console.error('   Set GA4_PROPERTY_ID in .env or use --property option');
        console.error('   Format: properties/XXXXXXXXX (find in GA4 Admin > Property Details)');
        process.exit(1);
    }

    const { startDate, endDate } = getDateRange(days);

    const request = {
        property: propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        metrics: metrics.map(m => ({ name: m })),
        dimensions: dimensions.map(d => ({ name: d })),
        limit
    };

    if (orderBy) {
        request.orderBys = [orderBy];
    }

    try {
        const [response] = await client.runReport(request);
        return parseResponse(response, metrics, dimensions);
    } catch (error) {
        console.error('❌ GA4 API Error:', error.message);
        if (error.message.includes('permission')) {
            console.error('   Make sure the service account has access to this GA4 property');
        }
        process.exit(1);
    }
}

// Parse GA4 response into simple objects
function parseResponse(response, metrics, dimensions) {
    if (!response.rows || response.rows.length === 0) {
        return [];
    }

    return response.rows.map(row => {
        const obj = {};

        // Add dimensions
        dimensions.forEach((dim, i) => {
            obj[dim] = row.dimensionValues[i]?.value || '';
        });

        // Add metrics
        metrics.forEach((metric, i) => {
            const value = row.metricValues[i]?.value || '0';
            // Convert to number if possible
            obj[metric] = isNaN(value) ? value : parseFloat(value);
        });

        return obj;
    });
}

// Format output based on selected format
function formatOutput(data, title, format = 'table') {
    switch (format) {
        case 'json':
            return JSON.stringify(data, null, 2);
        case 'markdown':
            return formatMarkdown(data, title);
        case 'claude':
            return formatForClaude(data, title);
        case 'table':
        default:
            return formatTable(data, title);
    }
}

// Format as ASCII table
function formatTable(data, title) {
    if (data.length === 0) return 'No data available';

    const keys = Object.keys(data[0]);
    const colWidths = {};

    // Calculate column widths
    keys.forEach(key => {
        colWidths[key] = Math.max(
            key.length,
            ...data.map(row => String(row[key]).length)
        );
        colWidths[key] = Math.min(colWidths[key], 50); // Max width
    });

    // Build table
    let output = `\n${title}\n${'='.repeat(title.length)}\n\n`;

    // Header
    output += '  ' + keys.map(k => k.padEnd(colWidths[k])).join(' | ') + '\n';
    output += '  ' + keys.map(k => '-'.repeat(colWidths[k])).join('-+-') + '\n';

    // Rows
    data.forEach(row => {
        output += '  ' + keys.map(k => {
            const val = String(row[k]);
            return val.length > 50 ? val.substring(0, 47) + '...' : val.padEnd(colWidths[k]);
        }).join(' | ') + '\n';
    });

    return output;
}

// Format as Markdown
function formatMarkdown(data, title) {
    if (data.length === 0) return '## ' + title + '\n\nNo data available.';

    const keys = Object.keys(data[0]);

    let output = `## ${title}\n\n`;
    output += '| ' + keys.join(' | ') + ' |\n';
    output += '| ' + keys.map(() => '---').join(' | ') + ' |\n';

    data.forEach(row => {
        output += '| ' + keys.map(k => String(row[k])).join(' | ') + ' |\n';
    });

    return output;
}

// Format for Claude analysis
function formatForClaude(data, title) {
    const { startDate, endDate } = getDateRange(options.days);

    let output = `# Google Analytics Report: ${title}

## Report Details
- **Date Range:** ${startDate} to ${endDate} (${options.days} days)
- **Property:** ${options.propertyId}
- **Generated:** ${new Date().toISOString()}
- **Records:** ${data.length}

## Data

`;

    if (data.length === 0) {
        output += 'No data available for this report.\n';
    } else {
        // Add as markdown table
        const keys = Object.keys(data[0]);
        output += '| ' + keys.join(' | ') + ' |\n';
        output += '| ' + keys.map(() => '---').join(' | ') + ' |\n';

        data.forEach(row => {
            output += '| ' + keys.map(k => String(row[k])).join(' | ') + ' |\n';
        });

        // Add summary stats for numeric columns
        output += '\n## Summary Statistics\n\n';
        keys.forEach(key => {
            const values = data.map(r => r[key]).filter(v => typeof v === 'number');
            if (values.length > 0) {
                const sum = values.reduce((a, b) => a + b, 0);
                const avg = sum / values.length;
                const max = Math.max(...values);
                const min = Math.min(...values);
                output += `- **${key}:** Total: ${sum.toLocaleString()}, Avg: ${avg.toFixed(2)}, Max: ${max.toLocaleString()}, Min: ${min.toLocaleString()}\n`;
            }
        });
    }

    output += `
## Analysis Request

Please analyze this Google Analytics data and provide:
1. **Key Insights:** What are the most important patterns or trends?
2. **Top Performers:** Which pages/sources are driving the most value?
3. **Improvement Opportunities:** What areas need attention?
4. **Actionable Recommendations:** Specific steps to improve performance.
`;

    return output;
}

// Output helper
function output(data, title) {
    const formatted = formatOutput(data, title, options.format);

    if (options.output) {
        fs.writeFileSync(options.output, formatted);
        console.log(`✅ Report saved to: ${options.output}`);
    } else {
        console.log(formatted);
    }
}

// ============================================
// COMMANDS
// ============================================

// Top Pages Report
async function cmdTopPages() {
    console.log(`\n📊 Fetching top pages from last ${options.days} days...\n`);

    const client = createClient();
    const data = await runReport(client, {
        metrics: ['screenPageViews', 'sessions', 'averageSessionDuration', 'bounceRate'],
        dimensions: ['pageTitle', 'pagePath'],
        limit: options.limit,
        days: options.days,
        orderBy: { metric: { metricName: 'screenPageViews' }, desc: true }
    });

    // Format for readability
    const formatted = data.map(row => ({
        page: row.pageTitle?.substring(0, 40) || row.pagePath,
        path: row.pagePath,
        views: row.screenPageViews,
        sessions: row.sessions,
        avgDuration: `${Math.round(row.averageSessionDuration)}s`,
        bounceRate: `${(row.bounceRate * 100).toFixed(1)}%`
    }));

    output(formatted, 'Top Pages by Views');
}

// Traffic Sources Report
async function cmdTraffic() {
    console.log(`\n📊 Fetching traffic sources from last ${options.days} days...\n`);

    const client = createClient();
    const data = await runReport(client, {
        metrics: ['sessions', 'totalUsers', 'newUsers', 'bounceRate', 'averageSessionDuration'],
        dimensions: ['sessionDefaultChannelGroup'],
        limit: options.limit,
        days: options.days,
        orderBy: { metric: { metricName: 'sessions' }, desc: true }
    });

    const formatted = data.map(row => ({
        channel: row.sessionDefaultChannelGroup,
        sessions: row.sessions,
        users: row.totalUsers,
        newUsers: row.newUsers,
        bounceRate: `${(row.bounceRate * 100).toFixed(1)}%`,
        avgDuration: `${Math.round(row.averageSessionDuration)}s`
    }));

    output(formatted, 'Traffic by Channel');
}

// Device Breakdown
async function cmdDevices() {
    console.log(`\n📊 Fetching device breakdown from last ${options.days} days...\n`);

    const client = createClient();
    const data = await runReport(client, {
        metrics: ['sessions', 'totalUsers', 'screenPageViews', 'bounceRate', 'averageSessionDuration'],
        dimensions: ['deviceCategory'],
        limit: 10,
        days: options.days,
        orderBy: { metric: { metricName: 'sessions' }, desc: true }
    });

    const formatted = data.map(row => ({
        device: row.deviceCategory,
        sessions: row.sessions,
        users: row.totalUsers,
        pageViews: row.screenPageViews,
        bounceRate: `${(row.bounceRate * 100).toFixed(1)}%`,
        avgDuration: `${Math.round(row.averageSessionDuration)}s`
    }));

    output(formatted, 'Device Breakdown');
}

// Engagement by Page
async function cmdEngagement() {
    console.log(`\n📊 Fetching page engagement from last ${options.days} days...\n`);

    const client = createClient();
    const data = await runReport(client, {
        metrics: ['screenPageViews', 'userEngagementDuration', 'engagementRate', 'averageSessionDuration'],
        dimensions: ['pagePath', 'pageTitle'],
        limit: options.limit,
        days: options.days,
        orderBy: { metric: { metricName: 'userEngagementDuration' }, desc: true }
    });

    const formatted = data.map(row => ({
        page: row.pageTitle?.substring(0, 35) || row.pagePath,
        views: row.screenPageViews,
        engagementTime: `${Math.round(row.userEngagementDuration)}s`,
        engagementRate: `${(row.engagementRate * 100).toFixed(1)}%`,
        avgSession: `${Math.round(row.averageSessionDuration)}s`
    }));

    output(formatted, 'Page Engagement (Highest First)');
}

// Low Engagement Pages (needs improvement)
async function cmdLowEngagement() {
    console.log(`\n📊 Fetching low engagement pages from last ${options.days} days...\n`);

    const client = createClient();
    const data = await runReport(client, {
        metrics: ['screenPageViews', 'userEngagementDuration', 'engagementRate', 'bounceRate'],
        dimensions: ['pagePath', 'pageTitle'],
        limit: 200, // Get more to filter
        days: options.days,
        orderBy: { metric: { metricName: 'screenPageViews' }, desc: true }
    });

    // Filter to pages with decent traffic but low engagement
    const lowEngagement = data
        .filter(row => row.screenPageViews >= 10 && row.engagementRate < 0.5)
        .sort((a, b) => a.engagementRate - b.engagementRate)
        .slice(0, options.limit);

    const formatted = lowEngagement.map(row => ({
        page: row.pageTitle?.substring(0, 35) || row.pagePath,
        path: row.pagePath,
        views: row.screenPageViews,
        engagementRate: `${(row.engagementRate * 100).toFixed(1)}%`,
        bounceRate: `${(row.bounceRate * 100).toFixed(1)}%`,
        suggestion: row.bounceRate > 0.7 ? 'High bounce - improve content' : 'Low engagement - add interactivity'
    }));

    output(formatted, 'Low Engagement Pages (Needs Improvement)');
}

// Conversions/Events
async function cmdConversions() {
    console.log(`\n📊 Fetching event performance from last ${options.days} days...\n`);

    const client = createClient();
    const data = await runReport(client, {
        metrics: ['eventCount', 'totalUsers'],
        dimensions: ['eventName'],
        limit: options.limit,
        days: options.days,
        orderBy: { metric: { metricName: 'eventCount' }, desc: true }
    });

    const formatted = data.map(row => ({
        event: row.eventName,
        count: row.eventCount,
        users: row.totalUsers,
        perUser: (row.eventCount / row.totalUsers).toFixed(2)
    }));

    output(formatted, 'Event Performance');
}

// Custom Report
async function cmdReport() {
    const metrics = options.metrics || ['sessions', 'screenPageViews', 'totalUsers'];
    const dimensions = options.dimensions || ['date'];

    console.log(`\n📊 Running custom report...`);
    console.log(`   Metrics: ${metrics.join(', ')}`);
    console.log(`   Dimensions: ${dimensions.join(', ')}`);
    console.log(`   Days: ${options.days}\n`);

    const client = createClient();
    const data = await runReport(client, {
        metrics,
        dimensions,
        limit: options.limit,
        days: options.days
    });

    output(data, 'Custom Report');
}

// Full Insights Report (for Claude)
async function cmdInsights() {
    console.log(`\n📊 Generating full insights report for Claude...\n`);

    const client = createClient();
    const { startDate, endDate } = getDateRange(options.days);

    // Collect all reports
    const reports = {};

    // Overview metrics
    console.log('   Fetching overview metrics...');
    reports.overview = await runReport(client, {
        metrics: ['sessions', 'totalUsers', 'newUsers', 'screenPageViews', 'averageSessionDuration', 'bounceRate', 'engagementRate'],
        dimensions: ['date'],
        limit: options.days,
        days: options.days
    });

    // Top pages
    console.log('   Fetching top pages...');
    reports.topPages = await runReport(client, {
        metrics: ['screenPageViews', 'sessions', 'bounceRate', 'averageSessionDuration'],
        dimensions: ['pagePath', 'pageTitle'],
        limit: 20,
        days: options.days,
        orderBy: { metric: { metricName: 'screenPageViews' }, desc: true }
    });

    // Traffic sources
    console.log('   Fetching traffic sources...');
    reports.traffic = await runReport(client, {
        metrics: ['sessions', 'totalUsers', 'bounceRate'],
        dimensions: ['sessionDefaultChannelGroup'],
        limit: 10,
        days: options.days,
        orderBy: { metric: { metricName: 'sessions' }, desc: true }
    });

    // Devices
    console.log('   Fetching device breakdown...');
    reports.devices = await runReport(client, {
        metrics: ['sessions', 'totalUsers', 'bounceRate'],
        dimensions: ['deviceCategory'],
        limit: 5,
        days: options.days
    });

    // Geographic
    console.log('   Fetching geographic data...');
    reports.geography = await runReport(client, {
        metrics: ['sessions', 'totalUsers'],
        dimensions: ['country'],
        limit: 10,
        days: options.days,
        orderBy: { metric: { metricName: 'sessions' }, desc: true }
    });

    // Build Claude-friendly output
    let output = `# Google Analytics Full Insights Report

## Report Metadata
- **Property:** ${options.propertyId}
- **Date Range:** ${startDate} to ${endDate} (${options.days} days)
- **Generated:** ${new Date().toISOString()}
- **Site:** ChokePidgin.com

---

## 1. Traffic Overview (Daily)

| Date | Sessions | Users | New Users | Page Views | Avg Duration | Bounce Rate | Engagement |
|------|----------|-------|-----------|------------|--------------|-------------|------------|
`;

    reports.overview.slice(0, 14).forEach(row => {
        output += `| ${row.date} | ${row.sessions} | ${row.totalUsers} | ${row.newUsers} | ${row.screenPageViews} | ${Math.round(row.averageSessionDuration)}s | ${(row.bounceRate * 100).toFixed(1)}% | ${(row.engagementRate * 100).toFixed(1)}% |\n`;
    });

    // Summary stats
    const totalSessions = reports.overview.reduce((sum, r) => sum + r.sessions, 0);
    const totalUsers = reports.overview.reduce((sum, r) => sum + r.totalUsers, 0);
    const totalPageViews = reports.overview.reduce((sum, r) => sum + r.screenPageViews, 0);
    const avgBounce = reports.overview.reduce((sum, r) => sum + r.bounceRate, 0) / reports.overview.length;

    output += `
**Period Totals:**
- Total Sessions: ${totalSessions.toLocaleString()}
- Total Users: ${totalUsers.toLocaleString()}
- Total Page Views: ${totalPageViews.toLocaleString()}
- Average Bounce Rate: ${(avgBounce * 100).toFixed(1)}%

---

## 2. Top Pages

| Page | Path | Views | Sessions | Bounce Rate | Avg Duration |
|------|------|-------|----------|-------------|--------------|
`;

    reports.topPages.forEach(row => {
        const title = (row.pageTitle || row.pagePath).substring(0, 40);
        output += `| ${title} | ${row.pagePath} | ${row.screenPageViews} | ${row.sessions} | ${(row.bounceRate * 100).toFixed(1)}% | ${Math.round(row.averageSessionDuration)}s |\n`;
    });

    output += `
---

## 3. Traffic Sources

| Channel | Sessions | Users | Bounce Rate |
|---------|----------|-------|-------------|
`;

    reports.traffic.forEach(row => {
        output += `| ${row.sessionDefaultChannelGroup} | ${row.sessions} | ${row.totalUsers} | ${(row.bounceRate * 100).toFixed(1)}% |\n`;
    });

    output += `
---

## 4. Device Breakdown

| Device | Sessions | Users | Bounce Rate |
|--------|----------|-------|-------------|
`;

    reports.devices.forEach(row => {
        output += `| ${row.deviceCategory} | ${row.sessions} | ${row.totalUsers} | ${(row.bounceRate * 100).toFixed(1)}% |\n`;
    });

    output += `
---

## 5. Geographic Distribution

| Country | Sessions | Users |
|---------|----------|-------|
`;

    reports.geography.forEach(row => {
        output += `| ${row.country} | ${row.sessions} | ${row.totalUsers} |\n`;
    });

    output += `
---

## Analysis Request for Claude

Please analyze this Google Analytics data for ChokePidgin.com (Hawaiian Pidgin learning website) and provide:

### 1. Traffic Analysis
- What are the traffic trends? Is the site growing?
- Which traffic sources are most valuable?
- Are there concerning patterns (high bounce rates, low engagement)?

### 2. Content Performance
- Which pages are performing best and why?
- Which pages need improvement?
- Are there content gaps we should fill?

### 3. User Behavior Insights
- How do mobile vs desktop users behave differently?
- What's the typical user journey?
- Where are users dropping off?

### 4. Actionable Recommendations
- Top 5 quick wins to improve performance
- Content priorities for next month
- Technical improvements needed

### 5. SEO Correlation
- Compare with Search Console data if available
- Which high-impression pages have low GA engagement?
- Content optimization priorities
`;

    if (options.output) {
        fs.writeFileSync(options.output, output);
        console.log(`\n✅ Full insights report saved to: ${options.output}`);
        console.log('   Feed this file to Claude for comprehensive analysis!');
    } else {
        console.log(output);
    }
}

// Real-time data
async function cmdRealtime() {
    console.log(`\n📊 Fetching real-time data...\n`);

    const client = createClient();
    const propertyId = options.propertyId;

    if (!propertyId) {
        console.error('❌ GA4 Property ID not set');
        process.exit(1);
    }

    try {
        const [response] = await client.runRealtimeReport({
            property: propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`,
            metrics: [{ name: 'activeUsers' }],
            dimensions: [{ name: 'pagePath' }],
            limit: 20
        });

        if (!response.rows || response.rows.length === 0) {
            console.log('No active users right now.');
            return;
        }

        const data = response.rows.map(row => ({
            page: row.dimensionValues[0]?.value,
            activeUsers: parseInt(row.metricValues[0]?.value || '0')
        }));

        const total = data.reduce((sum, r) => sum + r.activeUsers, 0);

        console.log(`\n🟢 Real-time Active Users: ${total}\n`);
        output(data, 'Active Users by Page');
    } catch (error) {
        console.error('❌ Real-time API Error:', error.message);
    }
}

// Main execution
async function main() {
    if (!command || command === '--help' || command === '-h' || options.help) {
        showHelp();
        return;
    }

    try {
        switch (command) {
            case 'top-pages':
                await cmdTopPages();
                break;
            case 'traffic':
                await cmdTraffic();
                break;
            case 'devices':
                await cmdDevices();
                break;
            case 'engagement':
                await cmdEngagement();
                break;
            case 'low-engagement':
                await cmdLowEngagement();
                break;
            case 'conversions':
            case 'events':
                await cmdConversions();
                break;
            case 'report':
                await cmdReport();
                break;
            case 'insights':
                await cmdInsights();
                break;
            case 'realtime':
            case 'rt':
                await cmdRealtime();
                break;
            default:
                console.error(`Unknown command: ${command}`);
                console.error('Run with --help to see available commands');
                process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
