#!/usr/bin/env node
/**
 * Add 5 New Cultural Stories
 * Educational stories teaching Hawaiian Pidgin and local culture
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_KEY not found');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const stories = [
    {
        id: "first_day_school",
        title: "First Day School",
        pidgin_text: "Keala stay all nervous on her first day high school. She no can find her class, den one senior boy walk up. 'Eh, you look lost. Wea you going?' he ask. 'I looking for da science room,' Keala say, all shy. 'Shoots, I show you. Come, follow me.' On da way, he tell her, 'No worry, everybody stay lost first day. Bumbye you going know dis place li da back of your hand.' Keala feel mo bettah already. Das da aloha spirit - always helping each oddah out.",
        english_translation: "Keala is very nervous on her first day of high school. She can't find her class, then a senior boy walks up. 'Hey, you look lost. Where are you going?' he asks. 'I'm looking for the science room,' Keala says, feeling shy. 'Okay, I'll show you. Come, follow me.' On the way, he tells her, 'Don't worry, everybody's lost on the first day. Eventually you'll know this place like the back of your hand.' Keala feels much better already. That's the aloha spirit - always helping each other out.",
        cultural_notes: "This story demonstrates the aloha spirit of helping newcomers and the common practice of code-switching between pidgin and English in school settings. The phrase 'li da back of your hand' is a pidgin adaptation of the English idiom.",
        vocabulary: [
            { pidgin: "stay", english: "to be (continuous state)", pronunciation: "stay" },
            { pidgin: "nervous", english: "anxious, worried", pronunciation: "NER-vus" },
            { pidgin: "wea", english: "where", pronunciation: "weh-ah" },
            { pidgin: "shoots", english: "okay, sure", pronunciation: "shoots" },
            { pidgin: "bumbye", english: "later, by and by", pronunciation: "BUM-bye" },
            { pidgin: "li dat", english: "like that", pronunciation: "lee-DAT" },
            { pidgin: "mo bettah", english: "much better", pronunciation: "moh BET-tah" },
            { pidgin: "oddah", english: "other", pronunciation: "UH-dah" }
        ],
        difficulty: "beginner",
        tags: ["school", "aloha_spirit", "helping", "first_day"]
    },
    {
        id: "broken_down_car",
        title: "Broken Down Car",
        pidgin_text: "Uncle Kimo's truck wen broke down right in da middle of Kamehameha Highway. He stay there scratching his head when one pickup truck pull ovah. 'Eh Uncle, you need help or what?' da young guy ask. 'Yeah brah, I no can tell what stay wrong. Engine just wen die.' Three mo cars stop fo help. One guy get jumper cables, anodda one know mechanics, and one Aunty even bring watah and snacks. After one hour, dey get da truck running. Uncle Kimo try give dem money but everybody say, 'Nah nah, no need. Das what we do. Next time you see somebody else, you help dem, yeah?' Das da local way - we take care each oddah.",
        english_translation: "Uncle Kimo's truck broke down right in the middle of Kamehameha Highway. He's standing there scratching his head when a pickup truck pulls over. 'Hey Uncle, do you need help?' the young guy asks. 'Yes brother, I can't tell what's wrong. The engine just died.' Three more cars stop to help. One guy has jumper cables, another one knows mechanics, and one Aunty even brings water and snacks. After an hour, they get the truck running. Uncle Kimo tries to give them money but everybody says, 'No no, no need. That's what we do. Next time you see somebody else, you help them, okay?' That's the local way - we take care of each other.",
        cultural_notes: "This story exemplifies the strong community spirit in Hawaii where strangers readily help each other. The refusal of payment and emphasis on 'paying it forward' is deeply ingrained in local culture. Calling people 'Uncle' and 'Aunty' shows respect even to strangers.",
        vocabulary: [
            { pidgin: "wen", english: "past tense marker (did)", pronunciation: "wen" },
            { pidgin: "broke down", english: "stopped working", pronunciation: "BROKE down" },
            { pidgin: "brah", english: "brother, friend", pronunciation: "brah" },
            { pidgin: "no can", english: "cannot", pronunciation: "no KAN" },
            { pidgin: "get", english: "have, has", pronunciation: "get" },
            { pidgin: "mo", english: "more", pronunciation: "moh" },
            { pidgin: "dem", english: "them", pronunciation: "dem" },
            { pidgin: "nah nah", english: "no no", pronunciation: "nah nah" },
            { pidgin: "das", english: "that's", pronunciation: "das" }
        ],
        difficulty: "intermediate",
        tags: ["community", "helping", "aloha_spirit", "locals"]
    },
    {
        id: "farmers_market_saturday",
        title: "Farmer's Market Saturday",
        pidgin_text: "Every Saturday morning, da whole family go KCC Farmer's Market. Da place stay packed wit people. 'Eh, look how choke!' Mama say. Dey walk around, checking out all da kine local produce. At one booth, one farmer offering samples. 'Try dis lilikoi butter! So ono!' he tell dem. Papa buy three jars. At anodda stall, get fresh poke. 'How much fo one pound?' Mama ask. 'Eighteen dollah, but fo you, I give special - sixteen.' 'Shoots, I take two pound den.' On da way out, dey see their neighbor. 'Aunty! You wen come early today!' 'Yeah, I like get da best mangoes before dey all gone!' Das Saturday morning - everybody hunting fo da freshest local kine grindz.",
        english_translation: "Every Saturday morning, the whole family goes to KCC Farmer's Market. The place is packed with people. 'Hey, look how crowded!' Mom says. They walk around, checking out all kinds of local produce. At one booth, a farmer is offering samples. 'Try this passionfruit butter! So delicious!' he tells them. Dad buys three jars. At another stall, there's fresh poke. 'How much for one pound?' Mom asks. 'Eighteen dollars, but for you, I'll give you special - sixteen.' 'Okay, I'll take two pounds then.' On the way out, they see their neighbor. 'Aunty! You came early today!' 'Yeah, I want to get the best mangoes before they're all gone!' That's Saturday morning - everybody's hunting for the freshest local food.",
        cultural_notes: "The KCC Farmer's Market is a famous Oahu institution. Haggling is acceptable and vendors often give 'local discounts' to regular customers. 'Lilikoi' (passionfruit) and poke are quintessential Hawaiian foods. The casual, friendly atmosphere and community connections are typical of local markets.",
        vocabulary: [
            { pidgin: "choke", english: "a lot, crowded", pronunciation: "choke" },
            { pidgin: "all da kine", english: "all kinds of", pronunciation: "all dah KYNE" },
            { pidgin: "lilikoi", english: "passionfruit", pronunciation: "lee-lee-KOY" },
            { pidgin: "ono", english: "delicious", pronunciation: "OH-no" },
            { pidgin: "fo", english: "for", pronunciation: "fo" },
            { pidgin: "dollah", english: "dollars", pronunciation: "DAH-lah" },
            { pidgin: "I like", english: "I want to", pronunciation: "I like" },
            { pidgin: "grindz", english: "food", pronunciation: "grindz" }
        ],
        difficulty: "intermediate",
        tags: ["food", "market", "community", "local_culture"]
    },
    {
        id: "new_mainland_neighbor",
        title: "New Neighbor from Mainland",
        pidgin_text: "One haole family just move in next door. Da dad come ovah fo introduce. 'Hi, I'm Steve. We just moved from California.' Papa give him shaka. 'Eh, welcome! I'm Kawika. You folks settling in okay?' Steve look confused at da hand gesture but smile anyway. 'Yes, thanks. But I have to ask - why does everyone call me 'Uncle' at the store? I'm only thirty-five!' Papa laugh. 'Oh brah, das just local style! We call everybody Uncle or Aunty, show respect, yeah? No worry, you going get used to 'um.' 'And everyone keeps saying howzit - is that like how's it going?' 'Shoots! You catching on already! Come, I show you where get da best plate lunch.' By da end of da day, Steve stay trying fo talk pidgin. He going fit in jus fine.",
        english_translation: "A Caucasian family just moved in next door. The dad comes over to introduce himself. 'Hi, I'm Steve. We just moved from California.' Dad gives him a shaka. 'Hey, welcome! I'm Kawika. Are you folks settling in okay?' Steve looks confused at the hand gesture but smiles anyway. 'Yes, thanks. But I have to ask - why does everyone call me 'Uncle' at the store? I'm only thirty-five!' Dad laughs. 'Oh brother, that's just local style! We call everybody Uncle or Aunty to show respect, you know? Don't worry, you'll get used to it.' 'And everyone keeps saying howzit - is that like how's it going?' 'Exactly! You're catching on already! Come, I'll show you where to get the best plate lunch.' By the end of the day, Steve is trying to speak pidgin. He's going to fit in just fine.",
        cultural_notes: "This story addresses common confusion newcomers face with local customs like the shaka gesture and honorific titles (Uncle/Aunty). The welcoming attitude toward newcomers who show respect and willingness to learn local customs is typical. 'Haole' is a neutral term for Caucasians or mainlanders in Hawaii.",
        vocabulary: [
            { pidgin: "haole", english: "Caucasian, mainlander", pronunciation: "HOW-leh" },
            { pidgin: "shaka", english: "hang loose hand gesture", pronunciation: "SHAH-kah" },
            { pidgin: "eh", english: "hey (attention getter)", pronunciation: "eh" },
            { pidgin: "folks", english: "people, you all", pronunciation: "fokes" },
            { pidgin: "local style", english: "the local way", pronunciation: "LO-kal style" },
            { pidgin: "no worry", english: "don't worry", pronunciation: "no WOR-ry" },
            { pidgin: "you going", english: "you will", pronunciation: "you GO-ing" },
            { pidgin: "jus fine", english: "just fine", pronunciation: "jus FINE" }
        ],
        difficulty: "beginner",
        tags: ["newcomers", "culture_shock", "local_customs", "mainland"]
    },
    {
        id: "talk_story_with_kupuna",
        title: "Talk Story with Kupuna",
        pidgin_text: "Every Friday pau hana, da keiki go visit Tutu at her house fo talk story. She stay on da lanai, making lei wit fresh plumeria. 'Come, come! Sit down. You like juice?' she ask. All da grandkids sit around while Tutu tell dem stories about old Hawaii. 'When I was small keed, we nevah had no TV, no iPad, nothing. We make our own fun - go beach, catch fish, climb tree.' 'Tutu, how you wen learn pidgin?' one keiki ask. 'Oh, das how everybody talk back den! Get Japanese, Filipino, Hawaiian, Chinese - everybody working togedda on da plantation. We mix all our languages, make one new kine way fo talk. Das why pidgin so special - it stay da language of da people, da working people who wen build Hawaii.' All da keiki stay quiet, listening. Dey learning mo than just pidgin - dey learning their history.",
        english_translation: "Every Friday after work, the children go visit Grandma at her house to talk story. She's on the porch, making lei with fresh plumeria flowers. 'Come, come! Sit down. Do you want juice?' she asks. All the grandkids sit around while Grandma tells them stories about old Hawaii. 'When I was a small child, we didn't have TV, no iPad, nothing. We made our own fun - go to the beach, catch fish, climb trees.' 'Grandma, how did you learn pidgin?' one child asks. 'Oh, that's how everybody talked back then! There were Japanese, Filipino, Hawaiian, Chinese - everybody working together on the plantation. We mixed all our languages, created a new kind of way to talk. That's why pidgin is so special - it's the language of the people, the working people who built Hawaii.' All the children are quiet, listening. They're learning more than just pidgin - they're learning their history.",
        cultural_notes: "This story highlights the importance of kupuna (elders) in passing down language and culture. The multi-ethnic plantation history is central to understanding pidgin's origins as a creole language. Making lei and gathering on the lanai (porch) are traditional Hawaiian customs that continue today.",
        vocabulary: [
            { pidgin: "pau hana", english: "after work, finished work", pronunciation: "pow HAH-nah" },
            { pidgin: "keiki", english: "children", pronunciation: "KAY-key" },
            { pidgin: "tutu", english: "grandma/grandpa", pronunciation: "TOO-too" },
            { pidgin: "talk story", english: "chat, have conversation", pronunciation: "talk STOR-ee" },
            { pidgin: "lanai", english: "porch, veranda", pronunciation: "lah-NYE" },
            { pidgin: "small keed", english: "small child", pronunciation: "small KEED" },
            { pidgin: "nevah had no", english: "didn't have any", pronunciation: "NEV-ah had no" },
            { pidgin: "wen", english: "did (past tense)", pronunciation: "wen" },
            { pidgin: "kupuna", english: "elders, grandparents", pronunciation: "koo-POO-nah" }
        ],
        difficulty: "advanced",
        tags: ["history", "kupuna", "culture", "plantation_era", "education"]
    }
];

async function addStories() {
    console.log('📚 Adding 5 new cultural stories...\n');

    const { data, error} = await supabase
        .from('stories')
        .insert(stories)
        .select();

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log(`✅ Added ${data.length} stories!`);

    console.log('\n📖 New stories:');
    data.forEach(story => {
        console.log(`   - ${story.title} (${story.difficulty})`);
    });

    // Get new total
    const { data: allStories } = await supabase.from('stories').select('id');
    console.log(`\n🎯 New total: ${allStories ? allStories.length : 0} stories`);
}

addStories();
