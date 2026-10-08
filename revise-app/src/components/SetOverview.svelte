<!-- src/components/SetOverview.svelte -->
<script>
    import { onMount, onDestroy } from 'svelte';

    export let currentSet;
    export let activeSession = null;
    export let returnScreen = 'dashboard'; // ✨ Contextual back screen: 'dashboard' | 'all-sets'
    
    export let onStartStudy;
    export let onResumeStudy;
    export let onEditQuestions;
    export let onUpdateSetDetails;
    export let onBack;

    let selectedMode = currentSet.lastConfig?.mode || 'elimination';
    let selectedOrder = currentSet.lastConfig?.order || 'random';
    let expandedQuestionIndex = null;

    // "Edit details" modal state
    let showEditDetailsModal = false;
    let editTitle = currentSet.title;
    let editDescription = currentSet.description || '';
    let editTags = (currentSet.tags || []).join(', ');

    $: hasActiveSessionForThisSet = activeSession && 
                                   activeSession.setId === currentSet.id && 
                                   (activeSession.questionsAnswered > 0 || activeSession.isReview || (activeSession.queue && activeSession.queue.length > 0));

    $: isCurrentModeActive = hasActiveSessionForThisSet && activeSession.mode === selectedMode;
    $: isResumable = hasActiveSessionForThisSet && activeSession.mode === selectedMode;

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });

    function handleKeydown(e) {
        if (e.key === 'Escape' && !showEditDetailsModal) {
            e.preventDefault();
            onBack();
        }
        if ((e.key === ' ' || e.key === 'Enter') && !showEditDetailsModal) {
            e.preventDefault();
            handleLaunch();
        }
        if ((e.key === 'm' || e.key === 'M') && !showEditDetailsModal) {
            onEditQuestions();
        }
    }

    function toggleQuestionPreview(index) {
        expandedQuestionIndex = expandedQuestionIndex === index ? null : index;
    }

    function handleLaunch() {
        if (hasActiveSessionForThisSet) {
            onResumeStudy();
        } else {
            onStartStudy(selectedMode, selectedOrder);
        }
    }

    function handleSaveDetails() {
        if (!editTitle.trim()) return;

        const updatedSet = {
            ...currentSet,
            title: editTitle.trim(),
            description: editDescription.trim(),
            tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
            updatedAt: Date.now()
        };

        onUpdateSetDetails(updatedSet);
        showEditDetailsModal = false;
    }
</script>

<div class="overview-workspace">

    <!-- 1. CONTEXTUAL BACK LINK & ACTIONS -->
    <div class="overview-top-nav">
        <!-- ✨ Dynamically says '← Dashboard' or '← All Sets'! ✨ -->
        <button class="back-link" on:click={onBack}>
            ← {returnScreen === 'all-sets' ? 'All Sets' : 'Dashboard'}
        </button>
        
        <div class="nav-right-actions">
            <button class="subtle-link" on:click={() => showEditDetailsModal = true}>
                Edit details
            </button>
            <span class="nav-dot">·</span>
            <button class="subtle-link" on:click={onEditQuestions}>
                Edit questions <kbd class="keycap-subtle">M</kbd>
            </button>
        </div>
    </div>

    <!-- 2. SET HEADER & METADATA -->
    <header class="overview-header">
        <div class="tags-row">
            {#each (currentSet.tags || ['Study Set']) as tag}
                <span class="set-tag">{tag}</span>
            {/each}
            <span class="tag-divider">·</span>
            <span class="card-count">{currentSet.questions.length} questions</span>
        </div>

        <h1 class="overview-title">{currentSet.title}</h1>
        
        {#if currentSet.description}
            <p class="overview-desc">{currentSet.description}</p>
        {/if}
    </header>

    <!-- 3. STUDY CONFIGURATION (Clean Sentence Case) -->
    <section class="config-panel">
    
    <!-- ✨ FIX: Show active review status in Set Overview ✨ -->
    {#if hasActiveSessionForThisSet && activeSession?.isReview}
    <div class="config-block" style="margin-bottom: 10px;">
        <span class="config-label" style="color: var(--incorrect-color);">ACTIVE REVIEW SESSION</span>
        <span style="font-size: 0.9em; color: var(--text-secondary);">
            You have an unfinished mistake review. Continuing will resume this review.
        </span>
    </div>
{/if}

    <div class="config-block">
        <span class="config-label">Study mode</span>
            <div class="mode-chips">
                <button 
                    class="mode-chip" 
                    class:active={selectedMode === 'elimination'}
                    on:click={() => selectedMode = 'elimination'}
                >
                    Elimination
                </button>
                <button 
                    class="mode-chip" 
                    class:active={selectedMode === 'spaced-repetition'}
                    on:click={() => selectedMode = 'spaced-repetition'}
                >
                    Spaced Repetition
                </button>
                <button 
                    class="mode-chip" 
                    class:active={selectedMode === 'flashcards'}
                    on:click={() => selectedMode = 'flashcards'}
>
                    Flashcards
                </button>
                <button class="mode-chip disabled" title="Coming in Phase 8">
                    Exam Sheet <span class="chip-status">soon</span>
                </button>
            </div>
        </div>

        <div class="config-block">
            <span class="config-label">Study options</span>
            <div class="options-row">
                <div class="option-toggle-group">
                    <button 
                        class="toggle-choice" 
                        class:selected={selectedOrder === 'random'}
                        on:click={() => selectedOrder = 'random'}
                    >
                        Random order
                    </button>
                    <button 
                        class="toggle-choice" 
                        class:selected={selectedOrder === 'sequential'}
                        on:click={() => selectedOrder = 'sequential'}
                    >
                        Sequential
                    </button>
                </div>
            </div>
        </div>

        <!-- Launch Button -->
        <!-- In SetOverview.svelte inside .launch-row -->
<!-- In SetOverview.svelte inside .launch-row: -->
<div class="launch-row">
    {#if isCurrentModeActive}
        <!-- Active session matching current mode -->
        <button class="btn btn-primary launch-btn" on:click={onResumeStudy}>
            {activeSession?.isReview ? 'Continue Review' : 'Continue Studying'} <kbd class="keycap-hint">Space ↵</kbd>
        </button>
        <button class="btn btn-secondary" on:click={() => onStartStudy(selectedMode, selectedOrder)}>
            Restart
        </button>
    {:else}
        <!-- Brand new session OR switching modes -->
        <button class="btn btn-primary launch-btn" on:click={() => onStartStudy(selectedMode, selectedOrder)}>
            Start Studying <kbd class="keycap-hint">Space ↵</kbd>
        </button>
        
        {#if hasActiveSessionForThisSet}
            <span class="session-switch-note">
                (Replaces in-progress session)
            </span>
        {/if}
    {/if}
</div>

    </section>

    <!-- 4. READ-ONLY QUESTION PREVIEW ACCORDION -->
    <section class="preview-section">
        <div class="preview-header">
            <span class="preview-title">Question preview</span>
            <span class="preview-count">({currentSet.questions.length})</span>
        </div>

        <div class="preview-list">
            {#each currentSet.questions as q, index}
                {@const isExpanded = expandedQuestionIndex === index}
                <div class="preview-item" class:expanded={isExpanded}>
                    
                    <div class="preview-item-header" on:click={() => toggleQuestionPreview(index)}>
                        <div class="preview-meta">
                            <span class="preview-num">{index + 1}.</span>
                            <span class="preview-text">{q.question}</span>
                        </div>
                        <span class="chevron">{isExpanded ? '▲' : '▼'}</span>
                    </div>

                    {#if isExpanded}
                        <div class="preview-item-body">
                            <div class="preview-answer correct">
                                <span class="symbol">✓</span>
                                <span class="text">{q.correct}</span>
                            </div>
                            {#each q.wrong as wrongAns}
                                <div class="preview-answer wrong">
                                    <span class="symbol">✕</span>
                                    <span class="text">{wrongAns}</span>
                                </div>
                            {/each}
                        </div>
                    {/if}

                </div>
            {/each}
        </div>
    </section>

</div>

<!-- ✨ EDIT SET DETAILS MODAL (Name, Description, Tags) ✨ -->
{#if showEditDetailsModal}
    <div class="details-overlay" on:click={(e) => e.target === e.currentTarget && (showEditDetailsModal = false)}>
        <div class="details-modal">
            <div class="details-header">
                <h2 class="details-title">Edit Set Details</h2>
                <button class="ghost-close-btn" on:click={() => showEditDetailsModal = false}>×</button>
            </div>

            <div class="details-body">
                <div class="field-group">
                    <label class="field-label">Set Title</label>
                    <input type="text" class="clean-input" bind:value={editTitle} placeholder="e.g. Biology 102 Exam 2" />
                </div>

                <div class="field-group">
                    <label class="field-label">Description (Optional)</label>
                    <textarea class="clean-textarea" rows="2" bind:value={editDescription} placeholder="Chapters 4-7, cell structure and ATP..."></textarea>
                </div>

                <div class="field-group">
                    <label class="field-label">Tags (Separated by commas)</label>
                    <input type="text" class="clean-input" bind:value={editTags} placeholder="Biology, Midterm, STEM" />
                </div>
            </div>

            <div class="details-footer">
                <button class="btn btn-secondary" on:click={() => showEditDetailsModal = false}>Cancel</button>
                <button class="btn btn-primary" on:click={handleSaveDetails}>Save Details</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .overview-workspace {
        width: 100%;
        max-width: 840px;
        margin: 20px auto 80px auto;
        display: flex;
        flex-direction: column;
        text-align: left;
    }

    .overview-top-nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }

    .back-link {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-family: inherit;
        font-size: 0.9em;
        cursor: pointer;
        padding: 0;
        transition: color 0.15s ease;
    }

    .back-link:hover, .subtle-link:hover {
        color: var(--text-primary);
    }

    .nav-right-actions {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .subtle-link {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-family: inherit;
        font-size: 0.88em;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .nav-dot {
        color: var(--text-secondary);
        opacity: 0.4;
    }

    .keycap-subtle {
        font-family: monospace;
        font-size: 0.8em;
        background: var(--bg-secondary);
        border: 1px solid var(--border-secondary);
        padding: 1px 5px;
        border-radius: 2px;
        color: var(--text-secondary);
    }

    .overview-header {
        margin-bottom: 32px;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--border-primary);
    }

    .tags-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.82em;
        color: var(--text-secondary);
        margin-bottom: 10px;
    }

    .set-tag {
        background: var(--bg-secondary);
        padding: 2px 8px;
        border-radius: 3px;
        color: var(--text-primary);
    }

    .tag-divider {
        opacity: 0.4;
    }

    .card-count {
        font-family: inherit;
    }

    .overview-title {
        font-size: 2.4em;
        font-weight: 800;
        color: var(--text-primary);
        margin: 0 0 10px 0;
        line-height: 1.15;
    }

    .overview-desc {
        font-size: 1.05em;
        color: var(--text-secondary);
        line-height: 1.5;
        margin: 0;
    }

    .config-panel {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-bottom: 48px;
    }

    .config-block {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .config-label {
        font-family: inherit;
        font-size: 0.85em;
        font-weight: 600;
        color: var(--text-secondary);
    }

    .mode-chips {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .mode-chip {
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        color: var(--text-secondary);
        font-family: inherit;
        padding: 8px 16px;
        font-size: 0.9em;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .mode-chip:hover:not(.disabled) {
        border-color: var(--accent-color);
        color: var(--text-primary);
    }

    .mode-chip.active {
        background: var(--bg-card);
        border-color: var(--accent-color);
        color: var(--text-primary);
        font-weight: 600;
        box-shadow: 0 2px 6px var(--shadow-light);
    }

    .mode-chip.disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .chip-status {
        font-size: 0.75em;
        opacity: 0.7;
    }

    .options-row {
        display: flex;
        gap: 12px;
    }

    .option-toggle-group {
        display: flex;
        gap: 3px;
        background: var(--bg-secondary);
        padding: 3px;
        border: 1px solid var(--border-primary);
    }

    .toggle-choice {
        background: transparent;
        border: none;
        padding: 5px 12px;
        font-size: 0.85em;
        font-family: inherit;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .toggle-choice.selected {
        background: var(--bg-card);
        color: var(--text-primary);
        font-weight: 600;
        box-shadow: 0 1px 3px var(--shadow-light);
    }

    .launch-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 8px;
    }

    .launch-btn {
        padding: 14px 28px;
        font-size: 1.05em;
    }

    .session-switch-note {
        font-size: 0.82em;
        color: var(--text-secondary);
        font-style: italic;
    }

    .keycap-hint {
        font-family: monospace;
        font-size: 0.85em;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 1px 6px;
        border-radius: 3px;
        margin-left: 6px;
    }

    .preview-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .preview-header {
        display: flex;
        align-items: center;
        gap: 6px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border-primary);
    }

    .preview-title {
        font-family: inherit;
        font-size: 1em;
        font-weight: 700;
        color: var(--text-primary);
    }

    .preview-count {
        font-family: inherit;
        font-size: 0.88em;
        color: var(--text-secondary);
    }

    .preview-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .preview-item {
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        transition: background 0.15s ease;
    }

    .preview-item.expanded {
        background: var(--bg-card);
        border-color: var(--border-secondary);
    }

    .preview-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        user-select: none;
    }

    .preview-item-header:hover {
        background: var(--bg-option-hover);
    }

    .preview-meta {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        overflow: hidden;
    }

    .preview-num {
        font-family: inherit;
        font-size: 0.9em;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .preview-text {
        font-size: 0.95em;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 12px;
    }

    .chevron {
        font-size: 0.7em;
        color: var(--text-secondary);
    }

    .preview-item-body {
        padding: 14px 16px;
        border-top: 1px solid var(--border-primary);
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: var(--bg-card);
    }

    .preview-answer {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.92em;
    }

    .preview-answer .symbol {
        font-family: monospace;
        font-size: 1.05em;
        font-weight: bold;
        width: 16px;
    }

    .preview-answer.correct {
        color: var(--correct-color);
    }

    .preview-answer.wrong {
        color: var(--text-secondary);
        opacity: 0.85;
    }

    /* EDIT SET DETAILS MODAL */
    .details-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--overlay-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1100;
        padding: 20px;
    }

    .details-modal {
        background: var(--bg-card);
        border: 1px solid var(--border-primary);
        width: 100%;
        max-width: 520px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 40px var(--shadow-light);
    }

    .details-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-primary);
    }

    .details-title {
        font-size: 1.1em;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
    }

    .ghost-close-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 1.3em;
        cursor: pointer;
        line-height: 1;
    }

    .ghost-close-btn:hover {
        color: var(--incorrect-color);
    }

    .details-body {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .field-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .field-label {
        font-size: 0.85em;
        font-weight: 600;
        color: var(--text-secondary);
    }

    .clean-input {
        background: var(--bg-primary);
        border: 1px solid var(--border-secondary);
        color: var(--text-primary);
        padding: 10px 12px;
        font-family: inherit;
        font-size: 0.95em;
        width: 100%;
        box-sizing: border-box;
    }

    .clean-textarea {
        background: var(--bg-primary);
        border: 1px solid var(--border-secondary);
        color: var(--text-primary);
        padding: 10px 12px;
        font-family: inherit;
        font-size: 0.95em;
        width: 100%;
        box-sizing: border-box;
        resize: vertical;
    }

    .clean-input:focus, .clean-textarea:focus {
        outline: none;
        border-color: var(--accent-color);
    }

    .details-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 14px 20px;
        border-top: 1px solid var(--border-primary);
        background: var(--bg-secondary);
    }
</style>