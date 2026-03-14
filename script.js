// Import the questions from the external file
import allQuestions from './questions.js';

document.addEventListener('DOMContentLoaded', () => {
    // Settings and UI state
    let isSpacedRepetition = false;
    let isDarkMode = false;
    let isRandomOrder = false;

    // DOM elements
    const startScreen = document.getElementById('startScreen');
    const quizScreen = document.getElementById('quizScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    const settingsOverlay = document.getElementById('settingsOverlay');

    const startBtn = document.getElementById('startBtn');
    const nextBtn = document.getElementById('nextBtn');
    const reviewBtn = document.getElementById('reviewBtn');
    const restartBtn = document.getElementById('restartBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');

    const questionEl = document.getElementById('question');
    const optionsEl = document.getElementById('options');
    const feedbackEl = document.getElementById('feedback');
    const questionCounterEl = document.getElementById('questionCounter');
    const progressFillEl = document.getElementById('progressFill');
    const quizTitleEl = document.getElementById('quizTitle');
    const finalScoreEl = document.getElementById('finalScore');
    const resultsTextEl = document.getElementById('resultsText');

    const studyModeToggle = document.getElementById('studyModeToggle');
    const studyModeText = document.getElementById('studyModeText');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeText = document.getElementById('darkModeText');
    const randomOrderToggle = document.getElementById('randomOrderToggle');
    const randomOrderText = document.getElementById('randomOrderText');
    const modeIndicator = document.getElementById('modeIndicator');
    const quizModeIndicator = document.getElementById('quizModeIndicator');

    // Spaced Repetition Card System
    class SpacedRepetitionCard {
        constructor(question, id) {
            this.question = question;
            this.id = id;
            this.interval = 1; // How many questions until next review
            this.repetition = 0; // How many times reviewed
            this.easeFactor = 2.5; // How easy this card is (affects future intervals)
            this.dueAfter = 0; // Show after this many questions have been answered
            this.consecutiveCorrect = 0; // Track consecutive correct answers
        }

        // Update card based on performance (correct/incorrect)
        updateCard(correct, questionsAnswered) {
            this.repetition++;

            if (correct) {
                this.consecutiveCorrect++;

                // Calculate next interval using spaced repetition algorithm
                if (this.consecutiveCorrect === 1) {
                    this.interval = 1; // Review again soon
                } else if (this.consecutiveCorrect === 2) {
                    this.interval = 3; // Review in 3 questions
                } else {
                    this.interval = Math.round(this.interval * this.easeFactor);
                }

                // Increase ease factor for easy cards
                this.easeFactor = Math.min(this.easeFactor + 0.1, 3.0);

                // Card is mastered after 3 consecutive correct answers with intervals
                if (this.consecutiveCorrect >= 3 && this.interval >= 5) {
                    return 'mastered';
                }

            } else {
                // Reset consecutive correct count and make it review sooner
                this.consecutiveCorrect = 0;
                this.interval = 3;
                this.easeFactor = Math.max(this.easeFactor - 0.2, 1.3);
            }

            // Set when this card should appear again
            this.dueAfter = questionsAnswered + this.interval;
            return correct ? 'correct' : 'incorrect';
        }

        // Check if this card is due for review
        isDue(questionsAnswered) {
            return questionsAnswered >= this.dueAfter;
        }
    }

    // Quiz state - completely rewritten for proper spaced repetition
    class QuizSession {
        constructor(questions, mode, randomOrder = false, title = 'Study Session') {
            this.originalQuestions = [...questions];
            this.mode = mode;
            this.randomOrder = randomOrder;
            this.title = title;
            this.reset();
        }

        reset() {
            this.questionsAnswered = 0;
            this.questionsCorrect = 0;
            this.currentQuestion = null;
            this.answered = false;
            this.isComplete = false;

            if (this.mode === 'spaced-repetition') {
                // Create spaced repetition cards
                this.cards = this.originalQuestions.map((q, i) => new SpacedRepetitionCard(q, i));
                this.masteredCards = [];
                this.newCards = [...this.cards]; // Cards not yet introduced
                this.reviewCards = []; // Cards due for review
                this.currentCard = null;
            } else {
                // Elimination mode - respect randomOrder setting
                if (this.randomOrder) {
                    this.questionsQueue = this.shuffleArray([...this.originalQuestions]);
                } else {
                    this.questionsQueue = [...this.originalQuestions];
                }
                this.wrongAnswers = [];
            }
        }

        shuffleArray(array) {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        }

        getNextQuestion() {
            if (this.mode === 'elimination') {
                return this.getNextEliminationQuestion();
            } else {
                return this.getNextSpacedRepetitionQuestion();
            }
        }

        getNextEliminationQuestion() {
            if (this.questionsQueue.length === 0) {
                this.isComplete = true;
                return null;
            }
            this.currentQuestion = this.questionsQueue.shift();
            this.answered = false;
            return this.currentQuestion;
        }

        getNextSpacedRepetitionQuestion() {
            // Update review cards - check which cards are now due
            this.updateReviewQueue();

            // Choose next card: prioritize review cards, then new cards
            let nextCard = null;

            if (this.reviewCards.length > 0) {
                // Pick a random review card that's due
                const dueReviewCards = this.reviewCards.filter(card => card.isDue(this.questionsAnswered));
                if (dueReviewCards.length > 0) {
                    const randomIndex = Math.floor(Math.random() * dueReviewCards.length);
                    nextCard = dueReviewCards[randomIndex];
                }
            }

            // If no review cards due, introduce a new card
            if (!nextCard && this.newCards.length > 0) {
                nextCard = this.newCards.shift(); // Take first new card
            }

            // If we have no cards left, session is complete
            if (!nextCard) {
                this.isComplete = true;
                return null;
            }

            this.currentCard = nextCard;
            this.currentQuestion = nextCard.question;
            this.answered = false;
            return this.currentQuestion;
        }

        updateReviewQueue() {
            // Move any due cards that aren't already in review queue
            this.cards.forEach(card => {
                if (card.isDue(this.questionsAnswered) &&
                    !this.reviewCards.includes(card) &&
                    !this.newCards.includes(card) &&
                    !this.masteredCards.includes(card)) {
                    this.reviewCards.push(card);
                }
            });
        }

        answerQuestion(selectedAnswer) {
            if (this.answered || !this.currentQuestion) return false;

            this.answered = true;
            this.questionsAnswered++;

            const isCorrect = selectedAnswer === this.currentQuestion.correct;
            if (isCorrect) {
                this.questionsCorrect++;
            }

            if (this.mode === 'elimination') {
                if (!isCorrect) {
                    this.wrongAnswers.push(this.currentQuestion);
                }
            } else {
                // Spaced repetition: update the card
                const result = this.currentCard.updateCard(isCorrect, this.questionsAnswered);

                if (result === 'mastered') {
                    // Remove from review queue and mark as mastered
                    this.reviewCards = this.reviewCards.filter(card => card.id !== this.currentCard.id);
                    this.masteredCards.push(this.currentCard);

                    // Visual feedback that card was mastered
                    setTimeout(() => {
                        if (feedbackEl) {
                            feedbackEl.innerHTML += '<br><em>✨ Question mastered!</em>';
                        }
                    }, 100);

                } else if (result === 'correct') {
                    // Move to review queue if not already there
                    if (!this.reviewCards.includes(this.currentCard)) {
                        this.reviewCards.push(this.currentCard);
                    }
                } else {
                    // Incorrect: make sure it's in review queue for soon
                    if (!this.reviewCards.includes(this.currentCard)) {
                        this.reviewCards.push(this.currentCard);
                    }
                }
            }

            return isCorrect;
        }

        getProgress() {
            if (this.mode === 'elimination') {
                return {
                    current: this.questionsAnswered,
                    total: this.originalQuestions.length,
                    percentage: (this.questionsAnswered / this.originalQuestions.length) * 100
                };
            } else {
                // Spaced repetition: show mastery progress
                const totalCards = this.originalQuestions.length;
                const masteredCount = this.masteredCards.length;
                return {
                    current: masteredCount,
                    total: totalCards,
                    percentage: (masteredCount / totalCards) * 100,
                    // Additional info for spaced repetition
                    newCards: this.newCards.length,
                    reviewCards: this.reviewCards.filter(card => card.isDue(this.questionsAnswered)).length,
                    mastered: masteredCount
                };
            }
        }

        getProgressText() {
            const progress = this.getProgress();
            if (this.mode === 'elimination') {
                return `Question ${progress.current + 1} of ${progress.total}`;
            } else {
                const dueReviews = this.reviewCards.filter(card => card.isDue(this.questionsAnswered)).length;
                return `Mastered: ${progress.mastered}/${progress.total} | New: ${progress.newCards} | Review: ${dueReviews}`;
            }
        }

        getFinalScore() {
            return {
                correct: this.questionsCorrect,
                total: this.questionsAnswered,
                percentage: this.questionsAnswered > 0 ? Math.round((this.questionsCorrect / this.questionsAnswered) * 100) : 0
            };
        }

        hasWrongAnswers() {
            return this.mode === 'elimination' && this.wrongAnswers.length > 0;
        }

        createReviewSession() {
            if (!this.hasWrongAnswers()) return null;
            return new QuizSession(this.wrongAnswers, 'elimination', this.randomOrder, 'Reviewing Mistakes');
        }

        // Get some debug info for spaced repetition
        getDebugInfo() {
            if (this.mode !== 'spaced-repetition') return '';

            const currentCardInfo = this.currentCard ?
                `Current card: ${this.currentCard.consecutiveCorrect} correct, interval: ${this.currentCard.interval}` : '';

            return currentCardInfo;
        }
    }

    let currentSession = null;

    // Theme handlers
    darkModeToggle.addEventListener('change', (e) => {
        isDarkMode = e.target.checked;
        applyTheme();
    });

    function applyTheme() {
        if (isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            darkModeText.textContent = 'Dark Mode';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            darkModeText.textContent = 'Light Mode';
        }
    }

    // Settings handlers
    settingsBtn.addEventListener('click', () => {
        settingsOverlay.style.display = 'flex';
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsOverlay.style.display = 'none';
    });

    settingsOverlay.addEventListener('click', (e) => {
        if (e.target === settingsOverlay) {
            settingsOverlay.style.display = 'none';
        }
    });

    studyModeToggle.addEventListener('change', (e) => {
        isSpacedRepetition = e.target.checked;
        updateModeIndicators();
    });

    randomOrderToggle.addEventListener('change', (e) => {
        isRandomOrder = e.target.checked;
        randomOrderText.textContent = isRandomOrder ? 'Random Order' : 'Sequential Order';
    });

    function updateModeIndicators() {
        const modeText = isSpacedRepetition ? 'Spaced Repetition Mode' : 'Elimination Mode';
        studyModeText.textContent = modeText;
        modeIndicator.textContent = modeText + ' Active';

        if (quizModeIndicator) {
            quizModeIndicator.textContent = isSpacedRepetition ? 'Spaced Repetition' : 'Elimination Mode';
        }
    }

    // Quiz event handlers
    startBtn.addEventListener('click', startQuiz);
    nextBtn.addEventListener('click', nextQuestion);
    reviewBtn.addEventListener('click', startReview);
    restartBtn.addEventListener('click', restartQuiz);

    function startQuiz() {
        const mode = isSpacedRepetition ? 'spaced-repetition' : 'elimination';
        currentSession = new QuizSession(allQuestions, mode, isRandomOrder);
        startSession();
    }

    function startReview() {
        if (currentSession && currentSession.hasWrongAnswers()) {
            currentSession = currentSession.createReviewSession();
            startSession();
        }
    }

    function startSession() {
        startScreen.style.display = 'none';
        resultsScreen.style.display = 'none';
        quizScreen.style.display = 'block';

        quizTitleEl.textContent = currentSession.title;
        updateModeIndicators();
        showQuestion();
    }

    function showQuestion() {
        const question = currentSession.getNextQuestion();

        if (!question) {
            showResults();
            return;
        }

        // Setup question display
        const allAnswers = [question.correct, ...question.wrong];
        const shuffledAnswers = currentSession.shuffleArray ?
            currentSession.shuffleArray(allAnswers) :
            allAnswers.sort(() => Math.random() - 0.5);

        questionEl.textContent = question.question;

        // Update progress - different display for each mode
        const progressText = currentSession.getProgressText();
        const progress = currentSession.getProgress();

        questionCounterEl.textContent = progressText;
        progressFillEl.style.width = progress.percentage + '%';

        // Create answer options
        optionsEl.innerHTML = '';
        shuffledAnswers.forEach(answer => {
            const option = document.createElement('div');
            option.className = 'option';
            option.textContent = answer;
            option.addEventListener('click', () => selectAnswer(option, answer, question.correct));
            optionsEl.appendChild(option);
        });

        feedbackEl.style.display = 'none';
        nextBtn.disabled = true;

        // Add debug info for spaced repetition
        if (currentSession.mode === 'spaced-repetition') {
            const debugInfo = currentSession.getDebugInfo();
            if (debugInfo) {
                console.log(debugInfo); // For debugging
            }
        }
    }

    function selectAnswer(optionElement, answer, correctAnswer) {
        if (currentSession.answered) return;

        const isCorrect = currentSession.answerQuestion(answer);

        // Update UI
        const allOptions = document.querySelectorAll('.option');
        allOptions.forEach(opt => {
            opt.classList.add('disabled');
            if (opt.textContent === correctAnswer) {
                opt.classList.add('correct');
            }
        });

        if (isCorrect) {
            feedbackEl.className = 'feedback correct';
            if (currentSession.mode === 'spaced-repetition') {
                const card = currentSession.currentCard;
                if (card.consecutiveCorrect === 1) {
                    feedbackEl.textContent = 'Correct! You\'ll see this again soon.';
                } else if (card.consecutiveCorrect === 2) {
                    feedbackEl.textContent = 'Correct again! Getting better at this one.';
                } else {
                    feedbackEl.textContent = 'Excellent! This question is getting easier for you.';
                }
            } else {
                feedbackEl.textContent = 'Correct! Well done.';
            }
        } else {
            optionElement.classList.add('incorrect');
            feedbackEl.className = 'feedback incorrect';
            if (currentSession.mode === 'spaced-repetition') {
                feedbackEl.textContent = `Incorrect. You'll see this question again soon. The correct answer is: ${correctAnswer}`;
            } else {
                feedbackEl.textContent = `Incorrect. The correct answer is: ${correctAnswer}`;
            }
        }

        feedbackEl.style.display = 'block';
        nextBtn.disabled = false;
    }

    function nextQuestion() {
        showQuestion();
    }

    function showResults() {
        quizScreen.style.display = 'none';
        resultsScreen.style.display = 'block';

        const score = currentSession.getFinalScore();
        finalScoreEl.textContent = `${score.percentage}%`;

        if (currentSession.mode === 'spaced-repetition') {
            const progress = currentSession.getProgress();
            resultsTextEl.textContent = `Great work! You mastered ${progress.mastered} out of ${progress.total} questions. You answered ${score.correct} out of ${score.total} questions correctly overall.`;
        } else {
            resultsTextEl.textContent = `You got ${score.correct} out of ${score.total} questions correct!`;
        }

        // Show review button only for elimination mode with wrong answers
        reviewBtn.style.display = currentSession.hasWrongAnswers() ? 'inline-block' : 'none';
    }

    function restartQuiz() {
        resultsScreen.style.display = 'none';
        startScreen.style.display = 'block';
        currentSession = null;
    }

    // Initialize
    applyTheme();
    updateModeIndicators();
});