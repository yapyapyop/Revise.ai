<!-- src/components/ResultsScreen.svelte -->
<script>
    export let session;
    export let onRestart;
    export let onReviewMistakes;

    $: score = session ? session.getFinalScore() : { percentage: 0, correct: 0, total: 0 };
    $: progress = session ? session.getProgress() : null;
    $: hasMistakes = session ? session.hasWrongAnswers() : false;

    $: resultsText = session?.mode === 'spaced-repetition'
        ? `Great work! You mastered ${progress?.mastered || 0} out of ${progress?.total || 0} questions. Overall accuracy: ${score.percentage}%.`
        : `You got ${score.correct} out of ${score.total} questions correct!`;
</script>

<div class="results-screen-container">
    <div class="quiz-card results-card">
        <h1 class="quiz-main-title" style="margin-bottom: 8px;">Study Session Complete!</h1>
        
        <!-- Big Bold Score Display -->
        <div class="score">{score.percentage}%</div>
        
        <p class="results-text">{resultsText}</p>

        <div class="results-actions">
            {#if hasMistakes}
                <button class="btn btn-secondary" on:click={onReviewMistakes}>
                    Review Wrong Answers
                </button>
            {/if}
            
            <button class="btn btn-primary" on:click={onRestart}>
                Back to Dashboard
            </button>
        </div>
    </div>
</div>

<style>
    .results-screen-container {
        width: 100%;
        max-width: 680px;
        margin: 0 auto;
        text-align: center;
    }

    .results-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 30px;
    }

    .score {
        font-size: 3.5em;
        font-weight: 800;
        color: var(--correct-color);
        margin: 15px 0;
        line-height: 1;
    }

    .results-text {
        font-size: 1.15em;
        color: var(--text-secondary);
        margin-bottom: 30px;
        max-width: 500px;
        line-height: 1.5;
    }

    .results-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
        flex-wrap: wrap;
        width: 100%;
    }

    @media (max-width: 600px) {
        .results-actions button {
            width: 100%;
        }
    }
</style>