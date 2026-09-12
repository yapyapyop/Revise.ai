<!-- src/components/SettingsModal.svelte -->
<script>
    export let isDarkMode = false;
    export let isSpacedRepetition = false;
    export let isRandomOrder = false;

    export let onClose;
    export let onToggleTheme;
    export let onToggleMode;
    export let onToggleOrder;

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }
</script>

<div class="settings-overlay" on:click={handleOverlayClick} style="display: flex;">
    <div class="settings-modal">
        <div class="settings-header">
            <h2 class="settings-title">Study Settings</h2>
            <button class="close-btn" on:click={onClose}>×</button>
        </div>

        <!-- Dark Mode Toggle -->
        <div class="setting-group">
            <label class="setting-label">Dark Mode</label>
            <div class="setting-description">
                Switch to dark theme for comfortable late-night studying.
            </div>
            <label class="toggle-switch">
                <input type="checkbox" checked={isDarkMode} on:change={onToggleTheme}>
                <span class="slider"></span>
            </label>
            <div style="margin-top: 8px;">
                <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
        </div>

        <!-- Study Mode Toggle -->
        <div class="setting-group">
            <label class="setting-label">Study Mode</label>
            <div class="setting-description">
                Choose how wrong answers are handled during your study session.
            </div>
            <label class="toggle-switch">
                <input type="checkbox" checked={isSpacedRepetition} on:change={onToggleMode}>
                <span class="slider"></span>
            </label>
            <div style="margin-top: 8px;">
                <span>{isSpacedRepetition ? 'Spaced Repetition Mode' : 'Elimination Mode'}</span>
            </div>
        </div>

        <!-- Question Order Toggle -->
        <div class="setting-group">
            <label class="setting-label">Question Order</label>
            <div class="setting-description">
                Randomize the order of questions each time you start (Elimination Mode only).
            </div>
            <label class="toggle-switch">
                <input type="checkbox" checked={isRandomOrder} on:change={onToggleOrder}>
                <span class="slider"></span>
            </label>
            <div style="margin-top: 8px;">
                <span>{isRandomOrder ? 'Random Order' : 'Sequential Order'}</span>
            </div>
        </div>

        <!-- Timed Mode (Future placeholder) -->
        <div class="setting-group">
            <label class="setting-label">Timed Mode</label>
            <div class="setting-description">
                Race against the clock! (Coming soon)
            </div>
            <label class="toggle-switch">
                <input type="checkbox" disabled style="opacity: 0.5;">
                <span class="slider" style="opacity: 0.5;"></span>
            </label>
        </div>
    </div>
</div>