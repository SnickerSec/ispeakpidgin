/**
 * Mini Quiz Component
 * A lightweight, interactive quiz component that can be embedded in any page.
 * Fetches 1 random question from the Supabase Quiz API.
 */

class MiniQuiz {
    constructor(containerId = 'mini-quiz-container') {
        this.container = document.getElementById(containerId);
        this.question = null;
        this.answered = false;
        
        if (this.container) {
            this.init();
        }
    }

    async init() {
        this.renderLoading();
        try {
            await this.loadQuestion();
            this.render();
        } catch (error) {
            console.error('Failed to load mini quiz:', error);
            this.container.innerHTML = ''; // Hide if it fails
        }
    }

    async loadQuestion() {
        if (!window.supabaseAPI) {
            throw new Error('Supabase API loader not found');
        }
        
        // Fetch 1 random question
        const response = await window.supabaseAPI.loadQuizQuestions({ count: 1, random: 'true' });
        if (response.questions && response.questions.length > 0) {
            this.question = response.questions[0];
        } else {
            throw new Error('No questions found');
        }
    }

    renderLoading() {
        this.container.innerHTML = `
            <div class="bg-white rounded-2xl p-6 shadow-md animate-pulse border-2 border-gray-100">
                <div class="h-6 bg-gray-200 rounded w-3/4 mb-4 mx-auto"></div>
                <div class="space-y-3">
                    <div class="h-10 bg-gray-100 rounded"></div>
                    <div class="h-10 bg-gray-100 rounded"></div>
                    <div class="h-10 bg-gray-100 rounded"></div>
                    <div class="h-10 bg-gray-100 rounded"></div>
                </div>
            </div>
        `;
    }

    render() {
        if (!this.question) return;

        const optionsHtml = this.question.options.map((option, index) => `
            <button 
                class="mini-quiz-option w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50 transition-all font-medium text-gray-700 mb-2 flex justify-between items-center group"
                data-index="${index}"
            >
                <span>${this.escapeHtml(option.text || option)}</span>
                <i class="ti ti-chevron-right opacity-0 group-hover:opacity-100 transition-opacity"></i>
            </button>
        `).join('');

        this.container.innerHTML = `
            <div class="bg-white rounded-2xl p-6 shadow-xl border-2 border-blue-100 relative overflow-hidden transition-all duration-500" id="mini-quiz-card">
                <div class="absolute top-0 right-0 p-3 opacity-10">
                    <i class="ti ti-bulb text-6xl text-blue-600"></i>
                </div>
                
                <div class="flex items-center gap-2 mb-4">
                    <span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Mini Quiz</span>
                    <span class="text-gray-400 text-xs">• Test your Pidgin!</span>
                </div>

                <h3 class="text-xl font-bold text-gray-800 mb-6 leading-tight">
                    ${this.escapeHtml(this.question.question)}
                </h3>

                <div class="space-y-2" id="mini-quiz-options">
                    ${optionsHtml}
                </div>

                <div id="mini-quiz-feedback" class="hidden mt-6 p-4 rounded-xl animate-bounce-in">
                    <p id="feedback-message" class="font-bold text-lg mb-1"></p>
                    <p id="feedback-explanation" class="text-sm opacity-90 mb-4"></p>
                    <div class="flex gap-2">
                        <a href="/how-local-you-stay.html" class="flex-1 bg-white/20 hover:bg-white/30 text-center py-2 rounded-lg font-bold text-sm transition-colors border border-white/30">
                            Take Full Quiz
                        </a>
                        <button id="next-mini-quiz" class="flex-1 bg-white text-blue-700 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors">
                            Next Question
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        const optionButtons = this.container.querySelectorAll('.mini-quiz-option');
        optionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAnswer(parseInt(btn.dataset.index), btn));
        });
    }

    handleAnswer(selectedIndex, selectedBtn) {
        if (this.answered) return;
        this.answered = true;

        const option = this.question.options[selectedIndex];
        const isCorrect = option.points > 0 || selectedIndex === this.question.correctAnswer;
        
        const feedbackContainer = this.container.querySelector('#mini-quiz-feedback');
        const feedbackMessage = this.container.querySelector('#feedback-message');
        const feedbackExplanation = this.container.querySelector('#feedback-explanation');
        const card = this.container.querySelector('#mini-quiz-card');
        const optionsContainer = this.container.querySelector('#mini-quiz-options');

        // Update card style
        if (isCorrect) {
            card.classList.remove('border-blue-100');
            card.classList.add('border-green-400', 'bg-green-50');
            feedbackContainer.classList.add('bg-green-600', 'text-white');
            feedbackMessage.innerHTML = '🤙 Shoots! Correct!';
            selectedBtn.classList.add('border-green-500', 'bg-green-100', 'text-green-800');
            selectedBtn.innerHTML += '<i class="ti ti-circle-check text-green-600 text-xl"></i>';
        } else {
            card.classList.remove('border-blue-100');
            card.classList.add('border-red-400', 'bg-red-50');
            feedbackContainer.classList.add('bg-red-600', 'text-white');
            feedbackMessage.innerHTML = '❌ Aww, not quite!';
            selectedBtn.classList.add('border-red-500', 'bg-red-100', 'text-red-800');
            selectedBtn.innerHTML += '<i class="ti ti-circle-x text-red-600 text-xl"></i>';
            
            // Highlight correct answer
            const correctIndex = this.question.correctAnswer !== undefined 
                ? this.question.correctAnswer 
                : this.question.options.findIndex(opt => opt.points > 0);
                
            if (correctIndex !== -1) {
                const correctBtn = this.container.querySelectorAll('.mini-quiz-option')[correctIndex];
                correctBtn.classList.add('border-green-500', 'bg-green-100', 'text-green-800');
            }
        }

        feedbackExplanation.textContent = this.question.explanation || this.question.description || '';
        feedbackContainer.classList.remove('hidden');
        
        // Disable all buttons
        this.container.querySelectorAll('.mini-quiz-option').forEach(btn => {
            btn.disabled = true;
            btn.classList.remove('hover:border-blue-400', 'hover:bg-blue-50');
        });

        // Add next button listener
        this.container.querySelector('#next-mini-quiz').addEventListener('click', () => {
            this.answered = false;
            this.init();
        });

        // Track event if gtag is available
        if (window.gtag) {
            window.gtag('event', 'mini_quiz_answer', {
                'question_id': this.question.id,
                'is_correct': isCorrect
            });
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('mini-quiz-container')) {
        window.miniQuiz = new MiniQuiz();
    }
});
