// src/lib/parser.js

/**
 * Universal text parser that auto-detects:
 * 1. Kahoot Spreadsheet Export (6-7 columns, ending with correct answer index 1-4)
 * 2. Standard Revise MCQ (5 columns: Question | Correct | W1 | W2 | W3)
 * 3. Standard Flashcard Notes (2 columns: Term | Definition)
 */
export function parseStudyNotes(rawText) {
    if (!rawText || !rawText.trim()) return [];

    const lines = rawText.trim().split('\n');
    const questions = [];

    for (const line of lines) {
        if (!line.trim()) continue;

        // Split by tabs (from Excel/Google Sheets copy-paste) or commas
        const parts = line.split(/\t|,/).map(p => p.trim());

        // Skip table header rows (e.g. "Question - max 120 characters...")
        const isHeader = parts[0].toLowerCase().includes('question') && 
                         (parts[1]?.toLowerCase().includes('answer') || parts[1]?.toLowerCase().includes('definition'));
        if (isHeader) continue;

        // FORMAT 1: KAHOOT SPREADSHEET (6 or 7 columns, with correct answer number at the end)
        if (parts.length >= 6) {
            const questionText = parts[0];
            const options = [parts[1], parts[2], parts[3], parts[4]].filter(Boolean);
            
            // The correct answer number (1, 2, 3, or 4) is in the last column
            const lastCol = parts[parts.length - 1] || parts[6];
            const correctNum = parseInt(lastCol);

            if (!isNaN(correctNum) && correctNum >= 1 && correctNum <= options.length) {
                const correctIndex = correctNum - 1;
                const correct = options[correctIndex];
                const wrong = options.filter((_, idx) => idx !== correctIndex);

                questions.push({
                    question: questionText,
                    correct: correct,
                    wrong: wrong
                });
                continue;
            }
        }

        // FORMAT 2: STANDARD 5-COLUMN MCQ (Question | Correct | W1 | W2 | W3)
        if (parts.length >= 5) {
            questions.push({
                question: parts[0],
                correct: parts[1],
                wrong: [parts[2], parts[3], parts[4]]
            });
            continue;
        }

        // FORMAT 3: 2-COLUMN FLASHCARDS / NOTES (Term | Definition)
        if (parts.length >= 2) {
            questions.push({
                question: parts[0],
                correct: parts[1],
                wrong: [] // Distractors can be auto-generated or reviewed in Flashcard mode!
            });
            continue;
        }
    }

    return questions;
}