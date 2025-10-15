import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef, useMemo } from 'react';
import type { VoiceMode } from '../types';
import { generateSpeech } from '../services/aiService';
import { decode, decodeAudioData } from '../utils/audio';

interface SpeechContextType {
    isMuted: boolean;
    toggleMute: () => void;
    speak: (text: string) => void;
    isSupported: boolean;
    isSpeaking: boolean;
}

const SpeechContext = createContext<SpeechContextType | undefined>(undefined);

const SPEECH_MUTED_KEY = 'maestroDigitalMuted';

const sanitizeTextForSpeech = (text: string): string => {
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
    const logicRef = useRef<any>();

    useEffect(() => {
        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                 // FIX: The fallback for older browsers was faulty. It called the constructor with 0 arguments,
                 // but some older implementations require a sample rate, causing a crash.
                 // This has been updated to be more robust.
                 try {
                    audioContextRef.current = new AudioContext({ sampleRate: 24000 });
                 } catch (e) {
                    console.warn("Could not create AudioContext with specific sample rate, falling back to default.", e);
                    try {
                       audioContextRef.current = new AudioContext();
                    } catch (e2) {
                       console.error("Could not create any AudioContext. Online speech will be disabled.", e2);
                    }
                 }
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
            // Fix: Pass 0 to stop() for compatibility with older browser versions.
            currentAudioSourceRef.current?.stop(0);
            currentAudioSourceRef.current = null;
            setIsSpeaking(false);
        }
    }, [isMuted]);
    
    // Store all logic and state dependencies in a ref. This allows the `speak` function
    // to access the latest state without needing to be re-created itself.
    useEffect(() => {
        logicRef.current = {
            isMuted,
            isSupported,
            spanishVoice,
            voiceMode,
            setIsSpeaking,
            audioContextRef,
            currentAudioSourceRef,
            async playOnline(text: string) {
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
                    // FIX: Pass 0 to start() for compatibility with older browser versions, which might require an argument.
                    source.start(0);
                    currentAudioSourceRef.current = source;
                } catch (error) {
                    console.error("Online speech synthesis error:", error);
                    setIsSpeaking(false);
                }
            }
        };
    }, [isMuted, isSupported, spanishVoice, voiceMode]);


    // This stable `speak` function's identity never changes. It acts as a gateway
    // to the real logic stored in the ref, preventing re-render loops in consumers.
    const speak = useCallback((text: string) => {
        const logic = logicRef.current;
        if (!logic || logic.isMuted || !logic.isSupported) return;

        const sanitizedText = sanitizeTextForSpeech(text);
        if (!sanitizedText) return;

        window.speechSynthesis.cancel();
        // Fix: Pass 0 to stop() for compatibility with older browser versions.
        logic.currentAudioSourceRef.current?.stop(0);
        logic.setIsSpeaking(true);

        const useLocal = logic.voiceMode === 'local' || (logic.voiceMode === 'auto' && !!logic.spanishVoice);
        
        if (useLocal) {
            const utterance = new SpeechSynthesisUtterance(sanitizedText);
            if (logic.spanishVoice) utterance.voice = logic.spanishVoice;
            utterance.lang = 'es-ES';
            utterance.onend = () => logic.setIsSpeaking(false);
            utterance.onerror = (e) => {
                if (e.error === 'interrupted' || e.error === 'canceled') {
                    console.debug(`Local speech intentionally stopped: ${e.error}`);
                    return;
                }
                const errorDetail = typeof e.error === 'object' ? JSON.stringify(e.error) : e.error;
                console.error(`Local speech synthesis error: ${errorDetail}`, { text: sanitizedText });
                
                if (logic.voiceMode === 'auto') {
                    console.log("Local TTS failed, attempting fallback to online voice.");
                    logic.playOnline(sanitizedText);
                } else {
                    logic.setIsSpeaking(false);
                }
            };
            window.speechSynthesis.speak(utterance);
        } else {
            logic.playOnline(sanitizedText);
        }
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    // Memoize the context value to prevent unnecessary re-renders in consumer components.
    // `speak` and `toggleMute` are stable, so this object only changes when the boolean states change.
    const value = useMemo(() => ({ 
        isMuted, 
        toggleMute, 
        speak, 
        isSupported, 
        isSpeaking 
    }), [isMuted, toggleMute, speak, isSupported, isSpeaking]);

    return <SpeechContext.Provider value={value}>{children}</SpeechContext.Provider>;
};

export const useSpeech = (): SpeechContextType => {
    const context = useContext(SpeechContext);
    if (context === undefined) {
        throw new Error('useSpeech must be used within a SpeechProvider');
    }
    return context;
};