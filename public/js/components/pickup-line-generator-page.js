// Pickup Line Generator Page Logic
(function() {
    'use strict';

    // State
    let generator;
    let selectedContext = 'romantic';
    let generationMode = 'random'; // 'random' or 'ai'
    let generationCount = 0;
    let currentLine = null;

    // Initialize generator when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize the generator
        if (typeof PickupLineGenerator !== 'undefined' && typeof pickupLineComponents !== 'undefined') {
            generator = new PickupLineGenerator(pickupLineComponents);
            console.log('✅ Pickup Line Generator initialized');
        } else {
            console.error('❌ Generator dependencies not loaded');
            showError('Failed to load generator. Please refresh the page.');
            return;
        }

        // Setup event listeners
        setupEventListeners();
    });

    function setupEventListeners() {
        // Context buttons
        document.querySelectorAll('.context-btn[data-context]').forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active from all context buttons
                document.querySelectorAll('.context-btn[data-context]').forEach(b => {
                    b.classList.remove('active');
                });
                // Add active to clicked button
                this.classList.add('active');
                selectedContext = this.getAttribute('data-context');
            });
        });

        // Mode buttons
        document.getElementById('mode-random')?.addEventListener('click', function() {
            setGenerationMode('random');
        });

        document.getElementById('mode-howzit')?.addEventListener('click', function() {
            setGenerationMode('howzit');
        });

        document.getElementById('mode-ai')?.addEventListener('click', function() {
            setGenerationMode('ai');
        });

        // Populate 808 Mode dropdowns
        populateHowzitDropdowns();

        // Generate button
        document.getElementById('generate-btn')?.addEventListener('click', generatePickupLine);

        // Regenerate button
        document.getElementById('regenerate-btn')?.addEventListener('click', generatePickupLine);

        // Copy button
        document.getElementById('copy-btn')?.addEventListener('click', copyToClipboard);

        // Share button
        document.getElementById('share-btn')?.addEventListener('click', sharePickupLine);
    }

    function setGenerationMode(mode) {
        generationMode = mode;

        // Update button states
        const randomBtn = document.getElementById('mode-random');
        const howzitBtn = document.getElementById('mode-howzit');
        const aiBtn = document.getElementById('mode-ai');
        const howzitOptions = document.getElementById('howzit-options');

        // Remove active from all
        randomBtn?.classList.remove('active');
        howzitBtn?.classList.remove('active');
        aiBtn?.classList.remove('active');

        // Add active to selected mode
        if (mode === 'random') {
            randomBtn?.classList.add('active');
            howzitOptions?.classList.add('hidden');
        } else if (mode === 'howzit') {
            howzitBtn?.classList.add('active');
            howzitOptions?.classList.remove('hidden');
        } else if (mode === 'ai') {
            aiBtn?.classList.add('active');
            howzitOptions?.classList.add('hidden');
        }
    }

    // Populate 808 Mode dropdowns
    function populateHowzitDropdowns() {
        if (typeof pickupLineComponents === 'undefined') {
            console.error('❌ pickupLineComponents not loaded');
            return;
        }

        const grindzSelect = document.getElementById('grindz-select');
        const landmarkSelect = document.getElementById('landmark-select');
        const trailSelect = document.getElementById('trail-select');

        console.log('📍 Populating 808 Mode dropdowns...');
        console.log('Places to eat:', pickupLineComponents.placesToEat?.length);
        console.log('Landmarks:', pickupLineComponents.landmarks?.length);
        console.log('Trails:', pickupLineComponents.hikingTrails?.length);

        // Populate places to eat
        if (grindzSelect && pickupLineComponents.placesToEat) {
            pickupLineComponents.placesToEat.forEach(place => {
                const option = document.createElement('option');
                option.value = place.name;
                option.textContent = `${place.name} - ${place.description}`;
                grindzSelect.appendChild(option);
            });
            console.log('✅ Populated grindz dropdown with', pickupLineComponents.placesToEat.length, 'options');
        } else {
            console.error('❌ Could not populate grindz dropdown');
        }

        // Populate landmarks
        if (landmarkSelect && pickupLineComponents.landmarks) {
            pickupLineComponents.landmarks.forEach(landmark => {
                const option = document.createElement('option');
                option.value = landmark.name;
                option.textContent = `${landmark.name} - ${landmark.description}`;
                landmarkSelect.appendChild(option);
            });
            console.log('✅ Populated landmarks dropdown with', pickupLineComponents.landmarks.length, 'options');
        } else {
            console.error('❌ Could not populate landmarks dropdown');
        }

        // Populate trails
        if (trailSelect && pickupLineComponents.hikingTrails) {
            pickupLineComponents.hikingTrails.forEach(trail => {
                const option = document.createElement('option');
                option.value = trail.name;
                option.textContent = `${trail.name} - ${trail.description}`;
                trailSelect.appendChild(option);
            });
            console.log('✅ Populated trails dropdown with', pickupLineComponents.hikingTrails.length, 'options');
        } else {
            console.error('❌ Could not populate trails dropdown');
        }
    }

    async function generatePickupLine() {
        const generateBtn = document.getElementById('generate-btn');
        const loadingState = document.getElementById('loading-state');
        const resultContainer = document.getElementById('result-container');

        // Disable button and show loading
        if (generateBtn) generateBtn.disabled = true;
        loadingState?.classList.remove('hidden');
        resultContainer?.classList.add('hidden');

        try {
            let line;

            if (generationMode === 'howzit') {
                // 808 Mode - Gemini AI generation with context
                line = await generateHowzitGrindz();
            } else if (generationMode === 'ai') {
                // AI generation
                line = await generator.generateWithAI(selectedContext);
            } else {
                // Random component-based generation
                line = generator.generate();
            }

            currentLine = line;
            displayResult(line);
            generationCount++;
            updateGenerationCount();

        } catch (error) {
            console.error('Generation error:', error);
            showError('Failed to generate pickup line. Please try again.');
        } finally {
            // Re-enable button and hide loading
            if (generateBtn) generateBtn.disabled = false;
            loadingState?.classList.add('hidden');
        }
    }

    // Generate 808 Mode pickup line using Gemini API
    async function generateHowzitGrindz() {
        const gender = document.getElementById('gender-select')?.value || 'wahine';
        const grindz = document.getElementById('grindz-select')?.value;
        const landmark = document.getElementById('landmark-select')?.value;
        const trail = document.getElementById('trail-select')?.value;

        // Validate selections
        if (!grindz && !landmark && !trail) {
            throw new Error('Please select at least one option (grindz, landmark, or trail)');
        }

        // Get the pretty phrase for this gender
        const prettyPhrases = pickupLineComponents.prettyPhrases[gender];
        const randomPretty = prettyPhrases[Math.floor(Math.random() * prettyPhrases.length)];

        // Build the prompt for Gemini
        const prompt = buildHowzitPrompt(gender, grindz, landmark, trail, randomPretty);

        // Call Gemini API (placeholder - needs implementation)
        const geminiResponse = await callGeminiAPI(prompt);

        return {
            pidgin: geminiResponse.pidgin,
            pronunciation: geminiResponse.pronunciation || geminiResponse.pidgin,
            english: geminiResponse.english,
            aiGenerated: true,
            type: 'howzit-grindz'
        };
    }

    // Build prompt for Gemini API
    function buildHowzitPrompt(gender, grindz, landmark, trail, prettyPhrase) {
        const genderLabel = gender === 'wahine' ? 'Wahine (Female)' : 'Kāne (Male)';
        const genderTerm = gender === 'wahine' ? 'wahine' : 'kāne';
        const contexts = [];

        if (grindz) contexts.push(`food spot: ${grindz}`);
        if (landmark) contexts.push(`landmark: ${landmark}`);
        if (trail) contexts.push(`hiking trail: ${trail}`);

        return `You are a Hawaiian Pidgin pickup line generator. Create one funny, complimentary pickup line to say TO a ${genderLabel} using authentic Hawaiian Pidgin.

REQUIREMENTS:
1. Start with a Pidgin greeting (Howzit, Ho Brah, Hey Sistah, etc.)
2. Include this compliment: "${prettyPhrase}"
3. Incorporate these contexts naturally: ${contexts.join(', ')}
4. Use Hawaiian Pidgin words like: 'ono (delicious), pau (finished), akamai (smart), choke (a lot), mo' bettah (better), shoots (okay), bumbai (later), grindz (food), holo holo (cruise around)
5. End with a question or suggestion (the "ask")
6. Keep it fun, respectful, and culturally authentic

Return ONLY a JSON object with this exact format:
{
  "pidgin": "the pickup line in Hawaiian Pidgin",
  "pronunciation": "how to pronounce it (use caps for stressed syllables)",
  "english": "English translation"
}

Example for a Wahine (Female):
{
  "pidgin": "Howzit wahine! You so pretty, you make dis garlic shrimp look junk. Like go holo holo down Pali Highway and grab one coconut? Shoots!",
  "pronunciation": "HOW-zit wah-HEE-neh! You so PRET-tee, you make DIS GAR-lic shrimp look JUNK. Like go HO-lo HO-lo down PAH-lee HIGH-way and grab one CO-co-nut? SHOOTS!",
  "english": "Hey woman! You're so pretty, you make this garlic shrimp look bad. Want to drive down Pali Highway and get a coconut? Okay!"
}

Example for a Kāne (Male):
{
  "pidgin": "Ho brah! You so handsome, even after climbing Koko Head you still look mo' bettah than da view. Like go get some broke da mouth grindz?",
  "pronunciation": "HO BRAH! You so HAND-sum, even AF-tah CLIMB-ing KO-ko HEAD you still look MO BET-tah than dah VIEW. Like go get some BROKE dah MOUTH GRINDZ?",
  "english": "Wow man! You're so handsome, even after climbing Koko Head stairs you still look better than the view. Want to get some delicious food?"
}`;
    }

    // Call Gemini API (placeholder - needs actual API implementation)
    async function callGeminiAPI(prompt) {
        console.log('📝 Gemini API Prompt:', prompt);

        // TODO: Implement actual Gemini API call
        // For now, return a sample response
        const samples = [
            {
                pidgin: "Howzit wahine! You so pretty, you make Zippy's chili look bland. Like go holo holo to Diamond Head and watch da sunset? Shoots!",
                pronunciation: "HOW-zit wah-HEE-neh! You so PRET-tee, you make ZIP-pee's CHILI look BLAND. Like go HO-lo HO-lo to DYE-mond HEAD and watch dah SUN-set? SHOOTS!",
                english: "Hey woman! You're so beautiful, you make Zippy's chili look bland. Want to drive to Diamond Head and watch the sunset? Okay!"
            },
            {
                pidgin: "Ho brah! You look akamai and fine kine. Even after climbing Koko Head, you still look mo' bettah than da view. Like go get some broke da mouth grindz?",
                pronunciation: "HO BRAH! You look ah-kah-MY and FINE KYNE. Even AF-tah CLIMB-ing KO-ko HEAD, you still look MO BET-tah than dah VIEW. Like go get some BROKE dah MOUTH GRINDZ?",
                english: "Wow man! You look smart and good. Even after climbing Koko Head stairs, you still look better than the view. Want to get some delicious food?"
            }
        ];

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        return samples[Math.floor(Math.random() * samples.length)];
    }

    function displayResult(line) {
        const resultContainer = document.getElementById('result-container');
        const resultPidgin = document.getElementById('result-pidgin');
        const resultPronunciation = document.getElementById('result-pronunciation');
        const resultEnglish = document.getElementById('result-english');
        const resultBadge = document.getElementById('result-badge');
        const culturalNote = document.getElementById('cultural-note');
        const culturalNoteText = document.getElementById('cultural-note-text');

        // Set content
        if (resultPidgin) resultPidgin.textContent = `"${line.pidgin}"`;
        if (resultPronunciation) resultPronunciation.textContent = line.pronunciation || line.pidgin;
        if (resultEnglish) resultEnglish.textContent = line.english;

        // Set badge
        if (resultBadge) {
            if (line.type === 'howzit-grindz') {
                resultBadge.textContent = '📍 808 Mode';
                resultBadge.className = 'badge badge-ai';
            } else if (line.aiGenerated || line.type === 'ai-generated') {
                resultBadge.textContent = '🤖 AI Generated';
                resultBadge.className = 'badge badge-ai';
            } else {
                resultBadge.textContent = '🎲 Random Mix';
                resultBadge.className = 'badge badge-random';
            }
        }

        // Show cultural note if available
        if (line.culturalNote && culturalNote && culturalNoteText) {
            culturalNoteText.textContent = line.culturalNote;
            culturalNote.classList.remove('hidden');
        } else if (culturalNote) {
            culturalNote.classList.add('hidden');
        }

        // Show result with animation
        if (resultContainer) {
            resultContainer.classList.remove('hidden');
            const resultCard = resultContainer.querySelector('.result-card');
            if (resultCard) {
                resultCard.classList.remove('show');
                // Trigger reflow
                void resultCard.offsetWidth;
                resultCard.classList.add('show');
            }
        }

        // Scroll to result
        resultContainer?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function copyToClipboard() {
        if (!currentLine) return;

        const text = `${currentLine.pidgin}\n(${currentLine.pronunciation})\n\n${currentLine.english}\n\nFrom ChokePidgin.com - Hawaiian Pidgin Pickup Line Generator 💕`;

        navigator.clipboard.writeText(text).then(() => {
            showNotification('✓ Copied to clipboard!');
        }).catch(err => {
            console.error('Copy error:', err);
            showNotification('Failed to copy', 'error');
        });
    }

    async function sharePickupLine() {
        if (!currentLine) return;

        const shareText = `${currentLine.pidgin}\n(${currentLine.pronunciation})\n\n${currentLine.english}\n\nFrom ChokePidgin.com 💕`;
        const shareUrl = 'https://chokepidgin.com/pickup-line-generator.html';

        // Check if Web Share API is available
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Hawaiian Pidgin Pickup Line',
                    text: shareText,
                    url: shareUrl
                });
            } catch (err) {
                // User cancelled or error occurred
                if (err.name !== 'AbortError') {
                    console.error('Error sharing:', err);
                    copyToClipboard(); // Fallback to copy
                }
            }
        } else {
            // Fallback: copy to clipboard
            copyToClipboard();
        }
    }

    function updateGenerationCount() {
        const countElement = document.getElementById('generation-count');
        if (countElement) {
            countElement.textContent = generationCount;
        }
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.textContent = message;

        const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
        notification.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-300`;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);

        // Remove after 2 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    function showError(message) {
        const resultContainer = document.getElementById('result-container');
        const loadingState = document.getElementById('loading-state');

        if (loadingState) loadingState.classList.add('hidden');

        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="bg-red-50 border-2 border-red-300 rounded-2xl p-6 text-center">
                    <p class="text-red-700 text-lg font-semibold mb-2">⚠️ Oops!</p>
                    <p class="text-red-600">${message}</p>
                </div>
            `;
            resultContainer.classList.remove('hidden');
        }
    }

})();
