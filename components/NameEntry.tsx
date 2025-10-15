import React, { useState } from 'react';
import { Button } from './common/Button';

interface NameEntryProps {
    onNameSubmit: (name: string) => void;
}

export const NameEntry: React.FC<NameEntryProps> = ({ onNameSubmit }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onNameSubmit(name.trim());
        }
    };

    return (
        <div className="animate-fade-in flex flex-col items-center justify-center p-8 min-h-[50vh]">
            <h1 className="font-title text-5xl sm:text-7xl text-slate-800 mb-4 text-gradient">¡Bienvenido/a!</h1>
            <p className="text-xl text-slate-600 mb-8">Soy tu Maestro Digital. Para empezar, ¿cómo te llamas?</p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Escribe tu nombre aquí"
                    className="p-4 text-xl border-2 border-slate-300 rounded-lg text-center w-full flex-grow"
                    autoFocus
                />
                <Button type="submit" variant="special" disabled={!name.trim()} className="w-full sm:w-auto">
                    ¡A Aprender!
                </Button>
            </form>
        </div>
    );
};