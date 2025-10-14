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

export const LevelSelection: React.FC<LevelSelectionProps> = ({ categoryId, gameState, onStartPractice, onBack }) => {
    const categoryData = gameState[categoryId];
    const levels = Object.keys(questions[categoryId]);

    return (
        <div className="animate-fade-in relative">
            <button onClick={onBack} className="absolute -top-2 left-0 sm:top-0 sm:left-0 text-slate-500 font-bold hover:text-slate-800 transition-colors">
                &larr; Volver al Panel
            </button>
            <h2 className="text-4xl font-black text-slate-800 mb-6 mt-8 sm:mt-0">{categoryNames[categoryId]}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {levels.map(levelStr => {
                    const level = parseInt(levelStr);
                    const isLocked = level > categoryData.unlockedLevel;
                    const highScore = categoryData.highScores[level] || 0;
                    const totalQuestions = questions[categoryId][level].length;
                    const stars = totalQuestions > 0 ? Math.round((highScore / totalQuestions) * 3) : 0;

                    return (
                        <Card 
                            key={level} 
                            onClick={!isLocked ? () => onStartPractice(categoryId, level) : undefined}
                            className={isLocked ? 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-70' : ''}
                        >
                            <h4 className="text-2xl font-bold">Nivel {level}</h4>
                            <div className={`text-3xl mt-2 ${isLocked ? 'filter grayscale' : 'text-yellow-400'}`}>
                                {'★'.repeat(stars).padEnd(3, '☆')}
                            </div>
                            <p className="mt-2 font-semibold">
                                {isLocked ? 'Bloqueado' : `Mejor: ${highScore}/${totalQuestions}`}
                            </p>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};