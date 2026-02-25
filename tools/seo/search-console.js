#!/usr/bin/env node
/**
 * Google Search Console CLI Tool
 *
 * Fetches search analytics data and generates SEO optimization suggestions.
 *
 * Setup:
 * 1. Go to Google Cloud Console: https://console.cloud.google.com/
 * 2. Create a new project or select existing one
 * 3. Enable "Google Search Console API"
 * 4. Create a Service Account and download JSON key
 * 5. Add the service account email to Search Console as a user
 * 6. Set GOOGLE_SEARCH_CONSOLE_KEY_PATH in .env or pass --key-file
 *
 * Usage:
 *   node tools/seo/search-console.js --help
 *   node tools/seo/search-console.js queries --days 28
 *   node tools/seo/search-console.js pages --days 7
 *   node tools/seo/search-console.js optimize
 *   node tools/seo/search-console.js report --output report.json
 */

const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
// Use domain property format (sc-domain:) or URL prefix format (https://)
const SITE_URL = process.env.SITE_URL || 'sc-domain:chokepidgin.com';
const KEY_PATH = process.env.GOOGLE_SEARCH_CONSOLE_KEY_PATH || './google-search-console-key.json';

const SEARCH_CONSOLE_API = 'https://searchconsole.googleapis.com/webmasters/v3';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const options = parseArgs(args.slice(1));

function parseArgs(args) {
    const opts = {
        days: 28,
        limit: 100,
        output: null,
        keyFile: KEY_PATH,
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
            case '--key-file':
            case '-k':
                opts.keyFile = args[++i];
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
Google Search Console CLI Tool
==============================

Commands:
  queries     Fetch top search queries (keywords)
  pages       Fetch top performing pages
  optimize    Generate SEO optimization suggestions
  report      Generate full analytics report
  api-server  Start API server for real-time data

Options:
  --days, -d      Number of days to analyze (default: 28)
  --limit, -l     Max results to return (default: 100)
  --output, -o    Output file path (JSON format)
  --key-file, -k  Path to service account key file
  --help, -h      Show this help message

Examples:
  node tools/seo/search-console.js queries --days 7
  node tools/seo/search-console.js pages --limit 50
  node tools/seo/search-console.js optimize --output suggestions.json
  node tools/seo/search-console.js report --days 30 --output report.json

Setup:
  1. Enable Google Search Console API in Google Cloud Console
  2. Create a Service Account and download the JSON key
  3. Add service account email to Search Console property
  4. Set GOOGLE_SEARCH_CONSOLE_KEY_PATH in .env file
    `);
}

async function getAuthClient(keyFilePath) {
    if (!fs.existsSync(keyFilePath)) {
        console.error(`\n❌ Key file not found: ${keyFilePath}`);
        console.error('\nTo set up authentication:');
        console.error('1. Go to https://console.cloud.google.com/');
        console.error('2. Create/select a project');
        console.error('3. Enable "Google Search Console API"');
        console.error('4. Create a Service Account (APIs & Services > Credentials)');
        console.error('5. Download the JSON key file');
        console.error('6. Add service account email to Search Console as a user');
        console.error(`7. Save key file to: ${keyFilePath}`);
        console.error('   Or set GOOGLE_SEARCH_CONSOLE_KEY_PATH in .env\n');
        process.exit(1);
    }

    const auth = new GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
    });

    return auth;
}

async function searchAnalyticsQuery(auth, siteUrl, requestBody) {
    const client = await auth.getClient();
    const encodedSiteUrl = encodeURIComponent(siteUrl);
    const url = `${SEARCH_CONSOLE_API}/sites/${encodedSiteUrl}/searchAnalytics/query`;

    const res = await client.request({
        url,
        method: 'POST',
        data: requestBody
    });

    return res.data;
}

function getDateRange(days) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 3); // Data has 3-day delay

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
    };
}

async function fetchQueries(auth, days, limit) {
    const { startDate, endDate } = getDateRange(days);

    console.log(`\n📊 Fetching search queries from ${startDate} to ${endDate}...\n`);

    const response = await searchAnalyticsQuery(auth, SITE_URL, {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: limit,
        orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }]
    });

    const rows = response.rows || [];

    return rows.map(row => ({
        query: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: (row.ctr * 100).toFixed(2) + '%',
        position: row.position.toFixed(1)
    }));
}

async function fetchPages(auth, days, limit) {
    const { startDate, endDate } = getDateRange(days);

    console.log(`\n📄 Fetching page performance from ${startDate} to ${endDate}...\n`);

    const response = await searchAnalyticsQuery(auth, SITE_URL, {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: limit,
        orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }]
    });

    const rows = response.rows || [];

    return rows.map(row => ({
        page: row.keys[0].replace(SITE_URL, ''),
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: (row.ctr * 100).toFixed(2) + '%',
        position: row.position.toFixed(1)
    }));
}

async function fetchQueryPageCombos(auth, days, limit) {
    const { startDate, endDate } = getDateRange(days);

    const response = await searchAnalyticsQuery(auth, SITE_URL, {
        startDate,
        endDate,
        dimensions: ['query', 'page'],
        rowLimit: limit,
        orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }]
    });

    return response.rows || [];
}

async function generateOptimizations(auth, days) {
    console.log('\n🔍 Analyzing data for optimization opportunities...\n');

    const [queries, pages, combos] = await Promise.all([
        fetchQueries(auth, days, 500),
        fetchPages(auth, days, 200),
        fetchQueryPageCombos(auth, days, 1000)
    ]);

    const suggestions = {
        generated: new Date().toISOString(),
        period: `${days} days`,
        categories: {}
    };

    // 1. Low CTR with High Impressions - Title/Description improvements needed
    suggestions.categories.lowCtrHighImpressions = {
        title: 'Improve Titles & Descriptions',
        description: 'These queries get views but few clicks. Improve meta titles and descriptions.',
        items: queries
            .filter(q => parseFloat(q.ctr) < 3 && q.impressions > 100)
            .slice(0, 20)
            .map(q => ({
                query: q.query,
                impressions: q.impressions,
                clicks: q.clicks,
                ctr: q.ctr,
                suggestion: `Write a more compelling title/description targeting "${q.query}"`
            }))
    };

    // 2. Position 4-20 keywords - Almost on page 1, need content boost
    suggestions.categories.almostPage1 = {
        title: 'Almost Page 1 - Content Boost Needed',
        description: 'Keywords ranking positions 4-20. Small improvements could get page 1.',
        items: queries
            .filter(q => parseFloat(q.position) >= 4 && parseFloat(q.position) <= 20 && q.impressions > 50)
            .slice(0, 20)
            .map(q => ({
                query: q.query,
                position: q.position,
                impressions: q.impressions,
                suggestion: `Create or improve content specifically targeting "${q.query}"`
            }))
    };

    // 3. Top performing pages - Double down on what works
    suggestions.categories.topPerformers = {
        title: 'Top Performing Pages',
        description: 'Your best pages. Consider creating similar content or internal linking.',
        items: pages.slice(0, 10).map(p => ({
            page: p.page,
            clicks: p.clicks,
            impressions: p.impressions,
            suggestion: 'Create related content and link to this page'
        }))
    };

    // 4. Underperforming pages - High impressions, low clicks
    suggestions.categories.underperformingPages = {
        title: 'Underperforming Pages',
        description: 'Pages with visibility but low engagement. Need content or meta improvements.',
        items: pages
            .filter(p => parseFloat(p.ctr) < 2 && p.impressions > 200)
            .slice(0, 15)
            .map(p => ({
                page: p.page,
                impressions: p.impressions,
                ctr: p.ctr,
                suggestion: 'Improve page title, meta description, and content quality'
            }))
    };

    // 5. Content gap opportunities - Queries without dedicated pages
    const pageKeywords = new Set();
    pages.forEach(p => {
        const slug = p.page.toLowerCase();
        slug.split(/[-\/]/).forEach(word => {
            if (word.length > 3) pageKeywords.add(word);
        });
    });

    suggestions.categories.contentGaps = {
        title: 'Content Gap Opportunities',
        description: 'Popular search queries that may need dedicated content.',
        items: queries
            .filter(q => {
                const queryWords = q.query.toLowerCase().split(' ');
                return !queryWords.some(w => pageKeywords.has(w)) && q.impressions > 100;
            })
            .slice(0, 15)
            .map(q => ({
                query: q.query,
                impressions: q.impressions,
                position: q.position,
                suggestion: `Create a dedicated page for "${q.query}"`
            }))
    };

    // 6. Quick wins - High position, just needs small push
    suggestions.categories.quickWins = {
        title: 'Quick Wins',
        description: 'Already ranking well. Small optimizations could boost traffic.',
        items: queries
            .filter(q => parseFloat(q.position) <= 5 && parseFloat(q.ctr) < 10 && q.impressions > 50)
            .slice(0, 15)
            .map(q => ({
                query: q.query,
                position: q.position,
                ctr: q.ctr,
                impressions: q.impressions,
                suggestion: 'Add schema markup, improve meta description, or add FAQ section'
            }))
    };

    // Calculate summary stats
    suggestions.summary = {
        totalQueries: queries.length,
        totalPages: pages.length,
        totalClicks: queries.reduce((sum, q) => sum + q.clicks, 0),
        totalImpressions: queries.reduce((sum, q) => sum + q.impressions, 0),
        avgPosition: (queries.reduce((sum, q) => sum + parseFloat(q.position), 0) / queries.length).toFixed(1),
        avgCtr: ((queries.reduce((sum, q) => sum + parseFloat(q.ctr), 0) / queries.length)).toFixed(2) + '%',
        optimizationCount: Object.values(suggestions.categories).reduce((sum, cat) => sum + cat.items.length, 0)
    };

    return suggestions;
}

async function generateReport(auth, days) {
    console.log('\n📈 Generating comprehensive SEO report...\n');

    const [queries, pages, optimizations] = await Promise.all([
        fetchQueries(auth, days, 200),
        fetchPages(auth, days, 100),
        generateOptimizations(auth, days)
    ]);

    return {
        generated: new Date().toISOString(),
        site: SITE_URL,
        period: {
            days,
            ...getDateRange(days)
        },
        summary: optimizations.summary,
        topQueries: queries.slice(0, 50),
        topPages: pages.slice(0, 30),
        optimizations: optimizations.categories
    };
}

function formatTable(data, columns) {
    if (!data.length) {
        console.log('  No data available');
        return;
    }

    // Calculate column widths
    const widths = {};
    columns.forEach(col => {
        widths[col] = Math.max(
            col.length,
            ...data.map(row => String(row[col] || '').length)
        );
        widths[col] = Math.min(widths[col], 50); // Max width
    });

    // Header
    const header = columns.map(col => col.padEnd(widths[col])).join(' | ');
    const separator = columns.map(col => '-'.repeat(widths[col])).join('-+-');

    console.log('  ' + header);
    console.log('  ' + separator);

    // Rows
    data.forEach(row => {
        const line = columns.map(col => {
            const val = String(row[col] || '');
            return val.length > widths[col]
                ? val.substring(0, widths[col] - 3) + '...'
                : val.padEnd(widths[col]);
        }).join(' | ');
        console.log('  ' + line);
    });
}

function outputResults(data, outputPath) {
    if (outputPath) {
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`\n✅ Results saved to: ${outputPath}`);
    }
    return data;
}

// API Server mode
async function startApiServer(keyFilePath) {
    const express = require('express');
    const app = express();
    const PORT = process.env.SEARCH_CONSOLE_API_PORT || 3001;

    let auth;
    try {
        auth = await getAuthClient(keyFilePath);
    } catch (err) {
        console.error('Failed to initialize Search Console auth:', err.message);
        process.exit(1);
    }

    app.get('/api/search-console/queries', async (req, res) => {
        try {
            const days = parseInt(req.query.days, 10) || 28;
            const limit = parseInt(req.query.limit, 10) || 100;
            const data = await fetchQueries(auth, days, limit);
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.get('/api/search-console/pages', async (req, res) => {
        try {
            const days = parseInt(req.query.days, 10) || 28;
            const limit = parseInt(req.query.limit, 10) || 100;
            const data = await fetchPages(auth, days, limit);
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.get('/api/search-console/optimize', async (req, res) => {
        try {
            const days = parseInt(req.query.days, 10) || 28;
            const data = await generateOptimizations(auth, days);
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.get('/api/search-console/report', async (req, res) => {
        try {
            const days = parseInt(req.query.days, 10) || 28;
            const data = await generateReport(auth, days);
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.listen(PORT, () => {
        console.log(`\n🚀 Search Console API server running on port ${PORT}`);
        console.log(`\nEndpoints:`);
        console.log(`  GET /api/search-console/queries?days=28&limit=100`);
        console.log(`  GET /api/search-console/pages?days=28&limit=100`);
        console.log(`  GET /api/search-console/optimize?days=28`);
        console.log(`  GET /api/search-console/report?days=28`);
    });
}

// Main execution
async function main() {
    if (options.help || !command) {
        showHelp();
        return;
    }

    try {
        const auth = await getAuthClient(options.keyFile);

        switch (command) {
            case 'queries': {
                const data = await fetchQueries(auth, options.days, options.limit);
                console.log(`Top ${data.length} Search Queries:\n`);
                formatTable(data, ['query', 'clicks', 'impressions', 'ctr', 'position']);
                outputResults(data, options.output);
                break;
            }

            case 'pages': {
                const data = await fetchPages(auth, options.days, options.limit);
                console.log(`Top ${data.length} Pages:\n`);
                formatTable(data, ['page', 'clicks', 'impressions', 'ctr', 'position']);
                outputResults(data, options.output);
                break;
            }

            case 'optimize': {
                const data = await generateOptimizations(auth, options.days);

                console.log('═'.repeat(60));
                console.log('📊 SEO OPTIMIZATION SUGGESTIONS');
                console.log('═'.repeat(60));
                console.log(`\nAnalysis Period: ${data.period}`);
                console.log(`Generated: ${data.generated}\n`);

                console.log('📈 SUMMARY');
                console.log('-'.repeat(40));
                console.log(`  Total Queries Analyzed: ${data.summary.totalQueries}`);
                console.log(`  Total Pages Analyzed: ${data.summary.totalPages}`);
                console.log(`  Total Clicks: ${data.summary.totalClicks}`);
                console.log(`  Total Impressions: ${data.summary.totalImpressions}`);
                console.log(`  Average Position: ${data.summary.avgPosition}`);
                console.log(`  Average CTR: ${data.summary.avgCtr}`);
                console.log(`  Optimization Opportunities: ${data.summary.optimizationCount}`);

                for (const [key, category] of Object.entries(data.categories)) {
                    if (category.items.length > 0) {
                        console.log(`\n\n🎯 ${category.title.toUpperCase()}`);
                        console.log('-'.repeat(40));
                        console.log(`  ${category.description}\n`);

                        category.items.slice(0, 10).forEach((item, i) => {
                            console.log(`  ${i + 1}. ${item.query || item.page}`);
                            if (item.position) console.log(`     Position: ${item.position}`);
                            if (item.impressions) console.log(`     Impressions: ${item.impressions}`);
                            if (item.ctr) console.log(`     CTR: ${item.ctr}`);
                            if (item.clicks) console.log(`     Clicks: ${item.clicks}`);
                            console.log(`     💡 ${item.suggestion}`);
                            console.log('');
                        });
                    }
                }

                outputResults(data, options.output);
                break;
            }

            case 'report': {
                const data = await generateReport(auth, options.days);

                console.log('═'.repeat(60));
                console.log('📊 COMPREHENSIVE SEO REPORT');
                console.log('═'.repeat(60));
                console.log(`Site: ${data.site}`);
                console.log(`Period: ${data.period.startDate} to ${data.period.endDate}`);
                console.log(`Generated: ${data.generated}\n`);

                console.log('📈 SUMMARY');
                console.log('-'.repeat(40));
                Object.entries(data.summary).forEach(([key, value]) => {
                    console.log(`  ${key}: ${value}`);
                });

                console.log('\n\n🔍 TOP QUERIES');
                console.log('-'.repeat(40));
                formatTable(data.topQueries.slice(0, 20), ['query', 'clicks', 'impressions', 'ctr', 'position']);

                console.log('\n\n📄 TOP PAGES');
                console.log('-'.repeat(40));
                formatTable(data.topPages.slice(0, 15), ['page', 'clicks', 'impressions', 'ctr', 'position']);

                outputResults(data, options.output);
                break;
            }

            case 'api-server': {
                await startApiServer(options.keyFile);
                break;
            }

            default:
                console.error(`Unknown command: ${command}`);
                showHelp();
                process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.code === 403) {
            console.error('\nPermission denied. Make sure:');
            console.error('1. The service account has been added to Search Console');
            console.error('2. The Search Console API is enabled in Google Cloud Console');
        }
        process.exit(1);
    }
}

main();
