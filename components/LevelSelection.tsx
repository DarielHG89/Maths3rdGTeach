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

const levelDetails: Record<number, { name: string; colorClasses: string; }> = {
    1: { name: 'Fácil', colorClasses: 'border-green-400 bg-green-50/80 hover:bg-green-100' },
    2: { name: 'Medio', colorClasses: 'border-blue-400 bg-blue-50/80 hover:bg-blue-100' },
    3: { name: 'Difícil', colorClasses: 'border-purple-400 bg-purple-50/80 hover:bg-purple-100' }
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
                    const details = levelDetails[level] || { name: 'Extra', colorClasses: 'border-gray-400 bg-gray-50/80' };

                    return (
                        <div key={level} className="relative">
                            <Card 
                                onClick={!isLocked ? () => onStartPractice(categoryId, level) : undefined}
                                className={`flex flex-col items-center justify-between min-h-[180px] ${!isLocked ? details.colorClasses : 'bg-slate-200'}`}
                            >
                                <div className="text-center">
                                    <h4 className="text-xl font-bold">Nivel {level}</h4>
                                    <p className="text-lg font-semibold text-slate-600">{details.name}</p>
                                </div>

                                <div className={`text-3xl mt-2 ${isLocked ? 'filter grayscale' : 'text-yellow-400'}`}>
                                    {'★'.repeat(stars).padEnd(3, '☆')}
                                </div>
                                
                                <p className="mt-2 font-semibold text-slate-500">
                                    Mejor: {highScore}/{totalQuestions}
                                </p>
                            </Card>
                            {isLocked && (
                                <div className="absolute inset-0 bg-slate-800/50 rounded-xl flex flex-col items-center justify-center text-white cursor-not-allowed">
                                    <span className="text-5xl" role="img" aria-label="Bloqueado">🔒</span>
                                    <span className="font-bold mt-2">Bloqueado</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};