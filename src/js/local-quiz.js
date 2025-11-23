// "How Local You Stay?" Quiz Logic

class LocalQuiz {
    constructor() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.selectedAnswers = [];
        this.questions = localQuizData.questions;
        this.totalQuestions = this.questions.length;

        this.initElements();
        this.attachEventListeners();
    }

    initElements() {
        // Screens
        this.startScreen = document.getElementById('start-screen');
        this.quizScreen = document.getElementById('quiz-screen');
        this.resultsScreen = document.getElementById('results-screen');

        // Buttons
        this.startBtn = document.getElementById('start-quiz-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.retakeBtn = document.getElementById('retake-quiz-btn');
        this.shareBtn = document.getElementById('share-results-btn');

        // Quiz elements
        this.questionEmoji = document.getElementById('question-emoji');
        this.questionText = document.getElementById('question-text');
        this.questionDescription = document.getElementById('question-description');
        this.optionsContainer = document.getElementById('options-container');
        this.feedbackContainer = document.getElementById('feedback-container');
        this.feedbackText = document.getElementById('feedback-text');

        // Progress elements
        this.currentQuestionSpan = document.getElementById('current-question');
        this.totalQuestionsSpan = document.getElementById('total-questions');
        this.currentScoreSpan = document.getElementById('current-score');
        this.progressBar = document.getElementById('progress-bar');

        // Result elements
        this.resultEmoji = document.getElementById('result-emoji');
        this.resultLevel = document.getElementById('result-level');
        this.resultTitle = document.getElementById('result-title');
        this.finalScoreSpan = document.getElementById('final-score');
        this.resultDescription = document.getElementById('result-description');
        this.resultTips = document.getElementById('result-tips');
    }

    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.startQuiz());
        this.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.retakeBtn.addEventListener('click', () => this.retakeQuiz());
        this.shareBtn.addEventListener('click', () => this.shareResults());
    }

    startQuiz() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.selectedAnswers = [];

        this.startScreen.classList.add('hidden');
        this.quizScreen.classList.remove('hidden');
        this.resultsScreen.classList.add('hidden');

        this.totalQuestionsSpan.textContent = this.totalQuestions;
        this.displayQuestion();
    }

    displayQuestion() {
        const question = this.questions[this.currentQuestionIndex];

        // Update progress
        this.currentQuestionSpan.textContent = this.currentQuestionIndex + 1;
        this.currentScoreSpan.textContent = this.score;
        const progress = ((this.currentQuestionIndex) / this.totalQuestions) * 100;
        this.progressBar.style.width = `${progress}%`;

        // Update question
        this.questionEmoji.textContent = question.image;
        this.questionText.textContent = question.question;
        this.questionDescription.textContent = question.description;

        // Clear and hide feedback
        this.feedbackContainer.classList.add('hidden');
        this.nextBtn.classList.add('hidden');

        // Create options
        this.optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'quiz-option bg-white border-4 border-gray-300 rounded-2xl p-6 text-center';
            optionDiv.innerHTML = `
                <p class="text-lg font-bold text-gray-800">${option.text}</p>
            `;
            optionDiv.addEventListener('click', () => this.selectOption(index));
            this.optionsContainer.appendChild(optionDiv);
        });

        // Trigger animation
        const questionCard = document.getElementById('question-container');
        questionCard.style.animation = 'none';
        setTimeout(() => {
            questionCard.style.animation = 'slideIn 0.5s ease';
        }, 10);
    }

    selectOption(optionIndex) {
        const question = this.questions[this.currentQuestionIndex];
        const selectedOption = question.options[optionIndex];
        const allOptions = this.optionsContainer.querySelectorAll('.quiz-option');

        // Disable all options after selection
        allOptions.forEach(opt => {
            opt.style.pointerEvents = 'none';
        });

        // Add score
        this.score += selectedOption.points;

        // Store answer
        this.selectedAnswers.push({
            questionId: question.id,
            selectedOption: optionIndex,
            points: selectedOption.points
        });

        // Visual feedback
        const selectedDiv = allOptions[optionIndex];
        if (selectedOption.points >= 8) {
            selectedDiv.classList.add('correct');
        } else {
            selectedDiv.classList.add('incorrect');
        }

        // Show feedback
        this.feedbackText.textContent = selectedOption.feedback;
        this.feedbackContainer.classList.remove('hidden');

        if (selectedOption.points >= 8) {
            this.feedbackContainer.className = 'mt-6 p-4 rounded-lg bg-green-100 border-l-4 border-green-500';
        } else {
            this.feedbackContainer.className = 'mt-6 p-4 rounded-lg bg-red-100 border-l-4 border-red-500';
        }

        // Show next button after a delay
        setTimeout(() => {
            this.nextBtn.classList.remove('hidden');
        }, 800);
    }

    nextQuestion() {
        this.currentQuestionIndex++;

        if (this.currentQuestionIndex < this.totalQuestions) {
            this.displayQuestion();
        } else {
            this.showResults();
        }
    }

    showResults() {
        this.quizScreen.classList.add('hidden');
        this.resultsScreen.classList.remove('hidden');

        // Calculate result level
        const result = this.getResultLevel(this.score);

        // Display results
        this.resultEmoji.textContent = result.emoji;
        this.resultLevel.textContent = result.level;
        this.resultTitle.textContent = result.title;
        this.finalScoreSpan.textContent = this.score;
        this.resultDescription.textContent = result.description;

        // Display tips
        this.resultTips.innerHTML = '';
        result.tips.forEach(tip => {
            const li = document.createElement('li');
            li.className = 'text-gray-700';
            li.textContent = `• ${tip}`;
            this.resultTips.appendChild(li);
        });

        // Track completion with Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'quiz_complete', {
                'event_category': 'Quiz',
                'event_label': result.level,
                'value': this.score
            });
        }
    }

    getResultLevel(score) {
        const maxPossibleScore = 120; // 12 questions × 10 points each
        const results = localQuizData.results;

        for (let result of results) {
            if (score >= result.minScore && score <= result.maxScore) {
                return result;
            }
        }

        // Fallback to highest level if score exceeds max
        return results[results.length - 1];
    }

    retakeQuiz() {
        this.resultsScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
    }

    shareResults() {
        const result = this.getResultLevel(this.score);
        const shareText = `I just took the "How Local You Stay?" quiz on ChokePidgin.com!\n\nMy result: ${result.level} - ${result.title}\nScore: ${this.score}/120 points\n\n🤙 Think you're more local than me? Take the quiz!`;
        const shareUrl = window.location.href;

        // Try native share API first (mobile)
        if (navigator.share) {
            navigator.share({
                title: 'How Local You Stay? Quiz Results',
                text: shareText,
                url: shareUrl
            }).catch(err => {
                console.log('Share failed:', err);
                this.fallbackShare(shareText, shareUrl);
            });
        } else {
            this.fallbackShare(shareText, shareUrl);
        }
    }

    fallbackShare(text, url) {
        // Copy to clipboard
        const fullText = `${text}\n\n${url}`;
        navigator.clipboard.writeText(fullText).then(() => {
            alert('Results copied to clipboard! 📋\n\nShare it on social media!');
        }).catch(err => {
            // If clipboard fails, show the text
            alert(fullText);
        });
    }
}

// Initialize quiz when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const quiz = new LocalQuiz();
});
