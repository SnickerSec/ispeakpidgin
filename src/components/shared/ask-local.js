// Ask a Local functionality with spam protection
class AskLocalManager {
    constructor() {
        this.correctAnswer = 0;
        this.submissionAttempts = 0;
        this.maxAttempts = 5; // Rate limiting: max 5 attempts per session
        this.cooldownPeriod = 60000; // 1 minute cooldown after max attempts
        this.lastSubmissionTime = 0;
        this.minTimeBetweenSubmissions = 30000; // 30 seconds between submissions

        this.initializeCaptcha();
        this.initializeEventListeners();
        this.loadSampleQuestions();
    }

    initializeCaptcha() {
        this.generateNewCaptcha();
    }

    generateNewCaptcha() {
        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 20) + 1;
        const operations = ['+', '-'];
        const operation = operations[Math.floor(Math.random() * operations.length)];

        let question, answer;

        if (operation === '+') {
            question = `${num1} + ${num2}`;
            answer = num1 + num2;
        } else {
            // For subtraction, ensure positive result
            const larger = Math.max(num1, num2);
            const smaller = Math.min(num1, num2);
            question = `${larger} - ${smaller}`;
            answer = larger - smaller;
        }

        this.correctAnswer = answer;
        document.getElementById('captcha-question').textContent = question;
        document.getElementById('captcha-answer').value = '';
    }

    initializeEventListeners() {
        // Form submission
        document.getElementById('ask-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmission();
        });

        // Refresh captcha
        document.getElementById('refresh-captcha').addEventListener('click', () => {
            this.generateNewCaptcha();
        });

        // Real-time validation feedback
        document.getElementById('captcha-answer').addEventListener('input', () => {
            this.validateCaptcha();
        });
    }

    validateCaptcha() {
        const userAnswer = parseInt(document.getElementById('captcha-answer').value);
        const submitBtn = document.getElementById('submit-question-btn');

        if (userAnswer === this.correctAnswer) {
            document.getElementById('captcha-answer').style.borderColor = '#10b981';
            submitBtn.disabled = false;
            return true;
        } else {
            document.getElementById('captcha-answer').style.borderColor = '#ef4444';
            submitBtn.disabled = true;
            return false;
        }
    }

    isRateLimited() {
        const now = Date.now();

        // Check if user exceeded max attempts and is in cooldown
        if (this.submissionAttempts >= this.maxAttempts) {
            const timeSinceLastAttempt = now - this.lastSubmissionTime;
            if (timeSinceLastAttempt < this.cooldownPeriod) {
                const remainingTime = Math.ceil((this.cooldownPeriod - timeSinceLastAttempt) / 1000);
                return { limited: true, remainingTime };
            } else {
                // Reset attempts after cooldown
                this.submissionAttempts = 0;
            }
        }

        // Check minimum time between submissions
        const timeSinceLastSubmission = now - this.lastSubmissionTime;
        if (timeSinceLastSubmission < this.minTimeBetweenSubmissions && this.lastSubmissionTime > 0) {
            const remainingTime = Math.ceil((this.minTimeBetweenSubmissions - timeSinceLastSubmission) / 1000);
            return { limited: true, remainingTime };
        }

        return { limited: false };
    }

    showFeedback(message, type = 'info') {
        const feedback = document.getElementById('submit-feedback');
        feedback.textContent = message;
        feedback.className = `text-sm ${type === 'success' ? 'text-green-600' : type === 'error' ? 'text-red-600' : 'text-blue-600'}`;

        // Clear feedback after 5 seconds
        setTimeout(() => {
            feedback.textContent = '';
            feedback.className = 'text-sm';
        }, 5000);
    }

    async handleFormSubmission() {
        const questionText = document.getElementById('question-text').value.trim();
        const userName = document.getElementById('user-name').value.trim() || 'Anonymous';
        const captchaAnswer = parseInt(document.getElementById('captcha-answer').value);

        // Validation
        if (!questionText) {
            this.showFeedback('Please enter your question.', 'error');
            return;
        }

        if (questionText.length < 10) {
            this.showFeedback('Please provide a more detailed question (at least 10 characters).', 'error');
            return;
        }

        if (captchaAnswer !== this.correctAnswer) {
            this.showFeedback('Please solve the math problem correctly.', 'error');
            this.generateNewCaptcha(); // Generate new captcha on wrong answer
            return;
        }

        // Rate limiting check
        const rateLimitCheck = this.isRateLimited();
        if (rateLimitCheck.limited) {
            this.showFeedback(`Please wait ${rateLimitCheck.remainingTime} seconds before submitting again.`, 'error');
            return;
        }

        // Content filtering (basic spam detection)
        if (this.containsSpam(questionText)) {
            this.showFeedback('Your question contains inappropriate content. Please revise and try again.', 'error');
            this.submissionAttempts++;
            this.lastSubmissionTime = Date.now();
            return;
        }

        // Submit the question
        try {
            await this.submitQuestion(userName, questionText);
            this.showFeedback('Your question has been submitted! Locals will respond soon. 🌺', 'success');

            // Reset form
            document.getElementById('ask-form').reset();
            this.generateNewCaptcha();

            // Update submission tracking
            this.submissionAttempts++;
            this.lastSubmissionTime = Date.now();

        } catch (error) {
            this.showFeedback('There was an error submitting your question. Please try again.', 'error');
        }
    }

    containsSpam(text) {
        const spamKeywords = [
            'viagra', 'casino', 'lottery', 'winner', 'click here', 'free money',
            'act now', 'limited time', 'buy now', 'discount', 'sale',
            'http://', 'https://', 'www.', '.com', '.net', '.org'
        ];

        const lowerText = text.toLowerCase();
        return spamKeywords.some(keyword => lowerText.includes(keyword));
    }

    async submitQuestion(userName, questionText) {
        // Simulate API call - in a real implementation, this would send to a backend
        return new Promise((resolve) => {
            setTimeout(() => {
                // Store question locally for demo purposes
                this.storeQuestion(userName, questionText);
                resolve();
            }, 1000);
        });
    }

    storeQuestion(userName, questionText) {
        // Get existing questions from localStorage
        let questions = JSON.parse(localStorage.getItem('askLocalQuestions') || '[]');

        // Add new question
        const newQuestion = {
            id: Date.now(),
            userName,
            questionText,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        questions.unshift(newQuestion); // Add to beginning

        // Keep only last 20 questions
        questions = questions.slice(0, 20);

        // Store back to localStorage
        localStorage.setItem('askLocalQuestions', JSON.stringify(questions));

        // Update the display
        this.displayRecentQuestions();
    }

    displayRecentQuestions() {
        const questions = JSON.parse(localStorage.getItem('askLocalQuestions') || '[]');
        const container = document.querySelector('#recent-questions .space-y-3');

        if (questions.length === 0) {
            container.innerHTML = `
                <div class="bg-white p-3 rounded text-center text-gray-500">
                    <p>No questions yet. Be the first to ask! 🌺</p>
                </div>
            `;
            return;
        }

        const displayQuestions = questions.slice(0, 3);
        const hasMoreQuestions = questions.length > 3;

        container.innerHTML = displayQuestions.map(q => {
            const hasResponses = q.responses && q.responses.length > 0;
            const statusClass = hasResponses ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
            const statusText = hasResponses ? '✅ Answered' : '⏳ Pending Response';
            const responseCount = hasResponses ? q.responses.length : 0;

            return `
                <div class="bg-white border rounded-lg overflow-hidden">
                    <div class="p-4 border-l-4 ${hasResponses ? 'border-green-400' : 'border-yellow-400'}">
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex-1">
                                <p class="font-semibold text-gray-800 mb-2">${this.escapeHtml(q.questionText)}</p>
                                <div class="flex items-center gap-2 text-xs text-gray-500">
                                    <span>👤 ${this.escapeHtml(q.userName)}</span>
                                    <span>•</span>
                                    <span>📅 ${this.formatDate(q.timestamp)}</span>
                                    <span class="${statusClass} px-2 py-1 rounded-full">${statusText}</span>
                                </div>
                            </div>
                        </div>

                        ${hasResponses ? `
                            <div class="mt-3">
                                <button class="expand-responses-btn text-green-600 hover:text-green-800 text-sm font-medium" data-question-id="${q.id}">
                                    👁️ View ${responseCount} Response${responseCount !== 1 ? 's' : ''} →
                                </button>
                            </div>

                            <!-- Responses Container (initially hidden) -->
                            <div id="responses-container-${q.id}" class="hidden mt-3">
                                ${this.renderResponses(q.responses)}
                            </div>
                        ` : ''}

                        <div class="mt-3">
                            <button class="respond-btn text-blue-600 hover:text-blue-800 text-sm font-medium" data-question-id="${q.id}">
                                💬 ${hasResponses ? 'Add Another Response' : 'Respond to Question'}
                            </button>
                        </div>

                        <!-- Response Form (initially hidden) -->
                        <div id="response-form-${q.id}" class="hidden mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                            <h5 class="font-semibold mb-3 text-blue-800">🌺 Share Your Local Knowledge</h5>
                            <div class="mb-3">
                                <input type="text" id="responder-name-${q.id}" class="w-full p-2 border rounded" placeholder="Your name (optional)" maxlength="50">
                            </div>
                            <div class="mb-3">
                                <textarea id="response-text-${q.id}" class="w-full p-2 border rounded" rows="3" placeholder="Share your local knowledge..." required maxlength="500"></textarea>
                                <div class="text-xs text-gray-500 mt-1">Maximum 500 characters</div>
                            </div>

                            <!-- Mini CAPTCHA for responses -->
                            <div class="mb-3 bg-yellow-50 p-3 rounded border">
                                <label class="block text-sm font-medium mb-1">
                                    🔒 Quick check: <span id="response-captcha-${q.id}"></span> = ?
                                </label>
                                <input type="number" id="response-captcha-answer-${q.id}" class="w-20 p-1 border rounded text-sm" required>
                            </div>

                            <div class="flex gap-2">
                                <button class="submit-response-btn bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition text-sm" data-question-id="${q.id}">
                                    🌺 Submit Response
                                </button>
                                <button class="cancel-response-btn text-gray-600 hover:text-gray-800 px-3 py-2 text-sm" data-question-id="${q.id}">
                                    Cancel
                                </button>
                            </div>
                            <div id="response-feedback-${q.id}" class="mt-2 text-sm"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add "View All Questions" button if there are more than 3 questions
        if (hasMoreQuestions) {
            container.innerHTML += `
                <div class="text-center mt-6">
                    <a href="ask-local.html" class="inline-block bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition font-semibold">
                        📋 View All Questions (${questions.length} total)
                    </a>
                </div>
            `;
        }

        // Add event listeners for response functionality
        this.addResponseEventListeners();
    }

    renderResponses(responses) {
        return `
            <div class="bg-green-50 rounded-lg p-3 mt-3 border border-green-200">
                <h5 class="font-semibold text-green-800 mb-2">🌺 Local Responses:</h5>
                <div class="space-y-2">
                    ${responses.map(r => `
                        <div class="bg-white p-3 rounded border-l-2 border-green-400">
                            <p class="text-gray-800">${this.escapeHtml(r.responseText)}</p>
                            <div class="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <span>👨‍🏫 ${this.escapeHtml(r.responderName || 'Local Helper')}</span>
                                <span>•</span>
                                <span>📅 ${this.formatDate(r.timestamp)}</span>
                                <button class="helpful-btn text-green-600 hover:text-green-800 ml-2" data-response-id="${r.id}">
                                    👍 Helpful (${r.helpfulCount || 0})
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    addResponseEventListeners() {
        // Expand responses button clicks
        document.querySelectorAll('.expand-responses-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const questionId = e.target.getAttribute('data-question-id');
                this.toggleResponsesVisibility(questionId, e.target);
            });
        });

        // Response button clicks
        document.querySelectorAll('.respond-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const questionId = e.target.getAttribute('data-question-id');
                this.showResponseForm(questionId);
            });
        });

        // Submit response buttons
        document.querySelectorAll('.submit-response-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const questionId = e.target.getAttribute('data-question-id');
                this.submitResponse(questionId);
            });
        });

        // Cancel response buttons
        document.querySelectorAll('.cancel-response-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const questionId = e.target.getAttribute('data-question-id');
                this.hideResponseForm(questionId);
            });
        });

        // Helpful buttons
        document.querySelectorAll('.helpful-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const responseId = e.target.getAttribute('data-response-id');
                this.markResponseHelpful(responseId);
            });
        });
    }

    toggleResponsesVisibility(questionId, button) {
        const responsesContainer = document.getElementById(`responses-container-${questionId}`);
        if (responsesContainer) {
            const isHidden = responsesContainer.classList.contains('hidden');

            if (isHidden) {
                responsesContainer.classList.remove('hidden');
                button.innerHTML = '🔽 Hide Responses';
            } else {
                responsesContainer.classList.add('hidden');
                // Find response count from button text
                const match = button.textContent.match(/View (\d+) Response/);
                const count = match ? match[1] : '1';
                button.innerHTML = `👁️ View ${count} Response${count !== '1' ? 's' : ''} →`;
            }
        }
    }

    showResponseForm(questionId) {
        const form = document.getElementById(`response-form-${questionId}`);
        if (form) {
            form.classList.remove('hidden');
            this.generateResponseCaptcha(questionId);
            // Focus on the response textarea
            document.getElementById(`response-text-${questionId}`).focus();
        }
    }

    hideResponseForm(questionId) {
        const form = document.getElementById(`response-form-${questionId}`);
        if (form) {
            form.classList.add('hidden');
            // Clear form
            document.getElementById(`responder-name-${questionId}`).value = '';
            document.getElementById(`response-text-${questionId}`).value = '';
            document.getElementById(`response-captcha-answer-${questionId}`).value = '';
        }
    }

    generateResponseCaptcha(questionId) {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const operation = Math.random() > 0.5 ? '+' : '-';

        let question, answer;
        if (operation === '+') {
            question = `${num1} + ${num2}`;
            answer = num1 + num2;
        } else {
            const larger = Math.max(num1, num2);
            const smaller = Math.min(num1, num2);
            question = `${larger} - ${smaller}`;
            answer = larger - smaller;
        }

        document.getElementById(`response-captcha-${questionId}`).textContent = question;
        document.getElementById(`response-captcha-${questionId}`).setAttribute('data-answer', answer);
    }

    async submitResponse(questionId) {
        const responderName = document.getElementById(`responder-name-${questionId}`).value.trim() || 'Local Helper';
        const responseText = document.getElementById(`response-text-${questionId}`).value.trim();
        const captchaAnswer = parseInt(document.getElementById(`response-captcha-answer-${questionId}`).value);
        const correctAnswer = parseInt(document.getElementById(`response-captcha-${questionId}`).getAttribute('data-answer'));
        const feedbackEl = document.getElementById(`response-feedback-${questionId}`);

        // Validation
        if (!responseText) {
            this.showResponseFeedback(questionId, 'Please enter your response.', 'error');
            return;
        }

        if (responseText.length < 10) {
            this.showResponseFeedback(questionId, 'Please provide a more detailed response (at least 10 characters).', 'error');
            return;
        }

        if (captchaAnswer !== correctAnswer) {
            this.showResponseFeedback(questionId, 'Please solve the math problem correctly.', 'error');
            this.generateResponseCaptcha(questionId);
            return;
        }

        // Content filtering
        if (this.containsSpam(responseText)) {
            this.showResponseFeedback(questionId, 'Your response contains inappropriate content. Please revise.', 'error');
            return;
        }

        try {
            // Add response to question
            this.addResponseToQuestion(questionId, responderName, responseText);
            this.showResponseFeedback(questionId, 'Thank you for sharing your local knowledge! 🌺', 'success');

            // Hide form after successful submission
            setTimeout(() => {
                this.hideResponseForm(questionId);
                this.displayRecentQuestions(); // Refresh display
            }, 2000);

        } catch (error) {
            this.showResponseFeedback(questionId, 'Error submitting response. Please try again.', 'error');
        }
    }

    addResponseToQuestion(questionId, responderName, responseText) {
        let questions = JSON.parse(localStorage.getItem('askLocalQuestions') || '[]');

        const questionIndex = questions.findIndex(q => q.id == questionId);
        if (questionIndex === -1) return;

        if (!questions[questionIndex].responses) {
            questions[questionIndex].responses = [];
        }

        const newResponse = {
            id: Date.now(),
            responderName,
            responseText,
            timestamp: new Date().toISOString(),
            helpfulCount: 0
        };

        questions[questionIndex].responses.push(newResponse);
        questions[questionIndex].status = 'answered';

        localStorage.setItem('askLocalQuestions', JSON.stringify(questions));
    }

    markResponseHelpful(responseId) {
        let questions = JSON.parse(localStorage.getItem('askLocalQuestions') || '[]');

        for (let question of questions) {
            if (question.responses) {
                const response = question.responses.find(r => r.id == responseId);
                if (response) {
                    response.helpfulCount = (response.helpfulCount || 0) + 1;
                    localStorage.setItem('askLocalQuestions', JSON.stringify(questions));
                    this.displayRecentQuestions(); // Refresh display
                    break;
                }
            }
        }
    }

    showResponseFeedback(questionId, message, type = 'info') {
        const feedback = document.getElementById(`response-feedback-${questionId}`);
        if (feedback) {
            feedback.textContent = message;
            feedback.className = `mt-2 text-sm ${type === 'success' ? 'text-green-600' : type === 'error' ? 'text-red-600' : 'text-blue-600'}`;

            // Clear feedback after 5 seconds
            setTimeout(() => {
                feedback.textContent = '';
                feedback.className = 'mt-2 text-sm';
            }, 5000);
        }
    }

    loadSampleQuestions() {
        // Check if we already have questions stored
        const existing = localStorage.getItem('askLocalQuestions');
        if (!existing) {
            // Add some sample questions for demonstration
            const sampleQuestions = [
                {
                    id: 1,
                    userName: 'Curious Visitor',
                    questionText: "What's the difference between 'stay' and 'is' in Pidgin?",
                    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                    status: 'answered',
                    responses: [
                        {
                            id: 101,
                            responderName: 'Local Auntie',
                            responseText: "In Pidgin, 'stay' is used more often than 'is'. Like 'He stay tired' instead of 'He is tired'. It feels more natural and local. 'Stay' can also mean location, like 'Where you stay?' meaning 'Where do you live?'",
                            timestamp: new Date(Date.now() - 82800000).toISOString(),
                            helpfulCount: 3
                        }
                    ]
                },
                {
                    id: 2,
                    userName: 'Mainland Mike',
                    questionText: "When should I use 'brah' vs 'bruddah'?",
                    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                    status: 'answered',
                    responses: [
                        {
                            id: 102,
                            responderName: 'Island Boy',
                            responseText: "'Brah' is more casual, like 'Hey brah, how's it?'. 'Bruddah' is more respectful or when talking about family/close friends. Both are good, just depends on the vibe!",
                            timestamp: new Date(Date.now() - 169200000).toISOString(),
                            helpfulCount: 2
                        }
                    ]
                }
            ];

            localStorage.setItem('askLocalQuestions', JSON.stringify(sampleQuestions));
        }

        this.displayRecentQuestions();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AskLocalManager();
});