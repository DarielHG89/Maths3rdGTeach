import React, { useState, useEffect, useRef } from 'react';
import type { ConnectionStatus, VoiceMode } from '../../types';
import { useSpeech } from '../../context/SpeechContext';

interface GlobalHeaderProps {
    onBack?: () => void;
    title?: string;
    connectionStatus: ConnectionStatus;
    isAiEnabled: boolean;
    onToggleAi: () => void;
    voiceMode: VoiceMode;
    onVoiceModeChange: (mode: VoiceMode) => void;
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
                className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors duration-300 focus:outline-none ${isEnabled ? 'bg-green-500' : 'bg-slate-300'}`}
                title={isOnline 
                    ? (isEnabled ? 'Desactivar IA' : 'Activar IA') 
                    : (isEnabled ? 'Desactivar IA (sin conexión)' : 'Activar IA (sin conexión)')
                }
            >
                <span
                    className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform duration-300 ${isEnabled ? 'translate-x-5' : 'translate-x-1'}`}
                />
            </button>
        </div>
    );
}

const VoiceControl: React.FC<{ voiceMode: VoiceMode, onVoiceModeChange: (mode: VoiceMode) => void, isOnline: boolean }> = ({ voiceMode, onVoiceModeChange, isOnline }) => {
    const { isMuted, toggleMute, isSupported, isSpeaking } = useSpeech();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!isSupported) return null;

    const modes: { key: VoiceMode, label: string }[] = [
        { key: 'auto', label: 'Auto' },
        { key: 'local', label: 'Local' },
        { key: 'online', label: 'Online (IA)' }
    ];

    const currentModeLabel = modes.find(m => m.key === voiceMode)?.label || 'Voz';

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={toggleMute}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-md transition-colors ${isMuted ? 'bg-slate-200 text-slate-500' : 'bg-yellow-400 text-white'}`}
                title={isMuted ? 'Activar voz' : 'Silenciar voz'}
            >
                {isSpeaking ? '💬' : (isMuted ? '🔇' : '🔊')}
            </button>
            <div className="relative" ref={menuRef}>
                 <button 
                    onClick={() => setIsMenuOpen(prev => !prev)} 
                    className="bg-slate-100 text-slate-600 font-bold py-1 px-2 rounded-md text-xs flex items-center gap-1"
                    title="Seleccionar modo de voz"
                 >
                    {currentModeLabel} <span className={`transition-transform transform ${isMenuOpen ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10 border border-slate-200">
                        {modes.map(mode => (
                             <button
                                key={mode.key}
                                onClick={() => {
                                    onVoiceModeChange(mode.key);
                                    setIsMenuOpen(false);
                                }}
                                className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:bg-transparent disabled:cursor-not-allowed"
                                disabled={!isOnline && mode.key === 'online'}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ onBack, title, connectionStatus, isAiEnabled, onToggleAi, voiceMode, onVoiceModeChange }) => {
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const settingsTimerRef = useRef<number | null>(null);

    const showSettings = () => {
        if (settingsTimerRef.current) {
            clearTimeout(settingsTimerRef.current);
        }
        setIsSettingsVisible(true);
        settingsTimerRef.current = window.setTimeout(() => {
            setIsSettingsVisible(false);
        }, 5000);
    };

    useEffect(() => {
        // Cleanup timer on component unmount
        return () => {
            if (settingsTimerRef.current) {
                clearTimeout(settingsTimerRef.current);
            }
        };
    }, []);
    
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
            <div className="w-1/4 flex justify-end items-center">
                <div className="flex items-center gap-2">
                    <div 
                        className={`flex items-center gap-2 transition-opacity duration-300 ${isSettingsVisible ? 'opacity-100' : 'opacity-0'}`}
                    >
                        {isSettingsVisible && (
                            <>
                                <AiToggleSwitch isEnabled={isAiEnabled} onToggle={onToggleAi} isOnline={connectionStatus === 'online'} />
                                <ConnectionIndicator status={connectionStatus} />
                                <VoiceControl voiceMode={voiceMode} onVoiceModeChange={onVoiceModeChange} isOnline={connectionStatus === 'online'} />
                            </>
                        )}
                    </div>
                    <button
                        onClick={showSettings}
                        className="p-1 rounded-full hover:bg-slate-200 transition-colors"
                        title="Configuración"
                    >
                        <span className="text-2xl" role="img" aria-label="Configuración">⚙️</span>
                    </button>
                </div>
            </div>
        </header>
    );
};