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
        },
        {
            id: 13,
            question: "What's the hand sign for 'hang loose'?",
            image: "✋",
            description: "Island hand gesture",
            options: [
                { text: "Thumbs up", points: 0, feedback: "Nah brah, das mainland!" },
                { text: "Peace sign", points: 0, feedback: "Wrong decade!" },
                { text: "Shaka (thumb and pinky out)", points: 10, feedback: "Chee hoo! Das da one!" },
                { text: "Wave", points: 2, feedback: "Close, but not quite!" }
            ]
        },
        {
            id: 14,
            question: "Someone says 'Shoots den'. What they mean?",
            image: "💬",
            description: "Common response",
            options: [
                { text: "They're shooting something", points: 0, feedback: "Brah, no be literal!" },
                { text: "Okay, sounds good, let's do it", points: 10, feedback: "Rajah! You get 'em!" },
                { text: "They're angry", points: 0, feedback: "Nah, opposite actually!" },
                { text: "Goodbye", points: 3, feedback: "Can mean dat too, but not quite!" }
            ]
        },
        {
            id: 15,
            question: "What's 'broke da mouth'?",
            image: "😋",
            description: "Food description",
            options: [
                { text: "Food that's too hard to chew", points: 0, feedback: "Nah brah!" },
                { text: "Really delicious food", points: 10, feedback: "Das right! So ono!" },
                { text: "Spicy food", points: 2, feedback: "Not quite!" },
                { text: "Expensive food", points: 0, feedback: "Nothing to do wit' price!" }
            ]
        },
        {
            id: 16,
            question: "Where you go for chicken katsu?",
            image: "🍗",
            description: "Local favorite",
            options: [
                { text: "KFC", points: 0, feedback: "Auwe! Das not even close!" },
                { text: "L&L or local plate lunch place", points: 10, feedback: "Now we talking! Das da spot!" },
                { text: "Fancy Japanese restaurant", points: 3, feedback: "Can, but local style mo' bettah!" },
                { text: "Make 'em at home", points: 5, feedback: "Can do, but lunch wagon mo' easy!" }
            ]
        },
        {
            id: 17,
            question: "What does 'talk story' mean?",
            image: "🗣️",
            description: "Social activity",
            options: [
                { text: "Tell a fictional story", points: 0, feedback: "Nah, das not it!" },
                { text: "Chat, hang out, shoot the breeze", points: 10, feedback: "Exactly! Just talking wit' friends!" },
                { text: "Gossip", points: 3, feedback: "Can be, but usually just casual talk!" },
                { text: "Give a speech", points: 0, feedback: "Too formal brah!" }
            ]
        },
        {
            id: 18,
            question: "What's a 'calabash cousin'?",
            image: "👨‍👩‍👧‍👦",
            description: "Ohana concept",
            options: [
                { text: "Someone who likes calabash", points: 0, feedback: "Nah, nothing to do wit' da food!" },
                { text: "Close family friend, like family", points: 10, feedback: "Das right! Ohana!" },
                { text: "Your actual cousin", points: 3, feedback: "Can be, but usually not blood!" },
                { text: "A type of calabash", points: 0, feedback: "Brah, das people not food!" }
            ]
        },
        {
            id: 19,
            question: "Someone says 'Chee hoo!' What's happening?",
            image: "🎉",
            description: "Expression of emotion",
            options: [
                { text: "They're confused", points: 0, feedback: "Nope!" },
                { text: "They're excited/stoked!", points: 10, feedback: "Chee hoo! You got 'em!" },
                { text: "They're calling someone", points: 0, feedback: "Nah brah!" },
                { text: "They sneezed", points: 0, feedback: "Das 'achoo' not 'chee hoo'!" }
            ]
        },
        {
            id: 20,
            question: "What you bring to a potluck?",
            image: "🍲",
            description: "Local gathering",
            options: [
                { text: "Store-bought cookies", points: 2, feedback: "Can, but kinda weak!" },
                { text: "Your best dish, made with love", points: 10, feedback: "Das how! Sharing da aloha!" },
                { text: "Nothing, just show up", points: 0, feedback: "Brah! Das not how we do!" },
                { text: "Just drinks", points: 3, feedback: "Need food too brah!" }
            ]
        },
        {
            id: 21,
            question: "What's 'ono kine grindz'?",
            image: "🤤",
            description: "Food terminology",
            options: [
                { text: "Expensive food", points: 0, feedback: "Nah, nothing to do wit' price!" },
                { text: "Delicious food", points: 10, feedback: "Rajah! Broke da mouth!" },
                { text: "Spicy food", points: 0, feedback: "Not about da spice!" },
                { text: "Healthy food", points: 0, feedback: "Local food not always healthy brah!" }
            ]
        },
        {
            id: 22,
            question: "Someone cuts you off in traffic. What you do?",
            image: "🚙",
            description: "Road rage test",
            options: [
                { text: "Give shaka and let 'em go", points: 10, feedback: "Das da aloha way! No stress!" },
                { text: "Honk and yell", points: 0, feedback: "Nah brah, calm down!" },
                { text: "Chase them down", points: 0, feedback: "Auwe! Too much road rage!" },
                { text: "Post about it online", points: 0, feedback: "Nah, just let it go!" }
            ]
        },
        {
            id: 23,
            question: "What's 'mauka' and 'makai'?",
            image: "🏔️",
            description: "Directional terms",
            options: [
                { text: "Types of fish", points: 0, feedback: "Nah brah, das directions!" },
                { text: "Towards mountain and towards ocean", points: 10, feedback: "Das it! Local directions!" },
                { text: "North and South", points: 0, feedback: "We no use dat here!" },
                { text: "Left and Right", points: 0, feedback: "Too mainland kine!" }
            ]
        },
        {
            id: 24,
            question: "What time is 'Hawaiian time'?",
            image: "⏰",
            description: "Island scheduling",
            options: [
                { text: "Exactly on time", points: 0, feedback: "Nah brah, too rigid!" },
                { text: "15-30 minutes late is normal", points: 10, feedback: "Now you get it! No stress!" },
                { text: "Always early", points: 0, feedback: "Too eager brah!" },
                { text: "Whatever time you feel like", points: 5, feedback: "Close, but still kinda rude!" }
            ]
        }
    ],

    // Results based on total score (5 questions, max 50 points)
    results: [
        {
            minScore: 0,
            maxScore: 15,
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
            minScore: 16,
            maxScore: 30,
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
            minScore: 31,
            maxScore: 42,
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
            minScore: 43,
            maxScore: 50,
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
