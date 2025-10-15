import React from 'react';
import type { GameState, CategoryId } from '../types';
import { questions } from '../data/questions';
import { Card } from './common/Card';
import { categoryNames } from '../utils/constants';

interface LevelSelectionProps {
    categoryId: CategoryId;
    gameState: GameState;
    onStartPractice: (categoryId: CategoryId, level: number) => void;
    onBack: () => void;
}

// Enhanced details for better visual distinction
const levelDetails: Record<number, { name: string; color: string; bg: string; border: string; }> = {
    1: { name: 'Fácil', color: 'text-green-800', bg: 'bg-green-100', border: 'border-green-500' },
    2: { name: 'Medio', color: 'text-blue-800', bg: 'bg-blue-100', border: 'border-blue-500' },
    3: { name: 'Difícil', color: 'text-purple-800', bg: 'bg-purple-100', border: 'border-purple-500' }
};

export const LevelSelection: React.FC<LevelSelectionProps> = ({ categoryId, gameState, onStartPractice, onBack }) => {
    const categoryData = gameState[categoryId];
    const levels = Object.keys(questions[categoryId]);

    return (
        <div className="animate-fade-in relative">
            <button onClick={onBack} className="absolute -top-2 left-0 sm:top-0 sm:left-0 text-slate-500 font-bold hover:text-slate-800 transition-colors">
                &larr; Volver al Panel
            </button>
            <h2 className="text-4xl font-black text-slate-800 mb-2 mt-8 sm:mt-0">{categoryNames[categoryId]}</h2>
            <p className="text-slate-600 mb-6">Selecciona una dificultad. ¡Debes sacar un buen resultado para desbloquear la siguiente!</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {levels.map(levelStr => {
                    const level = parseInt(levelStr);
                    const isLocked = level > categoryData.unlockedLevel;
                    const highScore = categoryData.highScores[level] || 0;
                    const totalQuestions = questions[categoryId][level].length;
                    const stars = totalQuestions > 0 ? Math.round((highScore / totalQuestions) * 3) : 0;
                    const details = levelDetails[level] || { name: 'Extra', color: 'text-gray-800', bg: 'bg-gray-100', border: 'border-gray-500' };

                    return (
                        <div key={level} className="relative">
                            <Card 
                                onClick={!isLocked ? () => onStartPractice(categoryId, level) : undefined}
                                className={`flex flex-col items-center justify-start min-h-[180px] !p-0 overflow-hidden ${isLocked ? 'filter grayscale' : ''}`}
                            >
                                <div className={`w-full p-2 text-center ${details.bg} ${details.border} border-b-2`}>
                                    <h4 className={`text-xl font-bold ${details.color}`}>Nivel {level}</h4>
                                    <p className={`font-semibold ${details.color} opacity-90`}>{details.name}</p>
                                </div>

                                <div className="flex flex-col items-center justify-center flex-grow p-3">
                                    <div className={`text-3xl mt-2 text-yellow-400`}>
                                        {'★'.repeat(stars).padEnd(3, '☆')}
                                    </div>
                                    
                                    <p className="mt-2 font-semibold text-slate-500">
                                        Mejor: {highScore}/{totalQuestions}
                                    </p>
                                </div>
                            </Card>
                            {isLocked && (
                                <div className="absolute inset-0 bg-slate-800/60 rounded-xl flex flex-col items-center justify-center text-white cursor-not-allowed">
                                    <span className="text-6xl" role="img" aria-label="Bloqueado">🔒</span>
                                    <span className="font-bold mt-2 text-lg">Bloqueado</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
