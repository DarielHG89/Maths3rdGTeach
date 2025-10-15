import React, { useState } from 'react';
import { Button } from './common/Button';
import type { StudentProfile } from '../types';

interface NameEntryProps {
    onProfileSubmit: (profile: StudentProfile) => void;
}

export const NameEntry: React.FC<NameEntryProps> = ({ onProfileSubmit }) => {
    const [name, setName] = useState('');
    const [age, setAge] = useState(8);
    const [gender, setGender] = useState<'boy' | 'girl' | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && gender) {
            onProfileSubmit({ name: name.trim(), age, gender });
        }
    };

    const isFormComplete = name.trim() !== '' && gender !== null;

    return (
        <div className="animate-fade-in flex flex-col items-center justify-center p-8 min-h-[50vh]">
            <h1 className="font-title text-5xl sm:text-7xl text-slate-800 mb-4 text-gradient">¡Bienvenido/a!</h1>
            <p className="text-xl text-slate-600 mb-8">Soy tu Maestro Digital. Para empezar, ¡vamos a crear tu perfil!</p>
            
            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 w-full max-w-md">
                
                <div className="w-full">
                    <label className="text-lg font-bold text-slate-700 block mb-2">¿Cómo te llamas?</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Escribe tu nombre aquí"
                        className="p-4 text-xl border-2 border-slate-300 rounded-lg text-center w-full flex-grow text-black bg-white"
                        autoFocus
                    />
                </div>

                <div className="w-full">
                    <label className="text-lg font-bold text-slate-700 block mb-2">¿Cuántos años tienes?</label>
                     <select 
                        value={age} 
                        onChange={(e) => setAge(parseInt(e.target.value))}
                        className="p-4 text-xl border-2 border-slate-300 rounded-lg text-center w-full bg-white text-black"
                    >
                        {Array.from({ length: 7 }, (_, i) => i + 6).map(a => (
                            <option key={a} value={a}>{a} años</option>
                        ))}
                    </select>
                </div>
                
                <div className="w-full">
                    <label className="text-lg font-bold text-slate-700 block mb-2">Elige tu avatar:</label>
                    <div className="flex justify-center gap-4">
                        <button type="button" onClick={() => setGender('boy')} className={`p-4 border-4 rounded-full transition-transform transform hover:scale-110 ${gender === 'boy' ? 'border-blue-500 scale-110' : 'border-transparent'}`}>
                            <span className="text-6xl">👦</span>
                        </button>
                        <button type="button" onClick={() => setGender('girl')} className={`p-4 border-4 rounded-full transition-transform transform hover:scale-110 ${gender === 'girl' ? 'border-pink-500 scale-110' : 'border-transparent'}`}>
                             <span className="text-6xl">👧</span>
                        </button>
                    </div>
                </div>

                <Button type="submit" variant="special" disabled={!isFormComplete} className="w-full sm:w-auto mt-4">
                    ¡A Aprender!
                </Button>
            </form>
        </div>
    );
};