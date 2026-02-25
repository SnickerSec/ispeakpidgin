#!/usr/bin/env node
/**
 * Setup script for 808 Mode Cringe Generator tables
 * Run with: node tools/data/setup-cringe-tables.js
 *
 * This script creates the tables and inserts all data for the cringe pickup line generator.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in environment');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// DATA DEFINITIONS
// ============================================

const greetings = [
    // For wahine (women)
    { gender: 'wahine', greeting: 'Eh sistah' },
    { gender: 'wahine', greeting: 'Howzit beautiful' },
    { gender: 'wahine', greeting: 'Auwe, look at you' },
    { gender: 'wahine', greeting: 'Ho, excuse me miss' },
    { gender: 'wahine', greeting: 'Rajah dat, sistah' },
    // For kane (men)
    { gender: 'kane', greeting: 'Eh braddah' },
    { gender: 'kane', greeting: 'Howzit handsome' },
    { gender: 'kane', greeting: 'Ho, my brah' },
    { gender: 'kane', greeting: 'Shoots cuz' },
    { gender: 'kane', greeting: 'Rajah dat, kane' }
];

const payoffs = [
    { payoff: 'Like go holo holo wit me?' },
    { payoff: 'You and me, bumbye?' },
    { payoff: 'Shoots, give me your numba?' },
    { payoff: 'Can I take you out or what?' },
    { payoff: 'We go cruise, yeah?' },
    { payoff: 'What you say, one date?' },
    { payoff: "Let's make memories, brah." },
    { payoff: 'You stay single or what?' },
    { payoff: 'My heart stay pounding, no lie.' },
    { payoff: 'I think I stay in love already.' }
];

const activities = [
    { activity_key: 'grindz', activity_name: 'Grindz (Food)', emoji: '🍜' },
    { activity_key: 'beach', activity_name: 'Beach/Ocean', emoji: '🏖️' },
    { activity_key: 'hiking', activity_name: 'Hiking/Nature', emoji: '🥾' }
];

// Locations organized by activity
const locationsByActivity = {
    grindz: [
        { location_key: 'leonards', location_name: "Leonard's Bakery" },
        { location_key: 'rainbow', location_name: 'Rainbow Drive-In' },
        { location_key: 'giovannis', location_name: "Giovanni's Shrimp Truck" },
        { location_key: 'teds', location_name: "Ted's Bakery" },
        { location_key: 'zippys', location_name: "Zippy's" }
    ],
    beach: [
        { location_key: 'sandys', location_name: 'Sandy Beach' },
        { location_key: 'pipeline', location_name: 'Pipeline' },
        { location_key: 'waikiki', location_name: 'Waikiki Beach' },
        { location_key: 'lanikai', location_name: 'Lanikai Beach' },
        { location_key: 'hanauma', location_name: 'Hanauma Bay' }
    ],
    hiking: [
        { location_key: 'diamondhead', location_name: 'Diamond Head' },
        { location_key: 'kokohead', location_name: 'Koko Head Stairs' },
        { location_key: 'manoa', location_name: 'Manoa Falls' },
        { location_key: 'pillbox', location_name: 'Pillbox Hike' },
        { location_key: 'stairway', location_name: 'Stairway to Heaven' }
    ]
};

// Metaphors organized by location_key
const metaphorsByLocation = {
    // GRINDZ
    leonards: [
        "you stay mo' sweet than one fresh malasada",
        "you hot like da malasadas coming out da fryer",
        "I'd wait in dat Leonard's line all day fo' you",
        "you sugar-coated my heart like one haupia malasada"
    ],
    rainbow: [
        "you mo' satisfying than da loco moco plate",
        "my heart stay mixed plate—all ova da place fo' you",
        "you da gravy to my rice, no can separate",
        "I'd share my last scoop rice wit you"
    ],
    giovannis: [
        "you got me hooked like Giovanni's garlic shrimp",
        "you stay making my heart sizzle like dat butter",
        "I no care if my breath smell garlic fo' you",
        "you worth da North Shore drive and da long line"
    ],
    teds: [
        "you mo' smooth than Ted's haupia pie",
        "you da chocolate haupia to my life",
        "meeting you was sweeter than Ted's coconut cream"
    ],
    zippys: [
        "you my comfort food, like Zippy's at 2am",
        "I'd take you to Zippy's anytime—you worth da chili and zip pac",
        "you got me feeling all warm inside like da saimin"
    ],
    // BEACH
    sandys: [
        "you hit me harder than da shorebreak at Sandys",
        "my heart stay getting pounded like I'm at Sandys",
        "you dangerous and beautiful, just like Sandys",
        "I'd risk da neck fo' you, Sandys style"
    ],
    pipeline: [
        "you got me barreled like Pipeline in winter",
        "loving you stay like dropping in at Pipe—scary but worth it",
        "you tube me up and spit me out every time"
    ],
    waikiki: [
        "you mo' stunning than da Waikiki sunset",
        "I'd paddle one canoe fo' you past da reef",
        "you light up my life like da hotels at night",
        "meeting you bettah than surfing Canoes on one good day"
    ],
    lanikai: [
        "you pristine like Lanikai in da morning",
        "I'd kayak to da Mokes fo' you any day",
        "you da hidden paradise, just like Lanikai"
    ],
    hanauma: [
        "I'd watch da reef video ten times fo' you",
        "you colorful like da fish at Hanauma",
        "I'd pay da entrance fee every day just fo' see you"
    ],
    // HIKING
    diamondhead: [
        "my heart stay racing fo' you like climbing Diamond Head",
        "da view of you bettah than da top of Diamond Head",
        "I'd hike in da hot sun fo' you any day",
        "you da reward at da end of da trail"
    ],
    kokohead: [
        "I'd climb all 1,048 stairs fo' one date wit you",
        "my legs stay shaking fo' you like afta Koko Head",
        "you worth da burn, just like Koko Head",
        "loving you stay like Koko Head—hard but so worth it"
    ],
    manoa: [
        "you refreshing like Manoa Falls on one hot day",
        "my love fo' you stay flowing like da waterfall",
        "I'd walk through all da mud fo' you"
    ],
    pillbox: [
        "da sunrise wit you bettah than Pillbox views",
        "I'd wake up 4am fo' hike wit you",
        "you got me feeling on top of da world"
    ],
    stairway: [
        "I'd risk da ticket fo' one hike wit you",
        "you illegal levels of beautiful, like Haiku Stairs",
        "being wit you stay like heaven, no need da stairs",
        "you da only stairway to heaven I need"
    ]
};

// ============================================
// SETUP FUNCTIONS
// ============================================

async function clearExistingData() {
    console.log('🧹 Clearing existing data...');

    // Delete in reverse order of dependencies
    await supabase.from('cringe_metaphors').delete().neq('id', 0);
    await supabase.from('cringe_locations').delete().neq('id', 0);
    await supabase.from('cringe_activities').delete().neq('id', 0);
    await supabase.from('cringe_payoffs').delete().neq('id', 0);
    await supabase.from('cringe_greetings').delete().neq('id', 0);

    console.log('✅ Existing data cleared');
}

async function insertGreetings() {
    console.log('📝 Inserting greetings...');
    const { data, error } = await supabase
        .from('cringe_greetings')
        .insert(greetings)
        .select();

    if (error) {
        console.error('❌ Error inserting greetings:', error.message);
        return false;
    }
    console.log(`✅ Inserted ${data.length} greetings`);
    return true;
}

async function insertPayoffs() {
    console.log('📝 Inserting payoffs...');
    const { data, error } = await supabase
        .from('cringe_payoffs')
        .insert(payoffs)
        .select();

    if (error) {
        console.error('❌ Error inserting payoffs:', error.message);
        return false;
    }
    console.log(`✅ Inserted ${data.length} payoffs`);
    return true;
}

async function insertActivities() {
    console.log('📝 Inserting activities...');
    const { data, error } = await supabase
        .from('cringe_activities')
        .insert(activities)
        .select();

    if (error) {
        console.error('❌ Error inserting activities:', error.message);
        return false;
    }
    console.log(`✅ Inserted ${data.length} activities`);
    return data;
}

async function insertLocationsAndMetaphors(activitiesData) {
    console.log('📝 Inserting locations and metaphors...');

    let totalLocations = 0;
    let totalMetaphors = 0;

    for (const activity of activitiesData) {
        const locations = locationsByActivity[activity.activity_key];
        if (!locations) continue;

        for (const loc of locations) {
            // Insert location
            const { data: locationData, error: locError } = await supabase
                .from('cringe_locations')
                .insert({
                    activity_id: activity.id,
                    location_key: loc.location_key,
                    location_name: loc.location_name
                })
                .select()
                .single();

            if (locError) {
                console.error(`❌ Error inserting location ${loc.location_name}:`, locError.message);
                continue;
            }
            totalLocations++;

            // Insert metaphors for this location
            const metaphors = metaphorsByLocation[loc.location_key];
            if (metaphors) {
                const metaphorRecords = metaphors.map(m => ({
                    location_id: locationData.id,
                    metaphor: m
                }));

                const { data: metaphorData, error: metError } = await supabase
                    .from('cringe_metaphors')
                    .insert(metaphorRecords)
                    .select();

                if (metError) {
                    console.error(`❌ Error inserting metaphors for ${loc.location_name}:`, metError.message);
                } else {
                    totalMetaphors += metaphorData.length;
                }
            }
        }
    }

    console.log(`✅ Inserted ${totalLocations} locations`);
    console.log(`✅ Inserted ${totalMetaphors} metaphors`);
    return true;
}

async function verifyData() {
    console.log('\n📊 Verifying data...');

    const { count: greetingsCount } = await supabase.from('cringe_greetings').select('*', { count: 'exact', head: true });
    const { count: payoffsCount } = await supabase.from('cringe_payoffs').select('*', { count: 'exact', head: true });
    const { count: activitiesCount } = await supabase.from('cringe_activities').select('*', { count: 'exact', head: true });
    const { count: locationsCount } = await supabase.from('cringe_locations').select('*', { count: 'exact', head: true });
    const { count: metaphorsCount } = await supabase.from('cringe_metaphors').select('*', { count: 'exact', head: true });

    console.log(`   Greetings: ${greetingsCount}`);
    console.log(`   Payoffs: ${payoffsCount}`);
    console.log(`   Activities: ${activitiesCount}`);
    console.log(`   Locations: ${locationsCount}`);
    console.log(`   Metaphors: ${metaphorsCount}`);
}

// ============================================
// MAIN
// ============================================

async function main() {
    console.log('🌺 808 Mode Cringe Generator Setup\n');

    try {
        // Check if tables exist by trying to query them
        const { error: testError } = await supabase.from('cringe_greetings').select('id').limit(1);

        if (testError && testError.code === '42P01') {
            console.error('❌ Tables do not exist! Please run the SQL schema first in Supabase SQL Editor.');
            console.log('\nRequired tables:');
            console.log('  - cringe_greetings');
            console.log('  - cringe_payoffs');
            console.log('  - cringe_activities');
            console.log('  - cringe_locations');
            console.log('  - cringe_metaphors');
            process.exit(1);
        }

        await clearExistingData();
        await insertGreetings();
        await insertPayoffs();
        const activitiesData = await insertActivities();

        if (activitiesData) {
            await insertLocationsAndMetaphors(activitiesData);
        }

        await verifyData();

        console.log('\n✅ Setup complete!');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

main();
