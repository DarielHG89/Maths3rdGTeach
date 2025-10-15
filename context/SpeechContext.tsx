import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import type { VoiceMode } from '../types';
import { generateSpeech } from '../services/aiService';
import { decode, decodeAudioData } from '../utils/audio';

interface SpeechContextType {
    isMuted: boolean;
    toggleMute: () => void;
    speak: (text: string) => Promise<void>;
    isSupported: boolean;
    isSpeaking: boolean;
}

const SpeechContext = createContext<SpeechContextType | undefined>(undefined);

const SPEECH_MUTED_KEY = 'maestroDigitalMuted';

// Helper function to remove characters that can cause issues with TTS engines
const sanitizeTextForSpeech = (text: string): string => {
    // This regex removes a broad range of emojis and symbols, replacing them with a space
    // to avoid merging words, then cleans up any extra whitespace.
    return text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, ' ').replace(/\s+/g, ' ').trim();
};


export const SpeechProvider: React.FC<{ children: ReactNode; voiceMode: VoiceMode }> = ({ children, voiceMode }) => {
    const [isMuted, setIsMuted] = useState<boolean>(() => {
        try {
            const savedMuteState = localStorage.getItem(SPEECH_MUTED_KEY);
            return savedMuteState ? JSON.parse(savedMuteState) : false;
        } catch {
            return false;
        }
    });
    const [isSupported, setIsSupported] = useState<boolean>(false);
    const [spanishVoice, setSpanishVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const mutedRef = useRef(isMuted);

    useEffect(() => {
        mutedRef.current = isMuted;
    }, [isMuted]);

    useEffect(() => {
        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                 audioContextRef.current = new AudioContext({ sampleRate: 24000 });
            }
        }
        const resumeAudio = () => {
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current?.resume();
            }
            window.removeEventListener('click', resumeAudio, true);
        };
        window.addEventListener('click', resumeAudio, true);

        const checkSupport = 'speechSynthesis' in window;
        setIsSupported(checkSupport);
        if (checkSupport) {
            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                const esVoice = voices.find(v => v.lang.startsWith('es-ES')) || voices.find(v => v.lang.startsWith('es-MX')) || voices.find(v => v.lang.startsWith('es'));
                setSpanishVoice(esVoice);
            };
            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
         return () => window.removeEventListener('click', resumeAudio, true);
    }, []);

    useEffect(() => {
        localStorage.setItem(SPEECH_MUTED_KEY, JSON.stringify(isMuted));
        if (isMuted) {
            window.speechSynthesis.cancel();
            currentAudioSourceRef.current?.stop();
            currentAudioSourceRef.current = null;
            setIsSpeaking(false);
        }
    }, [isMuted]);

    const playOnline = useCallback(async (text: string) => {
        if (!audioContextRef.current) {
            console.error("AudioContext not available.");
            setIsSpeaking(false);
            return;
        }
        try {
            const base64Audio = await generateSpeech(text);
            const audioData = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => {
                setIsSpeaking(false);
                currentAudioSourceRef.current = null;
            };
            source.start();
            currentAudioSourceRef.current = source;
        } catch (error) {
            console.error("Online speech synthesis error:", error);
            setIsSpeaking(false);
        }
    }, []);

    const speak = useCallback(async (text: string) => {
        if (mutedRef.current || !isSupported) return;

        const sanitizedText = sanitizeTextForSpeech(text);
        if (!sanitizedText) {
            // If text is only emojis/symbols, do nothing.
            return;
        }

        window.speechSynthesis.cancel();
        currentAudioSourceRef.current?.stop();
        setIsSpeaking(true);

        const useLocal = voiceMode === 'local' || (voiceMode === 'auto' && !!spanishVoice);
        
        if (useLocal) {
            const utterance = new SpeechSynthesisUtterance(sanitizedText);
            if (spanishVoice) utterance.voice = spanishVoice;
            utterance.lang = 'es-ES';
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = (e) => {
                // 'interrupted' and 'canceled' are not true errors. They happen when we
                // intentionally stop speech (e.g., by calling speak() again). We should
                // not treat them as failures that require a fallback.
                if (e.error === 'interrupted' || e.error === 'canceled') {
                    console.debug(`Local speech synthesis intentionally stopped: ${e.error}`);
                    return;
                }

                const errorDetail = typeof e.error === 'object' ? JSON.stringify(e.error) : e.error;
                console.error(`Local speech synthesis error: ${errorDetail}`, { text: sanitizedText });
                
                if (voiceMode === 'auto') {
                    console.log("Local TTS failed, attempting fallback to online voice.");
                    playOnline(sanitizedText);
                } else {
                    setIsSpeaking(false);
                }
            };
            window.speechSynthesis.speak(utterance);
        } else {
            await playOnline(sanitizedText);
        }
    }, [isSupported, spanishVoice, voiceMode, playOnline]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    const value = { isMuted, toggleMute, speak, isSupported, isSpeaking };

    return <SpeechContext.Provider value={value}>{children}</SpeechContext.Provider>;
};

export const useSpeech = (): SpeechContextType => {
    const context = useContext(SpeechContext);
    if (context === undefined) {
        throw new Error('useSpeech must be used within a SpeechProvider');
    }
    return context;
};