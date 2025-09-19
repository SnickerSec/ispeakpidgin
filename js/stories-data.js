// Hawaiian Pidgin Short Stories Database
const pidginStories = {
    'shave-ice': {
        title: 'Da Shave Ice Stand',
        preview: '"Eh brah, you like one shave ice or what?" Uncle Taro stay behind da counter...',
        content: `"Eh brah, you like one shave ice or what?" Uncle Taro stay behind da counter, his hands all purple from da grape syrup. "Today get special - li hing mui flavor."

I tell him, "Shoots, gimme da works den." He pile up da ice so high, look like one mini mountain. When I bite into 'em, da flavors just explode in my mouth.

"Dis is why I come here every day," I tell him. Uncle Taro just smile and say, "Das da magic, bruddah."`
    },

    'late-work': {
        title: 'Late for Work Again',
        preview: 'My alarm clock wen broke last night, so I wake up late again...',
        content: `My alarm clock wen broke last night, so I wake up late again. I jump in da shower, no time for breakfast, just grab one malasada from da kitchen. My boss already stay calling my phone three times.

"Eh sorry boss, traffic was crazy," I tell him when I finally reach work. He just shake his head. "Every week you get different excuse."

But he still let me slide because he know I work hard when I stay there.`
    },

    'fishing-trip': {
        title: 'Da Fishing Trip',
        preview: 'Me and my cousin wen wake up 4 AM for go fishing...',
        content: `Me and my cousin wen wake up 4 AM for go fishing. Da ocean stay so calm, like one mirror. "Dis going be one good day," he tell me while we throw da lines.

Two hours later, still nothing. "Maybe da fish all sleeping," I joke. Then WHAM! Something big grab my line. We both stay scrambling, trying not fall overboard.

Turn out was just one old boot. We laugh so hard, almost drop da cooler in da water.`
    },

    'graduation': {
        title: 'Graduation Day',
        preview: 'My keiki finally graduate high school today...',
        content: `My keiki finally graduate high school today. I stay so proud, I like cry but I trying act tough. She come up to me after da ceremony with her cap and gown, all smiling.

"Tanks for everything, Dad." Das when da tears start coming. "You da smart one in da family," I tell her. "Now you go college and show dem mainland kids how we do things Hawaii style."`
    },

    'bbq': {
        title: 'Da Neighborhood Barbecue',
        preview: 'Every Sunday, our street get together for one big barbecue...',
        content: `Every Sunday, our street get together for one big barbecue. Mrs. Nakamura bring her famous potato salad, Uncle Joe stay grilling da teriyaki chicken, and all da kids running around with da sprinklers on.

"Dis is what I love about living here," my wife tell me as we watch our neighbors all talking story. "Where else you can have dis kind community?"`
    },

    'traffic': {
        title: 'Stuck in Traffic',
        preview: 'I stay sitting in traffic for one hour already...',
        content: `I stay sitting in traffic for one hour already. Da radio guy keep saying "heavy traffic on da H-1," but das every day. Da car next to me get one guy playing ukulele while he waiting.

At least somebody making da best of it. I roll down my window and listen. He playing some old Hawaiian song my grandma used to sing. Makes da traffic not seem so bad.`
    },

    'store-run': {
        title: 'Da Store Run',
        preview: '"Eh, can you go store for me?" my mom ask...',
        content: `"Eh, can you go store for me?" my mom ask. "We need milk, bread, and... what else?" She hand me one list with ten more things on it.

At da store, I see my old classmate working da checkout. "Long time no see!" she tell me. We end up talking story for twenty minutes.

By da time I get home, da ice cream stay all melted, but was worth it for catch up with old friend.`
    },

    'first-day-school': {
        title: 'First Day School',
        preview: 'My little boy stay all nervous for his first day kindergarten...',
        content: `My little boy stay all nervous for his first day kindergarten. "What if da other kids no like me?" he ask.

I tell him, "Just be yourself, and share your snacks. Everybody like da kid who share snacks."

When I pick him up after school, he all excited. "Daddy, I made three new friends! And da teacher stay really nice!" See? I knew he going be fine.`
    },

    'surf-session': {
        title: 'Da Surf Session',
        preview: 'Da waves stay perfect today - clean, glassy, about four feet...',
        content: `Da waves stay perfect today - clean, glassy, about four feet. Me and my buddy paddle out to our favorite spot.

"Remember when we was groms and used to surf here every day?" he ask while we waiting for da next set. "Yeah, before we had jobs and responsibilities," I laugh.

But sitting out there in da lineup, watching da sun come up over da mountains, I feel like one kid again.`
    },

    'family-dinner': {
        title: 'Family Dinner',
        preview: 'Every Friday, my whole family come together at Grandma\'s house for dinner...',
        content: `Every Friday, my whole family come together at Grandma's house for dinner. She always cook way too much food - rice, chicken katsu, macaroni salad, haupia for dessert.

"Eat more," she keep telling everyone, even though we all already full. After dinner, da adults talk story on da porch while da kids play in da yard.

"Dis is what life stay all about," my uncle say, and everybody nod. He right, you know.`
    }
};

// Get all story IDs in order
const storyOrder = [
    'shave-ice', 'late-work', 'fishing-trip', 'graduation', 'bbq',
    'traffic', 'store-run', 'first-day-school', 'surf-session', 'family-dinner'
];

// Get stories for display (first 5 are shown initially)
function getInitialStories() {
    return storyOrder.slice(0, 5);
}

// Get remaining stories
function getRemainingStories() {
    return storyOrder.slice(5);
}

// Get story by ID
function getStoryById(storyId) {
    return pidginStories[storyId];
}