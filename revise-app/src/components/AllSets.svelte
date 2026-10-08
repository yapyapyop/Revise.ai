<!-- src/components/AllSets.svelte -->
<script>
    import { onMount, onDestroy } from 'svelte';

    export let allSets = [];
    export let onSelectSet;
    export let onQuickStartSet;
    export let onNewSet;
    export let onDeleteSet;
    export let onBack;

    let searchQuery = '';
    let selectedTag = 'All';
    let searchInputEl;

    $: allTags = ['All', ...new Set(allSets.flatMap(s => s.tags || []))];

    $: filteredSets = allSets.filter(set => {
        const matchesSearch = set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (set.description && set.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                              (set.tags && set.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
        const matchesTag = selectedTag === 'All' || (set.tags && set.tags.includes(selectedTag));
        return matchesSearch && matchesTag;
    });

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });

    function handleKeydown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            onBack();
        }
        if (e.key === '/' && document.activeElement !== searchInputEl) {
            e.preventDefault();
            searchInputEl?.focus();
        }
        if ((e.key === 'n' || e.key === 'N') && document.activeElement !== searchInputEl) {
            e.preventDefault();
            onNewSet();
        }
    }
</script>

<div class="library-workspace">
    
    <!-- TOP NAVIGATION & SEARCH -->
    <div class="library-top-nav">
        <button class="back-link" on:click={onBack}>
            ← Dashboard
        </button>

        <div class="nav-right-actions">
            <div class="search-wrap">
                <input 
                    type="text" 
                    class="library-search-input" 
                    placeholder="Search sets..."
                    bind:value={searchQuery}
                    bind:this={searchInputEl}
                />
                <kbd class="search-key">/</kbd>
            </div>

            <button class="btn btn-primary new-btn" on:click={onNewSet}>
                + New Set <kbd class="keycap-hint">N</kbd>
            </button>
        </div>
    </div>

    <!-- LIBRARY HEADER -->
    <header class="library-header">
        <div class="title-row">
            <h1 class="library-title">Your Study Sets</h1>
            <span class="library-count">{filteredSets.length} {filteredSets.length === 1 ? 'set' : 'sets'}</span>
        </div>

        {#if allTags.length > 2}
            <div class="tag-filters">
                {#each allTags as tag}
                    <button 
                        class="filter-pill" 
                        class:active={selectedTag === tag}
                        on:click={() => selectedTag = tag}
                    >
                        {tag}
                    </button>
                {/each}
            </div>
        {/if}
    </header>

    <!-- SETS TABLE: Clean Sentence Case & No Monospace on Data -->
    <div class="sets-table-container">
        <div class="table-header-row">
            <span class="col-title">Title</span>
            <span class="col-meta">Cards</span>
            <span class="col-meta">Mode</span>
            <span class="col-actions">Actions</span>
        </div>

        <div class="sets-table-body">
            {#each filteredSets as set}
                <div class="set-table-row" on:click={() => onSelectSet(set)}>
                    
                    <div class="col-title cell-title-group">
                        <span class="set-title-text">{set.title}</span>
                        {#if set.tags && set.tags.length > 0}
                            <div class="mini-tags">
                                {#each set.tags as tag}
                                    <span class="mini-tag">{tag}</span>
                                {/each}
                            </div>
                        {/if}
                    </div>

                    <!-- ✨ REGULAR FONT for card count ✨ -->
                    <div class="col-meta">
                        <span class="cell-data">{set.questions.length} cards</span>
                    </div>

                    <div class="col-meta">
                        <span class="cell-badge">
                            {set.lastConfig?.mode === 'spaced-repetition' ? 'Spaced Repetition' : 'Elimination'}
                        </span>
                    </div>

                    <div class="col-actions cell-actions-group">
                        <button 
                            class="action-btn play-btn" 
                            title="Quick Study"
                            on:click|stopPropagation={() => onQuickStartSet(set)}
                        >
                            ▶ Study
                        </button>
                        
                        <!-- ✨ EXACT MATCHING SVG TRASH ICON ✨ -->
                        {#if allSets.length > 1}
                            <button 
                                class="ghost-trash-btn" 
                                title="Delete Set"
                                on:click|stopPropagation={() => onDeleteSet(set)}
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        {/if}
                    </div>

                </div>
            {:else}
                <div class="empty-search-state">
                    <span>No study sets found matching "{searchQuery}"</span>
                </div>
            {/each}
        </div>
    </div>

</div>

<style>
    .library-workspace {
        width: 100%;
        max-width: 960px;
        margin: 20px auto 80px auto;
        display: flex;
        flex-direction: column;
        text-align: left;
    }

    .library-top-nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 28px;
    }

    .back-link {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 0.9em;
        cursor: pointer;
        padding: 0;
        transition: color 0.15s ease;
    }

    .back-link:hover {
        color: var(--text-primary);
    }

    .nav-right-actions {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .search-wrap {
        position: relative;
        display: flex;
        align-items: center;
    }

    .library-search-input {
        background: var(--bg-card);
        border: 1px solid var(--border-primary);
        color: var(--text-primary);
        padding: 7px 32px 7px 12px;
        font-size: 0.88em;
        font-family: inherit;
        width: 200px;
        transition: width 0.2s ease, border-color 0.2s ease;
    }

    .library-search-input:focus {
        width: 260px;
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

    .new-btn {
        padding: 8px 16px;
        font-size: 0.9em;
    }

    .keycap-hint {
        font-family: monospace;
        font-size: 0.85em;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 1px 5px;
        border-radius: 3px;
        margin-left: 4px;
    }

    .library-header {
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--border-primary);
    }

    .title-row {
        display: flex;
        align-items: baseline;
        gap: 12px;
        margin-bottom: 12px;
    }

    .library-title {
        font-size: 2em;
        font-weight: 800;
        color: var(--text-primary);
        margin: 0;
    }

    .library-count {
        font-family: inherit;
        font-size: 0.9em;
        color: var(--text-secondary);
    }

    .tag-filters {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }

    .filter-pill {
        background: var(--bg-secondary);
        border: 1px solid transparent;
        color: var(--text-secondary);
        padding: 4px 12px;
        font-size: 0.85em;
        font-family: inherit;
        border-radius: 3px;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .filter-pill:hover {
        color: var(--text-primary);
    }

    .filter-pill.active {
        background: var(--bg-card);
        border-color: var(--border-primary);
        color: var(--text-primary);
        font-weight: 600;
    }

    .sets-table-container {
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    /* Clean Sentence-Case Table Headers */
    .table-header-row {
        display: grid;
        grid-template-columns: 1fr 120px 160px 120px;
        padding: 8px 12px;
        font-family: inherit;
        font-size: 0.82em;
        font-weight: 600;
        color: var(--text-secondary);
        border-bottom: 1px solid var(--border-primary);
    }

    .sets-table-body {
        display: flex;
        flex-direction: column;
    }

    .set-table-row {
        display: grid;
        grid-template-columns: 1fr 120px 160px 120px;
        align-items: center;
        padding: 14px 12px;
        border-bottom: 1px solid var(--border-primary);
        cursor: pointer;
        transition: background 0.15s ease;
    }

    .set-table-row:hover {
        background: var(--bg-secondary);
    }

    .cell-title-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-right: 12px;
    }

    .set-title-text {
        font-size: 1.05em;
        font-weight: 600;
        color: var(--text-primary);
    }

    .mini-tags {
        display: flex;
        gap: 4px;
    }

    .mini-tag {
        font-size: 0.75em;
        background: var(--bg-primary);
        border: 1px solid var(--border-secondary);
        color: var(--text-secondary);
        padding: 1px 6px;
        border-radius: 2px;
    }

    .cell-data {
        font-family: inherit;
        font-size: 0.9em;
        color: var(--text-secondary);
    }

    .cell-badge {
        font-size: 0.85em;
        color: var(--accent-color);
    }

    .cell-actions-group {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .action-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.88em;
        font-family: inherit;
        transition: all 0.15s ease;
    }

    .play-btn {
        color: var(--correct-color);
        font-weight: 600;
    }

    .play-btn:hover {
        text-decoration: underline;
    }

    /* MATCHING SVG TRASH ICON */
    .ghost-trash-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        opacity: 0.5;
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

    .empty-search-state {
        padding: 40px;
        text-align: center;
        color: var(--text-secondary);
        font-size: 0.95em;
    }

    @media (max-width: 700px) {
        .table-header-row {
            display: none;
        }
        .set-table-row {
            grid-template-columns: 1fr auto;
            gap: 10px;
        }
        .col-meta {
            display: none;
        }
    }
</style>