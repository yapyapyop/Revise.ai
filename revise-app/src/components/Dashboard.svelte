<!-- src/components/Dashboard.svelte -->
<script>
    import { onMount, onDestroy } from 'svelte';

    export let allSets = [];
    export let activeSession = null;
    export let selectedSet = null;

    export let onStartQuiz;
    export let onResumeSession;
    export let onStartNewSession;
    export let onSelectSet;
    export let onQuickStartSet;
    export let onViewAllSets;
    export let onNewSet;
    export let onOpenQuestionManager;
    export let onOpenSettings;

    // ✨ SORT SETS: Most recently used/updated appears at the very top! ✨
    $: sortedRecentSets = [...allSets].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    $: currentDisplaySet = selectedSet || sortedRecentSets[0] || allSets[0];
    $: progressPercentage = calculateProgress(activeSession);
    $: accuracyPercentage = calculateAccuracy(activeSession);
    $: displayTitle = activeSession?.title || currentDisplaySet?.title || 'Practice Set';

    function calculateProgress(session) {
        if (!session) return 0;
        
        // Flashcards progress
        if (session.mode === 'flashcards') {
            const completed = session.graduatedCards?.length || 0;
            const total = session.totalCards || 1;
            return Math.min(100, Math.round((completed / total) * 100));
        }

        // MCQ modes progress
        if (!session.questionsAnswered) return 0;
        const total = session.totalQuestions || session.originalQuestions?.length || 1;
        
        if (session.mode === 'elimination') {
            return Math.min(100, Math.round((session.questionsAnswered / total) * 100));
        } else {
            const mastered = session.masteredCards?.length || 0;
            const reviewed = session.cards?.filter(c => c.repetition > 0).length || 0;
            return mastered > 0 
                ? Math.min(100, Math.round((mastered / total) * 100))
                : Math.min(90, Math.round((reviewed / total) * 100));
        }
    }

    function calculateAccuracy(session) {
        if (!session) return 0;
        
        // Flashcards doesn't have accuracy, just completion
        if (session.mode === 'flashcards') {
            return 100; 
        }
        
        if (!session.questionsAnswered) return 0;
        return Math.round((session.questionsCorrect / session.questionsAnswered) * 100);
    }


    function getModeLabel(mode) {
        if (mode === 'flashcards') return 'Flashcards';
        if (mode === 'spaced-repetition') return 'Spaced Repetition';
        return 'Elimination';
    }


    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });

    function handleKeydown(e) {
        const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
        const isModalOpen = document.querySelector('.workbench-overlay, .settings-overlay, .details-overlay');
        if (isTyping || isModalOpen) return;

        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (activeSession) {
                onResumeSession();
            } else {
                onStartQuiz();
            }
        }
        if (e.key === 'm' || e.key === 'M') {
            onOpenQuestionManager();
        }
    }
</script>

<div class="dashboard-workspace">
    <div class="dashboard-columns">

        <!-- LEFT HERO COLUMN -->
        <div class="hero-study-column">
            <div class="hero-context">
                <span class="hero-state-tag">
                    {activeSession ? 'Current session' : 'Start studying'}
                </span>
            </div>

            <h1 class="hero-set-title">{displayTitle}</h1>

<!-- In Dashboard.svelte inside .hero-modifiers -->
<div class="hero-modifiers">
    <span class="modifier-item" on:click={onOpenSettings}>
        {getModeLabel(activeSession?.mode || currentDisplaySet?.lastConfig?.mode)}
    </span>

    {#if activeSession?.isReview}
        <span class="modifier-dot">·</span>
        <span class="modifier-item" style="font-style: italic; color: var(--incorrect-color);">
            Reviewing mistakes
        </span>
    {/if}

    {#if (activeSession?.order || currentDisplaySet?.lastConfig?.order) === 'random'}
        <span class="modifier-dot">·</span>
        <span class="modifier-item" on:click={onOpenSettings}>Random order</span>
    {/if}
</div>

            <!-- Progress Bar -->
            <div class="hero-progress-section">
                <div class="hero-progress-track">
                    <div class="hero-progress-fill" style="width: {progressPercentage}%;"></div>
                </div>
                <!-- ✨ NO MONOSPACE on percentages! Regular clean UI font ✨ -->
                <div class="hero-meta-row">
                    <span>{progressPercentage}% complete</span>
                    {#if activeSession && activeSession.questionsAnswered > 0}
                        <span>{accuracyPercentage}% accuracy</span>
                    {/if}
                </div>
            </div>

            <!-- Primary Actions -->
            <div class="hero-action-row">
                {#if activeSession}
                    <button class="btn btn-primary hero-btn" on:click={onResumeSession}>
                        Continue Studying <kbd class="keycap-hint">↵</kbd>
                    </button>
                    <button class="btn btn-secondary hero-btn-secondary" on:click={onStartNewSession}>
                        Restart
                    </button>
                {:else}
                    <button class="btn btn-primary hero-btn" on:click={onStartQuiz}>
                        Start Studying <kbd class="keycap-hint">↵</kbd>
                    </button>
                {/if}
            </div>

            <div class="hero-secondary-links">
                <button class="subtle-link" on:click={onOpenQuestionManager}>
                    Edit Questions <kbd class="keycap-subtle">M</kbd>
                </button>
            </div>
        </div>

        <!-- RIGHT SIDEBAR: Recent Sets (Sorted with latest at top!) -->
        <div class="sidebar-column">
            <div class="recent-section">
                <div class="sidebar-header-row">
                    <span class="sidebar-label">Recent Sets</span>
                    <!-- ✨ Changed back to "+ New Set" ✨ -->
                    <button class="new-set-trigger" on:click={onNewSet}>+ New Set</button>
                </div>

                <div class="sleek-set-list">
                    {#each sortedRecentSets.slice(0, 5) as set}
                        {@const isActiveSet = activeSession?.setId === set.id || (!activeSession && currentDisplaySet?.id === set.id)}
                        <div 
                            class="sleek-set-row" 
                            class:active={isActiveSet}
                            on:click={() => onSelectSet(set)}
                        >
                            <div class="set-info-group">
                                <span class="set-name">{set.title}</span>
                                <span class="set-count">{set.questions.length} cards</span>
                            </div>

                            <!-- HOVER PLAY BUTTON (▶ Quick Start) -->
                            <div class="set-actions">
                                <button 
                                    class="quick-play-btn" 
                                    title="Quick Start"
                                    on:click|stopPropagation={() => onQuickStartSet(set)}
                                >
                                    ▶
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>

                {#if allSets.length > 3}
                    <button class="view-all-trigger" on:click={onViewAllSets}>
                        View all sets ({allSets.length}) →
                    </button>
                {/if}
            </div>
        </div>

    </div>
</div>

<style>
    .dashboard-workspace {
        width: 100%;
        max-width: 1080px;
        margin: 30px auto 0 auto;
        padding: 0 20px;
        box-sizing: border-box;
    }

    .dashboard-columns {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 80px;
        align-items: start;
    }

    .hero-study-column {
        display: flex;
        flex-direction: column;
        text-align: left;
    }

    .hero-context {
        margin-bottom: 8px;
    }

    .hero-state-tag {
        font-family: inherit;
        font-size: 0.9em;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .hero-set-title {
        font-size: 2.8em;
        font-weight: 800;
        color: var(--text-primary);
        margin: 0 0 8px 0;
        letter-spacing: -1px;
        line-height: 1.1;
    }

    .hero-modifiers {
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: inherit;
        font-size: 0.9em;
        margin-bottom: 32px;
    }

    .modifier-item {
        color: var(--accent-color);
        cursor: pointer;
    }

    .modifier-item:hover {
        text-decoration: underline;
    }

    .modifier-dot {
        opacity: 0.4;
    }

    .hero-progress-section {
        margin-bottom: 36px;
        width: 100%;
    }

    .hero-progress-track {
        background: var(--border-primary);
        height: 6px;
        width: 100%;
        margin-bottom: 10px;
        overflow: hidden;
    }

    .hero-progress-fill {
        background: var(--correct-color);
        height: 100%;
        transition: width 0.3s ease;
    }

    /* ✨ UI FONT for percentages, NOT mono! ✨ */
    .hero-meta-row {
        display: flex;
        justify-content: space-between;
        font-family: inherit;
        font-size: 0.88em;
        color: var(--text-secondary);
    }

    .hero-action-row {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 28px;
    }

    .hero-btn {
        padding: 14px 28px;
        font-size: 1.05em;
    }

    .hero-btn-secondary {
        padding: 14px 24px;
        font-size: 1.05em;
    }

    .keycap-hint {
        font-family: monospace;
        font-size: 0.85em;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 1px 6px;
        border-radius: 3px;
        margin-left: 8px;
    }

    .hero-secondary-links {
        display: flex;
        gap: 15px;
    }

    .subtle-link {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 0.9em;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: color 0.15s ease;
    }

    .subtle-link:hover {
        color: var(--text-primary);
    }

    .keycap-subtle {
        font-family: monospace;
        font-size: 0.75em;
        background: var(--bg-secondary);
        border: 1px solid var(--border-secondary);
        padding: 1px 6px;
        color: var(--text-secondary);
        border-radius: 3px;
    }

    .sidebar-column {
        padding-top: 14px;
        text-align: left;
    }

    .sidebar-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border-primary);
        margin-bottom: 10px;
    }

    .sidebar-label {
        font-family: inherit;
        font-size: 0.88em;
        font-weight: 600;
        color: var(--text-secondary);
    }

    .new-set-trigger {
        background: none;
        border: none;
        font-family: inherit;
        font-size: 0.85em;
        font-weight: 500;
        color: var(--accent-color);
        cursor: pointer;
    }

    .new-set-trigger:hover {
        text-decoration: underline;
    }

    .sleek-set-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .sleek-set-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.15s ease;
    }

    .sleek-set-row:hover {
        background: var(--bg-secondary);
    }

    .sleek-set-row.active {
        background: var(--bg-secondary);
    }

    .set-info-group {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        overflow: hidden;
    }

    .set-name {
        font-size: 0.95em;
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .set-count {
        font-family: inherit;
        font-size: 0.8em;
        color: var(--text-secondary);
    }

    .quick-play-btn {
        background: none;
        border: none;
        color: var(--correct-color);
        font-size: 0.9em;
        cursor: pointer;
        padding: 4px 8px;
        opacity: 0;
        transition: opacity 0.15s ease, transform 0.15s ease;
    }

    .sleek-set-row:hover .quick-play-btn {
        opacity: 1;
    }

    .quick-play-btn:hover {
        transform: scale(1.2);
    }

    .view-all-trigger {
        background: none;
        border: none;
        font-family: inherit;
        font-size: 0.85em;
        color: var(--text-secondary);
        cursor: pointer;
        margin-top: 14px;
        padding: 0;
    }

    .view-all-trigger:hover {
        color: var(--text-primary);
        text-decoration: underline;
    }

    @media (max-width: 860px) {
        .dashboard-columns {
            grid-template-columns: 1fr;
            gap: 50px;
        }
    }
</style>