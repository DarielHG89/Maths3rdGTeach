import React, { useMemo } from 'react';
import type { GameState, CategoryId, ConnectionStatus, StudentProfile } from '../types';
import { questions } from '../data/questions';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { categoryNames } from '../utils/constants';

interface MainMenuProps {
    studentProfile: StudentProfile | null;
    gameState: GameState;
    onSelectCategory: (categoryId: CategoryId) => void;
    onStartWeeklyExam: () => void;
    onStartRefreshExam: () => void;
    onStartLiveConversation: () => void;
    onStartFreePractice: () => void;
    connectionStatus: ConnectionStatus;
    isAiEnabled: boolean;
}

const categoryIcons: Record<CategoryId, string> = {
    numeros: '🔢',
    suma_resta: '➕',
    multi_divi: '✖️',
    problemas: '🧠',
    geometria: '📐',
    medidas: '📏',
    reloj: '⏰'
};

export const MainMenu: React.FC<MainMenuProps> = ({ studentProfile, gameState, onSelectCategory, onStartWeeklyExam, onStartRefreshExam, onStartLiveConversation, onStartFreePractice, connectionStatus, isAiEnabled }) => {
    
    const studentName = studentProfile?.name || 'Estudiante';

    const { masteryLevels, recommendation } = useMemo(() => {
        const levels = (Object.keys(questions) as CategoryId[]).map(categoryId => {
            const categoryData = gameState[categoryId];
            const totalLevels = Object.keys(questions[categoryId]).length;
            const totalPossibleStars = totalLevels * 3;
            let starsEarned = 0;
            
            Object.entries(categoryData.highScores).forEach(([level, score]) => {
                const totalQuestions = questions[categoryId][parseInt(level)]?.length || 0;
                if(totalQuestions > 0) {
                    starsEarned += Math.round((score / totalQuestions) * 3);
                }
            });

            const mastery = totalPossibleStars > 0 ? Math.round((starsEarned / totalPossibleStars) * 100) : 0;
            return { id: categoryId, mastery, stars: Math.round((mastery / 100) * 3) };
        });

        const sortedLevels = [...levels].sort((a, b) => a.mastery - b.mastery);
        const nextChallenge = sortedLevels.find(cat => cat.mastery < 100);
        
        const rec = nextChallenge
            ? `¡Hola, ${studentName}! Tu próximo desafío podría ser el área de ${categoryNames[nextChallenge.id]}.`
            : `¡Felicidades, ${studentName}! ¡Has dominado todas las áreas!`;

        return { masteryLevels: levels, recommendation: rec };
    }, [gameState, studentName]);

    return (
        <div className="animate-fade-in text-center">
            <h1 className="font-title text-5xl sm:text-7xl text-slate-800 text-gradient">Maestro Digital</h1>
            <p className="text-lg mb-4 mt-4">Este es tu panel de progreso, {studentName}. ¡Elige un modo para empezar!</p>
            
            <div className="bg-blue-100 border-2 border-blue-400 text-blue-700 font-bold px-4 py-3 rounded-lg relative mb-6" role="alert">
                <span className="block sm:inline">{recommendation}</span>
            </div>
            
            <div className="my-6">
                 <Button variant="special" onClick={onStartLiveConversation} className="w-full sm:w-auto text-2xl py-4 px-8 transform hover:scale-105" disabled={connectionStatus !== 'online' || !isAiEnabled}>
                   Charla con el Maestro 🤖
                </Button>
                {(connectionStatus !== 'online' || !isAiEnabled) && <p className="text-sm text-slate-500 mt-2">La charla en vivo requiere que la IA esté conectada y activada.</p>}
            </div>

            <h2 className="text-3xl font-black text-slate-800 mb-4">Modos de Práctica</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {masteryLevels.map(({ id, mastery, stars }) => (
                    <Card key={id} onClick={() => onSelectCategory(id)}>
                        <h3 className="font-black text-slate-800 text-lg capitalize flex items-center justify-center gap-2">
                            <span className="text-2xl">{categoryIcons[id]}</span>
                            <span>{categoryNames[id]}</span>
                        </h3>
                        <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">{mastery}%</div>
                        <p className="text-2xl text-yellow-400 mt-2">
                            {'★'.repeat(stars).padEnd(3, '☆')}
                        </p>
                    </Card>
                ))}
            </div>
            
            <hr className="my-6 border-slate-300" />

            <h2 className="text-3xl font-black text-slate-800 mb-4">Modos de Examen y Práctica Libre</h2>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button variant="secondary" onClick={onStartWeeklyExam} className="w-full sm:w-auto">🏆 Examen Semanal</Button>
                <Button variant="primary" onClick={onStartRefreshExam} className="w-full sm:w-auto">💡 Refrescar Memoria</Button>
                <Button variant="primary" onClick={onStartFreePractice} className="w-full sm:w-auto">🤸 Práctica Libre</Button>
            </div>
        </div>
    );
};