import React from 'react';
import type { ConnectionStatus } from '../../types';
import { useSpeech } from '../../context/SpeechContext';

interface GlobalHeaderProps {
    onBack?: () => void;
    title?: string;
    connectionStatus: ConnectionStatus;
    isAiEnabled: boolean;
    onToggleAi: () => void;
}

const ConnectionIndicator: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
    const statusInfo = {
        checking: { color: 'bg-yellow-400', text: 'IA...' },
        online: { color: 'bg-green-500', text: 'Online' },
        offline: { color: 'bg-red-500', text: 'Offline' },
    };
    const current = statusInfo[status];

    return (
        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-full" title={status === 'checking' ? 'Comprobando conexión con la IA...' : status === 'online' ? 'La IA está generando pistas y explicaciones' : 'Usando pistas y explicaciones predefinidas'}>
            <span className={`w-2.5 h-2.5 rounded-full ${current.color}`}></span>
            <span className="text-xs font-bold text-slate-600">{current.text}</span>
        </div>
    );
};

const AiToggleSwitch: React.FC<{ isEnabled: boolean, onToggle: () => void, isOnline: boolean }> = ({ isEnabled, onToggle, isOnline }) => {
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600">IA</span>
            <button
                onClick={onToggle}
                disabled={!isOnline}
                className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors duration-300 focus:outline-none ${isEnabled ? 'bg-green-500' : 'bg-slate-300'} ${!isOnline ? 'cursor-not-allowed opacity-50' : ''}`}
                title={isOnline ? (isEnabled ? 'Desactivar IA' : 'Activar IA') : 'La conexión con la IA no está disponible'}
            >
                <span
                    className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform duration-300 ${isEnabled ? 'translate-x-5' : 'translate-x-1'}`}
                />
            </button>
        </div>
    );
}

const VoiceToggleButton = () => {
    const { isMuted, toggleMute, isSupported } = useSpeech();

    if (!isSupported) {
        return null;
    }

    return (
        <button
            onClick={toggleMute}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-md transition-colors ${isMuted ? 'bg-slate-200 text-slate-500' : 'bg-yellow-400 text-white'}`}
            title={isMuted ? 'Activar voz' : 'Silenciar voz'}
        >
            {isMuted ? '🔇' : '🔊'}
        </button>
    )
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ onBack, title, connectionStatus, isAiEnabled, onToggleAi }) => {
    return (
        <header className="relative w-full p-3 flex justify-between items-center border-b-2 border-slate-200 flex-shrink-0">
            <div className="w-1/4 flex justify-start">
                {onBack && (
                    <button onClick={onBack} className="text-slate-500 font-bold hover:text-slate-800 transition-colors text-lg">
                        &larr;
                    </button>
                )}
            </div>
            <div className="w-2/4 text-center">
                {title && <h2 className="text-xl font-black text-slate-700 truncate">{title}</h2>}
            </div>
            <div className="w-1/4 flex justify-end items-center gap-2">
                 <AiToggleSwitch isEnabled={isAiEnabled} onToggle={onToggleAi} isOnline={connectionStatus === 'online'} />
                 <ConnectionIndicator status={connectionStatus} />
                 <VoiceToggleButton />
            </div>
        </header>
    );
};
