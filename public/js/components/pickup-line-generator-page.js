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

    // Store cringe activities data
    let cringeActivities = [];

    // Populate 808 Mode Cringe Generator dropdowns
    async function populateHowzitDropdowns() {
        console.log('📍 Setting up 808 Mode Cringe Generator...');

        try {
            // Fetch activities from the new cringe API
            const response = await fetch('/api/cringe/activities');
            if (!response.ok) throw new Error('Failed to load activities');
            const data = await response.json();
            cringeActivities = data.activities || [];

            console.log('✅ Loaded cringe activities:', cringeActivities.length);

            // Populate activity dropdown
            const activitySelect = document.getElementById('activity-select');
            if (activitySelect && cringeActivities.length > 0) {
                activitySelect.innerHTML = '<option value="">Choose one activity...</option>' +
                    cringeActivities.map(a =>
                        `<option value="${a.activity_key}" data-emoji="${a.emoji}">${a.emoji} ${a.activity_name}</option>`
                    ).join('');

                // Add change listener to populate locations
                activitySelect.addEventListener('change', updateLocationOptions);
            }
        } catch (error) {
            console.error('❌ Failed to load cringe activities:', error);
            const activitySelect = document.getElementById('activity-select');
            if (activitySelect) {
                activitySelect.innerHTML = '<option value="">Failed to load activities</option>';
            }
        }
    }

    // Update location dropdown when activity changes
    function updateLocationOptions() {
        const activitySelect = document.getElementById('activity-select');
        const locationSelect = document.getElementById('location-select');

        if (!activitySelect || !locationSelect) return;

        const selectedKey = activitySelect.value;

        if (!selectedKey) {
            locationSelect.innerHTML = '<option value="">Select activity first...</option>';
            locationSelect.disabled = true;
            return;
        }

        // Find the selected activity
        const activity = cringeActivities.find(a => a.activity_key === selectedKey);

        if (activity && activity.locations && activity.locations.length > 0) {
            locationSelect.innerHTML = '<option value="">Choose one spot...</option>' +
                activity.locations.map(loc =>
                    `<option value="${loc.location_key}">${loc.location_name}</option>`
                ).join('');
            locationSelect.disabled = false;
            console.log(`✅ Loaded ${activity.locations.length} locations for ${selectedKey}`);
        } else {
            locationSelect.innerHTML = '<option value="">No locations found</option>';
            locationSelect.disabled = true;
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

    // Generate 808 Mode Cringe pickup line using database-driven API
    async function generateHowzitGrindz() {
        const gender = document.getElementById('gender-select')?.value || 'wahine';
        const locationKey = document.getElementById('location-select')?.value;

        // Validate selections
        if (!locationKey) {
            throw new Error('Please select an activity and location');
        }

        console.log('📍 Generating cringe line for:', { gender, locationKey });

        // Call the cringe generator API
        const response = await fetch(`/api/cringe/generate?gender=${gender}&location_key=${locationKey}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Cringe line generated:', data);

        // The API returns pickup_line and components
        const fullLine = data.pickup_line;
        const components = data.components;

        return {
            pidgin: fullLine,
            pronunciation: fullLine, // Could add pronunciation later
            english: `A cringey local pickup line about ${components.location}`,
            aiGenerated: false,
            type: 'howzit-grindz',
            culturalNote: `This line references ${components.location}, a beloved local spot in Hawaii.`
        };
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
