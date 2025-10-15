import React, { useState, useCallback, useEffect } from 'react';
import { MainMenu } from './components/MainMenu';
import { LevelSelection } from './components/LevelSelection';
import { Quiz } from './components/Quiz';
import { Results } from './components/Results';
import { LiveConversation } from './components/LiveConversation';
import { NameEntry } from './components/NameEntry';
import { useGameState } from './hooks/useGameState';
import type { Screen, QuizConfig, CategoryId, ConnectionStatus, Question } from './types';
import { questions } from './data/questions';
import { checkGeminiConnection } from './services/aiService';
import { SpeechProvider } from './context/SpeechContext';

function shuffleArray<T,>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

const STUDENT_NAME_KEY = 'maestroDigitalStudentName';

export default function App() {
    const [screen, setScreen] = useState<Screen>('main-menu');
    const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
    const [finalScore, setFinalScore] = useState<{ score: number; total: number } | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
    const [studentName, setStudentName] = useState<string | null>(null);

    const { gameState, updateHighScore, unlockNextLevel } = useGameState();

    useEffect(() => {
        const savedName = localStorage.getItem(STUDENT_NAME_KEY);
        if (savedName) {
            setStudentName(savedName);
            setScreen('main-menu');
        } else {
            setScreen('name-entry');
        }

        checkGeminiConnection().then(isOnline => {
            setConnectionStatus(isOnline ? 'online' : 'offline');
        });
    }, []);

    const handleNameSubmit = (name: string) => {
        localStorage.setItem(STUDENT_NAME_KEY, name);
        setStudentName(name);
        setScreen('main-menu');
    };

    const handleSelectCategory = useCallback((categoryId: CategoryId) => {
        setSelectedCategory(categoryId);
        setScreen('level-selection');
    }, []);
    
    const handleStartPractice = useCallback((categoryId: CategoryId, level: number) => {
        setQuizConfig({
            type: 'practice',
            categoryId,
            level,
            name: `${categoryId.replace('_', ' y ')} - Nivel ${level}`,
            questions: shuffleArray([...questions[categoryId][level]])
        });
        setScreen('quiz');
    }, []);

    const handleStartWeeklyExam = useCallback(() => {
        let pool: Question[] = [];
        for (const cat of Object.keys(questions) as CategoryId[]) {
            for (let i = 1; i <= gameState[cat].unlockedLevel; i++) {
                if(questions[cat][i]) {
                    pool.push(...questions[cat][i]);
                }
            }
        }
        const examQuestions = shuffleArray(pool).slice(0, 10);
        if (examQuestions.length < 5) {
            alert("¡Aún no has desbloqueado suficientes niveles! Sigue practicando.");
            return;
        }
        setQuizConfig({
            type: 'exam',
            name: 'Examen Semanal',
            questions: examQuestions,
        });
        setScreen('quiz');
    }, [gameState]);

    const handleStartRefreshExam = useCallback(() => {
        let pool: Question[] = [];
        for (const cat of Object.keys(questions) as CategoryId[]) {
            for (let i = 1; i <= gameState[cat].unlockedLevel; i++) {
                if(questions[cat][i]) {
                    pool.push(...questions[cat][i]);
                }
            }
        }
        const examQuestions = shuffleArray(pool).slice(0, 5);
        if (examQuestions.length === 0) {
            alert("¡Completa al menos un nivel para poder refrescar la memoria!");
            return;
        }
        setQuizConfig({
            type: 'exam',
            name: 'Refrescar Memoria',
            questions: examQuestions
        });
        setScreen('quiz');
    }, [gameState]);


    const handleQuizEnd = useCallback((score: number, total: number) => {
        if (quizConfig?.type === 'practice' && quizConfig.categoryId && quizConfig.level) {
            const { categoryId, level } = quizConfig;
            updateHighScore(categoryId, level, score);
            unlockNextLevel(categoryId, level, score, total);
        }
        setFinalScore({ score, total });
        setScreen('results');
    }, [quizConfig, updateHighScore, unlockNextLevel]);

    const handleBackToMenu = useCallback(() => {
        setQuizConfig(null);
        setSelectedCategory(null);
        setFinalScore(null);
        setScreen('main-menu');
    }, []);

    const handleBackToLevelSelection = useCallback(() => {
        setScreen('level-selection');
    }, []);

    const handleStartLiveConversation = useCallback(() => {
        setScreen('live-conversation');
    }, []);

    const renderScreen = () => {
        switch (screen) {
            case 'name-entry':
                return <NameEntry onNameSubmit={handleNameSubmit} />;
            case 'main-menu':
                return (
                    <MainMenu
                        studentName={studentName}
                        gameState={gameState}
                        onSelectCategory={handleSelectCategory}
                        onStartWeeklyExam={handleStartWeeklyExam}
                        onStartRefreshExam={handleStartRefreshExam}
                        onStartLiveConversation={handleStartLiveConversation}
                        connectionStatus={connectionStatus}
                    />
                );
            case 'level-selection':
                if (!selectedCategory) return null;
                return (
                    <LevelSelection
                        categoryId={selectedCategory}
                        gameState={gameState}
                        onStartPractice={handleStartPractice}
                        onBack={handleBackToMenu}
                    />
                );
            case 'quiz':
                if (!quizConfig) return null;
                return <Quiz quizConfig={quizConfig} onQuizEnd={handleQuizEnd} onBack={quizConfig.type === 'practice' ? handleBackToLevelSelection : handleBackToMenu} />;
            case 'results':
                if (!finalScore) return null;
                return (
                    <Results
                        score={finalScore.score}
                        total={finalScore.total}
                        onBack={handleBackToMenu}
                    />
                );
            case 'live-conversation':
                 return <LiveConversation onBack={handleBackToMenu} />;
            default:
                return <MainMenu studentName={studentName} gameState={gameState} onSelectCategory={handleSelectCategory} onStartWeeklyExam={handleStartWeeklyExam} onStartRefreshExam={handleStartRefreshExam} onStartLiveConversation={handleStartLiveConversation} connectionStatus={connectionStatus} />;
        }
    };
    
    return (
        <SpeechProvider>
            <div className="flex justify-center items-center min-h-screen p-4">
                <div className="bg-white/90 backdrop-blur-sm p-4 sm:p-8 rounded-2xl shadow-2xl w-full max-w-4xl text-center text-slate-700 border border-white/20">
                    {renderScreen()}
                </div>
            </div>
        </SpeechProvider>
    );
}