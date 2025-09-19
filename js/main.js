// Main JavaScript file for Pidgin Pal
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    initNavigation();
    initDailyPhrase();
    initTranslator();
    initLearningHub();
    initCommunity();
    initSmoothScrolling();
    initVoiceSettings();
});

// Navigation functionality
function initNavigation() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Close mobile menu when clicking a link
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }
}

// Daily phrase functionality
function initDailyPhrase() {
    // Ensure getDailyPhrase function is available
    if (typeof getDailyPhrase === 'undefined') {
        console.error('getDailyPhrase function not found');
        return;
    }

    const dailyPhrase = getDailyPhrase();

    const phrasePidgin = document.getElementById('phrase-pidgin');
    const phraseEnglish = document.getElementById('phrase-english');
    const phraseUsage = document.getElementById('phrase-usage');
    const speakBtn = document.getElementById('speak-phrase');

    if (phrasePidgin && dailyPhrase) {
        phrasePidgin.textContent = dailyPhrase.pidgin;
        phraseEnglish.textContent = dailyPhrase.english;
        phraseUsage.textContent = dailyPhrase.usage;
    }

    if (speakBtn) {
        speakBtn.addEventListener('click', () => {
            speakText(dailyPhrase.pidgin);
        });
    }
}

// Translator functionality
function initTranslator() {
    const translatorInput = document.getElementById('translator-input');
    const translateBtn = document.getElementById('translate-btn');
    const translatorOutput = document.getElementById('translator-output');
    const speakTranslationBtn = document.getElementById('speak-translation');
    const engToPidginBtn = document.getElementById('eng-to-pidgin');
    const pidginToEngBtn = document.getElementById('pidgin-to-eng');
    const inputLabel = document.getElementById('input-label');
    const outputLabel = document.getElementById('output-label');

    let currentDirection = 'eng-to-pidgin';

    // Toggle button functionality
    if (engToPidginBtn && pidginToEngBtn) {
        engToPidginBtn.addEventListener('click', () => {
            currentDirection = 'eng-to-pidgin';

            // Update button styles
            engToPidginBtn.classList.add('bg-green-500', 'text-white');
            engToPidginBtn.classList.remove('hover:bg-gray-200');
            pidginToEngBtn.classList.remove('bg-green-500', 'text-white');
            pidginToEngBtn.classList.add('hover:bg-gray-200');

            // Update labels and placeholders
            inputLabel.textContent = 'English';
            outputLabel.textContent = 'Pidgin';
            translatorInput.placeholder = 'Type English text here...';
            translateBtn.textContent = 'Translate to Pidgin';

            // Clear previous output
            translatorOutput.textContent = '';
            speakTranslationBtn.classList.add('hidden');
        });

        pidginToEngBtn.addEventListener('click', () => {
            currentDirection = 'pidgin-to-eng';

            // Update button styles
            pidginToEngBtn.classList.add('bg-green-500', 'text-white');
            pidginToEngBtn.classList.remove('hover:bg-gray-200');
            engToPidginBtn.classList.remove('bg-green-500', 'text-white');
            engToPidginBtn.classList.add('hover:bg-gray-200');

            // Update labels and placeholders
            inputLabel.textContent = 'Pidgin';
            outputLabel.textContent = 'English';
            translatorInput.placeholder = 'Type Pidgin text here...';
            translateBtn.textContent = 'Translate to English';

            // Clear previous output
            translatorOutput.textContent = '';
            speakTranslationBtn.classList.add('hidden');
        });
    }

    // Translation functionality
    if (translateBtn && translatorInput && translatorOutput) {
        translateBtn.addEventListener('click', () => {
            const inputText = translatorInput.value;
            if (inputText.trim()) {
                const translatedText = translator.translate(inputText, currentDirection);
                translatorOutput.textContent = translatedText;

                // Show pronunciation button
                if (speakTranslationBtn) {
                    speakTranslationBtn.classList.remove('hidden');
                    speakTranslationBtn.onclick = () => speakText(translatedText);
                }

                // Add pronunciation guide if available (only for Pidgin output)
                if (currentDirection === 'eng-to-pidgin') {
                    const pronunciation = translator.getPronunciation(translatedText);
                    if (pronunciation) {
                        const existingGuide = translatorOutput.querySelector('.pronunciation-guide');
                        if (existingGuide) {
                            existingGuide.remove();
                        }
                        const guideEl = document.createElement('p');
                        guideEl.className = 'text-sm text-gray-600 mt-2 italic pronunciation-guide';
                        guideEl.textContent = pronunciation;
                        translatorOutput.appendChild(guideEl);
                    }
                }
            }
        });

        // Allow Enter key to translate
        translatorInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                translateBtn.click();
            }
        });
    }
}

// Learning Hub functionality
function initLearningHub() {
    const levelBtns = document.querySelectorAll('.level-btn');
    const lessonsContainer = document.getElementById('lessons-container');
    const quizSection = document.getElementById('quiz-section');

    let currentLevel = 'beginner';

    // Level switching
    levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentLevel = btn.dataset.level;

            // Update button styles
            levelBtns.forEach(b => {
                b.classList.remove('bg-green-500', 'text-white');
                b.classList.add('hover:bg-gray-100');
            });
            btn.classList.add('bg-green-500', 'text-white');
            btn.classList.remove('hover:bg-gray-100');

            // Load lessons for selected level
            loadLessons(currentLevel);
        });
    });

    // Load initial lessons
    loadLessons(currentLevel);

    function loadLessons(level) {
        if (!lessonsContainer) return;

        const lessons = lessonsData[level];
        lessonsContainer.innerHTML = '';

        lessons.forEach(lesson => {
            const lessonCard = createLessonCard(lesson);
            lessonsContainer.appendChild(lessonCard);
        });
    }

    function createLessonCard(lesson) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer';

        card.innerHTML = `
            <div class="text-4xl mb-3">${lesson.icon}</div>
            <h3 class="text-xl font-bold mb-3 text-gray-800">${lesson.title}</h3>
            <p class="text-gray-600 mb-4">Learn essential ${lesson.title.toLowerCase()} in Pidgin</p>
            <button class="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition">
                Start Lesson →
            </button>
        `;

        card.addEventListener('click', () => {
            showLessonDetail(lesson, currentLevel);
        });

        return card;
    }

    function showLessonDetail(lesson, level) {
        // Create modal for lesson detail
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';

        const modalContent = document.createElement('div');
        modalContent.className = 'bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8';

        modalContent.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-3xl font-bold text-gray-800">
                    <span class="text-4xl mr-3">${lesson.icon}</span>
                    ${lesson.title}
                </h2>
                <button class="close-modal text-gray-500 hover:text-gray-700 text-3xl">&times;</button>
            </div>

            <div class="mb-6">
                <h3 class="text-xl font-bold mb-4 text-green-600">Vocabulary</h3>
                <div class="space-y-4">
                    ${lesson.content.vocabulary.map(item => `
                        <div class="bg-gray-50 rounded-lg p-4">
                            <div class="flex justify-between items-start mb-2">
                                <span class="text-lg font-bold text-gray-800">${item.pidgin}</span>
                                <span class="text-gray-600">${item.english}</span>
                            </div>
                            <p class="text-gray-700 italic">"${item.example}"</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="mb-6 bg-blue-50 rounded-lg p-4">
                <h3 class="text-lg font-bold mb-2 text-blue-800">Cultural Note</h3>
                <p class="text-gray-700">${lesson.content.culturalNote}</p>
            </div>

            <div class="mb-6 bg-green-50 rounded-lg p-4">
                <h3 class="text-lg font-bold mb-2 text-green-800">Practice</h3>
                <p class="text-gray-700">${lesson.content.practice}</p>
            </div>

            <button class="quiz-btn bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 transition" data-level="${level}">
                Take Quiz on This Topic →
            </button>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Close modal functionality
        const closeBtn = modalContent.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Quiz button
        const quizBtn = modalContent.querySelector('.quiz-btn');
        quizBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            startQuiz(level);
        });
    }

    function startQuiz(level) {
        if (!quizSection) return;

        quizSection.classList.remove('hidden');
        const quizContent = document.getElementById('quiz-content');
        const questions = quizQuestions[level];
        let currentQuestion = 0;
        let score = 0;

        function showQuestion() {
            if (currentQuestion >= questions.length) {
                showResults();
                return;
            }

            const q = questions[currentQuestion];
            quizContent.innerHTML = `
                <div class="mb-6">
                    <p class="text-lg font-semibold mb-4">Question ${currentQuestion + 1} of ${questions.length}</p>
                    <p class="text-xl mb-6">${q.question}</p>
                    <div class="space-y-3">
                        ${q.options.map((option, index) => `
                            <button class="quiz-option w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition" data-index="${index}">
                                ${option}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;

            const optionBtns = quizContent.querySelectorAll('.quiz-option');
            optionBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const selectedIndex = parseInt(btn.dataset.index);
                    if (selectedIndex === q.correct) {
                        score++;
                        btn.classList.add('bg-green-100', 'border-green-500');
                    } else {
                        btn.classList.add('bg-red-100', 'border-red-500');
                        optionBtns[q.correct].classList.add('bg-green-100', 'border-green-500');
                    }

                    setTimeout(() => {
                        currentQuestion++;
                        showQuestion();
                    }, 1500);
                });
            });
        }

        function showResults() {
            const percentage = Math.round((score / questions.length) * 100);
            quizContent.innerHTML = `
                <div class="text-center">
                    <h3 class="text-2xl font-bold mb-4">Quiz Complete!</h3>
                    <p class="text-4xl font-bold mb-4 ${percentage >= 70 ? 'text-green-600' : 'text-orange-600'}">
                        ${percentage}%
                    </p>
                    <p class="text-lg mb-6">You got ${score} out of ${questions.length} questions correct!</p>
                    <button class="bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 transition" onclick="location.reload()">
                        Try Another Quiz
                    </button>
                </div>
            `;
        }

        showQuestion();
    }
}

// Community functionality
function initCommunity() {
    const askForm = document.getElementById('ask-form');

    if (askForm) {
        askForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const textarea = askForm.querySelector('textarea');
            if (textarea.value.trim()) {
                // In a real app, this would send to a backend
                alert('Tanks fo\' your question! We going answer you soon!');
                textarea.value = '';
            }
        });
    }

    // Story expansion
    const storyButtons = document.querySelectorAll('#stories-container button');
    storyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // In a real app, this would load the full story
            alert('Full story feature coming soon! Mahalo fo\' your patience!');
        });
    });
}

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                e.preventDefault();
                const offsetTop = targetSection.offsetTop - 80; // Account for sticky nav
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Enhanced text-to-speech functionality using PidginSpeech
function speakText(text, options = {}) {
    if ('speechSynthesis' in window) {
        // Get user preferences from sliders if they exist
        const rateSlider = document.getElementById('rate-slider');
        const pitchSlider = document.getElementById('pitch-slider');

        if (rateSlider) {
            options.rate = options.rate || parseFloat(rateSlider.value);
        }
        if (pitchSlider) {
            options.pitch = options.pitch || parseFloat(pitchSlider.value);
        }

        // Use the enhanced Pidgin speech synthesizer
        pidginSpeech.speak(text, options).catch(err => {
            console.error('Speech error:', err);
            // Fallback to basic speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        });
    } else {
        alert('Sorry, your browser doesn\'t support text-to-speech!');
    }
}

// Voice settings functionality
function initVoiceSettings() {
    const voiceSettingsBtn = document.getElementById('voice-settings-btn');
    const voiceSettingsModal = document.getElementById('voice-settings-modal');
    const closeVoiceSettings = document.getElementById('close-voice-settings');
    const voiceSelect = document.getElementById('voice-select');
    const rateSlider = document.getElementById('rate-slider');
    const pitchSlider = document.getElementById('pitch-slider');
    const rateValue = document.getElementById('rate-value');
    const pitchValue = document.getElementById('pitch-value');
    const testVoiceBtn = document.getElementById('test-voice-btn');
    const debugMode = document.getElementById('debug-mode');
    const voiceInstallGuideBtn = document.getElementById('voice-install-guide-btn');
    const voiceInstallModal = document.getElementById('voice-install-modal');
    const closeVoiceInstall = document.getElementById('close-voice-install');
    const closeVoiceInstallBtn = document.getElementById('close-voice-install-btn');

    if (!voiceSettingsBtn || !voiceSettingsModal) return;

    // Load voices into dropdown
    function loadVoiceOptions() {
        setTimeout(() => {
            const voices = pidginSpeech.getAvailableVoices();

            console.log('🎙️ Available voices:', voices.length);
            console.log('Voice details:', voices.map(v => ({ name: v.name, lang: v.lang })));

            if (voices.length > 0) {
                voiceSelect.innerHTML = '';

                // Group voices by language
                const groupedVoices = {};
                voices.forEach(voice => {
                    const lang = voice.lang.substring(0, 2);
                    if (!groupedVoices[lang]) {
                        groupedVoices[lang] = [];
                    }
                    groupedVoices[lang].push(voice);
                });

                console.log('Grouped voices:', groupedVoices);

                // Add English voices first, grouped by accent type
                if (groupedVoices['en']) {
                    // List of known non-rhotic voice names
                    const nonRhoticNames = [
                        'karen', 'lee', 'james', 'catherine', 'ryan', 'hayley',  // Australian
                        'hazel', 'william',  // New Zealand
                        'nicole', 'russell'  // Additional Australian
                    ];

                    // Separate by accent type for better recommendations
                    const nonRhoticVoices = groupedVoices['en'].filter(v => {
                        const hasAuNz = v.lang.includes('AU') || v.lang.includes('NZ');
                        const hasCountryName = v.name.toLowerCase().includes('australia') || v.name.toLowerCase().includes('new zealand');
                        const hasVoiceName = nonRhoticNames.some(name => v.name.toLowerCase().includes(name.toLowerCase()));

                        console.log(`Voice ${v.name} (${v.lang}): AU/NZ=${hasAuNz}, Country=${hasCountryName}, Name=${hasVoiceName}`);

                        return hasAuNz || hasCountryName || hasVoiceName;
                    });

                    const usVoices = groupedVoices['en'].filter(v =>
                        v.lang.includes('US') && !nonRhoticVoices.includes(v));

                    const otherEnglish = groupedVoices['en'].filter(v =>
                        !nonRhoticVoices.includes(v) && !usVoices.includes(v));

                    console.log('Non-rhotic voices found:', nonRhoticVoices.map(v => `${v.name} (${v.lang})`));
                    console.log('US voices found:', usVoices.map(v => `${v.name} (${v.lang})`));
                    console.log('Other voices found:', otherEnglish.map(v => `${v.name} (${v.lang})`));

                    // Helper function to identify voice accent type
                    function getVoiceAccentType(voice) {
                        const name = voice.name.toLowerCase();
                        const lang = voice.lang.toLowerCase();

                        if (lang.includes('au') || name.includes('australia') ||
                            ['karen', 'lee', 'james', 'catherine', 'ryan', 'hayley', 'nicole', 'russell'].some(n => name.includes(n))) {
                            return 'Australian';
                        }
                        if (lang.includes('nz') || name.includes('new zealand') ||
                            ['hazel', 'william'].some(n => name.includes(n))) {
                            return 'New Zealand';
                        }
                        return null;
                    }

                    // Non-rhotic voices first (best for Pidgin)
                    if (nonRhoticVoices.length > 0) {
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = '🌟 Best for Pidgin (Non-rhotic Accents)';

                        // Sort by quality score
                        nonRhoticVoices.sort((a, b) => {
                            const scoreA = getVoiceScore(a);
                            const scoreB = getVoiceScore(b);
                            return scoreB - scoreA;
                        });

                        nonRhoticVoices.forEach(voice => {
                            const option = document.createElement('option');
                            option.value = voice.name;
                            const accentType = getVoiceAccentType(voice);
                            const localText = voice.local ? 'Local' : 'Online';
                            option.textContent = `${voice.name} (${accentType} • ${localText})`;
                            if (pidginSpeech.preferredVoice?.name === voice.name) {
                                option.selected = true;
                            }
                            optgroup.appendChild(option);
                        });
                        voiceSelect.appendChild(optgroup);
                        console.log(`✅ Added ${nonRhoticVoices.length} non-rhotic voices to dropdown`);
                    } else {
                        console.log('❌ No Australian/NZ voices found on this system');

                        // Add a message about missing voices
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = '⚠️ No Australian/NZ voices available';
                        const option = document.createElement('option');
                        option.value = '';
                        option.textContent = 'Install Microsoft Voices for better Pidgin pronunciation';
                        option.disabled = true;
                        optgroup.appendChild(option);
                        voiceSelect.appendChild(optgroup);
                    }

                    // Helper function to calculate voice quality score
                    function getVoiceScore(voice) {
                        const name = voice.name.toLowerCase();
                        const lang = voice.lang.toLowerCase();

                        if (name.includes('karen') || name.includes('lee')) return 95;
                        if (name.includes('hazel') || name.includes('william')) return 90;
                        if (name.includes('james') || name.includes('catherine')) return 85;
                        if (lang.includes('au')) return 80;
                        if (lang.includes('nz')) return 78;
                        if (lang.includes('us')) return 70;
                        return 50;
                    }

                    // US voices second
                    if (usVoices.length > 0) {
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = '👍 Good (US English)';
                        usVoices.forEach(voice => {
                            const option = document.createElement('option');
                            option.value = voice.name;
                            option.textContent = `${voice.name} ${voice.local ? '(Local)' : '(Online)'}`;
                            if (pidginSpeech.preferredVoice?.name === voice.name) {
                                option.selected = true;
                            }
                            optgroup.appendChild(option);
                        });
                        voiceSelect.appendChild(optgroup);
                    }

                    // Other English voices
                    if (otherEnglish.length > 0) {
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = '⚠️ Other English';
                        otherEnglish.forEach(voice => {
                            const option = document.createElement('option');
                            option.value = voice.name;
                            option.textContent = `${voice.name} ${voice.local ? '(Local)' : '(Online)'}`;
                            if (pidginSpeech.preferredVoice?.name === voice.name) {
                                option.selected = true;
                            }
                            optgroup.appendChild(option);
                        });
                        voiceSelect.appendChild(optgroup);
                    }
                }

                // Add other voices
                Object.keys(groupedVoices).forEach(lang => {
                    if (lang !== 'en') {
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = `Other (${lang})`;
                        groupedVoices[lang].forEach(voice => {
                            const option = document.createElement('option');
                            option.value = voice.name;
                            option.textContent = voice.name;
                            optgroup.appendChild(option);
                        });
                        voiceSelect.appendChild(optgroup);
                    }
                });
            } else {
                // Retry if voices aren't loaded yet
                setTimeout(loadVoiceOptions, 500);
            }
        }, 100);
    }

    // Show modal
    voiceSettingsBtn.addEventListener('click', () => {
        voiceSettingsModal.classList.remove('hidden');
        loadVoiceOptions();
    });

    // Close modal
    closeVoiceSettings.addEventListener('click', () => {
        voiceSettingsModal.classList.add('hidden');
    });

    // Close modal on background click
    voiceSettingsModal.addEventListener('click', (e) => {
        if (e.target === voiceSettingsModal) {
            voiceSettingsModal.classList.add('hidden');
        }
    });

    // Voice selection
    voiceSelect.addEventListener('change', () => {
        pidginSpeech.setVoice(voiceSelect.value);
    });

    // Rate slider
    rateSlider.addEventListener('input', () => {
        rateValue.textContent = `${rateSlider.value}x`;
    });

    // Pitch slider
    pitchSlider.addEventListener('input', () => {
        pitchValue.textContent = `${pitchSlider.value}x`;
    });

    // Test voice button with debug mode
    testVoiceBtn.addEventListener('click', () => {
        const testPhrases = [
            "Howzit brah! Da waves stay pumping today!",
            "Eh, we go grind! The food is broke da mouth!",
            "Ho brah, that sunset is beautiful tonight, yeah?",
            "Shoots! Thanks for the help, sister!",
            "No worries, brah. Everything is good, they asked about it.",
            "More better if you come over there with them, brother."
        ];
        const randomPhrase = testPhrases[Math.floor(Math.random() * testPhrases.length)];

        const isDebugMode = debugMode && debugMode.checked;

        speakText(randomPhrase, {
            rate: parseFloat(rateSlider.value),
            pitch: parseFloat(pitchSlider.value),
            debug: isDebugMode
        });

        // Show debug information if enabled
        if (isDebugMode) {
            setTimeout(() => {
                const phoneticText = pidginSpeech.applyPhoneticTransform(randomPhrase);
                const ssmlText = pidginSpeech.applySSMLMarkup(phoneticText);

                alert(`🎙️ Debug Info:

Original: "${randomPhrase}"

Phonetic: "${phoneticText}"

SSML: "${ssmlText}"

Voice: ${pidginSpeech.preferredVoice?.name || 'Default'}
Accent: ${pidginSpeech.preferredVoice?.lang || 'Unknown'}`);
            }, 500);
        }
    });

    // Add a test button to check available voices
    if (debugMode) {
        debugMode.addEventListener('change', () => {
            if (debugMode.checked) {
                console.log('🎙️ Debug mode enabled - Voice information:');
                console.log('All available voices:', speechSynthesis.getVoices());
                console.log('Pidgin speech voices:', pidginSpeech.getAvailableVoices());
                console.log('Preferred voice:', pidginSpeech.preferredVoice);
            }
        });
    }

    // Voice installation guide modal
    if (voiceInstallGuideBtn && voiceInstallModal) {
        voiceInstallGuideBtn.addEventListener('click', () => {
            voiceInstallModal.classList.remove('hidden');
        });

        closeVoiceInstall.addEventListener('click', () => {
            voiceInstallModal.classList.add('hidden');
        });

        closeVoiceInstallBtn.addEventListener('click', () => {
            voiceInstallModal.classList.add('hidden');
        });

        voiceInstallModal.addEventListener('click', (e) => {
            if (e.target === voiceInstallModal) {
                voiceInstallModal.classList.add('hidden');
            }
        });
    }
}