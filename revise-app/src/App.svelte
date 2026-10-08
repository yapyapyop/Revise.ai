<!-- src/App.svelte -->
<script>
    import './app.css';
    import { onMount } from 'svelte';
    
    // Components
    import Dashboard from './components/Dashboard.svelte';
    import SetOverview from './components/SetOverview.svelte';
    import AllSets from './components/AllSets.svelte';
    import StudySession from './components/StudySession.svelte';
    import ResultsScreen from './components/ResultsScreen.svelte';
    import SettingsModal from './components/SettingsModal.svelte';
    import QuestionManager from './components/QuestionManager.svelte';
    import CreateSetModal from './components/CreateSetModal.svelte';
    import BottomDock from './components/BottomDock.svelte';
    import FlashcardSession from './components/FlashcardSession.svelte';
    import ConfirmModal from './components/ConfirmModal.svelte';
    
    // Logic & Storage
    import { QuizSession, FlashcardSession as FlashcardEngine } from './lib/studyModes.js';
    import { 
        loadAllSets,
        saveSet,
        deleteSetById,
        loadActiveSession, 
        saveActiveSession, 
        clearActiveSession 
    } from './lib/storage.js';

    let currentScreen = 'dashboard'; // 'dashboard' | 'all-sets' | 'set-overview' | 'quiz' | 'flashcards' | 'results'
    let setOverviewOrigin = 'dashboard'; 
    
    let allSets = [];
    let selectedSet = null;
    let activeSession = null;
    let currentQuizSession = null;
    
    let showSettingsModal = false;
    let showCreateSetModal = false;
    let showQuestionManager = false;
    let activeDialog = null; // Holds configuration for current modal
    let isQuizAnswered = false;
    let isDarkMode = true;

    onMount(() => {
        allSets = loadAllSets();
        selectedSet = allSets[0];
        activeSession = loadActiveSession();

        const savedTheme = localStorage.getItem('revise_theme') || 'dark';
        isDarkMode = (savedTheme === 'dark');
    });

    function toggleTheme() {
        isDarkMode = !isDarkMode;
        const theme = isDarkMode ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('revise_theme', theme);
    }

    // Opens Set Overview with origin memory
    function handleSelectSet(set, origin = 'dashboard') {
        selectedSet = set;
        setOverviewOrigin = origin;
        currentScreen = 'set-overview';
    }

    function handleQuickStartSet(set) {
        confirmSessionSwitch(set, () => {
            clearActiveSession();
            activeSession = null;
            const mode = set.lastConfig?.mode || 'elimination';
            const order = set.lastConfig?.order || 'random';
            launchStudySession(set, mode, order);
        });
    }

    function handleNewSet() {
        showCreateSetModal = true;
    }

    function handleCreateSetComplete(newSet, shouldOpenEditor = false) {
        saveSet(newSet);
        allSets = loadAllSets();
        selectedSet = newSet;
        showCreateSetModal = false;

        if (shouldOpenEditor) {
            showQuestionManager = true; // For blank decks: jump straight to typing!
        } else {
            currentScreen = 'set-overview'; // For imported decks: jump to staging overview!
        }
    }

    function handleDeleteSet(set) {
        activeDialog = {
            title: 'Delete Study Set',
            message: `Are you sure you want to delete "${set.title}"? This cannot be undone.`,
            confirmLabel: 'Delete Set',
            isDestructive: true,
            onConfirm: () => {
                deleteSetById(set.id);
                allSets = loadAllSets();
                selectedSet = allSets[0] || null;
                if (activeSession?.setId === set.id) {
                    clearActiveSession();
                    activeSession = null;
                }
                activeDialog = null;
                currentScreen = 'dashboard';
            },
            onCancel: () => activeDialog = null
        };
    }

    function launchStudySession(set, mode, order, resumeData = null) {
        selectedSet = set;
        selectedSet.updatedAt = Date.now();
        selectedSet.lastConfig = { mode, order };
        saveSet(selectedSet);
        allSets = loadAllSets();

        if (mode === 'flashcards') {
            currentQuizSession = new FlashcardEngine(
                resumeData?.originalQuestions || set.questions,
                order,
                set.title,
                set.id 
            );
            if (resumeData) currentQuizSession.loadFromSave(resumeData);
            currentScreen = 'flashcards';
        } else {
            currentQuizSession = new QuizSession(
                resumeData?.originalQuestions || set.questions,
                mode,
                order === 'random',
                set.title,
                set.id // ✨ Pass set.id!
            );
            if (resumeData) currentQuizSession.loadFromSave(resumeData);
            currentScreen = 'quiz';
        }
    }

    // Fast Path Resume (Dashboard "Continue Studying")
    function handleFastPathResume() {
        if (!activeSession) return;
        launchStudySession(
            selectedSet,
            activeSession.mode,
            activeSession.order || 'sequential',
            activeSession
        );
    }

    // In src/App.svelte
    function confirmSessionSwitch(targetSet, onConfirmed) {
        // ✨ FIX: Detect progress reliably across ALL modes ✨
        const hasQuizProgress = activeSession?.questionsAnswered > 0;
        const hasFlashcardProgress = activeSession?.mode === 'flashcards' && activeSession.graduatedCards?.length > 0;
        
        const hasOtherActiveSession = activeSession && 
                                      activeSession.setId !== targetSet.id && 
                                      (hasQuizProgress || hasFlashcardProgress);

        if (hasOtherActiveSession) {
            activeDialog = {
                title: 'Replace Active Session?',
                message: `You have an in-progress session for "${activeSession.title || 'another set'}". Starting "${targetSet.title}" will clear that progress.`,
                confirmLabel: 'Replace & Start',
                isDestructive: false,
                onConfirm: () => {
                    activeDialog = null;
                    clearActiveSession();
                    activeSession = null;
                    onConfirmed();
                },
                onCancel: () => activeDialog = null
            };
        } else {
            onConfirmed();
        }
    }

    // Launch from Set Overview ("Start Studying")
    function handleStartFromOverview(mode, order) {
        confirmSessionSwitch(selectedSet, () => {
            clearActiveSession();
            activeSession = null;
            launchStudySession(selectedSet, mode, order);
        });
    }

    function handleStartNewSession() {
        activeDialog = {
            title: 'Restart Session',
            message: 'Are you sure you want to restart? Your active session progress will be cleared.',
            confirmLabel: 'Restart Session',
            isDestructive: false,
            onConfirm: () => {
                clearActiveSession();
                activeSession = null;
                activeDialog = null;
                handleStartFromOverview(selectedSet.lastConfig?.mode || 'elimination', selectedSet.lastConfig?.order || 'random');
            },
            onCancel: () => activeDialog = null
        };
    }

    function handleExitQuiz() {
        if (currentQuizSession && !currentQuizSession.isComplete) {
            saveActiveSession({
                ...currentQuizSession.exportSaveData(),
                setId: selectedSet.id
            });
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

    function handleUpdateSetDetails(updatedSet) {
        selectedSet = updatedSet;
        saveSet(selectedSet);
        allSets = loadAllSets();
    }

    function handleSaveQuestions(updatedQuestions) {
        selectedSet.questions = updatedQuestions;
        selectedSet.updatedAt = Date.now();
        saveSet(selectedSet);
        allSets = loadAllSets();
        clearActiveSession();
        activeSession = null;
    }
</script>

<!-- Topbar -->
<div class="topbar">
    <div class="logo" style="cursor: pointer;" on:click={() => { activeSession = loadActiveSession(); currentScreen = 'dashboard'; }}>
        revise <span class="beta-tag">beta</span>
    </div>
    <div class="topbar-actions">
        <button class="settings-btn" on:click={() => showSettingsModal = true}>
            Preferences
        </button>
    </div>
</div>

<!-- Main Router -->
<div class="main-content">
    {#if currentScreen === 'dashboard'}
        <Dashboard 
            {allSets}
            {activeSession}
            {selectedSet}
            onStartQuiz={() => handleSelectSet(selectedSet, 'dashboard')}
            onResumeSession={handleFastPathResume}
            onStartNewSession={handleStartNewSession}
            onSelectSet={(set) => handleSelectSet(set, 'dashboard')}
            onQuickStartSet={handleQuickStartSet}
            onNewSet={handleNewSet}
            onViewAllSets={() => currentScreen = 'all-sets'}
            onOpenQuestionManager={() => showQuestionManager = true}
            onOpenSettings={() => showSettingsModal = true}
        />
    {:else if currentScreen === 'all-sets'}
        <AllSets 
            {allSets}
            onSelectSet={(set) => handleSelectSet(set, 'all-sets')}
            onQuickStartSet={handleQuickStartSet}
            onNewSet={handleNewSet}
            onDeleteSet={handleDeleteSet}
            onBack={() => currentScreen = 'dashboard'}
        />
    {:else if currentScreen === 'set-overview'}
        <SetOverview 
            currentSet={selectedSet}
            {activeSession}
            returnScreen={setOverviewOrigin}
            onStartStudy={handleStartFromOverview}
            onResumeStudy={handleFastPathResume}
            onEditQuestions={() => showQuestionManager = true}
            onUpdateSetDetails={handleUpdateSetDetails}
            onBack={() => currentScreen = setOverviewOrigin}
        />
    {:else if currentScreen === 'quiz'}
        <StudySession 
            session={currentQuizSession}
            onExit={handleExitQuiz}
            onComplete={handleCompleteQuiz}
            onAnswerStateChange={(answered) => isQuizAnswered = answered}
        />
    {:else if currentScreen === 'flashcards'}
        <FlashcardSession 
            session={currentQuizSession}
            onExit={handleExitQuiz}
            onComplete={handleCompleteQuiz}
            onFlipStateChange={(flipped) => isQuizAnswered = flipped}
        />
    {:else if currentScreen === 'results'}
        <!-- ✨ FIXED RESULTS ROUTER BLOCK ✨ -->
        <ResultsScreen 
            session={currentQuizSession}
            onRestart={() => {
                if (currentQuizSession && currentQuizSession.hasWrongAnswers()) {
                    currentQuizSession = currentQuizSession.createReviewSession();
                    saveActiveSession({
                        ...currentQuizSession.exportSaveData(),
                        setId: selectedSet.id
                    });
                    activeSession = loadActiveSession();
                } else {
                    clearActiveSession();
                    activeSession = null;
                }
                currentScreen = 'dashboard';
            }}
            onReviewMistakes={() => {
                currentQuizSession = currentQuizSession.createReviewSession();
                saveActiveSession({
                    ...currentQuizSession.exportSaveData(),
                    setId: selectedSet.id
                });
                currentScreen = 'quiz';
            }}
        />
    {/if}
</div>

<!-- Modals -->
{#if showSettingsModal}
    <SettingsModal 
        {isDarkMode}
        onClose={() => showSettingsModal = false}
        onToggleTheme={toggleTheme}
    />
{/if}

{#if showQuestionManager}
    <QuestionManager 
        questions={selectedSet.questions}
        onClose={() => showQuestionManager = false}
        onSave={handleSaveQuestions}
    />
{/if}

{#if showCreateSetModal}
    <CreateSetModal 
        onClose={() => showCreateSetModal = false}
        onCreateSet={handleCreateSetComplete}
    />
{/if}

{#if activeDialog}
    <ConfirmModal 
        title={activeDialog.title}
        message={activeDialog.message}
        confirmLabel={activeDialog.confirmLabel}
        isDestructive={activeDialog.isDestructive}
        isInput={activeDialog.isInput}
        inputPlaceholder={activeDialog.inputPlaceholder}
        onConfirm={activeDialog.onConfirm}
        onCancel={activeDialog.onCancel}
    />
{/if}

<!-- Bottom Command Dock -->
<BottomDock 
    {currentScreen}
    isAnswered={isQuizAnswered}
    isManagerOpen={showQuestionManager}
    isSettingsOpen={showSettingsModal}
/>