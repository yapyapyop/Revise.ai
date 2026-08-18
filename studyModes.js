// studyModes.js

export class SpacedRepetitionCard {
    constructor(question, id) {
        this.question = question;
        this.id = id;
        this.interval = 1; // How many questions until next review
        this.repetition = 0; // How many times reviewed
        this.easeFactor = 2.5; // How easy this card is
        this.dueAfter = 0; // Show after this many questions have been answered
        this.consecutiveCorrect = 0; // Track consecutive correct answers
    }

    updateCard(correct, questionsAnswered) {
        this.repetition++;

        if (correct) {
            this.consecutiveCorrect++;

            if (this.consecutiveCorrect === 1) {
                this.interval = 1;
            } else if (this.consecutiveCorrect === 2) {
                this.interval = 3;
            } else {
                this.interval = Math.round(this.interval * this.easeFactor);
            }

            this.easeFactor = Math.min(this.easeFactor + 0.1, 3.0);

            if (this.consecutiveCorrect >= 3 && this.interval >= 5) {
                return 'mastered';
            }
        } else {
            this.consecutiveCorrect = 0;
            this.interval = 3;
            this.easeFactor = Math.max(this.easeFactor - 0.2, 1.3);
        }

        this.dueAfter = questionsAnswered + this.interval;
        return correct ? 'correct' : 'incorrect';
    }

    isDue(questionsAnswered) {
        return questionsAnswered >= this.dueAfter;
    }
}

// In studyModes.js
export class QuizSession {
    constructor(questions, mode, randomOrder = false, title = 'Practice Set') {
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
            this.cards = this.originalQuestions.map((q, i) => new SpacedRepetitionCard(q, i));
            this.masteredCards = [];
            this.newCards = [...this.cards];
            this.reviewCards = [];
            this.currentCard = null;
        } else {
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
        this.updateReviewQueue();

        let nextCard = null;

        if (this.reviewCards.length > 0) {
            const dueReviewCards = this.reviewCards.filter(card => card.isDue(this.questionsAnswered));
            if (dueReviewCards.length > 0) {
                const randomIndex = Math.floor(Math.random() * dueReviewCards.length);
                nextCard = dueReviewCards[randomIndex];
            }
        }

        if (!nextCard && this.newCards.length > 0) {
            nextCard = this.newCards.shift();
        }

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
        if (this.answered || !this.currentQuestion) return { isCorrect: false, status: 'error' };

        this.answered = true;
        this.questionsAnswered++;

        const isCorrect = selectedAnswer === this.currentQuestion.correct;
        if (isCorrect) {
            this.questionsCorrect++;
        }

        let cardStatus = isCorrect ? 'correct' : 'incorrect';

        if (this.mode === 'elimination') {
            if (!isCorrect) {
                this.wrongAnswers.push(this.currentQuestion);
            }
        } else {
            cardStatus = this.currentCard.updateCard(isCorrect, this.questionsAnswered);

            if (cardStatus === 'mastered') {
                this.reviewCards = this.reviewCards.filter(card => card.id !== this.currentCard.id);
                this.masteredCards.push(this.currentCard);
            } else {
                if (!this.reviewCards.includes(this.currentCard)) {
                    this.reviewCards.push(this.currentCard);
                }
            }
        }

        return { isCorrect: isCorrect, status: cardStatus };
    }

    getProgress() {
        if (this.mode === 'elimination') {
            return {
                current: this.questionsAnswered,
                total: this.originalQuestions.length,
                percentage: (this.questionsAnswered / this.originalQuestions.length) * 100
            };
        } else {
            const totalCards = this.originalQuestions.length;
            const masteredCount = this.masteredCards.length;
            return {
                current: masteredCount,
                total: totalCards,
                percentage: (masteredCount / totalCards) * 100,
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

    getDebugInfo() {
        if (this.mode !== 'spaced-repetition') return '';
        return this.currentCard ?
            `Current card: ${this.currentCard.consecutiveCorrect} correct, interval: ${this.currentCard.interval}` : '';
    }

    // --- NEW METHOD 1: Export current session state to JSON-friendly object ---
    exportSaveData() {
        const saveData = {
            mode: this.mode,
            randomOrder: this.randomOrder,
            title: this.title,
            questionsAnswered: this.questionsAnswered,
            questionsCorrect: this.questionsCorrect,
            originalQuestions: this.originalQuestions
        };

        if (this.mode === 'spaced-repetition') {
            saveData.cards = this.cards.map(card => ({
                id: card.id,
                interval: card.interval,
                repetition: card.repetition,
                easeFactor: card.easeFactor,
                dueAfter: card.dueAfter,
                consecutiveCorrect: card.consecutiveCorrect,
                isMastered: this.masteredCards.some(c => c.id === card.id),
                isNew: this.newCards.some(c => c.id === card.id),
                isReview: this.reviewCards.some(c => c.id === card.id)
            }));
        } else {
            saveData.questionsQueue = this.questionsQueue;
            saveData.wrongAnswers = this.wrongAnswers;
        }

        return saveData;
    }

    // --- NEW METHOD 2: Restore session state from saved object ---
    loadFromSave(savedData) {
        this.mode = savedData.mode;
        this.randomOrder = savedData.randomOrder;
        this.title = savedData.title || this.title;
        this.questionsAnswered = savedData.questionsAnswered;
        this.questionsCorrect = savedData.questionsCorrect;
        this.originalQuestions = savedData.originalQuestions || this.originalQuestions;

        if (this.mode === 'spaced-repetition') {
            this.cards = savedData.cards.map(cardData => {
                const question = this.originalQuestions[cardData.id] || this.originalQuestions[0];
                const card = new SpacedRepetitionCard(question, cardData.id);
                card.interval = cardData.interval;
                card.repetition = cardData.repetition;
                card.easeFactor = cardData.easeFactor;
                card.dueAfter = cardData.dueAfter;
                card.consecutiveCorrect = cardData.consecutiveCorrect;
                return card;
            });

            this.masteredCards = [];
            this.newCards = [];
            this.reviewCards = [];

            savedData.cards.forEach((cardData, idx) => {
                const card = this.cards[idx];
                if (cardData.isMastered) {
                    this.masteredCards.push(card);
                } else if (cardData.isReview) {
                    this.reviewCards.push(card);
                } else {
                    this.newCards.push(card);
                }
            });
        } else {
            this.questionsQueue = savedData.questionsQueue || [];
            this.wrongAnswers = savedData.wrongAnswers || [];
        }
    }
}