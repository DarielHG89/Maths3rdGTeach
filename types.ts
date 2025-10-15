// Fix: Removed self-import of Screen type which caused a conflict.

export type Screen = 'main-menu' | 'level-selection' | 'quiz' | 'results' | 'live-conversation' | 'name-entry' | 'free-practice-menu';

export type CategoryId = 'numeros' | 'suma_resta' | 'multi_divi' | 'problemas' | 'geometria' | 'medidas' | 'reloj';

export type ConnectionStatus = 'checking' | 'online' | 'offline';

export type VoiceMode = 'auto' | 'local' | 'online';

export interface Question {
    type: 'mcq' | 'input';
    question: string;
    options?: string[];
    answer: string;
    explanation?: string;
    hints?: string[];
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
    [key:string]: CategoryGameState;
}

export interface TranscriptEntry {
    id: number;
    source: 'user' | 'model';
    text: string;
    isFinal: boolean;
}

export interface StudentProfile {
    name: string;
    age: number;
    gender: 'boy' | 'girl' | 'other';
}