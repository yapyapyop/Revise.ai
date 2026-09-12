<!-- src/App.svelte -->
<script>
    import './app.css';
    import { onMount } from 'svelte';
    import Dashboard from './components/Dashboard.svelte';
    import StudySession from './components/StudySession.svelte';
    import ResultsScreen from './components/ResultsScreen.svelte';
    import SettingsModal from './components/SettingsModal.svelte';
    import QuestionManager from './components/QuestionManager.svelte'; 
    import { QuizSession } from './lib/studyModes.js';
    import BottomDock from './components/BottomDock.svelte'; 
    import { 
        loadQuestionsFromStorage, 
        saveQuestionsToStorage, 
        loadActiveSession, 
        saveActiveSession, 
        clearActiveSession 
    } from './lib/storage.js';

    let currentScreen = 'dashboard';
    let currentQuestions = [];
    let activeSession = null;
    let currentQuizSession = null;
    let isQuizAnswered = false; // Tracks quiz answer state for dock
    
    // Modals
    let showSettingsModal = false;
    let showQuestionManager = false; // <-- 2. TRACK VISIBILITY

    let isDarkMode = true;
    let isSpacedRepetition = false;
    let isRandomOrder = false;

    onMount(() => {
        currentQuestions = loadQuestionsFromStorage();
        activeSession = loadActiveSession();

        // Check if user previously chose light mode
        const savedTheme = localStorage.getItem('revise_theme') || 'dark';
        isDarkMode = (savedTheme === 'dark');
    });

    function toggleTheme() {
        isDarkMode = !isDarkMode;
        const theme = isDarkMode ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        
        // ✨ REMEMBER PREFERENCE FOREVER ✨
        localStorage.setItem('revise_theme', theme);
    }

    function toggleMode() {
        isSpacedRepetition = !isSpacedRepetition;
    }

    function toggleOrder() {
        isRandomOrder = !isRandomOrder;
    }

    // Save questions from QuestionManager modal
    function handleSaveQuestions(updatedQuestions) {
        currentQuestions = updatedQuestions;
        saveQuestionsToStorage(currentQuestions);
        // Clear active session if questions changed to prevent queue misalignment
        clearActiveSession();
        activeSession = null;
    }

    function handleStartQuiz() {
        if (currentQuestions.length === 0) {
            alert('Please add some questions first!');
            return;
        }
        const mode = isSpacedRepetition ? 'spaced-repetition' : 'elimination';
        currentQuizSession = new QuizSession(currentQuestions, mode, isRandomOrder, 'Practice Set');
        currentScreen = 'quiz';
    }

    function handleResumeSession() {
        const savedData = loadActiveSession();
        if (!savedData) return;

        currentQuizSession = new QuizSession(
            savedData.originalQuestions || currentQuestions,
            savedData.mode,
            savedData.randomOrder,
            savedData.title || 'Practice Set'
        );
        currentQuizSession.loadFromSave(savedData);
        currentScreen = 'quiz';
    }

    function handleStartNewSession() {
        if (confirm("Are you sure? This will erase your current session progress.")) {
            clearActiveSession();
            activeSession = null;
            handleStartQuiz();
        }
    }

    function handleExitQuiz() {
        if (currentQuizSession && !currentQuizSession.isComplete) {
            saveActiveSession(currentQuizSession.exportSaveData());
        }
        activeSession = loadActiveSession();
        currentScreen = 'dashboard';
    }

    function handleCompleteQuiz(completedSession) {
        currentQuizSession = completedSession;
        currentScreen = 'results';

        if (!completedSession.hasWrongAnswers()) {
            clearActiveSession();
            activeSession = null;
        }
    }

    function handleRestartToDashboard() {
        clearActiveSession();
        activeSession = null;
        currentScreen = 'dashboard';
    }

    function handleReviewMistakes() {
        if (currentQuizSession && currentQuizSession.hasWrongAnswers()) {
            currentQuizSession = currentQuizSession.createReviewSession();
            saveActiveSession(currentQuizSession.exportSaveData());
            currentScreen = 'quiz';
        }
    }
</script>

<!-- Topbar -->
<div class="topbar">
    <div class="logo">
        revise <span class="beta-tag">beta</span>
    </div>
    <div class="topbar-actions">
        
        <button class="settings-btn" on:click={() => showSettingsModal = true}>
            Preferences
        </button>
    </div>
</div>

<!-- Main View Router -->
<div class="main-content">
    {#if currentScreen === 'dashboard'}
        <Dashboard 
            {activeSession}
            {isSpacedRepetition}
            {isRandomOrder}
            onStartQuiz={handleStartQuiz}
            onResumeSession={handleResumeSession}
            onStartNewSession={handleStartNewSession}
            onOpenQuestionManager={() => showQuestionManager = true}
            onOpenSettings={() => showSettingsModal = true}
        />
    {:else if currentScreen === 'quiz'}
        <StudySession 
            session={currentQuizSession}
            {isSpacedRepetition}
            {isRandomOrder}
            onExit={handleExitQuiz}
            onComplete={handleCompleteQuiz}
        />
    {:else if currentScreen === 'results'}
        <ResultsScreen 
            session={currentQuizSession}
            onRestart={handleRestartToDashboard}
            onReviewMistakes={handleReviewMistakes}
        />
    {/if}
</div>

<!-- MODALS -->
{#if showSettingsModal}
    <SettingsModal 
        {isDarkMode}
        {isSpacedRepetition}
        {isRandomOrder}
        onClose={() => showSettingsModal = false}
        onToggleTheme={toggleTheme}
        onToggleMode={toggleMode}
        onToggleOrder={toggleOrder}
    />
{/if}

{#if showQuestionManager}
    <QuestionManager 
        questions={currentQuestions}
        onClose={() => showQuestionManager = false}
        onSave={handleSaveQuestions}
    />
{/if}

<BottomDock 
    {currentScreen}
    isAnswered={isQuizAnswered}
    isManagerOpen={showQuestionManager}
    isSettingsOpen={showSettingsModal}
/>
