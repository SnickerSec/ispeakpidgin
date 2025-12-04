// Hawaiian Pidgin Pickup Line Generator
// Handles random generation and AI enhancement

class PickupLineGenerator {
    constructor(components) {
        this.components = components;
        this.generationHistory = [];
        this.maxHistorySize = 50; // Prevent repeats
    }

    // Get random element from array
    getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // Generate a component-based pickup line
    generateComponentLine() {
        const opener = this.getRandomElement(this.components.openers);
        const compliment = this.getRandomElement(this.components.compliments);
        const action = this.getRandomElement(this.components.actions);

        // Combine components
        const pidgin = `${opener.pidgin}, ${compliment.pidgin} ${action.pidgin}.`;
        const pronunciation = `${opener.pronunciation}, ${compliment.pronunciation} ${action.pronunciation}.`;

        // Create English translation by interpreting components
        const english = this.translateComponentsToEnglish(opener, compliment, action);

        return {
            pidgin,
            pronunciation,
            english,
            type: 'component-based',
            components: { opener, compliment, action }
        };
    }

    // Simple English translation for component-based lines
    translateComponentsToEnglish(opener, compliment, action) {
        // Basic translations
        const openerEng = opener.pidgin
            .replace(/Eh,? listen/i, 'Hey, listen')
            .replace(/Ho,? wow/i, 'Wow')
            .replace(/Check it/i, 'Check this out')
            .replace(/Brah,? fo real/i, 'Seriously')
            .replace(/Sistah,? check dis out/i, 'Hey, check this out')
            .replace(/No joke/i, 'Seriously')
            .replace(/Shoots,? I gotta tell you/i, 'I have to tell you')
            .replace(/Eh,? you know wat/i, 'You know what')
            .replace(/Ho brah/i, 'Wow')
            .replace(/Auwe/i, 'Wow')
            .replace(/Rajah dat/i, 'Listen')
            .replace(/Bumbye I tell you/i, 'I need to tell you');

        const complimentEng = compliment.pidgin
            .replace(/you stay look planny good/i, "you look really good")
            .replace(/you da kine person I like know/i, "you're the kind of person I want to know")
            .replace(/dat smile of yours/i, "that smile of yours")
            .replace(/you get da most beautiful eyes/i, "you have the most beautiful eyes")
            .replace(/you stay shine bright/i, "you shine bright")
            .replace(/you stay look bettah den shave ice/i, "you look better than shave ice")
            .replace(/your vibe stay so ono/i, "your vibe is so good")
            .replace(/da way you walk/i, "the way you walk")
            .replace(/you get dat aloha spirit/i, "you have that aloha spirit")
            .replace(/you stay glow like da sunset/i, "you glow like the sunset")
            .replace(/you more sweet den haupia/i, "you're sweeter than haupia")
            .replace(/you stay catch my eye/i, "you catch my eye");

        const actionEng = action.pidgin
            .replace(/get me all choke up/i, "gets me all choked up")
            .replace(/stay more sweet than shave ice/i, "is sweeter than shave ice")
            .replace(/make my slippah fly off/i, "makes my slippers fly off")
            .replace(/like da best kine plate lunch/i, "like the best kind of plate lunch")
            .replace(/make me like pau hana right now/i, "makes me want to finish work right now")
            .replace(/stay bettah den Waikiki sunset/i, "is better than a Waikiki sunset")
            .replace(/make me like grind all day/i, "makes me want to eat all day")
            .replace(/stay smoove like butter mochi/i, "is smooth like butter mochi")
            .replace(/make my heart stay race/i, "makes my heart race")
            .replace(/could neva get pau looking at you/i, "could never stop looking at you")
            .replace(/stay broke da mouth good/i, "is amazingly delicious")
            .replace(/like one fresh malasada/i, "like a fresh malasada");

        return `${openerEng}, ${complimentEng} ${actionEng}.`;
    }

    // Get a pre-made complete line
    generateCompleteLine() {
        return this.getRandomElement(this.components.completedLines);
    }

    // Generate any type (50% chance complete, 50% chance component)
    generate() {
        const useComplete = Math.random() < 0.5;

        let line;
        if (useComplete) {
            line = this.generateCompleteLine();
            line.type = 'complete';
        } else {
            line = this.generateComponentLine();
        }

        // Add to history to prevent immediate repeats
        this.generationHistory.push(line.pidgin);
        if (this.generationHistory.length > this.maxHistorySize) {
            this.generationHistory.shift();
        }

        return line;
    }

    // Generate with AI enhancement
    async generateWithAI(context = 'romantic') {
        try {
            const response = await fetch('/api/generate-pickup-line', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ context })
            });

            if (!response.ok) {
                throw new Error('AI generation failed');
            }

            const data = await response.json();
            return {
                pidgin: data.pidgin,
                pronunciation: data.pronunciation,
                english: data.english,
                type: 'ai-generated',
                aiGenerated: true
            };
        } catch (error) {
            console.error('AI generation error:', error);
            // Fallback to component-based generation
            return this.generate();
        }
    }

    // Enhance an existing line with AI
    async enhanceLine(baseLine) {
        try {
            const response = await fetch('/api/enhance-pickup-line', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pidgin: baseLine.pidgin,
                    english: baseLine.english
                })
            });

            if (!response.ok) {
                throw new Error('Enhancement failed');
            }

            const data = await response.json();
            return {
                ...baseLine,
                enhanced: true,
                enhancedVersion: data.enhanced,
                suggestions: data.suggestions
            };
        } catch (error) {
            console.error('Enhancement error:', error);
            return baseLine;
        }
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PickupLineGenerator;
}
