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
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            // Load pickup line components from Supabase API
            const data = await window.supabaseAPI.loadPickupLineComponents();
            const components = data.components;

            if (!components) {
                throw new Error('No components available');
            }

            // Store components globally for other functions
            window.pickupLineComponents = components;

            // Initialize the generator
            if (typeof PickupLineGenerator !== 'undefined') {
                generator = new PickupLineGenerator(components);
                console.log('✅ Pickup Line Generator initialized with Supabase data');
            } else {
                throw new Error('PickupLineGenerator class not loaded');
            }

            // Setup event listeners
            setupEventListeners();
        } catch (error) {
            console.error('❌ Generator initialization error:', error);
            showError('Failed to load generator. Please refresh the page.');
        }
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

        // Speak button
        document.getElementById('speak-btn')?.addEventListener('click', speakPickupLine);
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

    // Populate 808 Mode searchable dropdowns with custom search
    function populateHowzitDropdowns() {
        if (typeof pickupLineComponents === 'undefined') {
            console.error('❌ pickupLineComponents not loaded');
            return;
        }

        console.log('📍 Setting up 808 Mode searchable dropdowns...');
        console.log('Places to eat:', pickupLineComponents.placesToEat?.length);
        console.log('Landmarks:', pickupLineComponents.landmarks?.length);
        console.log('Trails:', pickupLineComponents.hikingTrails?.length);

        // Setup grindz dropdown
        setupSearchableDropdown(
            'grindz-input',
            'grindz-results',
            'grindz-random',
            pickupLineComponents.placesToEat
        );

        // Setup landmarks dropdown
        setupSearchableDropdown(
            'landmark-input',
            'landmark-results',
            'landmark-random',
            pickupLineComponents.landmarks
        );

        // Setup trails dropdown
        setupSearchableDropdown(
            'trail-input',
            'trail-results',
            'trail-random',
            pickupLineComponents.hikingTrails
        );
    }

    // Setup individual searchable dropdown with fuzzy search
    function setupSearchableDropdown(inputId, resultsId, randomBtnId, dataArray) {
        const input = document.getElementById(inputId);
        const resultsContainer = document.getElementById(resultsId);
        const randomBtn = document.getElementById(randomBtnId);

        if (!input || !resultsContainer || !randomBtn || !dataArray) {
            console.error(`❌ Could not setup dropdown: ${inputId}`);
            return;
        }

        // Function to render dropdown results
        function renderResults(items) {
            if (items.length === 0) {
                resultsContainer.innerHTML = '<div class="px-4 py-2 text-gray-500 text-sm">No results found</div>';
            } else {
                resultsContainer.innerHTML = items.map(item => `
                    <div class="dropdown-item px-4 py-2 hover:bg-orange-50 cursor-pointer border-b border-orange-100 last:border-b-0" data-value="${item.name}">
                        <div class="font-semibold text-gray-800">${item.name}</div>
                        <div class="text-xs text-gray-600">${item.description}</div>
                    </div>
                `).join('');
            }
            resultsContainer.classList.remove('hidden');
        }

        // Handle clicks on dropdown items using event delegation
        resultsContainer.addEventListener('click', function(e) {
            const item = e.target.closest('.dropdown-item');
            if (item && item.dataset.value) {
                input.value = item.dataset.value;
                resultsContainer.classList.add('hidden');
            }
        });

        // Search on input
        input.addEventListener('input', function() {
            const query = this.value.trim().toLowerCase();

            if (query.length === 0) {
                resultsContainer.classList.add('hidden');
                return;
            }

            // Filter results
            const filtered = dataArray.filter(item => {
                const nameMatch = item.name.toLowerCase().includes(query);
                const descMatch = item.description.toLowerCase().includes(query);
                return nameMatch || descMatch;
            });

            renderResults(filtered);
        });

        // Show all options on focus
        input.addEventListener('focus', function() {
            renderResults(dataArray);
        });

        // Random button handler
        randomBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const randomItem = dataArray[Math.floor(Math.random() * dataArray.length)];
            input.value = randomItem.name;
            resultsContainer.classList.add('hidden');

            // Visual feedback
            this.innerHTML = '✨';
            setTimeout(() => {
                this.innerHTML = '🎲';
            }, 500);
        });

        // Hide results when clicking outside (but not on the random button)
        document.addEventListener('click', function(e) {
            if (!input.contains(e.target) &&
                !resultsContainer.contains(e.target) &&
                !randomBtn.contains(e.target)) {
                resultsContainer.classList.add('hidden');
            }
        });

        console.log(`✅ Setup searchable dropdown: ${inputId} with ${dataArray.length} options`);
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
        const grindz = document.getElementById('grindz-input')?.value;
        const landmark = document.getElementById('landmark-input')?.value;
        const trail = document.getElementById('trail-input')?.value;

        // Validate selections
        if (!grindz && !landmark && !trail) {
            throw new Error('Please select at least one option (grindz, landmark, or trail)');
        }

        // Get the pretty phrase for this gender
        const prettyPhrases = pickupLineComponents.prettyPhrases[gender];
        const randomPretty = prettyPhrases[Math.floor(Math.random() * prettyPhrases.length)];

        // Call 808 Mode API endpoint
        const geminiResponse = await callGeminiAPI(gender, grindz, landmark, trail, randomPretty, selectedContext);

        return {
            pidgin: geminiResponse.pidgin,
            pronunciation: geminiResponse.pronunciation || geminiResponse.pidgin,
            english: geminiResponse.english,
            aiGenerated: true,
            type: 'howzit-grindz'
        };
    }

    // Call 808 Mode API endpoint (uses Gemini 2.5 Flash Lite server-side)
    async function callGeminiAPI(gender, grindz, landmark, trail, prettyPhrase, style) {
        console.log('📍 Calling 808 Mode API...');

        try {
            const response = await fetch('/api/generate-808-pickup-line', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gender,
                    style,
                    grindz,
                    landmark,
                    trail,
                    prettyPhrase
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `API error: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ 808 Mode API Response:', data);

            return {
                pidgin: data.pidgin,
                pronunciation: data.pronunciation,
                english: data.english
            };

        } catch (error) {
            console.error('❌ 808 Mode API Error:', error);
            console.warn('⚠️ Falling back to sample responses');
            return getFallbackSample(style);
        }
    }

    // Fallback samples when API is unavailable
    function getFallbackSample(prompt) {
        const samples = {
            romantic: [
                {
                    pidgin: "Howzit wahine! You so pretty, you make da sunset at Lanikai look dull. My heart stay racing mo' fast den climbing Diamond Head. Can I holo holo wit you?",
                    pronunciation: "HOW-zit wah-HEE-neh! You so PRET-tee, you make dah SUN-set at lah-nee-KAI look DULL. My HEART stay RAY-sing MO fast den CLIMB-ing DYE-mond HEAD. Can I HO-lo HO-lo wit you?",
                    english: "Hey woman! You're so beautiful, you make the sunset at Lanikai look dull. My heart is racing faster than climbing Diamond Head. Can I spend time with you?"
                }
            ],
            funny: [
                {
                    pidgin: "Ho brah! You so handsome, even Koko Head Stairs stay jealous of your steps! You make Leonard's malasadas look junk. Shoots, like go get one shave ice?",
                    pronunciation: "HO BRAH! You so HAND-sum, even KO-ko HEAD STAIRS stay JEH-lus of your STEPS! You make LEH-nards mah-lah-SAH-das look JUNK. SHOOTS, like go get one SHAVE ICE?",
                    english: "Wow man! You're so handsome, even Koko Head Stairs is jealous of your steps! You make Leonard's malasadas look bad. Okay, want to get shave ice?"
                }
            ],
            sweet: [
                {
                    pidgin: "Sistah, you stay shine bright like da lights at Ala Moana. You mo' sweet den Ted's haupia pie. Can take you holo holo to Waikiki bumbye?",
                    pronunciation: "SIS-tah, you stay SHINE bright like dah LIGHTS at AH-la moh-AH-nah. You MO sweet den TEDS how-PEE-ah PIE. Can take you HO-lo HO-lo to why-kee-KEE BUM-bye?",
                    english: "Sister, you shine bright like the lights at Ala Moana. You're sweeter than Ted's haupia pie. Can I take you to Waikiki later?"
                }
            ],
            bold: [
                {
                    pidgin: "Eh wahine! You da kine beautiful. I wen climb Olomana just fo impress you. Like go grind at Giovanni's den cruise da North Shore? I know you worth it.",
                    pronunciation: "EH wah-HEE-neh! You dah KYNE byoo-tee-FUL. I wen CLIMB oh-loh-MAH-nah just fo im-PRESS you. Like go GRIND at jee-oh-VAH-nees den CRUISE dah NORTH SHORE? I know you WORTH it.",
                    english: "Hey woman! You're the most beautiful. I climbed Olomana just to impress you. Want to eat at Giovanni's then cruise the North Shore? I know you're worth it."
                }
            ],
            classic: [
                {
                    pidgin: "Howzit beautiful! You get da kine smile dat stay mo' pretty den Manoa Falls. Like go grab some grindz at Rainbow Drive-In an talk story? Shoots, I buy.",
                    pronunciation: "HOW-zit BYOO-tee-ful! You get dah KYNE smile dat stay MO PRET-tee den mah-NOH-ah FALLS. Like go grab some GRINDZ at RAIN-bow DRIVE-in an TALK STOR-ee? SHOOTS, I BUY.",
                    english: "Hey beautiful! You have the kind of smile that's prettier than Manoa Falls. Want to grab food at Rainbow Drive-In and chat? Okay, I'll pay."
                }
            ]
        };

        // Try to determine style from prompt
        let style = 'romantic';
        if (prompt.includes('funny')) style = 'funny';
        else if (prompt.includes('sweet')) style = 'sweet';
        else if (prompt.includes('bold')) style = 'bold';
        else if (prompt.includes('classic')) style = 'classic';

        const styleSamples = samples[style] || samples.romantic;
        return styleSamples[Math.floor(Math.random() * styleSamples.length)];
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

    async function speakPickupLine() {
        if (!currentLine) return;

        const speakBtn = document.getElementById('speak-btn');

        try {
            // Update button to show loading state
            if (speakBtn) {
                speakBtn.disabled = true;
                speakBtn.innerHTML = '⏸️ Playing...';
            }

            // Use ElevenLabs speech if available, otherwise fallback to browser TTS
            if (typeof elevenLabsSpeech !== 'undefined' && elevenLabsSpeech.isSupported()) {
                await elevenLabsSpeech.speak(currentLine.pidgin, {
                    onSuccess: () => {
                        console.log('✅ Pickup line spoken successfully');
                    },
                    onError: (error) => {
                        console.error('Speech error:', error);
                        showNotification('Speech failed. Try again.', 'error');
                    }
                });
            } else if (typeof pidginSpeech !== 'undefined') {
                // Fallback to browser speech
                await pidginSpeech.speak(currentLine.pidgin);
            } else {
                showNotification('Speech not available', 'error');
            }

        } catch (error) {
            console.error('Error speaking pickup line:', error);
            showNotification('Failed to play audio', 'error');
        } finally {
            // Reset button
            if (speakBtn) {
                speakBtn.disabled = false;
                speakBtn.innerHTML = '🔊 Listen';
            }
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
