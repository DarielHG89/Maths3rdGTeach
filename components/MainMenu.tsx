import React, { useMemo } from 'react';
import type { GameState, CategoryId, ConnectionStatus } from '../types';
import { questions } from '../data/questions';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { useSpeech } from '../context/SpeechContext';
import { categoryNames } from '../utils/constants';

interface MainMenuProps {
    gameState: GameState;
    onSelectCategory: (categoryId: CategoryId) => void;
    onStartWeeklyExam: () => void;
    onStartRefreshExam: () => void;
    onStartLiveConversation: () => void;
    connectionStatus: ConnectionStatus;
}

const ConnectionIndicator: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
    const statusInfo = {
        checking: { color: 'bg-yellow-400', text: 'IA...' },
        online: { color: 'bg-green-500', text: 'IA Conectada' },
        offline: { color: 'bg-red-500', text: 'Modo Offline' },
    };

    return (
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full" title={status === 'checking' ? 'Comprobando conexión con la IA...' : status === 'online' ? 'La IA está generando pistas y explicaciones' : 'Usando pistas y explicaciones predefinidas'}>
            <span className={`w-3 h-3 rounded-full ${statusInfo[status].color}`}></span>
            <span>{statusInfo[status].text}</span>
        </div>
    );
};


const VoiceToggleButton = () => {
    const { isMuted, toggleMute, isSupported } = useSpeech();

    if (!isSupported) {
        return null;
    }

    return (
        <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-colors ${isMuted ? 'bg-slate-200 text-slate-500' : 'bg-yellow-400 text-white'}`}
            title={isMuted ? 'Activar voz' : 'Silenciar voz'}
        >
            {isMuted ? '🔇' : '🔊'}
        </button>
    )
}

export const MainMenu: React.FC<MainMenuProps> = ({ gameState, onSelectCategory, onStartWeeklyExam, onStartRefreshExam, onStartLiveConversation, connectionStatus }) => {
    
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
            ? `¡Hola! Tu próximo desafío podría ser el área de ${categoryNames[nextChallenge.id]}.`
            : "¡Felicidades! ¡Has dominado todas las áreas!";

        return { masteryLevels: levels, recommendation: rec };
    }, [gameState]);

    return (
        <div className="animate-fade-in">
            <header className="relative mb-4">
                <div className="absolute top-0 right-0 flex items-center gap-2">
                    <ConnectionIndicator status={connectionStatus} />
                    <VoiceToggleButton />
                </div>
                <h1 className="font-title text-5xl sm:text-7xl text-slate-800">Maestro Digital</h1>
            </header>
            <p className="text-lg mb-4">Este es tu panel de progreso. ¡Elige un modo para empezar!</p>
            
            <div className="bg-blue-100 border-2 border-blue-400 text-blue-700 font-bold px-4 py-3 rounded-lg relative mb-6" role="alert">
                <span className="block sm:inline">{recommendation}</span>
            </div>
            
            <div className="my-6">
                 <Button variant="special" onClick={onStartLiveConversation} className="w-full sm:w-auto text-2xl py-4 px-8 transform hover:scale-105" disabled={connectionStatus !== 'online'}>
                   Charla con el Maestro 🤖
                </Button>
                {connectionStatus !== 'online' && <p className="text-sm text-slate-500 mt-2">La charla en vivo requiere conexión con la IA.</p>}
            </div>

            <h2 className="text-3xl font-black text-slate-800 mb-4">Modos de Práctica</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {masteryLevels.map(({ id, mastery, stars }) => (
                    <Card key={id} onClick={() => onSelectCategory(id)}>
                        <h3 className="font-black text-slate-800 text-lg capitalize">{categoryNames[id]}</h3>
                        <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">{mastery}%</div>
                        <p className="text-2xl text-yellow-400 mt-2">
                            {'★'.repeat(stars).padEnd(3, '☆')}
                        </p>
                    </Card>
                ))}
            </div>
            
            <hr className="my-6 border-slate-300" />

            <h2 className="text-3xl font-black text-slate-800 mb-4">Modos de Examen</h2>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button variant="secondary" onClick={onStartWeeklyExam} className="w-full sm:w-auto">🏆 Examen Semanal</Button>
                <Button variant="primary" onClick={onStartRefreshExam} className="w-full sm:w-auto">💡 Refrescar Memoria</Button>
            </div>
        </div>
    );
};