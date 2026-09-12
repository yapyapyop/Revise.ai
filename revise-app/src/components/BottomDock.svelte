<!-- src/components/BottomDock.svelte -->
<script>
    export let currentScreen = 'dashboard';
    export let isManagerOpen = false;
    export let isSettingsOpen = false;
</script>

<footer class="dock-container">
    <div class="dock-content">
        <div class="dock-shortcuts">
            {#if isManagerOpen}
                <span class="dock-item"><kbd class="dock-key">Tab</kbd> navigate</span>
                <span class="dock-dot">·</span>
                <span class="dock-item"><kbd class="dock-key">Ctrl+↵</kbd> save questions</span>
                <span class="dock-dot">·</span>
                <span class="dock-item"><kbd class="dock-key">Esc</kbd> close</span>
            {:else if isSettingsOpen}
                <span class="dock-item"><kbd class="dock-key">Esc</kbd> close preferences</span>
            {:else if currentScreen === 'quiz'}
                <!-- UNIFIED QUIZ SHORTCUTS (No flickering or redundant state switching!) -->
                <span class="dock-item"><kbd class="dock-key">1–4</kbd> select option</span>
                <span class="dock-dot">·</span>
                <span class="dock-item"><kbd class="dock-key">Space</kbd> next question</span>
                <span class="dock-dot">·</span>
                <span class="dock-item"><kbd class="dock-key">Esc</kbd> exit session</span>
            {:else if currentScreen === 'dashboard'}
                <span class="dock-item"><kbd class="dock-key">Space</kbd> continue studying</span>
                <span class="dock-dot">·</span>
                <span class="dock-item"><kbd class="dock-key">M</kbd> edit questions</span>
            {:else if currentScreen === 'results'}
                <span class="dock-item"><kbd class="dock-key">Space</kbd> back to dashboard</span>
            {/if}
        </div>
    </div>
</footer>

<style>
    .dock-container {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 38px;
        background: var(--bg-card);
        border-top: 1px solid var(--border-primary);
        display: flex;
        align-items: center;
        /* ✨ LIFTED ABOVE OVERLAY (1005 > 1000) so it never gets dimmed! ✨ */
        z-index: 1005;
        box-sizing: border-box;
    }

    .dock-content {
        width: 100%;
        max-width: 1120px;
        margin: 0 auto;
        padding: 0 20px;
        display: flex;
        justify-content: flex-start;
    }

    .dock-shortcuts {
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: inherit;
        font-size: 0.84em;
        color: var(--text-secondary);
    }

    .dock-item {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .dock-key {
        font-family: monospace;
        font-size: 0.85em;
        background: var(--bg-secondary);
        border: 1px solid var(--border-secondary);
        color: var(--text-primary);
        padding: 1px 6px;
        border-radius: 3px;
        line-height: 1.3;
    }

    .dock-dot {
        opacity: 0.35;
        color: var(--text-secondary);
    }
</style>