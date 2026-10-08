<!-- src/components/QuestionManager.svelte -->
<script>
    import { onMount, onDestroy } from 'svelte';
    import ConfirmModal from './ConfirmModal.svelte';

    export let questions = [];
    export let onClose;
    export let onSave;

    let localQuestions = JSON.parse(JSON.stringify(questions));
    let expandedIndex = localQuestions.length > 0 ? 0 : null;
    let showAdvancedModal = false;
    let activeDialog = null;

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });

    function handleKeydown(e) {
        // Ctrl + Enter (or Cmd + Enter on Mac) safely saves and exits!
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
        // Escape closes modal (if advanced modal isn't open)
        if (e.key === 'Escape' && !showAdvancedModal) {
            e.preventDefault();
            onClose();
        }
    }

    function toggleExpand(index) {
        expandedIndex = expandedIndex === index ? null : index;
    }

    function addQuestion() {
        localQuestions = [
            ...localQuestions,
            {
                question: '',
                correct: '',
                wrong: ['']
            }
        ];
        expandedIndex = localQuestions.length - 1;
    }

    function deleteQuestion(index, e) {
    e.stopPropagation();
    activeDialog = {
        title: 'Delete Question',
        message: `Delete question #${index + 1}?`,
        confirmLabel: 'Delete',
        isDestructive: true,
        onConfirm: () => {
            localQuestions = localQuestions.filter((_, i) => i !== index);
            if (expandedIndex === index) expandedIndex = null;
            activeDialog = null;
        },
        onCancel: () => activeDialog = null
    };
}

    function addWrongAnswer(qIndex) {
        localQuestions[qIndex].wrong = [...localQuestions[qIndex].wrong, ''];
        localQuestions = localQuestions;
    }

    function removeWrongAnswer(qIndex, wIndex) {
        localQuestions[qIndex].wrong = localQuestions[qIndex].wrong.filter((_, i) => i !== wIndex);
        localQuestions = localQuestions;
    }

    function handleSave() {
        onSave(localQuestions);
        onClose();
    }

    // Advanced options handlers
    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (!Array.isArray(parsed)) throw new Error('Invalid format');
                localQuestions = parsed;
                showAdvancedModal = false;
            } catch (err) {
                alert('Error importing file: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    function handlePasteJson() {
    activeDialog = {
        title: 'Paste JSON Questions',
        message: 'Paste an array of questions in JSON format:',
        confirmLabel: 'Import JSON',
        isInput: true,
        inputPlaceholder: '[ { "question": "...", "correct": "...", "wrong": [...] } ]',
        onConfirm: (text) => {
            if (!text || !text.trim()) return;
            try {
                const parsed = JSON.parse(text);
                if (!Array.isArray(parsed)) throw new Error('JSON must be an array');
                localQuestions = parsed;
                showAdvancedModal = false;
                activeDialog = null;
            } catch (err) {
                alert('Error parsing JSON: ' + err.message);
            }
        },
        onCancel: () => activeDialog = null
    };
}

function handlePasteSpreadsheet() {
    activeDialog = {
        title: 'Paste Spreadsheet Notes',
        message: 'Paste rows (tab or comma separated):\nFormat: Question | Correct | Wrong1 | Wrong2 | Wrong3',
        confirmLabel: 'Import Notes',
        isInput: true,
        inputPlaceholder: 'Mitochondria \t Powerhouse of the cell...',
        onConfirm: (text) => {
            if (!text || !text.trim()) return;
            try {
                const lines = text.trim().split('\n');
                const parsed = lines.map(line => {
                    const parts = line.split(/\t|,/).map(p => p.trim());
                    if (parts.length < 5) throw new Error('Each row needs 5 columns');
                    return {
                        question: parts[0],
                        correct: parts[1],
                        wrong: [parts[2], parts[3], parts[4]]
                    };
                });
                localQuestions = parsed;
                showAdvancedModal = false;
                activeDialog = null;
            } catch (err) {
                alert('Error parsing spreadsheet: ' + err.message);
            }
        },
        onCancel: () => activeDialog = null
    };
}


    function handleDownloadJson() {
        const json = JSON.stringify(localQuestions, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'revise-questions.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    function handleCopyJson() {
        const json = JSON.stringify(localQuestions, null, 2);
        navigator.clipboard.writeText(json).then(() => {
            alert('Questions copied to clipboard!');
        });
    }

    function handleClearAll() {
    activeDialog = {
        title: 'Clear All Questions',
        message: 'Are you sure you want to delete ALL questions in this deck? This cannot be undone!',
        confirmLabel: 'Clear All',
        isDestructive: true,
        onConfirm: () => {
            localQuestions = [];
            showAdvancedModal = false;
            activeDialog = null;
        },
        onCancel: () => activeDialog = null
    };
}
</script>

<div class="workbench-overlay" on:click={(e) => e.target === e.currentTarget && onClose()}>
    <div class="workbench-modal">
        
        <!-- HEADER: Sized Up & Clear -->
        <div class="workbench-header">
    <div class="header-left">
        <span class="workbench-title">Questions</span>
        <span class="workbench-counter">({localQuestions.length})</span>
    </div>
    <div class="header-right">
        <button class="subtle-text-btn" on:click={() => showAdvancedModal = true}>
            Advanced options
        </button>
        <button class="ghost-close-btn" on:click={onClose}>×</button>
    </div>
</div>

        <!-- ACCORDION WORKBENCH LIST -->
        <div class="workbench-list">
            {#each localQuestions as q, index}
                {@const isExpanded = expandedIndex === index}
                <div class="workbench-item" class:is-expanded={isExpanded}>
                    
                    <!-- Row Header -->
                    <div class="item-header" on:click={() => toggleExpand(index)}>
                        <div class="item-meta">
                            <span class="item-num">{String(index + 1).padStart(2, '0')}</span>
                            <span class="item-preview">{q.question || 'Untitled Question'}</span>
                        </div>
                        <div class="item-controls">
                            <!-- Crisp SVG Vector Trash Icon (Inherits theme colors!) -->
                            <button class="ghost-trash-btn" title="Delete Question" on:click={(e) => deleteQuestion(index, e)}>
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                            <span class="chevron">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                    </div>

                    <!-- Expanded Inline Editor -->
                    {#if isExpanded}
                        <div class="item-editor">
                            <div class="field-row">
                                <textarea 
                                    class="clean-textarea" 
                                    rows="2" 
                                    placeholder="Type question here..."
                                    bind:value={q.question}
                                ></textarea>
                            </div>

                            <div class="answer-edit-row">
                                <span class="row-symbol correct">✓</span>
                                <input 
                                    type="text" 
                                    class="clean-input" 
                                    placeholder="Correct answer..."
                                    bind:value={q.correct} 
                                />
                            </div>

                            <div class="wrong-answers-stack">
                                {#each q.wrong as wrongAns, wIdx}
                                    <div class="answer-edit-row">
                                        <span class="row-symbol wrong">✕</span>
                                        <input 
                                            type="text" 
                                            class="clean-input" 
                                            placeholder="Incorrect answer..."
                                            bind:value={q.wrong[wIdx]} 
                                        />
                                        <!-- Inside wrong-answers-stack in QuestionManager.svelte -->
{#if q.wrong.length > 1}
    <button class="ghost-trash-btn" title="Remove Option" on:click={() => removeWrongAnswer(index, wIdx)}>
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
    </button>
{/if}
                                    </div>
                                {/each}
                            </div>

                            <button class="inline-add-btn" on:click={() => addWrongAnswer(index)}>
                                + add distractor
                            </button>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>

        <!-- FOOTER: Action Bar + Monkeytype Style Keyboard Hints -->
        <!-- Update the footer in QuestionManager.svelte: -->
<div class="workbench-footer">
    <button class="primary-action-add" on:click={addQuestion}>
        + New Question
    </button>
    
    <button class="btn btn-primary" on:click={handleSave}>
        Save Questions <span class="keycap-hint">Ctrl+↵</span>
    </button>
</div>

    </div>
</div>

<!-- ADVANCED OPTIONS SUB-MODAL -->
{#if showAdvancedModal}
    <div class="workbench-overlay" style="z-index: 1200;" on:click={(e) => e.target === e.currentTarget && (showAdvancedModal = false)}>
        <div class="workbench-modal" style="max-width: 520px;">
            <div class="workbench-header">
                <span class="workbench-title">Advanced Options</span>
                <button class="ghost-close-btn" on:click={() => showAdvancedModal = false}>×</button>
            </div>

            <div class="advanced-section">
                <span class="section-label">Import</span>
                <div class="advanced-btn-grid">
                    <label for="workbenchFile" class="btn btn-secondary">Upload JSON</label>
                    <input type="file" id="workbenchFile" accept=".json" style="display: none;" on:change={handleFileUpload}>
                    <button class="btn btn-secondary" on:click={handlePasteJson}>Paste JSON</button>
                    <button class="btn btn-secondary" on:click={handlePasteSpreadsheet}>Spreadsheet</button>
                </div>
            </div>

            <div class="advanced-section">
                <span class="section-label">Export</span>
                <div class="advanced-btn-grid">
                    <button class="btn btn-secondary" on:click={handleDownloadJson}>Download JSON</button>
                    <button class="btn btn-secondary" on:click={handleCopyJson}>Copy Clipboard</button>
                </div>
            </div>

            <div class="advanced-footer">
                <button class="btn btn-danger" on:click={handleClearAll}>Clear All</button>
                <button class="btn btn-secondary" on:click={() => showAdvancedModal = false}>Done</button>
            </div>
        </div>
    </div>
{/if}

<!-- At the bottom of QuestionManager.svelte: -->
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

<style>
    .workbench-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--overlay-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
    }

    .workbench-modal {
        background: var(--bg-card);
        border: 1px solid var(--border-primary);
        width: 100%;
        max-width: 760px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 40px var(--shadow-light);
    }

    /* HEADER: Sized Up & Crisp */
    .workbench-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid var(--border-primary);
    }

    .workbench-title {
    font-family: inherit; /* Proportional! */
    font-size: 1.15em;
    font-weight: 700;
    letter-spacing: 0;
    color: var(--text-primary);
}

    .workbench-counter {
    font-family: inherit; /* Numbers stay monospace! */
    font-size: 0.95em;
    color: var(--text-secondary);
}

    .header-right {
        display: flex;
        align-items: center;
        gap: 18px;
    }

    .subtle-text-btn {
        background: none;
        border: none;
        font-family: inherit;
        font-size: 0.95em; /* Increased */
        color: var(--text-secondary);
        cursor: pointer;
        transition: color 0.15s ease;
    }

    .subtle-text-btn:hover {
        color: var(--text-primary);
    }

    .ghost-close-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 1.4em;
        cursor: pointer;
        line-height: 1;
        transition: color 0.15s ease;
    }

    .ghost-close-btn:hover {
        color: var(--incorrect-color);
    }

    /* LIST */
    .workbench-list {
        overflow-y: auto;
        padding: 16px 24px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex: 1;
    }

    .workbench-item {
        border: 1px solid var(--border-primary);
        background: var(--bg-secondary);
        transition: border-color 0.15s ease;
    }

    .workbench-item.is-expanded {
        background: var(--bg-card);
        border-color: var(--accent-color);
    }

    .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 16px;
        cursor: pointer;
        user-select: none;
    }

    .item-header:hover {
        background: var(--bg-option-hover);
    }

    .item-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        overflow: hidden;
    }

    .item-num {
        font-family: monospace;
        font-size: 0.85em;
        color: var(--text-secondary);
    }

    .item-preview {
        font-size: 0.95em;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 12px;
    }

    .item-controls {
        display: flex;
        align-items: center;
        gap: 14px;
    }

    .ghost-trash-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        opacity: 0.6;
        cursor: pointer;
        display: flex;
        align-items: center;
        padding: 4px;
        transition: all 0.15s ease;
    }

    .ghost-trash-btn:hover {
        opacity: 1;
        color: var(--incorrect-color);
    }

    .chevron {
        font-size: 0.7em;
        color: var(--text-secondary);
    }

    /* EXPANDED EDITOR */
    .item-editor {
        padding: 18px;
        border-top: 1px solid var(--border-primary);
        display: flex;
        flex-direction: column;
        gap: 14px;
        background: var(--bg-card);
    }

    .clean-textarea {
        width: 100%;
        background: var(--bg-primary);
        border: 1px solid var(--border-secondary);
        color: var(--text-primary);
        padding: 10px 12px;
        font-family: inherit;
        font-size: 0.95em;
        line-height: 1.4;
        box-sizing: border-box;
        resize: vertical;
    }

    .clean-textarea:focus,
    .clean-input:focus {
        outline: none;
        border-color: var(--accent-color);
    }

    .answer-edit-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .row-symbol {
        font-family: monospace;
        font-size: 1.1em;
        font-weight: 700;
        width: 18px;
        text-align: center;
        flex-shrink: 0;
    }

    .row-symbol.correct {
        color: var(--correct-color);
    }

    .row-symbol.wrong {
        color: var(--incorrect-color);
        opacity: 0.8;
    }

    .clean-input {
        flex: 1;
        background: var(--bg-primary);
        border: 1px solid var(--border-secondary);
        color: var(--text-primary);
        padding: 9px 12px;
        font-family: inherit;
        font-size: 0.95em;
        box-sizing: border-box;
    }

    .wrong-answers-stack {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .ghost-del-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 1.2em;
        cursor: pointer;
        padding: 0 4px;
        line-height: 1;
    }

    .ghost-del-btn:hover {
        color: var(--incorrect-color);
    }

    .primary-action-add {
        background: none;
        border: none;
        font-family: inherit; /* Proportional, no monospace */
        font-size: 1.05em;    /* Scaled up and easy to spot */
        font-weight: 600;
        color: var(--text-primary);
        cursor: pointer;
        padding: 6px 0;
        transition: color 0.15s ease;
    }

    .primary-action-add:hover {
        color: var(--accent-color);
        text-decoration: underline;
    }

    .inline-add-btn {
        background: none;
        border: none;
        font-family: inherit; /* Proportional */
        font-size: 0.92em;    /* 5% bigger */
        font-weight: 500;
        color: var(--accent-color);
        cursor: pointer;
        text-align: left;
        padding: 6px 0 6px 28px;
        margin-top: 2px;
        transition: color 0.15s ease;
    }

    .inline-add-btn:hover {
        text-decoration: underline;
        color: var(--accent-hover);
    }
    /* FOOTER & KEYBOARD HINTS */
    .workbench-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-top: 1px solid var(--border-primary);
        background: var(--bg-secondary);
        flex-wrap: wrap;
        gap: 12px;
    }

    .footer-left {
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
    }

    .subtle-action-btn {
        background: none;
        border: none;
        font-family: monospace;
        font-size: 0.88em;
        color: var(--text-primary);
        cursor: pointer;
        padding: 0;
    }

    .subtle-action-btn:hover {
        text-decoration: underline;
    }

    /* Monkeytype-style subtle shortcut bar */
    .shortcut-hints {
        font-family: monospace;
        font-size: 0.78em;
        color: var(--text-secondary);
        opacity: 0.7;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .hint-key {
        background: var(--bg-card);
        border: 1px solid var(--border-secondary);
        padding: 1px 4px;
        border-radius: 2px;
        color: var(--text-primary);
    }

    .hint-dot {
        opacity: 0.4;
    }

    .keycap-hint {
        font-family: monospace;
        font-size: 0.85em;
        margin-left: 6px;
        opacity: 0.7;
    }

    /* ADVANCED MODAL SPECIFICS */
    .advanced-section {
        padding: 16px 24px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .section-label {
        font-family: inherit;
        font-size: 0.90em;
        letter-spacing: 1.2px;
        color: var(--text-secondary);
    }

    .advanced-btn-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 10px;
    }

    .advanced-btn-grid .btn {
        padding: 10px 14px;
        font-size: 0.9em;
    }

    .advanced-footer {
        display: flex;
        justify-content: space-between;
        padding: 16px 24px;
        border-top: 1px solid var(--border-primary);
        margin-top: 10px;
    }
</style>