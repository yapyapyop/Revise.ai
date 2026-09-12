<!-- src/components/StudySession.svelte -->
<script>
    import { onMount, onDestroy } from 'svelte';
    import { saveActiveSession } from '../lib/storage.js';

    export let session;
    export let isSpacedRepetition = false;
    export let isRandomOrder = false;

    export let onExit;
    export let onComplete;
    export let onAnswerStateChange = (answered) => {}; // Callback to notify bottom dock!

    let currentQuestion = null;
    let shuffledAnswers = [];
    let selectedAnswerIndex = null;
    let isAnswered = false;

    $: progress = session.getProgress();
    $: safeCounter = Math.min(progress.current + (isAnswered ? 0 : 1), progress.total);
    $: progressText = session.mode === 'elimination'
        ? `Question ${safeCounter} of ${progress.total}`
        : `Mastered: ${progress.mastered}/${progress.total} · Learning: ${progress.reviewCards}`;

    onMount(() => {
        loadNextQuestion();
        window.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });

    function handleKeydown(e) {
        if (!isAnswered) {
            if (e.key === '1' && shuffledAnswers[0]) handleSelectAnswer(0);
            if (e.key === '2' && shuffledAnswers[1]) handleSelectAnswer(1);
            if (e.key === '3' && shuffledAnswers[2]) handleSelectAnswer(2);
            if (e.key === '4' && shuffledAnswers[3]) handleSelectAnswer(3);
        } else {
            // Commit to Space as the single primary key!
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                loadNextQuestion();
            }
        }
        if (e.key === 'Escape') onExit();
    }

    function loadNextQuestion() {
        currentQuestion = session.getNextQuestion();
        if (!currentQuestion) {
            onComplete(session);
            return;
        }

        const allAnswers = [currentQuestion.correct, ...currentQuestion.wrong];
        shuffledAnswers = session.shuffleArray ? session.shuffleArray(allAnswers) : allAnswers.sort(() => Math.random() - 0.5);
        
        selectedAnswerIndex = null;
        isAnswered = false;
        onAnswerStateChange(false);
        session = session;
    }

    function handleSelectAnswer(index) {
        if (isAnswered) return;
        isAnswered = true;
        onAnswerStateChange(true);
        selectedAnswerIndex = index;
        
        const answer = shuffledAnswers[index];
        session.answerQuestion(answer);
        saveActiveSession(session.exportSaveData());
        session = session;
    }
</script>

<div class="ambient-workspace">
    <!-- Header -->
    <div class="ambient-header">
        <div class="context-group">
            <span class="context-title">Practice Set</span>
            <span class="context-dot">·</span>
            <span class="context-modifier">{session.mode === 'spaced-repetition' ? 'Spaced Repetition' : 'Elimination'}</span>
            {#if isRandomOrder}
                <span class="context-dot">·</span>
                <span class="context-modifier">Random order</span>
            {/if}
        </div>
        <button class="ghost-exit" on:click={onExit} title="Exit [Esc]">×</button>
    </div>

    <!-- Question -->
    {#if currentQuestion}
        <h1 class="ambient-question">{currentQuestion.question}</h1>

        <!-- Options -->
        <div class="ambient-options">
            {#each shuffledAnswers as answer, i}
                <button 
                    class="ambient-option-row"
                    class:selected-wrong={isAnswered && selectedAnswerIndex === i && answer !== currentQuestion.correct}
                    class:is-correct={isAnswered && answer === currentQuestion.correct}
                    class:dimmed={isAnswered && answer !== currentQuestion.correct && selectedAnswerIndex !== i}
                    on:click={() => handleSelectAnswer(i)}
                >
                    <span class="keycap">{i + 1}</span>
                    <span class="answer-text">{answer}</span>
                    {#if isAnswered && answer === currentQuestion.correct}
                        <span class="status-indicator correct">✓</span>
                    {:else if isAnswered && selectedAnswerIndex === i}
                        <span class="status-indicator wrong">✕</span>
                    {/if}
                </button>
            {/each}
        </div>

        <!-- Progress & Action Bar -->
        <div class="ambient-footer">
            <!-- 6px High-Contrast Progress Bar -->
            <div class="progress-track">
                <div class="progress-line" style="width: {progress.percentage}%;"></div>
            </div>
            
            <div class="meta-row">
                <!-- Scaled Up 15% -->
                <span class="counter-label">{progressText}</span>
                {#if isAnswered}
                    <button class="next-trigger" on:click={loadNextQuestion}>
                        next <kbd class="keycap-subtle">Space</kbd>
                    </button>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .ambient-workspace {
        width: 100%;
        max-width: 680px;
        margin: 40px auto 80px auto; /* Extra bottom clearance for dock */
        display: flex;
        flex-direction: column;
    }

    .ambient-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }
    .ambient-footer {
        position: sticky;
        /* ✨ STICKS AT 38px TO SIT PERFECTLY FLUSH ABOVE THE BOTTOM DOCK ✨ */
        bottom: 38px;
        background: var(--bg-primary);
        padding: 14px 0 10px 0;
        width: 100%;
        border-top: 1px solid var(--border-primary);
        z-index: 50; /* Sits above scrolling answer cards */
    }

    .context-group {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.88em;
    }

    .context-title {
        font-weight: 600;
        color: var(--text-primary);
    }

    .context-dot {
        opacity: 0.4;
    }

    .context-modifier {
        color: var(--text-secondary);
    }

    .ghost-exit {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 1.5em;
        cursor: pointer;
        line-height: 1;
        transition: color 0.15s ease;
    }

    .ghost-exit:hover {
        color: var(--incorrect-color);
    }

    .ambient-question {
        font-size: 1.7em;
        font-weight: 700;
        line-height: 1.35;
        color: var(--text-primary);
        margin-bottom: 32px;
        text-align: left;
    }

    .ambient-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 32px;
    }

    .ambient-option-row {
        background: transparent;
        border: 1px solid transparent;
        padding: 12px 16px;
        display: flex;
        align-items: flex-start;
        gap: 14px;
        cursor: pointer;
        text-align: left;
        color: var(--text-primary);
        font-size: 1.02em;
        line-height: 1.45;
        transition: all 0.15s ease;
    }

    .ambient-option-row:hover {
        background: var(--bg-secondary);
        border-color: var(--border-secondary);
    }

    .keycap {
        font-family: monospace;
        font-size: 0.85em;
        background: var(--bg-secondary);
        border: 1px solid var(--border-secondary);
        padding: 2px 7px;
        color: var(--text-secondary);
        margin-top: 1px;
        flex-shrink: 0;
    }

    .answer-text {
        flex: 1;
    }

    .ambient-option-row.is-correct {
        background: rgba(107, 142, 96, 0.15);
        border-color: var(--correct-color);
        color: var(--correct-color);
    }

    .ambient-option-row.selected-wrong {
        background: rgba(166, 124, 82, 0.15);
        border-color: var(--incorrect-color);
        color: var(--incorrect-color);
    }

    .ambient-option-row.dimmed {
        opacity: 0.35;
    }

    .status-indicator {
        font-weight: bold;
        font-size: 1.1em;
        flex-shrink: 0;
        margin-left: 8px;
    }

    /* 6PX HIGH-CONTRAST PROGRESS BAR */
    .progress-track {
        background: var(--border-primary);
        height: 6px;
        width: 100%;
        margin-bottom: 14px;
        overflow: hidden;
    }

    .progress-line {
        background: var(--correct-color);
        height: 100%;
        transition: width 0.25s ease;
    }

    .meta-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.98em; /* Scaled Up 15% */
        color: var(--text-secondary);
    }

    .next-trigger {
        background: none;
        border: none;
        color: var(--text-primary);
        font-family: inherit;
        font-size: 1.05em; /* Scaled Up */
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .keycap-subtle {
        font-family: monospace;
        font-size: 0.85em;
        background: var(--bg-secondary);
        border: 1px solid var(--border-secondary);
        padding: 2px 7px;
        border-radius: 3px;
        color: var(--text-secondary);
    }
</style>