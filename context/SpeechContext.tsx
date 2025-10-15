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
    availableLocalVoices: SpeechSynthesisVoice[];
    selectedVoiceURI: string | null;
    selectVoice: (uri: string) => void;
}

const SpeechContext = createContext<SpeechContextType | undefined>(undefined);

const SPEECH_MUTED_KEY = 'maestroDigitalMuted';
const SELECTED_VOICE_URI_KEY = 'maestroDigitalSelectedVoiceURI';

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
    const [availableLocalVoices, setAvailableLocalVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(() => {
        return localStorage.getItem(SELECTED_VOICE_URI_KEY);
    });
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const logicRef = useRef<any>();

    useEffect(() => {
        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
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
                const esVoices = voices.filter(v => v.lang.startsWith('es-'));
                setAvailableLocalVoices(esVoices);
                
                // If a voice was selected but is no longer available, reset it.
                if (selectedVoiceURI && !esVoices.some(v => v.voiceURI === selectedVoiceURI)) {
                    setSelectedVoiceURI(null);
                    localStorage.removeItem(SELECTED_VOICE_URI_KEY);
                }
            };
            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
         return () => window.removeEventListener('click', resumeAudio, true);
    }, [selectedVoiceURI]);

    useEffect(() => {
        if (!isSupported || isMuted) return;

        const keepAliveInterval = setInterval(() => {
            if (window.speechSynthesis && !window.speechSynthesis.speaking) {
                window.speechSynthesis.resume();
            }
        }, 14000); 

        return () => clearInterval(keepAliveInterval);
    }, [isSupported, isMuted]);

    useEffect(() => {
        localStorage.setItem(SPEECH_MUTED_KEY, JSON.stringify(isMuted));
        if (isMuted) {
            window.speechSynthesis.cancel();
            currentAudioSourceRef.current?.stop(0);
            currentAudioSourceRef.current = null;
            setIsSpeaking(false);
        }
    }, [isMuted]);
    
    const selectVoice = useCallback((uri: string) => {
        setSelectedVoiceURI(uri);
        localStorage.setItem(SELECTED_VOICE_URI_KEY, uri);
    }, []);

    useEffect(() => {
        const defaultSpanishVoice = availableLocalVoices.find(v => v.lang.startsWith('es-ES')) || availableLocalVoices.find(v => v.lang.startsWith('es-MX')) || availableLocalVoices[0];
        logicRef.current = {
            isMuted,
            isSupported,
            defaultSpanishVoice,
            availableLocalVoices,
            selectedVoiceURI,
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
                    source.start(0);
                    currentAudioSourceRef.current = source;
                } catch (error) {
                    console.error("Online speech synthesis error:", error);
                    setIsSpeaking(false);
                }
            }
        };
    }, [isMuted, isSupported, availableLocalVoices, selectedVoiceURI, voiceMode]);


    const speak = useCallback((text: string) => {
        const logic = logicRef.current;
        if (!logic || logic.isMuted || !logic.isSupported) return;

        const sanitizedText = sanitizeTextForSpeech(text);
        if (!sanitizedText) return;

        window.speechSynthesis.cancel();
        logic.currentAudioSourceRef.current?.stop(0);
        logic.setIsSpeaking(true);

        const useLocal = logic.voiceMode === 'local' || (logic.voiceMode === 'auto' && logic.availableLocalVoices.length > 0);
        
        if (useLocal) {
            const utterance = new SpeechSynthesisUtterance(sanitizedText);
            utteranceRef.current = utterance;

            const selectedVoice = logic.availableLocalVoices.find((v: SpeechSynthesisVoice) => v.voiceURI === logic.selectedVoiceURI);

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            } else if (logic.defaultSpanishVoice) {
                utterance.voice = logic.defaultSpanishVoice;
            }
            utterance.lang = utterance.voice?.lang || 'es-ES';

            utterance.onend = () => {
                logic.setIsSpeaking(false);
                if (utteranceRef.current === utterance) {
                    utteranceRef.current = null;
                }
            };

            utterance.onerror = (e) => {
                if (e.error !== 'interrupted' && e.error !== 'canceled') {
                    const errorDetail = typeof e.error === 'object' ? JSON.stringify(e.error) : e.error;
                    console.error(`Local speech synthesis error: ${errorDetail}`, { text: sanitizedText });
                    
                    if (logic.voiceMode === 'auto') {
                        console.log("Local TTS failed, attempting fallback to online voice.");
                        logic.playOnline(sanitizedText);
                    } else {
                        logic.setIsSpeaking(false);
                    }
                }
                if (utteranceRef.current === utterance) {
                    utteranceRef.current = null;
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

    const value = useMemo(() => ({ 
        isMuted, 
        toggleMute, 
        speak, 
        isSupported, 
        isSpeaking,
        availableLocalVoices,
        selectedVoiceURI,
        selectVoice
    }), [isMuted, toggleMute, speak, isSupported, isSpeaking, availableLocalVoices, selectedVoiceURI, selectVoice]);

    return <SpeechContext.Provider value={value}>{children}</SpeechContext.Provider>;
};

export const useSpeech = (): SpeechContextType => {
    const context = useContext(SpeechContext);
    if (context === undefined) {
        throw new Error('useSpeech must be used within a SpeechProvider');
    }
    return context;
};
