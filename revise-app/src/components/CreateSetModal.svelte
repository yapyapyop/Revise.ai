<!-- src/components/CreateSetModal.svelte -->
<script>
    import { onMount, onDestroy } from 'svelte';

    export let onClose;
    export let onCreateSet; // Returns (newSet, shouldOpenEditor)

    let activeTab = 'blank'; // 'blank' | 'spreadsheet' | 'json'

    // Form State
    let title = '';
    let description = '';
    let tagsInput = '';
    let spreadsheetText = '';
    let jsonText = '';

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });

    function handleKeydown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    }

    function createSetObject(questionsArray, defaultTitle = 'Untitled Set') {
        const finalTitle = title.trim() || defaultTitle;
        const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

        return {
            id: 'set_' + Date.now(),
            title: finalTitle,
            description: description.trim(),
            tags: tags.length > 0 ? tags : ['Custom'],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            questions: questionsArray,
            lastConfig: {
                mode: 'elimination',
                order: 'random'
            }
        };
    }

    // 1. Create Blank Set
    function handleCreateBlank() {
        if (!title.trim()) {
            alert('Please enter a set title.');
            return;
        }

        const newSet = createSetObject([
            {
                question: '',
                correct: '',
                wrong: ['']
            }
        ], title.trim());

        onCreateSet(newSet, true); // Opens Question Manager to start editing immediately!
    }

    // 2. Parse Delimited Text (Spreadsheet / Quizlet export)
    function handleImportSpreadsheet() {
        if (!spreadsheetText.trim()) return;

        try {
            const lines = spreadsheetText.trim().split('\n');
            const questions = [];

            for (const line of lines) {
                if (!line.trim()) continue;

                // Split by Tab or Comma
                const parts = line.split(/\t|,/).map(p => p.trim());

                if (parts.length >= 5) {
                    // Full MCQ Format: Question | Correct | W1 | W2 | W3
                    questions.push({
                        question: parts[0],
                        correct: parts[1],
                        wrong: parts.slice(2, 5)
                    });
                } else if (parts.length >= 2) {
                    // 2-Column Flashcard Format: Term | Definition
                    questions.push({
                        question: parts[0],
                        correct: parts[1],
                        wrong: [] // Distractors can be auto-generated later!
                    });
                }
            }

            if (questions.length === 0) {
                alert('Could not find valid rows. Make sure each line has at least 2 columns (Term | Definition).');
                return;
            }

            const newSet = createSetObject(questions, title.trim() || 'Imported Set');
            onCreateSet(newSet, false); // Opens Set Overview to inspect!
        } catch (err) {
            alert('Error parsing spreadsheet: ' + err.message);
        }
    }

    // 3. Import JSON file or text
    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (!Array.isArray(parsed)) throw new Error('JSON must be an array of questions');
                
                const fileName = file.name.replace('.json', '');
                const newSet = createSetObject(parsed, title.trim() || fileName);
                onCreateSet(newSet, false);
            } catch (err) {
                alert('Error importing JSON file: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    function handleImportJsonText() {
        if (!jsonText.trim()) return;

        try {
            const parsed = JSON.parse(jsonText.trim());
            if (!Array.isArray(parsed)) throw new Error('JSON must be an array of questions');

            const newSet = createSetObject(parsed, title.trim() || 'Imported JSON Set');
            onCreateSet(newSet, false);
        } catch (err) {
            alert('Error parsing JSON text: ' + err.message);
        }
    }
</script>

<div class="modal-overlay" on:click={(e) => e.target === e.currentTarget && onClose()}>
    <div class="create-modal">
        
        <!-- HEADER -->
        <div class="modal-header">
            <h2 class="modal-title">Create Study Set</h2>
            <button class="ghost-close-btn" on:click={onClose}>×</button>
        </div>

        <!-- TABS: Source Method -->
        <div class="source-tabs">
            <button 
                class="tab-btn" 
                class:active={activeTab === 'blank'}
                on:click={() => activeTab = 'blank'}
            >
                Blank set
            </button>
            <button 
                class="tab-btn" 
                class:active={activeTab === 'spreadsheet'}
                on:click={() => activeTab = 'spreadsheet'}
            >
                Paste notes / spreadsheet
            </button>
            <button 
                class="tab-btn" 
                class:active={activeTab === 'json'}
                on:click={() => activeTab = 'json'}
            >
                Import JSON
            </button>
        </div>

        <!-- MODAL BODY -->
        <div class="modal-body">
            
            <!-- Metadata Fields (Shared across all tabs) -->
            <div class="meta-fields">
                <div class="field-row">
                    <label class="field-label">Set Title</label>
                    <input 
                        type="text" 
                        class="clean-input" 
                        placeholder="e.g. Biology 102 — Exam 2"
                        bind:value={title} 
                    />
                </div>

                <div class="field-row-split">
                    <div class="split-col">
                        <label class="field-label">Tags (Optional)</label>
                        <input 
                            type="text" 
                            class="clean-input" 
                            placeholder="Biology, Midterm 1"
                            bind:value={tagsInput} 
                        />
                    </div>
                    <div class="split-col">
                        <label class="field-label">Description (Optional)</label>
                        <input 
                            type="text" 
                            class="clean-input" 
                            placeholder="Chapters 4-7, cell structure..."
                            bind:value={description} 
                        />
                    </div>
                </div>
            </div>

            <!-- TAB 1: BLANK SET -->
            {#if activeTab === 'blank'}
                <div class="tab-content">
                    <p class="tab-explainer">
                        Create an empty deck and add questions manually using the Question Manager.
                    </p>
                    <div class="action-footer">
                        <button class="btn btn-secondary" on:click={onClose}>Cancel</button>
                        <button class="btn btn-primary" on:click={handleCreateBlank}>
                            Create & Add Questions →
                        </button>
                    </div>
                </div>

            <!-- TAB 2: PASTE SPREADSHEET / QUIZLET -->
            {:else if activeTab === 'spreadsheet'}
                <div class="tab-content">
                    <p class="tab-explainer">
                        Paste rows from Google Sheets, Excel, or Quizlet export. <br />
                        Supports <strong>Term | Definition</strong> (2 columns) or <strong>Question | Correct | Wrong 1 | Wrong 2 | Wrong 3</strong> (5 columns).
                    </p>
                    
                    <textarea 
                        class="clean-textarea" 
                        rows="6" 
                        placeholder="Mitochondria &#9; Powerhouse of the cell&#10;Ribosome &#9; Site of protein synthesis..."
                        bind:value={spreadsheetText}
                    ></textarea>

                    <div class="action-footer">
                        <button class="btn btn-secondary" on:click={onClose}>Cancel</button>
                        <button class="btn btn-primary" on:click={handleImportSpreadsheet}>
                            Parse & Import Deck →
                        </button>
                    </div>
                </div>

            <!-- TAB 3: IMPORT JSON -->
            {:else if activeTab === 'json'}
                <div class="tab-content">
                    <div class="upload-dropzone">
                        <label for="jsonUploadField" class="btn btn-secondary">
                            Choose JSON File
                        </label>
                        <input 
                            type="file" 
                            id="jsonUploadField" 
                            accept=".json" 
                            style="display: none;" 
                            on:change={handleFileUpload} 
                        />
                        <span class="dropzone-sub">or paste JSON below</span>
                    </div>

                    <textarea 
                        class="clean-textarea" 
                        rows="4" 
                        placeholder={'[\n  { "question": "...", "correct": "...", "wrong": [...] }\n]'}
                        bind:value={jsonText}
                    ></textarea>

                    <div class="action-footer">
                        <button class="btn btn-secondary" on:click={onClose}>Cancel</button>
                        <button class="btn btn-primary" on:click={handleImportJsonText}>
                            Import from JSON →
                        </button>
                    </div>
                </div>
            {/if}

        </div>

    </div>
</div>

<style>
    .modal-overlay {
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
        padding: 24px;
        box-sizing: border-box;
    }

    .create-modal {
        background: var(--bg-card);
        border: 1px solid var(--border-primary);
        width: 100%;
        max-width: 640px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 16px 48px var(--shadow-light);
        box-sizing: border-box;
    }

    /* HEADER */
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 18px 24px;
        border-bottom: 1px solid var(--border-primary);
        background: var(--bg-secondary);
    }

    .modal-title {
        font-size: 1.15em;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
    }

    .ghost-close-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 1.4em;
        line-height: 1;
        cursor: pointer;
        transition: color 0.15s ease;
    }

    .ghost-close-btn:hover {
        color: var(--incorrect-color);
    }

    /* TABS */
    .source-tabs {
        display: flex;
        border-bottom: 1px solid var(--border-primary);
        background: var(--bg-card);
    }

    .tab-btn {
        flex: 1;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        padding: 12px;
        font-size: 0.88em;
        font-family: inherit;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .tab-btn:hover {
        color: var(--text-primary);
        background: var(--bg-secondary);
    }

    .tab-btn.active {
        color: var(--text-primary);
        font-weight: 600;
        border-bottom-color: var(--accent-color);
        background: var(--bg-secondary);
    }

    /* BODY */
    .modal-body {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        text-align: left;
    }

    .meta-fields {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding-bottom: 18px;
        border-bottom: 1px solid var(--border-primary);
    }

    .field-row {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .field-row-split {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
    }

    .split-col {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .field-label {
        font-size: 0.84em;
        font-weight: 600;
        color: var(--text-secondary);
    }

    .clean-input {
        background: var(--bg-primary);
        border: 1px solid var(--border-secondary);
        color: var(--text-primary);
        padding: 9px 12px;
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
        font-family: monospace;
        font-size: 0.88em;
        width: 100%;
        box-sizing: border-box;
        resize: vertical;
        line-height: 1.4;
    }

    .clean-input:focus, .clean-textarea:focus {
        outline: none;
        border-color: var(--accent-color);
    }

    /* TAB SPECIFICS */
    .tab-content {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    .tab-explainer {
        font-size: 0.88em;
        color: var(--text-secondary);
        line-height: 1.5;
        margin: 0;
    }

    .upload-dropzone {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
    }

    .dropzone-sub {
        font-size: 0.82em;
        color: var(--text-secondary);
    }

    .action-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 10px;
    }
</style>