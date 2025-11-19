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
    ]
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = pickupLineComponents;
}
