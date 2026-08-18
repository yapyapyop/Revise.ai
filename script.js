// script.js
import {
    loadQuestionsFromStorage,
    saveQuestionsToStorage,
    saveActiveSession,
    loadActiveSession,
    clearActiveSession
} from './storage.js';

import { QuizSession } from './studyModes.js';

document.addEventListener('DOMContentLoaded', () => {
    // Settings and UI state
    let isSpacedRepetition = false;
    let isDarkMode = false;
    let isRandomOrder = false;

    // DOM elements - Screens
    const startScreen = document.getElementById('startScreen');
    const quizScreen = document.getElementById('quizScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    const settingsOverlay = document.getElementById('settingsOverlay');

    // DOM elements - Dashboard Cards & Stats
    const activeSessionCard = document.getElementById('activeSessionCard');
    const defaultSessionCard = document.getElementById('defaultSessionCard');
    const cardSetTitle = document.getElementById('cardSetTitle');
    const cardProgressFill = document.getElementById('cardProgressFill');
    const cardProgressText = document.getElementById('cardProgressText');
    const cardAccuracyText = document.getElementById('cardAccuracyText');
    const badgeContainer = document.getElementById('badgeContainer');

    // DOM elements - Action Buttons
    const startBtn = document.getElementById('startBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const startNewBtn = document.getElementById('startNewBtn');
    const exitQuizBtn = document.getElementById('exitQuizBtn');
    const nextBtn = document.getElementById('nextBtn');
    const reviewBtn = document.getElementById('reviewBtn');
    const restartBtn = document.getElementById('restartBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');

    // DOM elements - Quiz Screen
    const questionEl = document.getElementById('question');
    const optionsEl = document.getElementById('options');
    const feedbackEl = document.getElementById('feedback');
    const questionCounterEl = document.getElementById('questionCounter');
    const progressFillEl = document.getElementById('progressFill');
    const quizTitleEl = document.getElementById('quizTitle');
    const finalScoreEl = document.getElementById('finalScore');
    const resultsTextEl = document.getElementById('resultsText');

    // DOM elements - Settings Modal
    const studyModeToggle = document.getElementById('studyModeToggle');
    const studyModeText = document.getElementById('studyModeText');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeText = document.getElementById('darkModeText');
    const randomOrderToggle = document.getElementById('randomOrderToggle');
    const randomOrderText = document.getElementById('randomOrderText');
    const quizModeIndicator = document.getElementById('quizModeIndicator');

    // Question Manager elements
    const manageQuestionsBtn = document.getElementById('manageQuestionsBtn');
    const questionManagerOverlay = document.getElementById('questionManagerOverlay');
    const closeQuestionManagerBtn = document.getElementById('closeQuestionManagerBtn');
    const doneManagingBtn = document.getElementById('doneManagingBtn');
    const questionCount = document.getElementById('questionCount');
    const questionList = document.getElementById('questionList');
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const jsonFileInput = document.getElementById('jsonFileInput');
    const pasteJsonBtn = document.getElementById('pasteJsonBtn');
    const pasteSpreadsheetBtn = document.getElementById('pasteSpreadsheetBtn');
    const downloadJsonBtn = document.getElementById('downloadJsonBtn');
    const copyJsonBtn = document.getElementById('copyJsonBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');

    // Current questions in use
    let currentQuestions = loadQuestionsFromStorage();
    let currentSession = null;

    // --- QUIZ EXIT BUTTON ([X]) HANDLER ---
    if (exitQuizBtn) {
        exitQuizBtn.addEventListener('click', () => {
            if (currentSession && !currentSession.isComplete) {
                saveActiveSession(currentSession.exportSaveData());
            }

            quizScreen.style.display = 'none';
            startScreen.style.display = 'block';

            checkActiveSession();
        });
    }

    // --- DASHBOARD & ACTIVE SESSION CHECK ---
    function checkActiveSession() {
        const savedSession = loadActiveSession();
        const dashboardSubtitle = document.getElementById('dashboardSubtitle');

        if (savedSession && savedSession.questionsAnswered > 0) {
            if (activeSessionCard) activeSessionCard.style.display = 'block';
            if (defaultSessionCard) defaultSessionCard.style.display = 'none';
            if (dashboardSubtitle) dashboardSubtitle.textContent = 'Pick up where you left off:';

            if (cardSetTitle) cardSetTitle.textContent = savedSession.title || 'Practice Set';

            let progressPercentage = 0;
            const totalQuestions = savedSession.totalQuestions || savedSession.originalQuestions?.length || currentQuestions.length || 1;

            if (savedSession.mode === 'elimination') {
                progressPercentage = Math.round((savedSession.questionsAnswered / totalQuestions) * 100);
            } else {
                const masteredCount = savedSession.masteredCards?.length || 0;
                const cardsReviewedCount = savedSession.cards?.filter(c => c.repetition > 0).length || 0;

                if (masteredCount > 0) {
                    progressPercentage = Math.round((masteredCount / totalQuestions) * 100);
                } else {
                    progressPercentage = Math.min(90, Math.round((cardsReviewedCount / totalQuestions) * 100));
                }
            }
            progressPercentage = Math.min(100, Math.max(0, progressPercentage));

            const accuracyPercentage = savedSession.questionsAnswered > 0
                ? Math.round((savedSession.questionsCorrect / savedSession.questionsAnswered) * 100)
                : 0;

            if (cardProgressFill) cardProgressFill.style.width = `${progressPercentage}%`;
            if (cardProgressText) cardProgressText.textContent = `Progress: ${progressPercentage}%`;
            if (cardAccuracyText) cardAccuracyText.textContent = `Accuracy: ${accuracyPercentage}% correct`;

        } else {
            if (activeSessionCard) activeSessionCard.style.display = 'none';
            if (defaultSessionCard) defaultSessionCard.style.display = 'block';
            if (dashboardSubtitle) dashboardSubtitle.textContent = 'Select your study mode and start learning:';
        }
    }

    function updateModeIndicators() {
        const modeText = isSpacedRepetition ? 'Spaced Repetition Mode' : 'Elimination Mode';
        if (studyModeText) studyModeText.textContent = modeText;
        if (quizModeIndicator) quizModeIndicator.textContent = isSpacedRepetition ? 'Spaced Repetition' : 'Elimination Mode';

        if (badgeContainer) {
            badgeContainer.innerHTML = '';

            const modeBadge = document.createElement('div');
            modeBadge.className = 'study-mode-indicator';
            modeBadge.style.cursor = 'pointer';
            modeBadge.style.marginBottom = '0';
            modeBadge.textContent = isSpacedRepetition ? 'Spaced Repetition Mode Active' : 'Elimination Mode Active';
            modeBadge.addEventListener('click', () => settingsOverlay.style.display = 'flex');
            badgeContainer.appendChild(modeBadge);

            if (isRandomOrder) {
                const orderBadge = document.createElement('div');
                orderBadge.className = 'study-mode-indicator';
                orderBadge.style.cursor = 'pointer';
                orderBadge.style.marginBottom = '0';
                orderBadge.textContent = 'Random Order Active';
                orderBadge.addEventListener('click', () => settingsOverlay.style.display = 'flex');
                badgeContainer.appendChild(orderBadge);
            }
        }
    }

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
        updateModeIndicators();
    });

    // Session Button Handlers
    if (startBtn) startBtn.addEventListener('click', startQuiz);

    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            const savedData = loadActiveSession();
            if (!savedData) return;

            currentSession = new QuizSession(
                savedData.originalQuestions || currentQuestions,
                savedData.mode,
                savedData.randomOrder,
                savedData.title
            );
            currentSession.loadFromSave(savedData);
            startSession();
        });
    }

    if (startNewBtn) {
        startNewBtn.addEventListener('click', () => {
            if (confirm("Are you sure? This will erase your current session progress.")) {
                clearActiveSession();
                checkActiveSession();
                startQuiz();
            }
        });
    }

    nextBtn.addEventListener('click', nextQuestion);
    reviewBtn.addEventListener('click', startReview);
    restartBtn.addEventListener('click', restartQuiz);

    function startQuiz() {
        if (currentQuestions.length === 0) {
            alert('Please add some questions first!');
            return;
        }
        const mode = isSpacedRepetition ? 'spaced-repetition' : 'elimination';
        
        // Pass 'Practice Set' as the title here:
        currentSession = new QuizSession(currentQuestions, mode, isRandomOrder, 'Practice Set');
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

        // FIX: If the saved title is the old 'Study Session' or empty, change it to 'Practice Set'!
        quizTitleEl.textContent = (!currentSession.title || currentSession.title === 'Study Session') 
            ? 'Practice Set' 
            : currentSession.title;

        updateModeIndicators();
        showQuestion();
    }

    function showQuestion() {
        const question = currentSession.getNextQuestion();

        if (!question) {
            showResults();
            return;
        }

        const allAnswers = [question.correct, ...question.wrong];
        const shuffledAnswers = currentSession.shuffleArray ?
            currentSession.shuffleArray(allAnswers) :
            allAnswers.sort(() => Math.random() - 0.5);

        questionEl.textContent = question.question;

        const progressText = currentSession.getProgressText();
        const progress = currentSession.getProgress();

        questionCounterEl.textContent = progressText;
        progressFillEl.style.width = progress.percentage + '%';

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
    }

    function selectAnswer(optionElement, answer, correctAnswer) {
        if (currentSession.answered) return;

        const result = currentSession.answerQuestion(answer);

        // Auto-save progress
        saveActiveSession(currentSession.exportSaveData());

        const allOptions = document.querySelectorAll('.option');
        allOptions.forEach(opt => {
            opt.classList.add('disabled');
            if (opt.textContent === correctAnswer) {
                opt.classList.add('correct');
            }
        });

        if (result.isCorrect) {
            feedbackEl.className = 'feedback correct';

            if (currentSession.mode === 'spaced-repetition') {
                if (result.status === 'mastered') {
                    feedbackEl.innerHTML = 'Correct! <br><em>✨ Question mastered!</em>';
                } else {
                    const card = currentSession.currentCard;
                    if (card.consecutiveCorrect === 1) {
                        feedbackEl.textContent = 'Correct! You\'ll see this again soon.';
                    } else if (card.consecutiveCorrect === 2) {
                        feedbackEl.textContent = 'Correct again! Getting better at this one.';
                    } else {
                        feedbackEl.textContent = 'Excellent! This question is getting easier for you.';
                    }
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

        clearActiveSession();
        checkActiveSession();

        const score = currentSession.getFinalScore();
        finalScoreEl.textContent = `${score.percentage}%`;

        if (currentSession.mode === 'spaced-repetition') {
            const progress = currentSession.getProgress();
            resultsTextEl.textContent = `Great work! You mastered ${progress.mastered} out of ${progress.total} questions. You answered ${score.correct} out of ${score.total} questions correctly overall.`;
        } else {
            resultsTextEl.textContent = `You got ${score.correct} out of ${score.total} questions correct!`;
        }

        reviewBtn.style.display = currentSession.hasWrongAnswers() ? 'inline-block' : 'none';
    }

    function restartQuiz() {
        resultsScreen.style.display = 'none';
        startScreen.style.display = 'block';
        currentSession = null;
        checkActiveSession();
    }

    // ============================================
// ACCORDION QUESTION MANAGER & ADVANCED OPTIONS
// ============================================

    const advancedOptionsOverlay = document.getElementById('advancedOptionsOverlay');
    const advancedOptionsBtn = document.getElementById('advancedOptionsBtn');
    const closeAdvancedOptionsBtn = document.getElementById('closeAdvancedOptionsBtn');
    const doneAdvancedBtn = document.getElementById('doneAdvancedBtn');
    const saveQuestionsBtn = document.getElementById('saveQuestionsBtn');
    const accordionQuestionList = document.getElementById('accordionQuestionList');

    let expandedQuestionIndex = null; // Track which item is expanded

    function updateQuestionCount() {
        if (questionCount) {
            questionCount.textContent = `${currentQuestions.length} question${currentQuestions.length !== 1 ? 's' : ''} loaded`;
        }
    }

// Render Accordion List
    function renderQuestionList() {
        if (!accordionQuestionList) return;
        accordionQuestionList.innerHTML = '';

        currentQuestions.forEach((q, index) => {
            const isExpanded = expandedQuestionIndex === index;
            const item = document.createElement('div');
            item.className = 'accordion-item';

            // Header Row (Collapsed view)
            const header = document.createElement('div');
            header.className = 'accordion-header';
            header.innerHTML = `
            <div class="accordion-title">${index + 1}. ${q.question || 'New Question'}</div>
            <div class="accordion-actions">
                <button class="icon-btn danger" title="Delete Question" onclick="event.stopPropagation(); deleteQuestion(${index})">🗑️</button>
                <button class="icon-btn">${isExpanded ? '▲' : '▼'}</button>
            </div>
        `;
            header.addEventListener('click', () => {
                expandedQuestionIndex = isExpanded ? null : index;
                renderQuestionList();
            });
            item.appendChild(header);

            // Expanded Body
            if (isExpanded) {
                const body = document.createElement('div');
                body.className = 'accordion-body';

                // Question Input
                body.innerHTML = `
                <div class="qm-input-group">
                    <label class="qm-input-label">Question Text:</label>
                    <textarea class="qm-input q-text" rows="2">${q.question}</textarea>
                </div>
                <div class="qm-input-group">
                    <label class="qm-input-label">Correct Answer:</label>
                    <input type="text" class="qm-input q-correct" value="${q.correct || ''}">
                </div>
                <div class="qm-input-group">
                    <label class="qm-input-label">Incorrect Answers:</label>
                    <div class="wrong-answers-container"></div>
                </div>
            `;

                // Wrong Answers list inside expanded item
                const wrongContainer = body.querySelector('.wrong-answers-container');
                q.wrong.forEach((wrongAns, wIdx) => {
                    const row = document.createElement('div');
                    row.className = 'wrong-answer-row';
                    row.innerHTML = `
                    <input type="text" class="qm-input q-wrong" data-widx="${wIdx}" value="${wrongAns}">
                    ${q.wrong.length > 1 ? `<button class="icon-btn danger" title="Remove Option">🗑️</button>` : ''}
                `;

                    // Delete Wrong Answer handler
                    const delBtn = row.querySelector('.danger');
                    if (delBtn) {
                        delBtn.addEventListener('click', () => {
                            q.wrong.splice(wIdx, 1);
                            renderQuestionList();
                        });
                    }
                    wrongContainer.appendChild(row);
                });

                // Add Wrong Answer Button
                const addWrongBtn = document.createElement('button');
                addWrongBtn.className = 'add-wrong-btn';
                addWrongBtn.textContent = '+ Add Incorrect Answer';
                addWrongBtn.addEventListener('click', () => {
                    q.wrong.push('');
                    renderQuestionList();
                });
                body.querySelector('.qm-input-group:last-child').appendChild(addWrongBtn);

                // Real-time input listeners to update currentQuestions object
                body.querySelector('.q-text').addEventListener('input', (e) => q.question = e.target.value);
                body.querySelector('.q-correct').addEventListener('input', (e) => q.correct = e.target.value);
                body.querySelectorAll('.q-wrong').forEach(input => {
                    input.addEventListener('input', (e) => {
                        const wIdx = parseInt(e.target.getAttribute('data-widx'));
                        q.wrong[wIdx] = e.target.value;
                    });
                });

                item.appendChild(body);
            }

            accordionQuestionList.appendChild(item);
        });

        updateQuestionCount();
    }

// Global Delete Question Handler
    window.deleteQuestion = function(index) {
        if (confirm(`Delete question #${index + 1}?`)) {
            currentQuestions.splice(index, 1);
            if (expandedQuestionIndex === index) expandedQuestionIndex = null;
            renderQuestionList();
        }
    };

    if (manageQuestionsBtn) {
        manageQuestionsBtn.addEventListener('click', () => {
            questionManagerOverlay.style.display = 'flex';
            renderQuestionList(); // <--- THIS RENDERS THE ACCORDION UI!
        });
    }

    if (closeQuestionManagerBtn) {
        closeQuestionManagerBtn.addEventListener('click', () => {
            questionManagerOverlay.style.display = 'none';
        });
    }

// Add New Blank Question
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', () => {
            currentQuestions.push({
                question: 'New Question',
                correct: '',
                wrong: ['']
            });
            expandedQuestionIndex = currentQuestions.length - 1; // Auto-expand new question!
            renderQuestionList();
        });
    }

// Save All Questions & Close Modal
    if (saveQuestionsBtn) {
        saveQuestionsBtn.addEventListener('click', () => {
            saveQuestionsToStorage(currentQuestions);
            questionManagerOverlay.style.display = 'none';
            alert('Questions saved successfully!');
        });
    }

// Advanced Options Modal Toggles (Gear Icon)
    if (advancedOptionsBtn) {
        advancedOptionsBtn.addEventListener('click', () => {
            advancedOptionsOverlay.style.display = 'flex';
        });
    }

    if (closeAdvancedOptionsBtn) {
        closeAdvancedOptionsBtn.addEventListener('click', () => {
            advancedOptionsOverlay.style.display = 'none';
        });
    }

    if (doneAdvancedBtn) {
        doneAdvancedBtn.addEventListener('click', () => {
            advancedOptionsOverlay.style.display = 'none';
            renderQuestionList(); // Refresh main list in case JSON was imported!
        });
    }

// Modal Overlay Click Handlers
    questionManagerOverlay.addEventListener('click', (e) => {
        if (e.target === questionManagerOverlay) questionManagerOverlay.style.display = 'none';
    });

    advancedOptionsOverlay.addEventListener('click', (e) => {
        if (e.target === advancedOptionsOverlay) advancedOptionsOverlay.style.display = 'none';
    });

    // Initialize
    applyTheme();
    updateModeIndicators();
    updateQuestionCount();
    checkActiveSession();
});