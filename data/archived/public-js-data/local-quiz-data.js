// "How Local You Stay?" Quiz Data
// BuzzFeed-style quiz to test how local someone is

const localQuizData = {
    title: "How Local You Stay?",
    description: "Take this quiz to find out if you're a true local or just a tourist!",

    questions: [
        {
            id: 1,
            question: "What you call this?",
            image: "🍧", // Shave Ice emoji (we'll use emojis for now, can add real images later)
            description: "A popular Hawaiian treat",
            options: [
                { text: "Snow Cone", points: 0, feedback: "Auwe! Das not da same ting!" },
                { text: "Shaved Ice", points: 5, feedback: "Close, but not quite local kine!" },
                { text: "Shave Ice", points: 10, feedback: "Rajah! You know da kine!" },
                { text: "Ice Kona", points: 3, feedback: "Nah brah, try again!" }
            ]
        },
        {
            id: 2,
            question: "When somebody says 'Howzit?' what you say back?",
            image: "🤙",
            description: "Common local greeting",
            options: [
                { text: "I'm fine, how are you?", points: 0, feedback: "Too formal brah!" },
                { text: "Howzit!", points: 10, feedback: "Das right! Keep it simple!" },
                { text: "Hello, good morning!", points: 0, feedback: "Nah, you tourist or what?" },
                { text: "Shoots!", points: 8, feedback: "Not bad, but 'Howzit' back mo' bettah!" }
            ]
        },
        {
            id: 3,
            question: "What's the proper way to take off your slippers?",
            image: "🩴",
            description: "Before entering a house",
            options: [
                { text: "Leave them on, it's just shoes", points: 0, feedback: "Brah! You going make any local auntie mad!" },
                { text: "Take them off at the door", points: 10, feedback: "Chee hoo! You get da respect!" },
                { text: "Take them off if asked", points: 3, feedback: "Nah, you gotta know already!" },
                { text: "Kick them off anywhere", points: 5, feedback: "Close, but gotta be by da door!" }
            ]
        },
        {
            id: 4,
            question: "What time is 'pau hana'?",
            image: "🕐",
            description: "Important local concept",
            options: [
                { text: "Breakfast time", points: 0, feedback: "Nah das morning brah!" },
                { text: "Lunch break", points: 3, feedback: "Not quite!" },
                { text: "After work/End of work day", points: 10, feedback: "Shoots! Time for relax!" },
                { text: "Bedtime", points: 0, feedback: "Too late already!" }
            ]
        },
        {
            id: 5,
            question: "Somebody brings a cooler to the beach. What's inside?",
            image: "🧊",
            description: "Beach essentials",
            options: [
                { text: "Water bottles", points: 3, feedback: "Good, but you missing someting!" },
                { text: "Beer and poke", points: 10, feedback: "Now we talking! Das how local do 'em!" },
                { text: "Sandwiches", points: 0, feedback: "Mainland kine!" },
                { text: "Soda", points: 2, feedback: "Nah, try again!" }
            ]
        },
        {
            id: 6,
            question: "What you call flip-flops?",
            image: "👡",
            description: "Everyday footwear",
            options: [
                { text: "Flip-flops", points: 0, feedback: "Brah, you not from here yeah?" },
                { text: "Sandals", points: 0, feedback: "Too fancy!" },
                { text: "Slippers", points: 10, feedback: "Chee! Das how we say 'em!" },
                { text: "Thongs", points: 3, feedback: "Old school, but we say slippers now!" }
            ]
        },
        {
            id: 7,
            question: "What's the best plate lunch spot?",
            image: "🍱",
            description: "Local grindz essential",
            options: [
                { text: "Panda Express", points: 0, feedback: "Auwe! Das chain restaurant!" },
                { text: "The local lunch wagon", points: 10, feedback: "Rajah! Mo' bettah grindz!" },
                { text: "McDonald's", points: 0, feedback: "Nah brah, not even close!" },
                { text: "Any place with AC", points: 2, feedback: "Nah, gotta be about da food!" }
            ]
        },
        {
            id: 8,
            question: "How you give directions?",
            image: "🗺️",
            description: "Local navigation style",
            options: [
                { text: "Turn left on Main Street", points: 2, feedback: "Too haole kine!" },
                { text: "Go mauka by da old Zippy's", points: 10, feedback: "Das it! True local style!" },
                { text: "Use GPS coordinates", points: 0, feedback: "Brah, nobody talk like dat!" },
                { text: "It's 2.5 miles north", points: 0, feedback: "We no use miles brah!" }
            ]
        },
        {
            id: 9,
            question: "Somebody says 'We go beach'. When you leaving?",
            image: "🏖️",
            description: "Island time concept",
            options: [
                { text: "Right now", points: 3, feedback: "Too fast! Relax small kine!" },
                { text: "In about an hour... or two... or whenever", points: 10, feedback: "Chee hoo! You know island time!" },
                { text: "At exactly 2:00 PM", points: 0, feedback: "Too mainland kine!" },
                { text: "Tomorrow", points: 0, feedback: "Nah, 'we go' means today!" }
            ]
        },
        {
            id: 10,
            question: "What's 'da kine'?",
            image: "❓",
            description: "The ultimate pidgin test",
            options: [
                { text: "I don't know", points: 0, feedback: "If you gotta ask, you not local!" },
                { text: "That thing, you know, da kine!", points: 10, feedback: "Exactly! You get 'em!" },
                { text: "A specific item", points: 3, feedback: "Can be, but 'da kine' is 'da kine'!" },
                { text: "Broken English", points: 0, feedback: "Nah! Das pidgin, not broken!" }
            ]
        },
        {
            id: 11,
            question: "How you eat your musubi?",
            image: "🍙",
            description: "Local favorite snack",
            options: [
                { text: "With a fork and knife", points: 0, feedback: "Brah! Use your hands!" },
                { text: "Just bite 'em", points: 10, feedback: "Das right! No need fancy!" },
                { text: "Cut into small pieces", points: 0, feedback: "Nah, too much work!" },
                { text: "What's a musubi?", points: 0, feedback: "You nevah live Hawaii or what?!" }
            ]
        },
        {
            id: 12,
            question: "Traffic on H-1. What you do?",
            image: "🚗",
            description: "Daily island life",
            options: [
                { text: "Honk and get mad", points: 0, feedback: "No make lidat! Get aloha spirit!" },
                { text: "Just wait, listen music, no stress", points: 10, feedback: "Das da local way! No can rush!" },
                { text: "Take a different route", points: 5, feedback: "Good idea, but sometimes no mo' choice!" },
                { text: "Call in sick", points: 3, feedback: "Haha! But nah, just deal wit 'em!" }
            ]
        }
    ],

    // Results based on total score
    results: [
        {
            minScore: 0,
            maxScore: 30,
            level: "Fresh Off da Boat",
            emoji: "✈️",
            title: "You Tourist or What?!",
            description: "Brah, you just wen land at da airport? You get planny tings fo' learn! Stick around, talk to da locals, and try learn da culture. No worry, everybody gotta start somewhere!",
            tips: [
                "Start wit' da basics: learn fo' take off your slippahs",
                "Try some local grindz from a lunch wagon",
                "Listen how da locals talk - pick up da pidgin slowly"
            ]
        },
        {
            minScore: 31,
            maxScore: 60,
            level: "Transplant Trying",
            emoji: "🌴",
            title: "You Getting There!",
            description: "Eh, not bad! You been around small kine, you learning da ways. You still get dat mainland vibe, but you trying fo' fit in. Keep going, you almost there!",
            tips: [
                "Practice your pidgin wit' da locals",
                "Go explore mo' local spots, not just Waikiki",
                "Learn da island time - relax small kine!"
            ]
        },
        {
            minScore: 61,
            maxScore: 90,
            level: "Local Kine",
            emoji: "🤙",
            title: "Shoots, You Pretty Local!",
            description: "Chee hoo! You know da kine already! You probably been living Hawaii fo' while, or you grew up wit' locals. You get da culture, you talk da talk, you walk da walk. Respect!",
            tips: [
                "You doing good, just keep being you!",
                "Share da culture wit' da newbies",
                "Maybe you can teach 'em how fo' be mo' local!"
            ]
        },
        {
            minScore: 91,
            maxScore: 120,
            level: "Born and Raised",
            emoji: "🌺",
            title: "100% Island Kine!",
            description: "Brah! You DA LOCAL! Born and raised, yeah? You know all da spots, you speak fluent pidgin, you get da aloha spirit. You da real deal! Mahalo fo' keeping da culture alive!",
            tips: [
                "You already know errything!",
                "Keep sharing da aloha spirit",
                "Teach da next generation how fo' stay local!"
            ]
        }
    ]
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = localQuizData;
}
