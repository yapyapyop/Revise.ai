<!-- src/components/Dashboard.svelte -->
<script>
    import { onMount, onDestroy } from 'svelte';

    export let activeSession = null;
    export let isSpacedRepetition = false;
    export let isRandomOrder = false;

    export let onStartQuiz;
    export let onResumeSession;
    export let onStartNewSession;
    export let onOpenQuestionManager;
    export let onOpenSettings;

    $: progressPercentage = calculateProgress(activeSession);
    $: accuracyPercentage = calculateAccuracy(activeSession);
    $: displayTitle = activeSession?.title || 'Practice Set';

    function calculateProgress(session) {
        if (!session || !session.questionsAnswered) return 0;
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
        if (!session || !session.questionsAnswered) return 0;
        return Math.round((session.questionsCorrect / session.questionsAnswered) * 100);
    }

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });

    // In src/components/Dashboard.svelte
    function handleKeydown(e) {
        // ✨ BUG FIX: If user is typing OR if any modal is open, IGNORE shortcuts! ✨
        const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
        const isModalOpen = document.querySelector('.workbench-overlay, .settings-overlay');
        
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

        <!-- LEFT HERO COLUMN: Scaled Up, Confident Presence -->
        <div class="hero-study-column">
            
            <!-- Context & State -->
            <div class="hero-context">
    <span class="hero-state-tag">
        {activeSession ? 'Current session' : 'Start studying'}
    </span>
</div>

<!-- 2. Primary Title -->
<h1 class="hero-set-title">{displayTitle}</h1>

<!-- 3. Sentence-case modifiers with subtle interpunct '·' -->
<div class="hero-modifiers">
    <span class="modifier-item" on:click={onOpenSettings}>
        {isSpacedRepetition ? 'Spaced Repetition' : 'Elimination'}
    </span>
    {#if isRandomOrder}
        <span class="modifier-dot">·</span>
        <span class="modifier-item" on:click={onOpenSettings}>Random order</span>
    {/if}
</div>

            <!-- Stretched 100% Horizontal Progress Bar -->
            <div class="hero-progress-section">
                <div class="hero-progress-track">
                    <div class="hero-progress-fill" style="width: {progressPercentage}%;"></div>
                </div>
                <div class="hero-meta-row">
                    <span>{progressPercentage}% complete</span>
                    {#if activeSession && activeSession.questionsAnswered > 0}
                        <span>{accuracyPercentage}% accuracy</span>
                    {/if}
                </div>
            </div>

            <!-- Primary Actions (Scaled up & tactile) -->
            <div class="hero-action-row">
                {#if activeSession}
                    <button class="btn btn-primary hero-btn" on:click={onResumeSession}>
                        Continue Studying
                    </button>
                    <button class="btn btn-secondary hero-btn-secondary" on:click={onStartNewSession}>
                        Restart
                    </button>
                {:else}
                    <button class="btn btn-primary hero-btn" on:click={onStartQuiz}>
                        Start Studying
                    </button>
                {/if}
            </div>

            <!-- Clean, No-Emoji Secondary Link -->
            <div class="hero-secondary-links">
                <button class="subtle-link" on:click={onOpenQuestionManager}>
                    Edit Questions <span class="keycap-subtle">M</span>
                </button>
            </div>
        </div>

        <!-- RIGHT SIDEBAR: Linear Style List (Wider & Bolder) -->
        <div class="sidebar-column">
            <div class="recent-section">
                <div class="sidebar-header-row">
                    <span class="sidebar-label">Recent Sets</span>
                    <button class="new-set-trigger" on:click={onOpenQuestionManager}>+ New Set</button>
                </div>

                <div class="sleek-set-list">
                    <div class="sleek-set-row active">
                        <span class="set-name">Practice Set</span>
                        <span class="set-stat">{progressPercentage}%</span>
                    </div>
                    <div class="sleek-set-row">
                        <span class="set-name">Practice Set 2</span>
                        <span class="set-stat">-</span>
                    </div>
                    <div class="sleek-set-row">
                        <span class="set-name">Practice Set 3</span>
                        <span class="set-stat">-</span>
                    </div>
                </div>
            </div>
        </div>

    </div>
</div>

<style>
    /* 1. EXPANDED SCALE: 1080px wide (20% increase) */
    .dashboard-workspace {
        width: 100%;
        max-width: 1080px;
        margin: 30px auto 0 auto; /* Moved up for better vertical anchor */
        padding: 0 20px;
        box-sizing: border-box;
    }

    .dashboard-columns {
        display: grid;
        grid-template-columns: 1fr 320px; /* Generous columns */
        gap: 80px; /* Expansive breathing room */
        align-items: start;
    }

    /* LEFT HERO LAUNCHER */
    .hero-study-column {
        display: flex;
        flex-direction: column;
        text-align: left;
    }

    .hero-context {
        margin-bottom: 8px;
    }

    .hero-state-tag {
    font-family: inherit; /* Proportional Inter font! */
    font-size: 0.9em;
    font-weight: 500;
    color: var(--text-secondary);
    letter-spacing: 0; /* No more aggressive tracking! */
}


    /* 2. BOLDER TITLE: Scaled from 2.2em to 2.8em */
    .hero-set-title {
        font-size: 2.8em;
        font-weight: 800;
        color: var(--text-primary);
        margin: 0 0 8px 0;
        letter-spacing: -1px;
        line-height: 1.1;
    }

    .hero-modifiers {
    font-family: inherit; /* Proportional! */
    font-size: 0.9em;
    margin-bottom: 28px;
}

    .modifier-item {
        color: var(--accent-color);
        cursor: pointer;
        letter-spacing: 1px;
    }

    .modifier-item:hover {
        text-decoration: underline;
    }

    .modifier-dot {
        color: var(--text-secondary);
        opacity: 0.4;
    }

    /* 3. FULL-WIDTH STRETCHED PROGRESS BAR */
    .hero-progress-section {
        margin-bottom: 36px;
        width: 100%; /* Stretches 100% across the left column! */
    }

    .hero-progress-track {
        background: var(--border-primary);
        height: 4px;
        width: 100%;
        margin-bottom: 10px;
        overflow: hidden;
    }

    .hero-progress-fill {
        background: var(--correct-color);
        height: 100%;
        transition: width 0.3s ease;
    }

    .hero-meta-row {
        display: flex;
        justify-content: space-between;
        font-family: monospace;
        font-size: 0.85em;
        color: var(--text-secondary);
    }

    /* 4. BUTTONS WITH PHYSICAL PRESENCE */
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
        font-size: 0.9em;
        margin-left: 8px;
        opacity: 0.7;
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

    /* RIGHT SIDEBAR (LINEAR STYLE) */
    .sidebar-column {
        padding-top: 14px;
    }

    .sidebar-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border-primary);
        margin-bottom: 14px;
    }

    .sidebar-label {
    font-family: inherit; /* Proportional! */
    font-size: 0.85em;
    font-weight: 600;
    color: var(--text-secondary);
    letter-spacing: 0;
}

    .new-set-trigger {
        background: none;
        border: none;
        font-family: inherit;
        font-size: 0.92em;
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
        padding: 12px 10px;
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

    .set-name {
        font-size: 0.95em;
        color: var(--text-primary);
    }

    .set-stat {
        font-family: monospace;
        font-size: 0.85em;
        color: var(--text-secondary);
    }

    @media (max-width: 860px) {
        .dashboard-columns {
            grid-template-columns: 1fr;
            gap: 50px;
        }
    }
</style>