import React from 'react';
import type { CategoryId } from '../types';
import { questions } from '../data/questions';
import { Card } from './common/Card';
import { categoryNames } from '../utils/constants';

interface FreePracticeMenuProps {
    onSelectCategory: (categoryId: CategoryId) => void;
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

export const FreePracticeMenu: React.FC<FreePracticeMenuProps> = ({ onSelectCategory }) => {
    const categories = Object.keys(questions) as CategoryId[];

    return (
        <div className="animate-fade-in text-center">
            <p className="text-slate-600 mb-6">Elige una categoría para practicar sin límites. ¡Todos los niveles están desbloqueados!</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map(id => (
                    <Card key={id} onClick={() => onSelectCategory(id)}>
                        <h3 className="font-black text-slate-800 text-lg capitalize flex items-center justify-center gap-2">
                            <span className="text-2xl">{categoryIcons[id]}</span>
                            <span>{categoryNames[id]}</span>
                        </h3>
                    </Card>
                ))}
            </div>
        </div>
    );
};