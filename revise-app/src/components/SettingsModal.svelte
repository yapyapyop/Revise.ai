<!-- src/components/SettingsModal.svelte -->
<script>
    import { onMount, onDestroy } from 'svelte';

    export let isDarkMode = true;
    export let onClose;
    export let onToggleTheme;

    let activeSection = 'general';
    let searchQuery = '';
    let searchInputEl;
    let scrollContainerEl;

    // 3 Strict Global Categories
    const sections = [
        { id: 'general', label: 'General' },
        { id: 'keyboard', label: 'Keyboard' },
        { id: 'accessibility', label: 'Accessibility' },
        { id: 'about', label: 'About' }
    ];

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
        if (e.key === '/' && document.activeElement !== searchInputEl) {
            e.preventDefault();
            searchInputEl?.focus();
        }
    }

    function scrollToSection(id) {
        activeSection = id;
        const el = document.getElementById(`settings-section-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function handleScroll() {
        if (!scrollContainerEl) return;
        const containerTop = scrollContainerEl.getBoundingClientRect().top;

        for (const s of sections) {
            const el = document.getElementById(`settings-section-${s.id}`);
            if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.top - containerTop <= 60 && rect.bottom - containerTop > 40) {
                    activeSection = s.id;
                    break;
                }
            }
        }
    }
</script>

<div class="pref-overlay" on:click={(e) => e.target === e.currentTarget && onClose()}>
    <div class="pref-workspace">

        <!-- TOPBAR -->
        <div class="pref-topbar">
            <h2 class="pref-title">Preferences</h2>
            
            <div class="pref-topbar-right">
                <div class="search-wrap">
                    <input 
                        type="text" 
                        class="pref-search-input" 
                        placeholder="Search settings..."
                        bind:value={searchQuery}
                        bind:this={searchInputEl}
                    />
                    <kbd class="search-key">/</kbd>
                </div>
                <button class="ghost-close-btn" on:click={onClose} title="Close [Esc]">×</button>
            </div>
        </div>

        <!-- WORKSPACE BODY (2 COLUMNS) -->
        <div class="pref-body">
            
            <!-- LEFT NAVIGATION SIDEBAR (Scroll-Spy Active) -->
            <nav class="pref-sidebar">
                {#each sections as s}
                    <button 
                        class="sidebar-nav-item" 
                        class:active={activeSection === s.id}
                        on:click={() => scrollToSection(s.id)}
                    >
                        {s.label}
                    </button>
                {/each}
            </nav>

            <!-- RIGHT CONTINUOUS SCROLL PANE -->
            <div 
                class="pref-content-scroll" 
                bind:this={scrollContainerEl}
                on:scroll={handleScroll}
            >
                
                <!-- 1. GENERAL -->
                <section id="settings-section-general" class="pref-section">
                    <h3 class="section-heading">General</h3>

                    <!-- Theme -->
                    <div class="setting-row">
                        <div class="setting-info">
                            <span class="setting-title">Theme</span>
                            <span class="setting-desc">Choose your workspace atmosphere.</span>
                        </div>
                        <div class="toggle-control">
                            <button 
                                class="theme-choice-btn" 
                                class:selected={isDarkMode}
                                on:click={() => { if (!isDarkMode) onToggleTheme(); }}
                            >
                                Dark Academia
                            </button>
                            <button 
                                class="theme-choice-btn" 
                                class:selected={!isDarkMode}
                                on:click={() => { if (isDarkMode) onToggleTheme(); }}
                            >
                                Warm Paper
                            </button>
                        </div>
                    </div>

                    <!-- Advance Behavior -->
                    <div class="setting-row">
                        <div class="setting-info">
                            <span class="setting-title">Advance behavior</span>
                            <span class="setting-desc">How to proceed after answering during study.</span>
                        </div>
                        <div class="toggle-control">
                            <button class="theme-choice-btn selected">Manual (Space)</button>
                            <button class="theme-choice-btn" style="opacity: 0.5;">Instant on correct</button>
                        </div>
                    </div>

                    <!-- Audio Cues -->
                    <div class="setting-row dimmed-feature">
                        <div class="setting-info">
                            <span class="setting-title">Sound effects</span>
                            <span class="setting-desc">Tactile mechanical clicks on keyboard selection.</span>
                        </div>
                        <span class="quiet-status-tag">Coming soon</span>
                    </div>
                </section>

                <!-- 2. KEYBOARD -->
                <section id="settings-section-keyboard" class="pref-section">
                    <h3 class="section-heading">Keyboard</h3>

                    <!-- Next Key -->
                    <div class="setting-row">
                        <div class="setting-info">
                            <span class="setting-title">Primary next key</span>
                            <span class="setting-desc">Key used to advance to the next question.</span>
                        </div>
                        <kbd class="keycap-display">Space</kbd>
                    </div>

                    <!-- Option Numbering -->
                    <div class="setting-row">
                        <div class="setting-info">
                            <span class="setting-title">Option numbering</span>
                            <span class="setting-desc">Key labels assigned to multiple choice choices.</span>
                        </div>
                        <div class="toggle-control">
                            <button class="theme-choice-btn selected">1, 2, 3, 4</button>
                            <button class="theme-choice-btn" style="opacity: 0.5;">A, B, C, D</button>
                        </div>
                    </div>

                    <!-- Dock Visibility -->
                    <div class="setting-row">
                        <div class="setting-info">
                            <span class="setting-title">Shortcut hints dock</span>
                            <span class="setting-desc">Persistent command dock at the bottom of the screen.</span>
                        </div>
                        <span class="active-status-label">Always visible</span>
                    </div>
                </section>

                <!-- 3. ACCESSIBILITY -->
                <section id="settings-section-accessibility" class="pref-section">
                    <h3 class="section-heading">Accessibility</h3>

                    <!-- Text Size -->
                    <div class="setting-row">
                        <div class="setting-info">
                            <span class="setting-title">Question text size</span>
                            <span class="setting-desc">Adjust the scale of the question and answer text.</span>
                        </div>
                        <div class="toggle-control">
                            <button class="theme-choice-btn selected">Standard</button>
                            <button class="theme-choice-btn" style="opacity: 0.5;">Large</button>
                        </div>
                    </div>

                    <!-- Reduce Motion -->
                    <div class="setting-row dimmed-feature">
                        <div class="setting-info">
                            <span class="setting-title">Reduce motion</span>
                            <span class="setting-desc">Disable smooth card transitions and progress bar animation.</span>
                        </div>
                        <span class="quiet-status-tag">System default</span>
                    </div>

                    <!-- Reading Font -->
                    <div class="setting-row dimmed-feature">
                        <div class="setting-info">
                            <span class="setting-title">Reading font</span>
                            <span class="setting-desc">Switch question text to high-legibility Atkinson Hyperlegible.</span>
                        </div>
                        <span class="quiet-status-tag">Standard (Inter)</span>
                    </div>
                </section>
                <section id="settings-section-about" class="pref-section">
                    <h3 class="section-heading">About</h3>

                    <div class="setting-row">
                        <div class="setting-info">
                            <span class="setting-title">Revise</span>
                            <span class="setting-desc">A simple, free, and focused way to study.</span>
                        </div>
                        <span class="quiet-status-tag">v1.2.0 beta</span>
                    </div>

                    <div class="setting-row">
                        <div class="setting-info">
                            <span class="setting-title">Source code</span>
                            <span class="setting-desc">View the source code here.</span>
                        </div>
                        <a 
                            href="https://github.com/yapyapyop/Revise.ai" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            class="subtle-link"
                            style="font-size: 0.9em; text-decoration: underline;"
                        >
                            View on GitHub ↗
                        </a>
                    </div>

                    <div class="setting-row">
                        <div class="setting-info">
                            <span class="setting-title">Privacy & Storage</span>
                            <span class="setting-desc">All study sets and session stats are stored 100% locally on your device. Zero tracking.</span>
                        </div>
                        <span class="active-status-label">Local & Private</span>
                    </div>

                    <div class="about-signoff">
    <p class="signoff-line">Made late at night by hughshoelace</p>
    <p class="signoff-sub">Built for students who hate paywalls.</p>
</div>
                </section>

            </div>
        </div>

    </div>
</div>

<style>
    .pref-overlay {
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
        padding: 24px;
        box-sizing: border-box;
    }

    .pref-workspace {
        background: var(--bg-card);
        border: 1px solid var(--border-primary);
        width: 100%;
        max-width: 820px;
        height: 520px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 16px 48px var(--shadow-light);
        box-sizing: border-box;
    }

    /* TOPBAR */
    .pref-topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid var(--border-primary);
        background: var(--bg-secondary);
    }

    .pref-title {
        font-size: 1.15em;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
    }

    .pref-topbar-right {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .search-wrap {
        position: relative;
        display: flex;
        align-items: center;
    }

    .pref-search-input {
        background: var(--bg-card);
        border: 1px solid var(--border-primary);
        color: var(--text-primary);
        padding: 6px 32px 6px 12px;
        font-size: 0.88em;
        font-family: inherit;
        width: 180px;
        transition: width 0.2s ease, border-color 0.2s ease;
    }

    .pref-search-input:focus {
        width: 220px;
        outline: none;
        border-color: var(--accent-color);
    }

    .search-key {
        position: absolute;
        right: 8px;
        font-family: monospace;
        font-size: 0.75em;
        background: var(--bg-secondary);
        border: 1px solid var(--border-secondary);
        color: var(--text-secondary);
        padding: 1px 5px;
        border-radius: 2px;
        pointer-events: none;
    }

    .ghost-close-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 1.4em;
        line-height: 1;
        cursor: pointer;
        transition: color 0.15s ease;
        padding: 2px;
    }

    .ghost-close-btn:hover {
        color: var(--incorrect-color);
    }

    /* BODY LAYOUT */
    .pref-body {
        display: grid;
        grid-template-columns: 180px 1fr;
        flex: 1;
        overflow: hidden;
    }

    /* SIDEBAR */
    .pref-sidebar {
        border-right: 1px solid var(--border-primary);
        padding: 18px 12px;
        display: flex;
        flex-direction: column;
        gap: 3px;
        background: var(--bg-card);
    }

    .sidebar-nav-item {
        background: transparent;
        border: none;
        text-align: left;
        padding: 9px 12px;
        font-size: 0.9em;
        font-weight: 500;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.15s ease;
        border-radius: 4px;
    }

    .sidebar-nav-item:hover {
        color: var(--text-primary);
        background: var(--bg-secondary);
    }

    .sidebar-nav-item.active {
        color: var(--text-primary);
        background: var(--bg-secondary);
        font-weight: 600;
    }

    /* CONTENT SCROLL PANE */
    .pref-content-scroll {
        overflow-y: auto;
        padding: 24px 32px 60px 32px;
        display: flex;
        flex-direction: column;
        gap: 36px;
    }

    .pref-section {
        display: flex;
        flex-direction: column;
        gap: 18px;
    }

    .section-heading {
        font-size: 0.98em;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border-primary);
    }

    .setting-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
    }

    .setting-info {
        display: flex;
        flex-direction: column;
        gap: 3px;
        text-align: left;
    }

    .setting-title {
        font-size: 0.95em;
        font-weight: 600;
        color: var(--text-primary);
    }

    .setting-desc {
        font-size: 0.84em;
        color: var(--text-secondary);
        line-height: 1.4;
    }

    .dimmed-feature {
        opacity: 0.55;
    }

    .quiet-status-tag {
        font-family: inherit;
        font-size: 0.78em;
        color: var(--text-secondary);
        background: transparent;
        border: 1px dashed var(--border-secondary);
        padding: 3px 8px;
        border-radius: 3px;
        user-select: none;
        cursor: default;
        flex-shrink: 0;
    }

    .toggle-control {
        display: flex;
        gap: 4px;
        background: var(--bg-secondary);
        padding: 3px;
        border: 1px solid var(--border-primary);
    }

    .theme-choice-btn {
        background: transparent;
        border: none;
        padding: 6px 12px;
        font-size: 0.85em;
        font-family: inherit;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .theme-choice-btn.selected {
        background: var(--bg-card);
        color: var(--text-primary);
        font-weight: 600;
        box-shadow: 0 1px 3px var(--shadow-light);
    }

    .active-status-label {
        font-size: 0.85em;
        font-weight: 500;
        color: var(--correct-color);
        user-select: none;
    }

    .keycap-display {
        font-family: monospace;
        font-size: 0.85em;
        background: var(--bg-secondary);
        border: 1px solid var(--border-secondary);
        color: var(--text-primary);
        padding: 3px 8px;
        border-radius: 3px;
    }

    .about-signoff {
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid var(--border-primary);
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 4px;
    user-select: none;
}

.signoff-line {
    font-size: 0.88em;
    color: var(--text-secondary);
    font-style: italic;
    margin: 0;
}

.signoff-sub {
    font-size: 0.82em;
    color: var(--text-secondary);
    opacity: 0.65;
    margin: 0;
}
</style>