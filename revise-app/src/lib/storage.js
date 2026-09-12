import allQuestions from './questions.js';

export function loadQuestionsFromStorage() {
    const stored = localStorage.getItem('revise_questions');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error loading questions from storage:', e);
        }
    }
    return [...allQuestions]; // use imported questions as default
}

export function saveQuestionsToStorage(questions) {
    localStorage.setItem('revise_questions', JSON.stringify(questions));
}

export function saveActiveSession(sessionData) {
    localStorage.setItem('revise_active_session', JSON.stringify(sessionData));
}

export function loadActiveSession() {
    const stored = localStorage.getItem('revise_active_session');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error loading session:', e);
            return null;
        }
    }
    return null;
}

export function clearActiveSession() {
    localStorage.removeItem('revise_active_session');
}