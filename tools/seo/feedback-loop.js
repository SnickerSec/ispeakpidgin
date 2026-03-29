#!/usr/bin/env node
/**
 * SEO Feedback Loop - Close the Loop Tool
 *
 * This script identifies high-visibility search queries from Google Search Console
 * that are NOT currently in our dictionary. It helps automate the process of
 * discovering what users are searching for and adding it to the codebase.
 *
 * Workflow:
 * 1. Fetch search queries with > 50 impressions (last 28 days)
 * 2. Fetch all current dictionary terms from Supabase
 * 3. Filter queries that aren't in the dictionary
 * 4. Categorize and suggest additions
 * 5. Output to /tmp/missing-terms.json for use with npm run data:add-missing
 */

const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { supabase } = require('../../config/supabase');

// Configuration
const SITE_URL = process.env.SITE_URL || 'sc-domain:chokepidgin.com';
const KEY_PATH = process.env.GOOGLE_SEARCH_CONSOLE_KEY_PATH || './google-search-console-key.json';
const SEARCH_CONSOLE_API = 'https://searchconsole.googleapis.com/webmasters/v3';
const OUTPUT_PATH = '/tmp/missing-terms.json';

async function getAuthClient() {
    if (!fs.existsSync(KEY_PATH)) {
        throw new Error(`Google Search Console key file not found at ${KEY_PATH}`);
    }
    return new GoogleAuth({
        keyFile: KEY_PATH,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
    });
}

async function fetchSearchQueries(auth, days = 28) {
    const client = await auth.getClient();
    const encodedSiteUrl = encodeURIComponent(SITE_URL);
    const url = `${SEARCH_CONSOLE_API}/sites/${encodedSiteUrl}/searchAnalytics/query`;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 3); // 3-day delay
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const requestBody = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['query'],
        rowLimit: 5000,
        orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }]
    };

    const res = await client.request({ url, method: 'POST', data: requestBody });
    return res.data.rows || [];
}

async function getExistingDictionary() {
    const { data, error } = await supabase
        .from('dictionary_entries')
        .select('pidgin');
    
    if (error) throw error;
    return new Set(data.map(item => item.pidgin.toLowerCase()));
}

function categorizeQuery(query) {
    const q = query.toLowerCase();
    if (q.includes('food') || q.includes('eat') || q.includes('grind') || q.includes('ono')) return 'food';
    if (q.includes('hello') || q.includes('greet') || q.includes('howzit')) return 'greetings';
    if (q.includes('bad') || q.includes('insult') || q.includes('mean')) return 'slang';
    if (q.includes('love') || q.includes('girl') || q.includes('boy')) return 'romance';
    if (q.includes('where') || q.includes('place') || q.includes('direction')) return 'locations';
    return 'general';
}

async function main() {
    console.log('🔄 Starting SEO Feedback Loop...');
    console.log('=============================\n');

    try {
        const auth = await getAuthClient();
        
        console.log('📡 Fetching Search Console data...');
        const scQueries = await fetchSearchQueries(auth);
        console.log(`✅ Found ${scQueries.length} unique search queries`);

        console.log('🔍 Fetching current dictionary from Supabase...');
        const existingTerms = await getExistingDictionary();
        console.log(`✅ Found ${existingTerms.size} existing dictionary terms`);

        console.log('\n🧠 Identifying missing terms and content gaps...');
        
        const missing = [];
        const seenQueries = new Set();

        for (const row of scQueries) {
            const query = row.keys[0].toLowerCase();
            
            // Filter criteria:
            // 1. Not in dictionary
            // 2. Has at least 20 impressions (adjust as needed)
            // 3. Not a "what does X mean" or "how to say X" query (extract X)
            
            let term = query;
            const meanRegex = /what does (.*) mean/i;
            const sayRegex = /how to say (.*) in/i;
            const meaningRegex = /(.*) meaning/i;

            if (meanRegex.test(query)) term = query.match(meanRegex)[1];
            else if (sayRegex.test(query)) term = query.match(sayRegex)[1];
            else if (meaningRegex.test(query)) term = query.match(meaningRegex)[1];

            term = term.trim().replace(/[?!]/g, '');

            if (term.length > 2 && !existingTerms.has(term) && !seenQueries.has(term) && row.impressions > 20) {
                missing.push({
                    pidgin: term,
                    english: ["TBD (Add English translation)"],
                    category: categorizeQuery(term),
                    impressions: row.impressions,
                    clicks: row.clicks,
                    ctr: (row.ctr * 100).toFixed(2) + '%',
                    position: row.position.toFixed(1)
                });
                seenQueries.add(term);
            }
        }

        // Sort by impressions
        missing.sort((a, b) => b.impressions - a.impressions);

        console.log(`✨ Found ${missing.length} potential new terms!`);

        if (missing.length > 0) {
            console.log('\n📊 Top 10 Missing Opportunities:');
            missing.slice(0, 10).forEach((m, i) => {
                console.log(`   ${i+1}. "${m.pidgin}" (${m.impressions} impressions, ${m.clicks} clicks) - Cat: ${m.category}`);
            });

            const outputData = {
                generated: new Date().toISOString(),
                count: missing.length,
                missing: missing
            };

            fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputData, null, 2));
            console.log(`\n✅ Missing terms list saved to: ${OUTPUT_PATH}`);
            console.log('\n💡 Next steps:');
            console.log('   1. Open /tmp/missing-terms.json and fill in the "english" translations');
            console.log('   2. Run: npm run data:add-missing');
        } else {
            console.log('\n🎉 No significant content gaps found! You are covering what users are searching for.');
        }

    } catch (err) {
        console.error('\n❌ Feedback loop failed:', err.message);
        process.exit(1);
    }
}

main();
