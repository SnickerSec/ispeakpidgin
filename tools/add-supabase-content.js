#!/usr/bin/env node

/**
 * Add new content to Supabase
 * Adds stories and pickup lines
 */

const SUPABASE_URL = 'https://jfzgzjgdptowfbtljvyp.supabase.co';
// Use service role key to bypass RLS (set via environment variable)
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_KEY) {
    console.error('❌ Error: SUPABASE_SERVICE_KEY environment variable not set');
    console.log('Usage: SUPABASE_SERVICE_KEY=your_key node add-supabase-content.js');
    process.exit(1);
}

// New stories to add
const newStories = [
    {
        id: "first_day_work",
        title: "First Day on the Job",
        pidgin_text: "Ho brah, my first day work was one trip! Da boss tell me, 'Eh, you da new guy yeah? No worry, we going show you how we do.' I was so nervous, hands stay shaking. But den dis one aunty from accounting come ovah, 'Eh, relax. We all ohana hea. You like some coffee?' She wen bring me one fresh malasada too. By pau hana time, I felt like I been working dea my whole life. Dat's da aloha spirit, brah.",
        english_translation: "Wow man, my first day of work was quite an experience! The boss tells me, 'Hey, you're the new guy right? Don't worry, we're going to show you how we do things.' I was so nervous, my hands were shaking. But then this one lady from accounting came over, 'Hey, relax. We're all family here. Would you like some coffee?' She brought me a fresh malasada too. By the end of work, I felt like I had been working there my whole life. That's the aloha spirit, man.",
        cultural_notes: "Hawaiian workplaces often have a strong sense of 'ohana' (family). Malasadas are Portuguese donuts that are extremely popular in Hawaii. 'Pau hana' refers to the time after work is finished.",
        vocabulary: [
            { pidgin: "ho brah", english: "wow man", pronunciation: "ho brah" },
            { pidgin: "one trip", english: "quite an experience", pronunciation: "one trip" },
            { pidgin: "no worry", english: "don't worry", pronunciation: "no worry" },
            { pidgin: "stay shaking", english: "were shaking", pronunciation: "stay shaking" },
            { pidgin: "wen bring", english: "brought", pronunciation: "wen bring" },
            { pidgin: "pau hana", english: "after work", pronunciation: "pow HAH-nah" }
        ],
        tags: ["work", "ohana", "aloha", "malasada", "beginner"],
        difficulty: "beginner"
    },
    {
        id: "fishing_with_grandpa",
        title: "Fishing with Grandpa",
        pidgin_text: "Every Saturday, me and my tutu kane go down da pier fo' fish. He get his special spot, been going dea since small kid time. 'Eh, you gotta be patient,' he always tell me. 'Da fish going come when dey ready.' We sit dea, talk story about da old days. He tell me about when Haleiwa was all pineapple fields. No cars, no tourists, just da locals. 'Ho, was different time,' he say, looking at da ocean. I love dose days with tutu. Dat's how we pass down da culture, one fishing trip at a time.",
        english_translation: "Every Saturday, my grandfather and I go down to the pier to fish. He has his special spot, been going there since he was a child. 'Hey, you've got to be patient,' he always tells me. 'The fish will come when they're ready.' We sit there, chatting about the old days. He tells me about when Haleiwa was all pineapple fields. No cars, no tourists, just the locals. 'Wow, it was a different time,' he says, looking at the ocean. I love those days with grandpa. That's how we pass down the culture, one fishing trip at a time.",
        cultural_notes: "Fishing is an important cultural activity in Hawaii, passed down through generations. 'Tutu kane' is the Hawaiian term for grandfather. Haleiwa on the North Shore was once a small plantation town before becoming a popular tourist destination.",
        vocabulary: [
            { pidgin: "tutu kane", english: "grandfather", pronunciation: "too-too KAH-neh" },
            { pidgin: "fo' fish", english: "to fish", pronunciation: "fo fish" },
            { pidgin: "small kid time", english: "childhood", pronunciation: "small kid time" },
            { pidgin: "talk story", english: "chat/converse", pronunciation: "talk story" },
            { pidgin: "ho", english: "wow", pronunciation: "ho" },
            { pidgin: "dose", english: "those", pronunciation: "dose" }
        ],
        tags: ["family", "fishing", "tradition", "culture", "grandparents"],
        difficulty: "intermediate"
    },
    {
        id: "beach_day_waikiki",
        title: "Beach Day in Waikiki",
        pidgin_text: "Chee, Waikiki stay so packed today! Tourists everywhere, but we know da secret spots. My cuz tell me, 'Eh, let's go Queens. Mo' bettah ovah dea.' We grab our cooler - got spam musubi, some chips, and plenty drinks. Set up our tent, and now we stay living da life. Some haole guy ask me, 'Is this beach always this beautiful?' I tell him, 'Brah, dis is Hawaii. Every day stay beautiful.' He smile big. Even da tourists can feel da aloha wen dey hea.",
        english_translation: "Wow, Waikiki is so packed today! Tourists everywhere, but we know the secret spots. My cousin tells me, 'Hey, let's go to Queens. It's better over there.' We grab our cooler - we've got spam musubi, some chips, and plenty of drinks. We set up our tent, and now we're living the life. Some white guy asks me, 'Is this beach always this beautiful?' I tell him, 'Man, this is Hawaii. Every day is beautiful.' He smiles big. Even the tourists can feel the aloha when they're here.",
        cultural_notes: "Queens Beach is a local favorite spot in Waikiki. Spam musubi (spam on rice wrapped in seaweed) is a beloved local snack. 'Haole' traditionally refers to foreigners, especially white people, and isn't necessarily negative.",
        vocabulary: [
            { pidgin: "chee", english: "wow/expression", pronunciation: "chee" },
            { pidgin: "stay packed", english: "is crowded", pronunciation: "stay packed" },
            { pidgin: "cuz", english: "cousin/friend", pronunciation: "cuz" },
            { pidgin: "mo' bettah", english: "better", pronunciation: "mo bettah" },
            { pidgin: "haole", english: "white person/foreigner", pronunciation: "HOW-lee" },
            { pidgin: "wen dey hea", english: "when they're here", pronunciation: "wen dey hea" }
        ],
        tags: ["beach", "waikiki", "tourists", "local", "food"],
        difficulty: "intermediate"
    },
    {
        id: "shave_ice_debate",
        title: "The Great Shave Ice Debate",
        pidgin_text: "Every time get hot, same argument start up. My sista say Matsumoto's da best. My braddah say no ways, gotta go Waiola. Me? I stay neutral, I just like shave ice period. 'You guys crazy,' I tell dem. 'All shave ice stay good!' But dey no listen. Dey start arguing about da ice texture, da syrup quality, whether get azuki bean or ice cream on da bottom. By da time dey pau arguing, we all melting in da sun. 'Shoots, let's just go da closest one,' I finally say. Dat's how we end up at Uncle's store down da road. And you know what? Was ono!",
        english_translation: "Every time it gets hot, the same argument starts up. My sister says Matsumoto's is the best. My brother says no way, you've got to go to Waiola. Me? I stay neutral, I just like shave ice period. 'You guys are crazy,' I tell them. 'All shave ice is good!' But they don't listen. They start arguing about the ice texture, the syrup quality, whether to get azuki bean or ice cream on the bottom. By the time they're done arguing, we're all melting in the sun. 'Alright, let's just go to the closest one,' I finally say. That's how we end up at Uncle's store down the road. And you know what? It was delicious!",
        cultural_notes: "Shave ice (not 'shaved' ice) is a beloved Hawaiian treat. Matsumoto's in Haleiwa and Waiola in Honolulu are two famous shops. Traditional toppings include azuki beans (sweet red beans), mochi, and ice cream at the bottom.",
        vocabulary: [
            { pidgin: "sista", english: "sister", pronunciation: "sista" },
            { pidgin: "braddah", english: "brother", pronunciation: "BRAH-dah" },
            { pidgin: "no ways", english: "no way", pronunciation: "no ways" },
            { pidgin: "stay good", english: "is good", pronunciation: "stay good" },
            { pidgin: "pau", english: "finished", pronunciation: "pow" },
            { pidgin: "shoots", english: "alright/okay", pronunciation: "shoots" },
            { pidgin: "ono", english: "delicious", pronunciation: "OH-no" }
        ],
        tags: ["food", "shave ice", "family", "debate", "summer"],
        difficulty: "intermediate"
    },
    {
        id: "traffic_h1",
        title: "Stuck in H-1 Traffic",
        pidgin_text: "Auwe! H-1 stay jam up again. Same ting every day, brah. I stay in my car for one hour already, barely moved. Da radio guy say get one accident near da merge. Course get accident - everybody trying fo' cut in last minute! My phone ring - it's my madda. 'Eh, wea you stay? Dinna getting cold!' I tell her, 'Ma, I stuck on H-1. Going be late.' She sigh. 'Dat freeway... should have left earlier.' She right, but I not going admit dat. When I finally get home, she wen save me one plate. Dats one good madda right dea.",
        english_translation: "Oh no! H-1 is jammed up again. Same thing every day, man. I've been in my car for an hour already, barely moved. The radio guy says there's an accident near the merge. Of course there's an accident - everybody's trying to cut in at the last minute! My phone rings - it's my mom. 'Hey, where are you? Dinner's getting cold!' I tell her, 'Mom, I'm stuck on H-1. I'm going to be late.' She sighs. 'That freeway... you should have left earlier.' She's right, but I'm not going to admit that. When I finally get home, she saved me a plate. That's a good mom right there.",
        cultural_notes: "H-1 is Oahu's main freeway and is notorious for heavy traffic, especially during rush hour. The merge near the airport is particularly congested. Despite the frustration, family dinners remain important in Hawaiian culture.",
        vocabulary: [
            { pidgin: "auwe", english: "oh no/alas", pronunciation: "ow-WEH" },
            { pidgin: "stay jam up", english: "is congested", pronunciation: "stay jam up" },
            { pidgin: "fo' cut in", english: "to cut in", pronunciation: "fo cut in" },
            { pidgin: "madda", english: "mother", pronunciation: "MAH-dah" },
            { pidgin: "wea you stay", english: "where are you", pronunciation: "wea you stay" },
            { pidgin: "wen save", english: "saved", pronunciation: "wen save" }
        ],
        tags: ["traffic", "H-1", "family", "everyday life", "frustration"],
        difficulty: "intermediate"
    },
    {
        id: "learning_ukulele",
        title: "Learning Ukulele from Uncle",
        pidgin_text: "My uncle, he one mean ukulele playa. Been playing since befo' I was born. One day I ask him, 'Uncle, teach me fo' play?' He look at me long time, den smile. 'Okay, but you gotta practice every day. No can be lazy.' He wen give me his old ukulele - da koa wood one, beautiful yeah? First day, my fingers stay hurting so much. 'Dat's normal,' Uncle say. 'Keep going.' Three months latah, I can play 'Somewhere Over da Rainbow.' Uncle heard me, his eyes get all watery. 'Shoots, you getting good,' he say. Dat was da best compliment ever.",
        english_translation: "My uncle, he's an amazing ukulele player. He's been playing since before I was born. One day I ask him, 'Uncle, will you teach me to play?' He looks at me for a long time, then smiles. 'Okay, but you have to practice every day. You can't be lazy.' He gave me his old ukulele - the koa wood one, beautiful right? First day, my fingers were hurting so much. 'That's normal,' Uncle says. 'Keep going.' Three months later, I can play 'Somewhere Over the Rainbow.' Uncle heard me, his eyes get all watery. 'Wow, you're getting good,' he says. That was the best compliment ever.",
        cultural_notes: "The ukulele is central to Hawaiian music culture. Koa wood ukuleles are prized for their beautiful sound and appearance. 'Somewhere Over the Rainbow' by Israel Kamakawiwo'ole is one of Hawaii's most beloved songs.",
        vocabulary: [
            { pidgin: "mean", english: "excellent/skilled", pronunciation: "mean" },
            { pidgin: "befo'", english: "before", pronunciation: "beh-FOH" },
            { pidgin: "fo' play", english: "to play", pronunciation: "fo play" },
            { pidgin: "no can", english: "cannot", pronunciation: "no can" },
            { pidgin: "wen give", english: "gave", pronunciation: "wen give" },
            { pidgin: "latah", english: "later", pronunciation: "LAH-tah" }
        ],
        tags: ["music", "ukulele", "family", "learning", "culture"],
        difficulty: "intermediate"
    },
    {
        id: "garage_sale_find",
        title: "Garage Sale Treasure",
        pidgin_text: "Brah, you not going believe what I wen find at one garage sale in Kailua! Dis old Filipino aunty stay selling all kine stuffs. I see dis surfboard in da back - old school single fin, little bit beat up but still good. I ask her, 'Aunty, how much fo' da board?' She look at me, den at da board. 'Dat ting? Was my husband's. He ma-ke die dead ten years ago. You like 'em? Twenty dollas.' I give her fitty instead. 'Keep da change, Aunty. Dis board going get one good home.' She smile so big. Sometimes da best tings in life come from garage sales.",
        english_translation: "Man, you're not going to believe what I found at a garage sale in Kailua! This old Filipino aunty is selling all kinds of stuff. I see this surfboard in the back - old school single fin, a little beat up but still good. I ask her, 'Aunty, how much for the board?' She looks at me, then at the board. 'That thing? It was my husband's. He passed away ten years ago. Do you want it? Twenty dollars.' I give her fifty instead. 'Keep the change, Aunty. This board is going to get a good home.' She smiled so big. Sometimes the best things in life come from garage sales.",
        cultural_notes: "Garage sales are popular weekend activities in Hawaii, often called 'yard sales' or 'estate sales.' Kailua on the windward side of Oahu is known for its beautiful beaches and local community feel. Vintage surfboards are prized collectibles.",
        vocabulary: [
            { pidgin: "wen find", english: "found", pronunciation: "wen find" },
            { pidgin: "all kine", english: "all kinds of", pronunciation: "all kine" },
            { pidgin: "old school", english: "vintage/classic", pronunciation: "old school" },
            { pidgin: "ma-ke die dead", english: "passed away/died", pronunciation: "MAH-keh die dead" },
            { pidgin: "fitty", english: "fifty", pronunciation: "FIT-tee" },
            { pidgin: "'em", english: "it/them", pronunciation: "em" }
        ],
        tags: ["shopping", "surfing", "community", "treasure", "kindness"],
        difficulty: "advanced"
    },
    {
        id: "midnight_spam_run",
        title: "Midnight Spam Run",
        pidgin_text: "Two in da morning, my stomach stay growling. I check da fridge - nothing. I tell my roommate, 'Eh, we go 7-Eleven.' He look at me like I stay pupule. 'Fo' what?' 'Spam musubi, brah. I need um.' So we drive to da closest 7-Eleven, still wearing our slippahs and shorts. Da aunty at da counter, she no even blink. 'Two musubi?' she ask. She know us already. We sit outside, eating our musubi undah da stars. My roommate say, 'Dis is da life, yeah?' I just nod. Sometimes da simplest tings stay da best.",
        english_translation: "Two in the morning, my stomach is growling. I check the fridge - nothing. I tell my roommate, 'Hey, let's go to 7-Eleven.' He looks at me like I'm crazy. 'For what?' 'Spam musubi, man. I need it.' So we drive to the closest 7-Eleven, still wearing our slippers and shorts. The lady at the counter, she doesn't even blink. 'Two musubi?' she asks. She knows us already. We sit outside, eating our musubi under the stars. My roommate says, 'This is the life, right?' I just nod. Sometimes the simplest things are the best.",
        cultural_notes: "7-Eleven is extremely popular in Hawaii and known for its spam musubi. Many locals make late-night runs for this beloved snack. 'Slippahs' (flip-flops) are standard footwear in Hawaii, worn almost everywhere.",
        vocabulary: [
            { pidgin: "stay growling", english: "is growling", pronunciation: "stay growling" },
            { pidgin: "pupule", english: "crazy", pronunciation: "poo-POO-leh" },
            { pidgin: "fo' what", english: "for what/why", pronunciation: "fo what" },
            { pidgin: "slippahs", english: "flip-flops/slippers", pronunciation: "SLIP-pahs" },
            { pidgin: "undah", english: "under", pronunciation: "UN-dah" },
            { pidgin: "da life", english: "the good life", pronunciation: "da life" }
        ],
        tags: ["food", "night", "friends", "spam musubi", "simple life"],
        difficulty: "beginner"
    }
];

// New pickup lines to add
const newPickupLines = [
    {
        pidgin: "If you was one wave, I would ride you all day long.",
        english: "If you were a wave, I'd ride you all day long.",
        category: "beach",
        spiciness: 3,
        tags: ["surfing", "beach", "flirty"]
    },
    {
        pidgin: "You stay so hot, you making da trade winds jealous.",
        english: "You're so hot, you're making the trade winds jealous.",
        category: "romantic",
        spiciness: 2,
        tags: ["weather", "compliment"]
    },
    {
        pidgin: "I not one lifeguard, but I save you one spot in my heart.",
        english: "I'm not a lifeguard, but I saved you a spot in my heart.",
        category: "beach",
        spiciness: 1,
        tags: ["beach", "sweet", "cute"]
    },
    {
        pidgin: "Brah, you must be da sunset cuz you stay taking my breath away.",
        english: "Man, you must be the sunset because you're taking my breath away.",
        category: "romantic",
        spiciness: 1,
        tags: ["sunset", "romantic", "classic"]
    },
    {
        pidgin: "Is your name Aloha? Cuz you stay greeting me with love.",
        english: "Is your name Aloha? Because you're greeting me with love.",
        category: "romantic",
        spiciness: 1,
        tags: ["aloha", "sweet", "clever"]
    },
    {
        pidgin: "You like grab some shave ice? Cuz you stay making me melt.",
        english: "Want to get some shave ice? Because you're making me melt.",
        category: "food",
        spiciness: 1,
        tags: ["shave ice", "food", "date"]
    },
    {
        pidgin: "My heart stay pounding harder than da waves at Pipeline.",
        english: "My heart is pounding harder than the waves at Pipeline.",
        category: "beach",
        spiciness: 2,
        tags: ["surfing", "pipeline", "intense"]
    },
    {
        pidgin: "You must be da North Shore cuz you stay looking dangerous and beautiful.",
        english: "You must be the North Shore because you look dangerous and beautiful.",
        category: "beach",
        spiciness: 2,
        tags: ["north shore", "compliment", "clever"]
    },
    {
        pidgin: "Fo' real kine, you stay mo' stunning than Diamond Head at sunrise.",
        english: "For real, you're more stunning than Diamond Head at sunrise.",
        category: "romantic",
        spiciness: 1,
        tags: ["diamond head", "romantic", "scenic"]
    },
    {
        pidgin: "I like be your spam and you be my rice - we go bettah together.",
        english: "I want to be your spam and you be my rice - we go better together.",
        category: "food",
        spiciness: 1,
        tags: ["spam musubi", "food", "cute"]
    },
    {
        pidgin: "You get me feeling all chicken skin, and I like um.",
        english: "You're giving me goosebumps, and I like it.",
        category: "romantic",
        spiciness: 2,
        tags: ["chicken skin", "feeling", "attraction"]
    },
    {
        pidgin: "Are you one malasada? Cuz you stay sweet and I no can resist.",
        english: "Are you a malasada? Because you're sweet and I can't resist.",
        category: "food",
        spiciness: 1,
        tags: ["malasada", "food", "sweet"]
    },
    {
        pidgin: "Wea you been all my life? I been looking since small kid time.",
        english: "Where have you been all my life? I've been looking since childhood.",
        category: "romantic",
        spiciness: 1,
        tags: ["classic", "romantic", "searching"]
    },
    {
        pidgin: "You must be from Maui cuz you stay no ka oi - da best.",
        english: "You must be from Maui because you're the best.",
        category: "romantic",
        spiciness: 1,
        tags: ["maui", "compliment", "best"]
    },
    {
        pidgin: "I not trying fo' be mayjah, but you stay da most beautiful ting I evah seen.",
        english: "I'm not trying to be dramatic, but you're the most beautiful thing I've ever seen.",
        category: "romantic",
        spiciness: 2,
        tags: ["compliment", "sincere", "beautiful"]
    },
    {
        pidgin: "You like talk story? I get all night fo' listen to you.",
        english: "Want to chat? I have all night to listen to you.",
        category: "romantic",
        spiciness: 1,
        tags: ["talk story", "conversation", "interest"]
    },
    {
        pidgin: "My love fo' you stay deeper than da Pacific Ocean.",
        english: "My love for you is deeper than the Pacific Ocean.",
        category: "romantic",
        spiciness: 2,
        tags: ["ocean", "deep", "love"]
    },
    {
        pidgin: "You stay hotter than lava from Kilauea.",
        english: "You're hotter than lava from Kilauea.",
        category: "spicy",
        spiciness: 3,
        tags: ["volcano", "hot", "intense"]
    },
    {
        pidgin: "Let's make like da tide and come together.",
        english: "Let's be like the tide and come together.",
        category: "beach",
        spiciness: 2,
        tags: ["ocean", "together", "romantic"]
    },
    {
        pidgin: "I would swim through sharks fo' get your numba.",
        english: "I would swim through sharks to get your number.",
        category: "beach",
        spiciness: 2,
        tags: ["sharks", "brave", "dedication"]
    },
    {
        pidgin: "You stay making me feel like I wen win da lottery.",
        english: "You're making me feel like I won the lottery.",
        category: "romantic",
        spiciness: 1,
        tags: ["lucky", "winner", "feeling"]
    },
    {
        pidgin: "I no need GPS, my heart stay always pointing to you.",
        english: "I don't need GPS, my heart always points to you.",
        category: "romantic",
        spiciness: 1,
        tags: ["direction", "heart", "sweet"]
    },
    {
        pidgin: "You like be my plus one fo' every beach day?",
        english: "Want to be my plus one for every beach day?",
        category: "beach",
        spiciness: 1,
        tags: ["beach", "dating", "future"]
    },
    {
        pidgin: "Fo' you, I would share my last piece poke.",
        english: "For you, I would share my last piece of poke.",
        category: "food",
        spiciness: 2,
        tags: ["poke", "sharing", "sacrifice"]
    },
    {
        pidgin: "You stay da rainbow afta my rainy day.",
        english: "You're the rainbow after my rainy day.",
        category: "romantic",
        spiciness: 1,
        tags: ["rainbow", "hope", "romantic"]
    }
];

async function addStories() {
    console.log('📚 Adding new stories to Supabase...\n');

    let added = 0;
    let skipped = 0;

    for (const story of newStories) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/stories`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(story)
            });

            if (response.ok) {
                console.log(`✅ Added story: "${story.title}"`);
                added++;
            } else if (response.status === 409) {
                console.log(`⏭️  Skipped (exists): "${story.title}"`);
                skipped++;
            } else {
                const error = await response.text();
                console.log(`❌ Failed to add "${story.title}": ${error}`);
            }
        } catch (error) {
            console.log(`❌ Error adding "${story.title}": ${error.message}`);
        }
    }

    console.log(`\n📊 Stories: ${added} added, ${skipped} skipped\n`);
    return added;
}

async function addPickupLines() {
    console.log('💕 Adding new pickup lines to Supabase...\n');

    let added = 0;
    let skipped = 0;

    for (const line of newPickupLines) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/pickup_lines`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(line)
            });

            if (response.ok) {
                console.log(`✅ Added: "${line.pidgin.substring(0, 40)}..."`);
                added++;
            } else if (response.status === 409) {
                console.log(`⏭️  Skipped (exists): "${line.pidgin.substring(0, 40)}..."`);
                skipped++;
            } else {
                const error = await response.text();
                console.log(`❌ Failed: ${error}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }

    console.log(`\n📊 Pickup lines: ${added} added, ${skipped} skipped\n`);
    return added;
}

async function main() {
    console.log('🌺 Adding new content to Supabase\n');
    console.log('='.repeat(50) + '\n');

    const storiesAdded = await addStories();
    const linesAdded = await addPickupLines();

    console.log('='.repeat(50));
    console.log('\n✨ Content update complete!');
    console.log(`   Stories added: ${storiesAdded}`);
    console.log(`   Pickup lines added: ${linesAdded}`);
}

main().catch(console.error);
