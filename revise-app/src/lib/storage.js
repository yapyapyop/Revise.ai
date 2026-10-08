// In src/lib/storage.js
import defaultQuestions from './questions.js';

const STORAGE_KEYS = {
    SETS: 'revise_sets_db',
    ACTIVE_SESSION: 'revise_active_session',
    PREFERENCES: 'revise_preferences'
};

// 3 Rich Pre-loaded Decks
const INITIAL_SEED_SETS = [
    {
        id: 'set_practice_default',
        title: 'Practice Set',
        description: 'General science, physics, astronomy, and trivia questions.',
        tags: ['General', 'Trivia'],
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000 * 2,
        questions: [...defaultQuestions],
        lastConfig: { mode: 'elimination', order: 'random' }
    },
    {
        id: 'set_bio_cell',
        title: 'Biology 102 — Cell Structure',
        description: 'Core cellular organelles, membrane transport, and ATP synthesis.',
        tags: ['Biology', 'STEM', 'Midterm 1'],
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
        questions: [
            {
                question: "Which organelle is responsible for ATP production in eukaryotic cells?",
                correct: "Mitochondria",
                wrong: ["Golgi apparatus", "Ribosome", "Endoplasmic reticulum"]
            },
            {
                question: "What is the primary lipid component of the plasma membrane bilayer?",
                correct: "Phospholipids",
                wrong: ["Triglycerides", "Steroids", "Glycolipids"]
            },
            {
                question: "Which cellular structure is responsible for protein synthesis?",
                correct: "Ribosome",
                wrong: ["Lysosome", "Peroxisome", "Vacuole"]
            },
            {
                question: "During which phase of mitosis do sister chromatids separate?",
                correct: "Anaphase",
                wrong: ["Prophase", "Metaphase", "Telophase"]
            }
        ],
        lastConfig: { mode: 'spaced-repetition', order: 'sequential' }
    },
    {
        id: 'set_world_history',
        title: 'World History — Ancient Civilizations',
        description: 'Mesopotamia, ancient Egypt, Mesoamerica, and the Silk Road.',
        tags: ['History', 'Humanities'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        questions: [
            {
                question: "Which river valley civilization developed the cuneiform writing system?",
                correct: "Mesopotamia (Sumerians)",
                wrong: ["Indus Valley", "Ancient Egypt", "Yellow River Valley"]
            },
            {
                question: "The ancient city of Carthage was originally founded by which maritime traders?",
                correct: "Phoenicians",
                wrong: ["Greeks", "Romans", "Persians"]
            },
            {
                question: "Which empire was ruled by Cyrus the Great in the 6th century BCE?",
                correct: "Achaemenid Persian Empire",
                wrong: ["Ottoman Empire", "Byzantine Empire", "Babylonian Empire"]
            }
        ],
        lastConfig: { mode: 'elimination', order: 'random' }
    }
];

export function loadAllSets() {
    const stored = localStorage.getItem(STORAGE_KEYS.SETS);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
            console.error('Error loading sets database:', e);
        }
    }
    // Seed initial decks
    saveAllSets(INITIAL_SEED_SETS);
    return INITIAL_SEED_SETS;
}

export function saveAllSets(sets) {
    localStorage.setItem(STORAGE_KEYS.SETS, JSON.stringify(sets));
}

export function getSetById(id) {
    const sets = loadAllSets();
    return sets.find(s => s.id === id) || sets[0];
}

export function saveSet(updatedSet) {
    const sets = loadAllSets();
    const index = sets.findIndex(s => s.id === updatedSet.id);
    updatedSet.updatedAt = Date.now();
    
    if (index !== -1) {
        sets[index] = updatedSet;
    } else {
        sets.unshift(updatedSet);
    }
    saveAllSets(sets);
}

export function deleteSetById(id) {
    const sets = loadAllSets().filter(s => s.id !== id);
    saveAllSets(sets);
}

export function createBlankSet(title = 'Untitled Set') {
    const newSet = {
        id: `set_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title,
        description: '',
        tags: ['Custom'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        questions: [
            {
                question: '',
                correct: '',
                wrong: ['']
            }
        ],
        lastConfig: { mode: 'elimination', order: 'random' }
    };
    saveSet(newSet);
    return newSet;
}

// Active session helpers
export function saveActiveSession(sessionData) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(sessionData));
}

export function loadActiveSession() {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return null;
        }
    }
    return null;
}

export function clearActiveSession() {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
}