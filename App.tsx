

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { MainMenu } from './components/MainMenu';
import { LevelSelection } from './components/LevelSelection';
import { Quiz } from './components/Quiz';
import { Results } from './components/Results';
import { LiveConversation } from './components/LiveConversation';
import { NameEntry } from './components/NameEntry';
import { FreePracticeMenu } from './components/FreePracticeMenu';
import { GlobalHeader } from './components/common/GlobalHeader';
import { useGameState } from './hooks/useGameState';
import type { Screen, QuizConfig, CategoryId, ConnectionStatus, Question, StudentProfile, VoiceMode } from './types';
import { questions } from './data/questions';
import { checkGeminiConnection } from './services/aiService';
import { SpeechProvider } from './context/SpeechContext';
import { categoryNames } from './utils/constants';

function shuffleArray<T,>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

const STUDENT_PROFILE_KEY = 'maestroDigitalStudentProfile';
const AI_ENABLED_KEY = 'maestroDigitalAiEnabled';
const VOICE_MODE_KEY = 'maestroDigitalVoiceMode';

export default function App() {
    const [screen, setScreen] = useState<Screen>('name-entry');
    const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
    const [finalScore, setFinalScore] = useState<{ score: number; total: number } | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
    const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
    const [isFreeMode, setIsFreeMode] = useState(false);
    const [isAiEnabled, setIsAiEnabled] = useState<boolean>(() => {
        const saved = localStorage.getItem(AI_ENABLED_KEY);
        return saved ? JSON.parse(saved) : false;
    });
    const [voiceMode, setVoiceMode] = useState<VoiceMode>(() => {
        const saved = localStorage.getItem(VOICE_MODE_KEY);
        return (saved as VoiceMode) || 'local';
    });

    const { gameState, updateHighScore, unlockNextLevel, addSkillRecord } = useGameState();

    useEffect(() => {
        const savedProfile = localStorage.getItem(STUDENT_PROFILE_KEY);
        if (savedProfile) {
            setStudentProfile(JSON.parse(savedProfile));
            setScreen('main-menu');
        } else {
            setScreen('name-entry');
        }

        checkGeminiConnection().then(isOnline => {
            setConnectionStatus(isOnline ? 'online' : 'offline');
        });
    }, []);

    const handleToggleAi = () => {
        setIsAiEnabled(prev => {
            const newState = !prev;
            localStorage.setItem(AI_ENABLED_KEY, JSON.stringify(newState));
            return newState;
        });
    };

    const handleVoiceModeChange = (mode: VoiceMode) => {
        setVoiceMode(mode);
        localStorage.setItem(VOICE_MODE_KEY, mode);
    };

    const handleProfileSubmit = (profile: StudentProfile) => {
        localStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify(profile));
        setStudentProfile(profile);
        setScreen('main-menu');
    };

    const handleSelectCategory = useCallback((categoryId: CategoryId) => {
        setSelectedCategory(categoryId);
        setIsFreeMode(false);
        setScreen('level-selection');
    }, []);

    const handleSelectCategoryForFreePractice = useCallback((categoryId: CategoryId) => {
        setSelectedCategory(categoryId);
        setIsFreeMode(true);
        setScreen('level-selection');
    }, []);
    
    const handleStartPractice = useCallback((categoryId: CategoryId, level: number) => {
        const questionPool = questions[categoryId][level] || [];
        const practiceQuestions = shuffleArray([...questionPool]).slice(0, 10); // Take 10 random questions for variety
        setQuizConfig({
            type: 'practice',
            categoryId,
            level,
            name: `${categoryNames[categoryId]} - Nivel ${level}`,
            questions: practiceQuestions
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


    const handleQuizEnd = useCallback((score: number, total: number, totalTime: number) => {
        if (quizConfig?.type === 'practice' && quizConfig.categoryId && quizConfig.level) {
            const { categoryId, level } = quizConfig;
            
            // Calculate Skill Score
            const accuracy = total > 0 ? score / total : 0;
            const timePerQuestion = total > 0 ? totalTime / total : 0;
            const difficultyMultiplier = 1 + (level - 1) * 0.25; // 1, 1.25, 1.5

            // Base score on accuracy
            let skillScore = accuracy * 1000;
            
            // Bonus/penalty for time
            const targetTime = 15; // seconds per question
            const timeBonus = (targetTime - timePerQuestion) * 10;
            skillScore += timeBonus;
            
            // Apply difficulty multiplier
            skillScore *= difficultyMultiplier;

            // Ensure score is not negative
            skillScore = Math.max(0, skillScore);
            
            // FIX: Pass the 'level' to 'addSkillRecord' to match the required type.
            addSkillRecord(categoryId, skillScore, level);

            if (!isFreeMode) {
                updateHighScore(categoryId, level, score);
                unlockNextLevel(categoryId, level, score, total);
            }
        }
        setFinalScore({ score, total });
        setScreen('results');
    }, [quizConfig, updateHighScore, unlockNextLevel, addSkillRecord, isFreeMode]);

    const handleBackToMenu = useCallback(() => {
        setQuizConfig(null);
        setSelectedCategory(null);
        setFinalScore(null);
        setIsFreeMode(false);
        setScreen('main-menu');
    }, []);

    const handleBackToLevelSelection = useCallback(() => {
        setQuizConfig(null);
        setFinalScore(null);
        setScreen('level-selection');
    }, []);

    const handleStartLiveConversation = useCallback(() => {
        setScreen('live-conversation');
    }, []);
    
    const handleStartFreePractice = useCallback(() => {
        setScreen('free-practice-menu');
    }, []);

    const handleBackToFreePracticeMenu = useCallback(() => {
        setScreen('free-practice-menu');
    }, []);

    const screenConfig = useMemo(() => {
        switch (screen) {
            case 'name-entry':
                return {
                    component: <NameEntry onProfileSubmit={handleProfileSubmit} />,
                    showHeader: false,
                };
            case 'main-menu':
                 return {
                    component: <MainMenu studentProfile={studentProfile} gameState={gameState} onSelectCategory={handleSelectCategory} onStartWeeklyExam={handleStartWeeklyExam} onStartRefreshExam={handleStartRefreshExam} onStartLiveConversation={handleStartLiveConversation} onStartFreePractice={handleStartFreePractice} connectionStatus={connectionStatus} isAiEnabled={isAiEnabled}/>,
                    showHeader: true,
                };
            case 'free-practice-menu':
                return {
                    component: <FreePracticeMenu onSelectCategory={handleSelectCategoryForFreePractice} />,
                    title: 'Práctica Libre',
                    onBack: handleBackToMenu,
                    showHeader: true,
                };
            case 'level-selection':
                if (!selectedCategory) return { component: null, showHeader: false };
                return {
                    component: <LevelSelection categoryId={selectedCategory} gameState={gameState} onStartPractice={handleStartPractice} isFreeMode={isFreeMode} />,
                    title: categoryNames[selectedCategory],
                    onBack: isFreeMode ? handleBackToFreePracticeMenu : handleBackToMenu,
                    showHeader: true,
                };
            case 'quiz':
                if (!quizConfig || !studentProfile) return { component: null, showHeader: false };
                return {
                    component: <Quiz quizConfig={quizConfig} onQuizEnd={handleQuizEnd} onBack={quizConfig.type === 'practice' ? handleBackToLevelSelection : handleBackToMenu} isAiEnabled={isAiEnabled} studentProfile={studentProfile} />,
                    title: quizConfig.name,
                    onBack: quizConfig.type === 'practice' ? handleBackToLevelSelection : handleBackToMenu,
                    showHeader: true,
                };
            case 'results':
                if (!finalScore) return { component: null, showHeader: false };
                return {
                    component: <Results score={finalScore.score} total={finalScore.total} onBack={handleBackToMenu} />,
                    title: 'Resultados',
                    showHeader: true,
                };
            case 'live-conversation':
                 return {
                    component: <LiveConversation onBack={handleBackToMenu} />,
                    title: 'Charla con el Maestro',
                    onBack: handleBackToMenu,
                    showHeader: true,
                 };
            default:
                 return {
                    component: <MainMenu studentProfile={studentProfile} gameState={gameState} onSelectCategory={handleSelectCategory} onStartWeeklyExam={handleStartWeeklyExam} onStartRefreshExam={handleStartRefreshExam} onStartLiveConversation={handleStartLiveConversation} onStartFreePractice={handleStartFreePractice} connectionStatus={connectionStatus} isAiEnabled={isAiEnabled}/>,
                    showHeader: true,
                };
        }
    }, [screen, studentProfile, gameState, handleSelectCategory, handleStartWeeklyExam, handleStartRefreshExam, handleStartLiveConversation, handleStartFreePractice, connectionStatus, isAiEnabled, handleProfileSubmit, handleSelectCategoryForFreePractice, handleBackToMenu, selectedCategory, handleStartPractice, isFreeMode, handleBackToFreePracticeMenu, quizConfig, handleQuizEnd, handleBackToLevelSelection, finalScore]);
    
    return (
        <SpeechProvider voiceMode={voiceMode}>
            <div className="flex justify-center items-center min-h-screen p-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-4xl text-slate-700 border border-white/20 flex flex-col h-[95vh] max-h-[95vh]">
                    {screenConfig.showHeader && (
                        <GlobalHeader
                            onBack={screenConfig.onBack}
                            title={screenConfig.title}
                            connectionStatus={connectionStatus}
                            isAiEnabled={isAiEnabled}
                            onToggleAi={handleToggleAi}
                            voiceMode={voiceMode}
                            onVoiceModeChange={handleVoiceModeChange}
                        />
                    )}
                    <main className="flex-grow overflow-y-auto p-4 sm:p-8">
                        {screenConfig.component}
                    </main>
                </div>
            </div>
        </SpeechProvider>
    );
}