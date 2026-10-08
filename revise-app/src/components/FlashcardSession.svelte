<!-- src/components/FlashcardSession.svelte -->
<script>
    import { onMount, onDestroy } from 'svelte';
    import { saveActiveSession } from '../lib/storage.js';

    export let session;
    export let onExit;
    export let onComplete;
    export let onFlipStateChange = (flipped) => {};

    let currentCard = null;
    let isFlipped = false;

    $: progress = session ? session.getProgress() : { remaining: 0, completed: 0, total: 0, percentage: 0 };
    $: displayTitle = session.title || 'Practice Set';

    onMount(() => {
        loadNextCard();
        window.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });

     function handleKeydown(e) {
        // ✨ FIX: Ignore keystrokes if user is interacting with a dialog! ✨
        if (document.querySelector('.dialog-overlay')) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            onExit();
            return;
        }

        if (!isFlipped && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            flipCard();
            return;
        }

        if (isFlipped) {
            if (e.key === '1') { e.preventDefault(); handleRate(1); }
            if (e.key === '2') { e.preventDefault(); handleRate(2); }
            if (e.key === '3') { e.preventDefault(); handleRate(3); }
        }
    }

    function toggleFlip() {
        isFlipped = !isFlipped;
        onFlipStateChange(isFlipped);
    }

    function flipCard() {
        isFlipped = true;
        onFlipStateChange(true);
    }

    function loadNextCard() {
        currentCard = session.getNextCard();
        if (!currentCard) {
            onComplete(session);
            return;
        }

        isFlipped = false;
        onFlipStateChange(false);
        session = session;
    }

    function handleRate(rating) {
        session.rateCard(rating);
        saveActiveSession(session.exportSaveData());
        loadNextCard();
    }
</script>

<div class="flashcard-workspace">
    
    <!-- CONTEXT HEADER -->
    <div class="flashcard-header">
        <div class="context-group">
            <span class="context-title">{displayTitle}</span>
            <span class="context-dot">·</span>
            <span class="context-modifier">Flashcards</span>
        </div>
        <button class="ghost-exit" on:click={onExit} title="Exit [Esc]">×</button>
    </div>

    <!-- 3D TACTILE FLIP CARD -->
    {#if currentCard}
        <div class="card-scene">
            <div class="flip-card" class:is-flipped={isFlipped} on:click={toggleFlip}>
                
                <!-- FRONT: PROMPT -->
                <div class="card-face card-front">
                    <span class="face-tag">Prompt</span>
                    <div class="card-body">
                        <h2 class="prompt-text">{currentCard.question}</h2>
                    </div>
                    <div class="card-hint-row">
                        <span class="flip-hint">Tap card or press <kbd class="keycap-subtle">Space</kbd> to reveal</span>
                    </div>
                </div>

                <!-- BACK: REVEALED ANSWER & 3-TIER RATING -->
                <div class="card-face card-back">
                    <span class="face-tag">Answer</span>
                    <div class="card-body">
                        <h2 class="answer-text">{currentCard.correct}</h2>
                    </div>

                    <!-- 3-Tier Rating Action Row -->
                    <div class="rating-bar" on:click|stopPropagation>
                        <button class="rating-btn rate-1" on:click={() => handleRate(1)}>
                            <kbd class="rate-key">1</kbd>
                            <span>Didn't know</span>
                        </button>

                        <button class="rating-btn rate-2" on:click={() => handleRate(2)}>
                            <kbd class="rate-key">2</kbd>
                            <span>Almost</span>
                        </button>

                        <button class="rating-btn rate-3" on:click={() => handleRate(3)}>
                            <kbd class="rate-key">3</kbd>
                            <span>Knew it</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>

        <!-- PROGRESS BAR & QUEUE COUNTER -->
        <div class="flashcard-footer">
            <div class="progress-track">
                <div class="progress-line" style="width: {progress.percentage}%;"></div>
            </div>
            
            <div class="meta-row">
                <span>{progress.completed} of {progress.total} mastered</span>
                <span class="queue-stat">{progress.remaining} cards in queue</span>
            </div>
        </div>
    {/if}

</div>

<style>
    .flashcard-workspace {
        width: 100%;
        max-width: 680px;
        margin: 30px auto 80px auto;
        display: flex;
        flex-direction: column;
        text-align: left;
    }

    .flashcard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
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

    /* 3D CARD CONTAINER */
    .card-scene {
        width: 100%;
        height: 380px;
        perspective: 1200px; /* 3D depth */
        margin-bottom: 36px;
    }

    .flip-card {
        width: 100%;
        height: 100%;
        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
    }

    .flip-card.is-flipped {
        transform: rotateY(180deg);
        cursor: default;
    }

    .card-face {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--bg-card);
        border: 1px solid var(--border-primary);
        box-shadow: 0 8px 30px var(--shadow-light);
        padding: 28px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        backface-visibility: hidden;
        box-sizing: border-box;
    }

    .card-back {
        transform: rotateY(180deg);
    }

    .face-tag {
        font-family: inherit;
        font-size: 0.8em;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .card-body {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px 10px;
        text-align: center;
    }

    .prompt-text {
        font-size: 1.6em;
        font-weight: 700;
        line-height: 1.4;
        color: var(--text-primary);
        margin: 0;
    }

    .answer-text {
        font-size: 1.6em;
        font-weight: 600;
        line-height: 1.4;
        color: var(--correct-color);
        margin: 0;
    }

    .card-hint-row {
        text-align: center;
        font-size: 0.85em;
        color: var(--text-secondary);
    }

    .keycap-subtle {
        font-family: monospace;
        font-size: 0.88em;
        background: var(--bg-secondary);
        border: 1px solid var(--border-secondary);
        padding: 2px 7px;
        border-radius: 3px;
        color: var(--text-primary);
    }

    /* 3-TIER RATING CONTROLS */
    .rating-bar {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
        width: 100%;
    }

    .rating-btn {
        background: var(--bg-secondary);
        border: 1px solid var(--border-secondary);
        padding: 12px 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-family: inherit;
        font-size: 0.9em;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        border-radius: 4px;
    }

    .rate-key {
        font-family: monospace;
        font-size: 0.85em;
        padding: 1px 6px;
        background: var(--bg-card);
        border: 1px solid var(--border-secondary);
        border-radius: 2px;
    }

    /* Rating Colors */
    .rating-btn.rate-1 { color: var(--incorrect-color); }
    .rating-btn.rate-1:hover {
        background: rgba(163, 93, 72, 0.15);
        border-color: var(--incorrect-color);
    }

    .rating-btn.rate-2 { color: #c49a45; }
    .rating-btn.rate-2:hover {
        background: rgba(196, 154, 69, 0.15);
        border-color: #c49a45;
    }

    .rating-btn.rate-3 { color: var(--correct-color); }
    .rating-btn.rate-3:hover {
        background: rgba(59, 102, 64, 0.15);
        border-color: var(--correct-color);
    }

    /* FOOTER */
    .flashcard-footer {
        width: 100%;
    }

    .progress-track {
        background: var(--border-primary);
        height: 6px;
        width: 100%;
        margin-bottom: 12px;
        overflow: hidden;
    }

    .progress-line {
        background: var(--correct-color);
        height: 100%;
        transition: width 0.3s ease;
    }

    .meta-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.88em;
        color: var(--text-secondary);
    }

    @media (max-width: 600px) {
        .card-scene {
            height: 320px;
        }
        .prompt-text, .answer-text {
            font-size: 1.3em;
        }
        .rating-bar {
            grid-template-columns: 1fr;
            gap: 8px;
        }
    }
</style>