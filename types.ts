export type Screen = 'main-menu' | 'level-selection' | 'quiz' | 'results' | 'live-conversation' | 'name-entry';

export type CategoryId = 'numeros' | 'suma_resta' | 'multi_divi' | 'problemas' | 'geometria' | 'medidas' | 'reloj';

export type ConnectionStatus = 'checking' | 'online' | 'offline';

export interface Question {
    type: 'mcq' | 'input';
    question: string;
    options?: string[];
    answer: string;
    explanation?: string;
    hint?: string;
}

export interface QuizConfig {
    type: 'practice' | 'exam';
    categoryId?: CategoryId;
    level?: number;
    name: string;
    questions: Question[];
}

export interface CategoryGameState {
    unlockedLevel: number;
    highScores: { [level: number]: number };
}

export interface GameState {
    [key: string]: CategoryGameState;
}

export interface TranscriptEntry {
    id: number;
    source: 'user' | 'model';
    text: string;
    isFinal: boolean;
}