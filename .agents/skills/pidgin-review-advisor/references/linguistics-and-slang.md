# Hawaiian Pidgin Linguistics, Pronunciation & Slang Taxonomy Guide

This reference provides the linguistic principles, orthographic rules, phonetic mapping conventions, and slang taxonomies used in **ChokePidgin / iSpeakPidgin**.

---

## 1. Hawaiian Pidgin (Hawaiʻi Creole) Grammar & Syntax

Hawaiian Pidgin is a distinct English-lexifier creole language with its own systematic grammatical rules influenced by Hawaiian, Cantonese, Portuguese, Japanese, Ilocano, and Tagalog.

### Core Grammatical Patterns
1. **Preverbal Tense-Aspect Markers**:
   - **`stay`** (Progressive / Locative): Marks ongoing action or physical location.
     - *Example*: "He stay eat" (He is eating right now), "I stay Haleʻiwa" (I am in Haleiwa).
   - **`wen`** (Past Tense): Marks completed past actions.
     - *Example*: "I wen go store" (I went to the store).
   - **`go` / `gon`** (Future / Intentional): Marks future action.
     - *Example*: "We go beach" (Let's go to the beach / We are going to the beach).
   - **`like`** (Desire / Immediate Future):
     - *Example*: "He like fight" (He wants to fight / He is looking for a fight).

2. **Negation**:
   - **`nevah`** (Past Negation): Replaces *did not*.
     - *Example*: "I nevah see dat" (I didn't see that).
   - **`no`** (Present / Imperative Negation): Replaces *do not* or *is not*.
     - *Example*: "No make body" (Don't act foolish / Don't show off).
   - **`no can`** (Impossibility): Replaces *cannot*.
     - *Example*: "No can, brah" (I can't do that / That's not possible).

3. **Copula Deletion**:
   - Predicate adjectives do not require the verb *to be*.
     - *Example*: "Da food ono" (The food is delicious), "He lolo" (He is crazy/stupid).

4. **Question Tags & Intonation**:
   - Tags like *yeah?*, *alreadah?*, *right?*, or rising intonation at the end of statements indicate questions.
     - *Example*: "You pau, yeah?" (Are you finished?), "He wen go alreadah?" (Did he leave already?).

---

## 2. Orthography & Pronunciation Rules

### Hawaiian Loanwords & Diacritics
- **ʻOkina** (`ʻ` or `'`): Glottal stop. Essential for words like *Hawaiʻi*, *Lanaʻi*, *kaʻa*, *manaʻo*.
- **Kahakō** (macron like `ā`, `ē`, `ī`, `ō`, `ū`): Lengthens vowel sounds.
- **Phonetic Conversion for ElevenLabs TTS**:
  Standard TTS engines mispronounce Hawaiian and Pidgin terms. The global phonetic map translates written terms into phonetic strings before sending to ElevenLabs:

| Written Word | ElevenLabs Phonetic Replacement | Meaning |
| :--- | :--- | :--- |
| `da kine` | `dah kyne` | The thing / whatchamacallit |
| `kine` | `kyne` | Kind / type |
| `pau` | `pow` | Finished / done |
| `pau hana` | `pow hah-nah` | After work / happy hour |
| `mauka` | `mow-kah` | Toward the mountains |
| `makai` | `mah-kye` | Toward the ocean |
| `ono` | `oh-no` | Delicious |
| `wahine` | `vah-hee-nay` | Woman / female |
| `kane` | `kah-nay` | Man / male |
| `keiki` | `kay-kee` | Child / kids |
| `wikiwiki` | `vee-kee-vee-kee` | Fast / hurry |
| `choke` | `choke` | A lot / plenty |
| `shaka` | `shah-kah` | Hand greeting / good vibes |
| `chee-hoo` | `chee-hooo` | Local celebratory yell |
| `buss up` | `bus up` | Broken / ruined / wasted |

---

## 3. Slang Taxonomies & Expansion Candidates

When recommending new words, slang, or phrases to add to the Supabase dictionary and phrase collections, draw from these rich cultural categories:

### A. Surf & Ocean Slang
- **`heavies`**: Huge, dangerous surf or intimidating waves.
- **`in da pit`**: Deep inside the tube/barrel of a wave.
- **`junk surf`**: Sloppy, choppy, or bad ocean conditions.
- **`point break`**: A surf spot where waves hit a headland or reef point.
- **`shred da gnar`**: Surfing with intense skill and speed.
- **`closeout`**: A wave breaking all at once with no rideable shoulder.

### B. Food, Cooking & Grindz
- **`manapua`**: Steamed or baked Chinese pork bun (char siu bao).
- **`loco moco`**: Classic plate lunch of white rice, hamburger patty, fried egg, and brown gravy.
- **`kau kau`**: Food / meal / to eat.
- **`broke da mouth`**: Exceptionally delicious food.
- **`kanak attack`**: The deep post-meal food coma.
- **`li hing mui`**: Dried, salty-sweet plum powder used on fruit, gummy bears, and shaved ice.
- **`pupu platter`**: An assortment of appetizers.

### C. Everyday Local Banter & Social Expressions
- **`no make body`**: Don't show off; don't act pretentious.
- **`small kine`**: A little bit; slightly; no big deal.
- **`fakafied`**: Fake, artificial, or pretending to be local when not.
- **`solid bro`**: Dependable, trustworthy, top quality.
- **`if can, can; if no can, no can`**: If it works out, great; if not, so be it (ultimate local philosophy).
- **`stink eye`**: A stern, disapproving glare or dirty look.
- **`chicken skin`**: Goosebumps from awe, emotion, or supernatural stories.
- **`talk story`**: Relaxed, informal conversation catching up with friends.
- **`rajah dat`**: Roger that / understood / agreement.

---

## 4. Nuance & Tone Profiles for AI Integration

When configuring or reviewing Gemini prompts (`routes/ai.js`), ensure translations and tutor dialogues reflect authentic tone profiles:

1. **Light / Tourist Friendly**:
   - Mild slang, gentle pronunciation hints, easy-to-read English translations.
   - Ideal for visitors learning basic manners and ordering plate lunches.
2. **Standard Local**:
   - Everyday conversational Pidgin with natural sentence rhythm, moderate slang (`shoots`, `da kine`, `brah`, `stay pau`).
3. **Heavy / Broad Pidgin**:
   - Thick creole structure, full preverbal markers (`wen`, `stay`, `nevah`), idiomatic contractions (`whaddsdascoops`, `wassamattayou`), deep local references.
