<!-- src/components/ConfirmModal.svelte -->
<script>
    import { onMount, onDestroy } from 'svelte';

    export let title = 'Are you sure?';
    export let message = '';
    export let confirmLabel = 'Confirm';
    export let isDestructive = false;
    export let isInput = false;
    export let inputPlaceholder = '';
    export let inputValue = '';

    export let onConfirm;
    export let onCancel;

    let inputEl;

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
        if (isInput && inputEl) {
            inputEl.focus();
        }
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });

    function handleKeydown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
        // Ctrl+Enter or Enter (if not multi-line input) confirms
        if (e.key === 'Enter' && (!isInput || e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleConfirm();
        }
    }

    function handleConfirm() {
        if (isInput) {
            onConfirm(inputValue);
        } else {
            onConfirm();
        }
    }
</script>

<div class="dialog-overlay" on:click={(e) => e.target === e.currentTarget && onCancel()}>
    <div class="dialog-card">
        
        <div class="dialog-header">
            <h3 class="dialog-title">{title}</h3>
            <button class="ghost-close-btn" on:click={onCancel}>×</button>
        </div>

        <div class="dialog-body">
            {#if message}
                <p class="dialog-message">{message}</p>
            {/if}

            {#if isInput}
                <textarea 
                    class="dialog-textarea"
                    rows="5"
                    placeholder={inputPlaceholder}
                    bind:value={inputValue}
                    bind:this={inputEl}
                ></textarea>
            {/if}
        </div>

        <div class="dialog-footer">
            <button class="btn btn-secondary" on:click={onCancel}>
                Cancel <kbd class="keycap-subtle">Esc</kbd>
            </button>
            <button 
                class="btn" 
                class:btn-danger={isDestructive} 
                class:btn-primary={!isDestructive}
                on:click={handleConfirm}
            >
                {confirmLabel} <kbd class="keycap-subtle">↵</kbd>
            </button>
        </div>

    </div>
</div>

<style>
    .dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--overlay-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1300; /* Above all other modals! */
        padding: 20px;
        box-sizing: border-box;
    }

    .dialog-card {
        background: var(--bg-card);
        border: 1px solid var(--border-primary);
        width: 100%;
        max-width: 480px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 16px 48px var(--shadow-light);
        text-align: left;
    }

    .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-primary);
        background: var(--bg-secondary);
    }

    .dialog-title {
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

    .dialog-body {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .dialog-message {
        font-size: 0.95em;
        color: var(--text-secondary);
        line-height: 1.5;
        margin: 0;
    }

    .dialog-textarea {
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

    .dialog-textarea:focus {
        outline: none;
        border-color: var(--accent-color);
    }

    .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 14px 20px;
        border-top: 1px solid var(--border-primary);
        background: var(--bg-secondary);
    }

    .keycap-subtle {
        font-family: monospace;
        font-size: 0.8em;
        background: rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 1px 5px;
        border-radius: 2px;
        margin-left: 4px;
    }
</style>