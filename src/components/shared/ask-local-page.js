// Ask a Local Page - Full functionality for dedicated page
class AskLocalPageManager {
    constructor() {
        this.currentFilter = 'all';
        this.questions = [];
        this.askLocalManager = null;

        this.initializePage();
        this.setupEventListeners();
    }

    initializePage() {
        // Note: Mobile menu is handled by navigation.html component

        // Initialize form handling
        this.correctAnswer = 0;
        this.submissionAttempts = 0;
        this.maxAttempts = 5;
        this.cooldownPeriod = 60000;
        this.lastSubmissionTime = 0;
        this.minTimeBetweenSubmissions = 30000;

        this.initializeFormHandling();
        this.loadSampleQuestions();
        this.loadQuestions();
        this.setupBackToTop();
    }

    initializeFormHandling() {
        this.generateNewCaptcha();

        // Form submission
        const askForm = document.getElementById('ask-form');
        if (askForm) {
            askForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission();
            });
        }

        // Refresh captcha
        const refreshBtn = document.getElementById('refresh-captcha');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.generateNewCaptcha();
            });
        }

        // Real-time validation feedback
        const captchaInput = document.getElementById('captcha-answer');
        if (captchaInput) {
            captchaInput.addEventListener('input', () => {
                this.validateCaptcha();
            });
        }
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
            const larger = Math.max(num1, num2);
            const smaller = Math.min(num1, num2);
            question = `${larger} - ${smaller}`;
            answer = larger - smaller;
        }

        this.correctAnswer = answer;
        const questionEl = document.getElementById('captcha-question');
        const answerEl = document.getElementById('captcha-answer');

        if (questionEl) questionEl.textContent = question;
        if (answerEl) answerEl.value = '';
    }

    validateCaptcha() {
        const userAnswer = parseInt(document.getElementById('captcha-answer').value);
        const submitBtn = document.getElementById('submit-question-btn');

        if (userAnswer === this.correctAnswer) {
            document.getElementById('captcha-answer').style.borderColor = '#10b981';
            if (submitBtn) submitBtn.disabled = false;
            return true;
        } else {
            document.getElementById('captcha-answer').style.borderColor = '#ef4444';
            if (submitBtn) submitBtn.disabled = true;
            return false;
        }
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
            this.generateNewCaptcha();
            return;
        }

        try {
            this.submitQuestion(userName, questionText);
            this.showFeedback('Your question has been submitted! Locals will respond soon. 🌺', 'success');

            // Reset form
            document.getElementById('ask-form').reset();
            this.generateNewCaptcha();

            // Reload questions
            this.loadQuestions();

        } catch (error) {
            this.showFeedback('There was an error submitting your question. Please try again.', 'error');
        }
    }

    submitQuestion(userName, questionText) {
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

        questions.unshift(newQuestion);
        questions = questions.slice(0, 20);

        localStorage.setItem('askLocalQuestions', JSON.stringify(questions));
    }

    showFeedback(message, type = 'info') {
        const feedback = document.getElementById('submit-feedback');
        if (feedback) {
            feedback.textContent = message;
            feedback.className = `text-sm ${type === 'success' ? 'text-green-600' : type === 'error' ? 'text-red-600' : 'text-blue-600'}`;

            setTimeout(() => {
                feedback.textContent = '';
                feedback.className = 'text-sm';
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
                    timestamp: new Date(Date.now() - 86400000).toISOString(),
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
                    timestamp: new Date(Date.now() - 172800000).toISOString(),
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
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.getAttribute('data-filter'));
            });
        });

        // Note: Mobile menu is handled by navigation.html component
    }

    loadQuestions() {
        this.questions = JSON.parse(localStorage.getItem('askLocalQuestions') || '[]');
        this.displayAllQuestions();
        this.updateQuestionCount();
    }

    setFilter(filter) {
        this.currentFilter = filter;

        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active', 'bg-blue-500', 'text-white');
                btn.classList.remove('hover:bg-gray-100');
            } else {
                btn.classList.remove('active', 'bg-blue-500', 'text-white');
                btn.classList.add('hover:bg-gray-100');
            }
        });

        this.displayAllQuestions();
        this.updateQuestionCount();
    }

    getFilteredQuestions() {
        switch (this.currentFilter) {
            case 'answered':
                return this.questions.filter(q => q.responses && q.responses.length > 0);
            case 'pending':
                return this.questions.filter(q => !q.responses || q.responses.length === 0);
            default:
                return this.questions;
        }
    }

    displayAllQuestions() {
        const container = document.getElementById('all-questions');
        const loadingState = document.getElementById('loading-state');
        const noResults = document.getElementById('no-results');

        if (!container) return;

        // Hide loading state
        if (loadingState) loadingState.style.display = 'none';

        const filteredQuestions = this.getFilteredQuestions();

        if (filteredQuestions.length === 0) {
            container.innerHTML = '';
            if (noResults) noResults.classList.remove('hidden');
            return;
        }

        if (noResults) noResults.classList.add('hidden');

        container.innerHTML = filteredQuestions.map(q => {
            const hasResponses = q.responses && q.responses.length > 0;
            const statusClass = hasResponses ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
            const statusText = hasResponses ? '✅ Answered' : '⏳ Pending Response';
            const cardClass = hasResponses ? 'answered-card' : 'pending-card';
            const safeId = this.escapeAttr(q.id);

            return `
                <div class="question-card ${cardClass} bg-white border rounded-lg overflow-hidden shadow-lg">
                    <div class="p-6">
                        <div class="flex justify-between items-start mb-4">
                            <div class="flex-1">
                                <h3 class="font-bold text-lg text-gray-800 mb-2">${this.escapeHtml(q.questionText)}</h3>
                                <div class="flex items-center gap-3 text-sm text-gray-500">
                                    <span class="whitespace-nowrap">👤 ${this.escapeHtml(q.userName)}</span>
                                    <span class="whitespace-nowrap">•</span>
                                    <span class="whitespace-nowrap">📅 ${this.formatDate(q.timestamp)}</span>
                                    <span class="${statusClass} px-3 py-1 rounded-full font-medium whitespace-nowrap">${statusText}</span>
                                </div>
                            </div>
                        </div>

                        ${hasResponses ? this.renderResponses(q.responses) : ''}

                        <div class="mt-4 pt-4 border-t border-gray-100">
                            <button class="respond-btn text-blue-600 hover:text-blue-800 font-medium" data-question-id="${safeId}">
                                💬 ${hasResponses ? 'Add Another Response' : 'Respond to Question'}
                            </button>
                        </div>

                        <!-- Response Form (initially hidden) -->
                        <div id="response-form-${safeId}" class="hidden mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                            <h4 class="font-semibold mb-3 text-blue-800">🌺 Share Your Local Knowledge</h4>
                            <div class="mb-3">
                                <input type="text" id="responder-name-${safeId}" class="w-full p-2 border rounded" placeholder="Your name (optional)" maxlength="50">
                            </div>
                            <div class="mb-3">
                                <textarea id="response-text-${safeId}" class="w-full p-2 border rounded" rows="3" placeholder="Share your local knowledge..." required maxlength="500"></textarea>
                                <div class="text-xs text-gray-500 mt-1">Maximum 500 characters</div>
                            </div>

                            <!-- Mini CAPTCHA for responses -->
                            <div class="mb-3 bg-yellow-50 p-3 rounded border">
                                <label class="block text-sm font-medium mb-1">
                                    🔒 Quick check: <span id="response-captcha-${safeId}"></span> = ?
                                </label>
                                <input type="number" id="response-captcha-answer-${safeId}" class="w-20 p-1 border rounded text-sm" required>
                            </div>

                            <div class="flex gap-2">
                                <button class="submit-response-btn bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition text-sm" data-question-id="${safeId}">
                                    🌺 Submit Response
                                </button>
                                <button class="cancel-response-btn text-gray-600 hover:text-gray-800 px-3 py-2 text-sm" data-question-id="${safeId}">
                                    Cancel
                                </button>
                            </div>
                            <div id="response-feedback-${safeId}" class="mt-2 text-sm"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners for response functionality
        this.addResponseEventListeners();
    }

    renderResponses(responses) {
        return `
            <div class="bg-green-50 rounded-lg p-4 mt-4 border border-green-200">
                <h4 class="font-semibold text-green-800 mb-3">🌺 Local Responses:</h4>
                <div class="space-y-3">
                    ${responses.map(r => {
                        const safeResponseId = this.escapeAttr(r.id);
                        const helpfulCount = parseInt(r.helpfulCount, 10) || 0;
                        return `
                        <div class="bg-white p-4 rounded border-l-4 border-green-400">
                            <p class="text-gray-800 mb-2">${this.escapeHtml(r.responseText)}</p>
                            <div class="flex items-center gap-3 text-sm text-gray-500">
                                <span class="whitespace-nowrap">👨‍🏫 ${this.escapeHtml(r.responderName || 'Local Helper')}</span>
                                <span class="whitespace-nowrap">•</span>
                                <span class="whitespace-nowrap">📅 ${this.formatDate(r.timestamp)}</span>
                                <button class="helpful-btn text-green-600 hover:text-green-800 ml-2 whitespace-nowrap" data-response-id="${safeResponseId}">
                                    👍 Helpful (${helpfulCount})
                                </button>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>
        `;
    }

    addResponseEventListeners() {
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

    showResponseForm(questionId) {
        const form = document.getElementById(`response-form-${questionId}`);
        if (form) {
            form.classList.remove('hidden');
            this.generateResponseCaptcha(questionId);
            document.getElementById(`response-text-${questionId}`).focus();
        }
    }

    hideResponseForm(questionId) {
        const form = document.getElementById(`response-form-${questionId}`);
        if (form) {
            form.classList.add('hidden');
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

    submitResponse(questionId) {
        const responderName = document.getElementById(`responder-name-${questionId}`).value.trim() || 'Local Helper';
        const responseText = document.getElementById(`response-text-${questionId}`).value.trim();
        const captchaAnswer = parseInt(document.getElementById(`response-captcha-answer-${questionId}`).value);
        const correctAnswer = parseInt(document.getElementById(`response-captcha-${questionId}`).getAttribute('data-answer'));

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

        try {
            this.addResponseToQuestion(questionId, responderName, responseText);
            this.showResponseFeedback(questionId, 'Thank you for sharing your local knowledge! 🌺', 'success');

            setTimeout(() => {
                this.hideResponseForm(questionId);
                this.loadQuestions(); // Refresh display
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
                    this.loadQuestions(); // Refresh display
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

            setTimeout(() => {
                feedback.textContent = '';
                feedback.className = 'mt-2 text-sm';
            }, 5000);
        }
    }

    updateQuestionCount() {
        const countElement = document.getElementById('questions-count');
        if (!countElement) return;

        const filteredQuestions = this.getFilteredQuestions();
        const total = this.questions.length;

        let countText = '';
        if (this.currentFilter === 'all') {
            countText = `Showing all ${total} question${total !== 1 ? 's' : ''}`;
        } else {
            const filterText = this.currentFilter === 'answered' ? 'answered' : 'pending';
            countText = `Showing ${filteredQuestions.length} ${filterText} question${filteredQuestions.length !== 1 ? 's' : ''} of ${total} total`;
        }

        countElement.textContent = countText;
    }

    setupBackToTop() {
        const backToTopBtn = document.getElementById('back-to-top');
        if (!backToTopBtn) return;

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.style.opacity = '1';
                backToTopBtn.style.pointerEvents = 'auto';
            } else {
                backToTopBtn.style.opacity = '0';
                backToTopBtn.style.pointerEvents = 'none';
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Escape for safe use in HTML attributes (data-*, id, etc.)
    escapeAttr(text) {
        if (text === null || text === undefined) return '';
        return String(text).replace(/[&"'<>]/g, char => ({
            '&': '&amp;',
            '"': '&quot;',
            "'": '&#39;',
            '<': '&lt;',
            '>': '&gt;'
        }[char]));
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
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AskLocalPageManager();
    });
} else {
    // DOM is already loaded
    new AskLocalPageManager();
}