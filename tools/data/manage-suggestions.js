#!/usr/bin/env node

/**
 * Manage User Suggestions CLI
 * 
 * Inspect, approve, or reject community word/phrase suggestions in Supabase.
 * 
 * Usage:
 *   node tools/data/manage-suggestions.js list [--all]
 *   node tools/data/manage-suggestions.js approve <id> [--term <pidgin>] [--meaning <english>] [--category <cat>]
 *   node tools/data/manage-suggestions.js reject <id>
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase service credentials missing (SUPABASE_URL, SUPABASE_SERVICE_KEY / SUPABASE_SERVICE_ROLE_KEY).');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function printHelp() {
    console.log(`
🌺 ChokePidgin Suggestion Moderation Tool

Commands:
  list [--all]                           List pending suggestions (or all if --all specified)
  approve <id> [options]                 Approve suggestion and optionally add to dictionary
  reject <id>                            Reject suggestion

Approve Options:
  --term <term>                          Override the Pidgin term
  --meaning <meaning>                    Override the English meaning
  --category <category>                  Dictionary category (default: 'community')
  --no-dict                              Do not insert into dictionary_entries (only mark approved)
`);
}

async function listSuggestions(showAll = false) {
    let query = supabase.from('user_suggestions').select('*').order('created_at', { ascending: false });
    if (!showAll) {
        query = query.eq('status', 'pending');
    }

    const { data, error } = await query;
    if (error) {
        console.error('❌ Failed to fetch suggestions:', error.message);
        process.exit(1);
    }

    if (!data || data.length === 0) {
        console.log(`✨ No ${showAll ? '' : 'pending '}suggestions found.`);
        return;
    }

    console.log(`\n📋 Found ${data.length} suggestion(s):\n`);
    for (const item of data) {
        const statusBadge = item.status === 'pending' ? '⏳ PENDING' : (item.status === 'approved' ? '✅ APPROVED' : '❌ REJECTED');
        console.log(`[#${item.id}] ${statusBadge}`);
        console.log(`   Pidgin:       ${item.pidgin}`);
        console.log(`   English:      ${item.english}`);
        if (item.example) console.log(`   Example:      "${item.example}"`);
        console.log(`   Contributor:  ${item.contributor_name || 'Anonymous'}`);
        console.log(`   Submitted:    ${new Date(item.created_at).toLocaleString()}`);
        console.log('-'.repeat(50));
    }
}

async function approveSuggestion(id, options = {}) {
    const { data: suggestion, error: fetchErr } = await supabase
        .from('user_suggestions')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchErr || !suggestion) {
        console.error(`❌ Suggestion #${id} not found:`, fetchErr?.message);
        process.exit(1);
    }

    const pidginTerm = (options.term || suggestion.pidgin).trim();
    const englishMeaning = (options.meaning || suggestion.english).trim();
    const category = options.category || 'community';
    const addToDict = !options.noDict;

    if (addToDict) {
        console.log(`📖 Adding "${pidginTerm}" to dictionary_entries...`);
        const { error: dictErr } = await supabase
            .from('dictionary_entries')
            .insert([{
                pidgin: pidginTerm,
                english: [englishMeaning],
                examples: suggestion.example ? [suggestion.example] : [],
                category,
                difficulty: 'beginner',
                frequency: 'medium'
            }]);

        if (dictErr) {
            console.warn('⚠️ Warning: Failed to insert into dictionary_entries:', dictErr.message);
        } else {
            console.log(`✅ Added to dictionary_entries under category "${category}"`);
        }
    }

    const { error: updateErr } = await supabase
        .from('user_suggestions')
        .update({ status: 'approved' })
        .eq('id', id);

    if (updateErr) {
        console.error(`❌ Failed to update status for #${id}:`, updateErr.message);
        process.exit(1);
    }

    console.log(`🎉 Suggestion #${id} approved!`);
}

async function rejectSuggestion(id) {
    const { data: suggestion, error: fetchErr } = await supabase
        .from('user_suggestions')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchErr || !suggestion) {
        console.error(`❌ Suggestion #${id} not found:`, fetchErr?.message);
        process.exit(1);
    }

    const { error: updateErr } = await supabase
        .from('user_suggestions')
        .update({ status: 'rejected' })
        .eq('id', id);

    if (updateErr) {
        console.error(`❌ Failed to reject #${id}:`, updateErr.message);
        process.exit(1);
    }

    console.log(`🚫 Suggestion #${id} ("${suggestion.pidgin}") marked as rejected.`);
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === '--help' || command === '-h') {
        printHelp();
        return;
    }

    if (command === 'list') {
        const showAll = args.includes('--all');
        await listSuggestions(showAll);
        return;
    }

    if (command === 'approve') {
        const id = args[1];
        if (!id) {
            console.error('❌ Missing suggestion ID. Usage: approve <id>');
            process.exit(1);
        }

        const options = {
            noDict: args.includes('--no-dict')
        };

        const termIdx = args.indexOf('--term');
        if (termIdx !== -1 && args[termIdx + 1]) options.term = args[termIdx + 1];

        const meaningIdx = args.indexOf('--meaning');
        if (meaningIdx !== -1 && args[meaningIdx + 1]) options.meaning = args[meaningIdx + 1];

        const catIdx = args.indexOf('--category');
        if (catIdx !== -1 && args[catIdx + 1]) options.category = args[catIdx + 1];

        await approveSuggestion(id, options);
        return;
    }

    if (command === 'reject') {
        const id = args[1];
        if (!id) {
            console.error('❌ Missing suggestion ID. Usage: reject <id>');
            process.exit(1);
        }

        await rejectSuggestion(id);
        return;
    }

    console.error(`❌ Unknown command: "${command}"`);
    printHelp();
    process.exit(1);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
