// Hawaiian Pidgin Pickup Line Generator - Component-Based Data
// This allows for thousands of unique combinations

const pickupLineComponents = {
    // Opening phrases (How you start)
    openers: [
        { pidgin: "Eh, listen", pronunciation: "EH, LIS-sen" },
        { pidgin: "Ho, wow", pronunciation: "HO, wow" },
        { pidgin: "Check it", pronunciation: "check IT" },
        { pidgin: "Brah, fo real", pronunciation: "BRAH, foh REE-al" },
        { pidgin: "Sistah, check dis out", pronunciation: "SIS-tah, check DIS out" },
        { pidgin: "No joke", pronunciation: "no JOKE" },
        { pidgin: "Shoots, I gotta tell you", pronunciation: "SHOOTS, I GAH-tah tell you" },
        { pidgin: "Eh, you know wat", pronunciation: "EH, you know WAHT" },
        { pidgin: "Ho brah", pronunciation: "HO BRAH" },
        { pidgin: "Auwe", pronunciation: "ow-WEH" },
        { pidgin: "Rajah dat", pronunciation: "RAH-jah DAHT" },
        { pidgin: "Bumbye I tell you", pronunciation: "BUM-bye I tell you" }
    ],

    // Compliments/Targets (What you're saying about them)
    compliments: [
        { pidgin: "you stay look planny good", pronunciation: "you stay look PLAN-nee good" },
        { pidgin: "you da kine person I like know", pronunciation: "you dah KYNE PER-son I like know" },
        { pidgin: "dat smile of yours", pronunciation: "daht SMILE of yours" },
        { pidgin: "you get da most beautiful eyes", pronunciation: "you get dah most byoo-tee-ful EYES" },
        { pidgin: "you stay shine bright", pronunciation: "you stay SHINE bright" },
        { pidgin: "you stay look bettah den shave ice", pronunciation: "you stay look BET-tah den shave ICE" },
        { pidgin: "your vibe stay so ono", pronunciation: "your VIBE stay so OH-no" },
        { pidgin: "da way you walk", pronunciation: "dah way you WALK" },
        { pidgin: "you get dat aloha spirit", pronunciation: "you get daht ah-LOH-hah SPEER-it" },
        { pidgin: "you stay glow like da sunset", pronunciation: "you stay GLOW like dah SUN-set" },
        { pidgin: "you more sweet den haupia", pronunciation: "you more SWEET den how-PEE-ah" },
        { pidgin: "you stay catch my eye", pronunciation: "you stay CATCH my eye" }
    ],

    // Actions/Analogies/Conclusions (The punchline/effect)
    actions: [
        { pidgin: "get me all choke up", pronunciation: "get me all CHOKE up" },
        { pidgin: "stay more sweet than shave ice", pronunciation: "stay more SWEET than shave ICE" },
        { pidgin: "make my slippah fly off", pronunciation: "make my SLIP-pah fly OFF" },
        { pidgin: "like da best kine plate lunch", pronunciation: "like dah best KYNE plate LUNCH" },
        { pidgin: "make me like pau hana right now", pronunciation: "make me like PAU HAH-nah right NOW" },
        { pidgin: "stay bettah den Waikiki sunset", pronunciation: "stay BET-tah den why-kee-kee SUN-set" },
        { pidgin: "make me like grind all day", pronunciation: "make me like GRIND all DAY" },
        { pidgin: "stay smoove like butter mochi", pronunciation: "stay SMOOVE like BU-ter MO-chee" },
        { pidgin: "make my heart stay race", pronunciation: "make my HEART stay RACE" },
        { pidgin: "could neva get pau looking at you", pronunciation: "could NEH-vah get PAU LOO-king at you" },
        { pidgin: "stay broke da mouth good", pronunciation: "stay BROKE dah MOUTH good" },
        { pidgin: "like one fresh malasada", pronunciation: "like one fresh mah-lah-SAH-dah" }
    ],

    // Pidgin flavor words (can be inserted for authenticity)
    flavorWords: [
        { pidgin: "choke", pronunciation: "CHOKE", meaning: "a lot/many" },
        { pidgin: "da kine", pronunciation: "dah KYNE", meaning: "the thing/whatchamacallit" },
        { pidgin: "brah", pronunciation: "BRAH", meaning: "brother/friend" },
        { pidgin: "sistah", pronunciation: "SIS-tah", meaning: "sister/friend" },
        { pidgin: "shoots", pronunciation: "SHOOTS", meaning: "okay/sounds good" },
        { pidgin: "pau", pronunciation: "PAU", meaning: "finished/done" },
        { pidgin: "grindz", pronunciation: "GRINDZ", meaning: "food" },
        { pidgin: "ono", pronunciation: "OH-no", meaning: "delicious" },
        { pidgin: "bumbye", pronunciation: "BUM-bye", meaning: "later/eventually" },
        { pidgin: "planny", pronunciation: "PLAN-nee", meaning: "plenty/a lot" }
    ],

    // Complete pre-made lines (high quality guaranteed hits)
    completedLines: [
        {
            pidgin: "Eh, you da only kine wave I wanna catch",
            pronunciation: "EH, you dah OH-nlee KYNE wave I WAH-nah catch",
            english: "You're the only wave I want to catch",
            category: "ocean"
        },
        {
            pidgin: "Ho, if you was one musubi, you'd be da special kine",
            pronunciation: "HO, if you was one moo-soo-BEE, you'd be dah SPEH-shul KYNE",
            english: "If you were a musubi, you'd be the special kind",
            category: "food"
        },
        {
            pidgin: "Shoots, can I get your number or I gotta wait bumbye?",
            pronunciation: "SHOOTS, can I get your NUM-bah or I GAH-tah wait BUM-bye?",
            english: "Can I get your number or do I have to wait until later?",
            category: "direct"
        },
        {
            pidgin: "You stay shine brighter den da tiki torches",
            pronunciation: "you stay SHINE BRIGHT-ah den dah TEE-kee TOR-ches",
            english: "You shine brighter than the tiki torches",
            category: "light"
        },
        {
            pidgin: "No joke, you get me all pupule inside",
            pronunciation: "no JOKE, you get me all poo-POO-leh in-SIDE",
            english: "No joke, you make me crazy inside",
            category: "feelings"
        },
        {
            pidgin: "Brah, if beauty was grindz, you'd be da best plate lunch",
            pronunciation: "BRAH, if BYOO-tee was GRINDZ, you'd be dah best PLATE lunch",
            english: "If beauty was food, you'd be the best plate lunch",
            category: "food"
        },
        {
            pidgin: "Sistah, you stay ono like fresh poi",
            pronunciation: "SIS-tah, you stay OH-no like fresh POY",
            english: "Sister, you're delicious like fresh poi",
            category: "food"
        },
        {
            pidgin: "You make my heart go broke da mouth",
            pronunciation: "you make my HEART go broke dah MOUTH",
            english: "You make my heart feel amazing (like delicious food)",
            category: "feelings"
        },
        {
            pidgin: "Eh, I stay lost - can show me da way to your heart?",
            pronunciation: "EH, I stay LOST - can show me dah WAY to your HEART?",
            english: "Hey, I'm lost - can you show me the way to your heart?",
            category: "classic"
        },
        {
            pidgin: "You get mo shine den da Honolulu city lights",
            pronunciation: "you get MO shine den dah ho-no-LOO-loo SIH-tee lights",
            english: "You shine more than the Honolulu city lights",
            category: "light"
        },
        {
            pidgin: "Can I be da spam to your musubi?",
            pronunciation: "can I be dah SPAM to your moo-soo-BEE?",
            english: "Can I be the spam to your musubi? (perfect match)",
            category: "food"
        },
        {
            pidgin: "Rajah dat - you stay da most beautiful wahine I eva seen",
            pronunciation: "RAH-jah daht - you stay dah most BYOO-tee-ful wah-HEE-neh I EH-vah seen",
            english: "That's right - you're the most beautiful woman I've ever seen",
            category: "direct"
        }
    ],

    // 808 Mode Generator - Contextual Options
    placesToEat: [
        { name: "Zippy's", description: "Local favorite restaurant", pidgin: "Zippy's chili bowl" },
        { name: "Leonard's Bakery", description: "Famous malasadas", pidgin: "Leonard's hot malasada" },
        { name: "Helena's Hawaiian Food", description: "Authentic Hawaiian cuisine", pidgin: "Helena's pipikaula" },
        { name: "Giovanni's Shrimp Truck", description: "North Shore garlic shrimp", pidgin: "Giovanni's garlic shrimp" },
        { name: "Rainbow Drive-In", description: "Classic local plate lunch", pidgin: "Rainbow's loco moco" },
        { name: "Ted's Bakery", description: "Chocolate haupia pie", pidgin: "Ted's haupia pie" },
        { name: "Ono Hawaiian Foods", description: "Traditional Hawaiian dishes", pidgin: "Ono's kalua pig" },
        { name: "Marukame Udon", description: "Fresh udon noodles", pidgin: "Marukame's udon" },
        { name: "L&L Hawaiian Barbecue", description: "BBQ mix plate", pidgin: "L&L BBQ mix plate" },
        { name: "Kono's", description: "North Shore breakfast burritos", pidgin: "Kono's breakfast burrito" },
        { name: "Matsumoto Shave Ice", description: "Historic shave ice stand", pidgin: "Matsumoto's shave ice" },
        { name: "Nico's Pier 38", description: "Fresh fish restaurant", pidgin: "Nico's poke bowl" },
        { name: "Highway Inn", description: "Hawaiian comfort food", pidgin: "Highway Inn's laulau" },
        { name: "Anna Miller's", description: "24-hour diner", pidgin: "Anna Miller's pie" },
        { name: "Kaka'ako Kitchen", description: "Local lunch spot", pidgin: "Kaka'ako's plate lunch" },
        { name: "Waiola Shave Ice", description: "Legendary shave ice", pidgin: "Waiola's shave ice" },
        { name: "Haleiwa Joe's", description: "Seafood and steaks", pidgin: "Haleiwa Joe's fish" },
        { name: "Uncle Bo's", description: "Pupu bar and grill", pidgin: "Uncle Bo's pupu platter" },
        { name: "Liliha Bakery", description: "Famous coco puffs", pidgin: "Liliha's coco puffs" },
        { name: "Kamehameha Bakery", description: "Poi glazed donuts", pidgin: "Kamehameha's poi donuts" },
        { name: "Ethel's Grill", description: "Hole-in-the-wall plate lunch", pidgin: "Ethel's teri beef" },
        { name: "Waiahole Poi Factory", description: "Traditional Hawaiian food", pidgin: "Waiahole's poi" },
        { name: "Kua 'Aina", description: "Burgers and sandwiches", pidgin: "Kua 'Aina's burger" },
        { name: "Teddy's Bigger Burgers", description: "Local burger chain", pidgin: "Teddy's burger" },
        { name: "Café 100", description: "Hilo loco moco birthplace", pidgin: "Café 100's loco moco" },
        { name: "Kalapawai Market", description: "Kailua deli and market", pidgin: "Kalapawai's sandwich" },
        { name: "Yama's Fish Market", description: "Local poke and plate lunch", pidgin: "Yama's poke" },
        { name: "Foodland Poke Bar", description: "Supermarket poke counter", pidgin: "Foodland poke" },
        { name: "Alicia's Market", description: "Family-run Filipino market", pidgin: "Alicia's pork adobo" },
        { name: "Palace Saimin", description: "Old-school saimin shop", pidgin: "Palace's saimin" }
    ],

    landmarks: [
        { name: "Diamond Head", description: "Iconic Oahu crater", pidgin: "Diamond Head" },
        { name: "Pali Highway", description: "Scenic mountain road", pidgin: "Pali Highway" },
        { name: "Road to Hana", description: "Maui's famous coastal drive", pidgin: "Hana Highway" },
        { name: "Ka'ena Point", description: "Western tip of Oahu", pidgin: "Ka'ena Point" },
        { name: "Nu'uanu Pali Lookout", description: "Historic cliff lookout", pidgin: "Pali Lookout" },
        { name: "Waikiki", description: "Famous beach and tourist spot", pidgin: "Waikiki Beach" },
        { name: "North Shore", description: "Surfing capital", pidgin: "da North Shore" },
        { name: "Makapu'u Point", description: "Eastern Oahu lighthouse", pidgin: "Makapu'u" },
        { name: "Hanauma Bay", description: "Snorkeling paradise", pidgin: "Hanauma Bay" },
        { name: "Sunset Beach", description: "Winter surf spot", pidgin: "Sunset Beach" },
        { name: "Ala Moana Beach Park", description: "Local favorite beach", pidgin: "Ala Moana" },
        { name: "Kailua Beach", description: "Windward side paradise", pidgin: "Kailua Beach" },
        { name: "Lanikai Beach", description: "Picture-perfect white sand", pidgin: "Lanikai" },
        { name: "Tantalus Lookout", description: "Mountain viewpoint", pidgin: "Tantalus" },
        { name: "Sandy Beach", description: "Bodysurfing hotspot", pidgin: "Sandy's" },
        { name: "Waimea Bay", description: "Big wave surf spot", pidgin: "Waimea Bay" },
        { name: "Halona Blowhole", description: "Ocean geyser viewpoint", pidgin: "da Blowhole" },
        { name: "Likeke Highway", description: "Wilson Tunnel route", pidgin: "Likeke" },
        { name: "Kamehameha Highway", description: "Scenic coastal road", pidgin: "Kam Highway" },
        { name: "H-3 Freeway", description: "Interstate through mountains", pidgin: "da H-3" },
        { name: "Aloha Stadium", description: "Former swap meet location", pidgin: "Aloha Stadium" },
        { name: "Pearl Harbor", description: "Historic military site", pidgin: "Pearl Harbor" },
        { name: "Iolani Palace", description: "Royal palace downtown", pidgin: "Iolani Palace" },
        { name: "Koko Crater", description: "Volcanic cone landmark", pidgin: "Koko Crater" },
        { name: "Chinaman's Hat", description: "Mokoli'i Island", pidgin: "Chinaman's Hat" },
        { name: "Haleiwa Town", description: "North Shore surf town", pidgin: "Haleiwa" },
        { name: "Waimanalo Beach", description: "Long sandy beach", pidgin: "Waimanalo" },
        { name: "Yokohama Bay", description: "West side beach", pidgin: "Yokohama Bay" },
        { name: "Mokulua Islands", description: "Twin islands off Lanikai", pidgin: "da Mokes" },
        { name: "Kahala Beach", description: "Upscale neighborhood beach", pidgin: "Kahala" },
        { name: "Windward Mall", description: "Kailua shopping center", pidgin: "Windward Mall" },
        { name: "Pearlridge Center", description: "Large shopping mall", pidgin: "Pearlridge" },
        { name: "Ward Village", description: "Kaka'ako development", pidgin: "Ward" },
        { name: "Chinatown", description: "Historic downtown district", pidgin: "Chinatown" },
        { name: "Kapiolani Park", description: "Large Waikiki park", pidgin: "Kapi'o Park" }
    ],

    hikingTrails: [
        { name: "Koko Head Stairs", description: "1,048 railroad tie stairs", pidgin: "Koko Head" },
        { name: "Manoa Falls", description: "Rainforest waterfall hike", pidgin: "Manoa Falls" },
        { name: "Lanikai Pillbox", description: "Kaiwa Ridge bunkers", pidgin: "da Pillbox" },
        { name: "Diamond Head Trail", description: "Iconic crater summit", pidgin: "Diamond Head" },
        { name: "Makapu'u Lighthouse", description: "Paved coastal trail", pidgin: "Makapu'u Lighthouse" },
        { name: "Waimea Falls", description: "North Shore botanical hike", pidgin: "Waimea Falls" },
        { name: "Aiea Loop Trail", description: "Ridge and valley views", pidgin: "Aiea Loop" },
        { name: "Olomana Three Peaks", description: "Advanced ridge scramble", pidgin: "Olomana" },
        { name: "Kuliouou Ridge", description: "Panoramic Ko'olau views", pidgin: "Kuliouou" },
        { name: "Kaena Point Trail", description: "Coastal wilderness hike", pidgin: "Kaena Point" },
        { name: "Maunawili Falls", description: "Jungle waterfall adventure", pidgin: "Maunawili Falls" },
        { name: "Wiliwilinui Ridge", description: "Ko'olau summit trail", pidgin: "Wiliwilinui" },
        { name: "Ehukai Pillbox", description: "Sunset Beach viewpoint", pidgin: "Ehukai Pillbox" },
        { name: "Pali Notches", description: "Advanced cliff trail", pidgin: "da Pali Notches" },
        { name: "Haiku Stairs", description: "Stairway to Heaven (closed)", pidgin: "Haiku Stairs" },
        { name: "Makapuu Tidepools", description: "Coastal lava formations", pidgin: "Makapuu Tidepools" },
        { name: "Likeke Falls", description: "Hidden waterfall hike", pidgin: "Likeke Falls" },
        { name: "Wa'ahila Ridge", description: "St. Louis Heights trail", pidgin: "Wa'ahila Ridge" },
        { name: "Kaau Crater", description: "Waterfall rope climb", pidgin: "Kaau Crater" },
        { name: "Moanalua Valley", description: "Back way to Haiku Stairs", pidgin: "Moanalua Valley" },
        { name: "Lulumahu Falls", description: "Bamboo forest waterfall", pidgin: "Lulumahu Falls" },
        { name: "Waimano Ridge", description: "Pearl City trail", pidgin: "Waimano Ridge" },
        { name: "Maili Pillbox", description: "Westside bunker hike", pidgin: "Maili Pillbox" },
        { name: "Kaena Point (North)", description: "Mokuleia coastal trail", pidgin: "Kaena Point North" },
        { name: "Kaena Point (West)", description: "Yokohama Bay route", pidgin: "Kaena Point West" },
        { name: "Tantalus Arboretum", description: "Forest loop trail", pidgin: "Tantalus" },
        { name: "Makiki Valley Loop", description: "Urban forest hike", pidgin: "Makiki Valley" },
        { name: "Jackass Ginger", description: "Nu'uanu stream hike", pidgin: "Jackass Ginger" },
        { name: "Kahana Valley", description: "Windward rainforest trail", pidgin: "Kahana Valley" },
        { name: "Kapalua Trail", description: "Kailua loop hike", pidgin: "Kapalua Trail" },
        { name: "Pu'u Manamana", description: "Narrow ridge scramble", pidgin: "Pu'u Manamana" },
        { name: "Kawai Nui Marsh", description: "Kailua wetland walk", pidgin: "Kawai Nui" },
        { name: "Hoʻomaluhia Loop", description: "Botanical garden trail", pidgin: "Hoʻomaluhia" },
        { name: "Peacock Flats", description: "Mokuleia forest trail", pidgin: "Peacock Flats" },
        { name: "Pink Pillbox", description: "Maili sunset hike", pidgin: "Pink Pillbox" }
    ],

    genderTargets: [
        { value: "wahine", label: "Wahine (Female)", pronoun: "she", possessive: "her", compliment: "pretty", pidgin: "wahine" },
        { value: "kane", label: "Kāne (Male)", pronoun: "he", possessive: "his", compliment: "handsome", pidgin: "kāne" }
    ],

    // Core Pidgin vocabulary for "You so pretty" variations
    prettyPhrases: {
        wahine: [
            "You so pretty",
            "You so 'ono lookin'",
            "You da kine beautiful",
            "You look planny good",
            "You stay shine bright",
            "You mo' pretty den da sunset"
        ],
        kane: [
            "You so handsome",
            "You look akamai and fine kine",
            "You da kine good looking",
            "You stay look planny good",
            "You mo' handsome brah",
            "You look mo' bettah"
        ]
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = pickupLineComponents;
}
