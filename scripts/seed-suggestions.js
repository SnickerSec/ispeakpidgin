#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://jfzgzjgdptowfbtljvyp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const suggestions = [
    { pidgin: 'Buggah', english: 'A person, thing, or guy', example: 'That buggah stay fast!', contributor_name: 'Local Boy', status: 'pending' },
    { pidgin: 'Choke', english: 'A large amount or plenty', example: 'Get choke waves today!', contributor_name: 'Surfer Sam', status: 'pending' },
    { pidgin: 'Grindz', english: 'Delicious food', example: 'We go get some ono grindz.', contributor_name: 'Foodie Phil', status: 'pending' },
    { pidgin: 'Howzit', english: 'How are you? / Hello', example: 'Howzit brah!', contributor_name: 'Island Girl', status: 'pending' },
    { pidgin: 'Shoots', english: 'Okay / Done deal', example: 'Shoots, I see you at 5.', contributor_name: 'Busy Ben', status: 'pending' }
];

async function seed() {
    console.log('🌱 Seeding user suggestions...');
    const { data, error } = await supabase
        .from('user_suggestions')
        .upsert(suggestions, { onConflict: 'pidgin' });

    if (error) {
        console.error('❌ Error seeding suggestions:', error.message);
    } else {
        console.log('✅ Successfully seeded 5 sample suggestions!');
    }
}

seed();
