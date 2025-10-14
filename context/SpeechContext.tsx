import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface SpeechContextType {
    isMuted: boolean;
    toggleMute: () => void;
    speak: (text: string) => void;
    isSupported: boolean;
}

const SpeechContext = createContext<SpeechContextType | undefined>(undefined);

const SPEECH_MUTED_KEY = 'maestroDigitalMuted';

export const SpeechProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isMuted, setIsMuted] = useState<boolean>(() => {
        try {
            const savedMuteState = localStorage.getItem(SPEECH_MUTED_KEY);
            return savedMuteState ? JSON.parse(savedMuteState) : true;
        } catch {
            return true;
        }
    });
    const [isSupported, setIsSupported] = useState<boolean>(false);
    const [spanishVoice, setSpanishVoice] = useState<SpeechSynthesisVoice | null>(null);

    useEffect(() => {
        const checkSupport = 'speechSynthesis' in window;
        setIsSupported(checkSupport);

        if (checkSupport) {
            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                const esVoice = voices.find(v => v.lang.startsWith('es-ES')) || voices.find(v => v.lang.startsWith('es-MX')) || voices.find(v => v.lang.startsWith('es'));
                if (esVoice) {
                    setSpanishVoice(esVoice);
                }
            };

            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(SPEECH_MUTED_KEY, JSON.stringify(isMuted));
        if (isMuted) {
            window.speechSynthesis.cancel();
        }
    }, [isMuted]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    const speak = useCallback((text: string) => {
        if (isMuted || !isSupported) {
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }
        utterance.lang = 'es-ES';
        window.speechSynthesis.speak(utterance);
    }, [isMuted, isSupported, spanishVoice]);

    const value = { isMuted, toggleMute, speak, isSupported };

    return <SpeechContext.Provider value={value}>{children}</SpeechContext.Provider>;
};

export const useSpeech = (): SpeechContextType => {
    const context = useContext(SpeechContext);
    if (context === undefined) {
        throw new Error('useSpeech must be used within a SpeechProvider');
    }
    return context;
};