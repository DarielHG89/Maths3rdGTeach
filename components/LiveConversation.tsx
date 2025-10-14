import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { LiveSession, LiveServerMessage } from '@google/genai';
import { connectToLive } from '../services/aiService';
import { createBlob, decode, decodeAudioData } from '../utils/audio';
import type { TranscriptEntry } from '../types';

interface LiveConversationProps {
    onBack: () => void;
}

type ConversationStatus = 'idle' | 'listening' | 'processing';

const MicButton: React.FC<{ status: ConversationStatus, onClick: () => void }> = ({ status, onClick }) => {
    const statusConfig = {
        idle: { icon: '🎤', text: 'Toca para hablar', color: 'bg-blue-500 hover:bg-blue-600', textColor: 'text-white' },
        listening: { icon: '◼', text: 'Escuchando...', color: 'bg-red-500 hover:bg-red-600', textColor: 'text-white' },
        processing: { icon: '💬', text: 'Pensando...', color: 'bg-gray-400', textColor: 'text-gray-800', disabled: true },
    };
    const current = statusConfig[status];

    return (
        <button
            onClick={onClick}
            disabled={current.disabled}
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-lg transform active:scale-95 disabled:cursor-not-allowed disabled:transform-none ${current.color} ${current.textColor} ${!current.disabled ? 'hover:scale-105' : ''}`}
        >
            <span className="text-5xl">{current.icon}</span>
            <span className="mt-1 font-bold">{current.text}</span>
        </button>
    )
}

export const LiveConversation: React.FC<LiveConversationProps> = ({ onBack }) => {
    const [status, setStatus] = useState<ConversationStatus>('idle');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [error, setError] = useState<string | null>(null);

    const sessionRef = useRef<LiveSession | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    
    const processMessageRef = useRef<(message: LiveServerMessage) => void>();
    
    const stopConversation = useCallback((force = false) => {
        if (!force && status === 'idle') return;

        setStatus('idle');
        sessionRef.current?.close();
        sessionRef.current = null;

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        
        if (inputAudioContextRef.current?.state !== 'closed') {
          inputAudioContextRef.current?.close().catch(console.error);
        }
        inputAudioContextRef.current = null;
        
        if (outputAudioContextRef.current?.state !== 'closed') {
          outputAudioContextRef.current?.close().catch(console.error);
        }
        outputAudioContextRef.current = null;
        
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }, [status]);


    useEffect(() => {
        processMessageRef.current = async (message: LiveServerMessage) => {
             if (message.serverContent) {
                if (message.serverContent.inputTranscription) {
                    const { text, isFinal } = message.serverContent.inputTranscription;
                    setTranscript(prev => {
                        const last = prev[prev.length - 1];
                        if (last?.source === 'user' && !last.isFinal) {
                            return [...prev.slice(0, -1), { ...last, text, isFinal }];
                        }
                        return [...prev, { id: Date.now(), source: 'user', text, isFinal }];
                    });
                     if (isFinal) {
                        setStatus('processing');
                    }
                }
                if (message.serverContent.outputTranscription) {
                    const { text, isFinal } = message.serverContent.outputTranscription;
                    setTranscript(prev => {
                        const last = prev[prev.length - 1];
                        if (last?.source === 'model' && !last.isFinal) {
                            return [...prev.slice(0, -1), { ...last, text: last.text + text, isFinal }];
                        }
                        return [...prev, { id: Date.now(), source: 'model', text, isFinal }];
                    });
                }
                const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (audioData) {
                    const ctx = outputAudioContextRef.current;
                    if (ctx) {
                        const nextStartTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
        
                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(ctx.destination);
                        source.addEventListener('ended', () => {
                            audioSourcesRef.current.delete(source);
                        });
                        source.start(nextStartTime);
                        nextStartTimeRef.current = nextStartTime + audioBuffer.duration;
                        audioSourcesRef.current.add(source);
                    }
                }
    
                if (message.serverContent?.interrupted) {
                    audioSourcesRef.current.forEach(source => {
                        source.stop();
                        audioSourcesRef.current.delete(source);
                    });
                    nextStartTimeRef.current = 0;
                    setTranscript(prev => {
                        const last = prev[prev.length - 1];
                        if (last?.source === 'model' && !last.isFinal) {
                            return [...prev.slice(0, -1), { ...last, isFinal: true }];
                        }
                        return prev;
                    });
                    setStatus('listening');
                }

                if(message.serverContent.turnComplete) {
                    setStatus('listening');
                }
            }
        };
    }, []);

    const startConversation = useCallback(async () => {
        setError(null);
        setTranscript([]);
        setStatus('listening');
        try {
            inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            const sessionPromise = connectToLive(
                (message) => processMessageRef.current?.(message),
                (e) => { console.error(e); setError('Hubo un error en la conexión.'); stopConversation(true); },
                () => { console.log('closed'); stopConversation(true); }
            );

            sessionPromise.then(session => {
                sessionRef.current = session;
            }).catch(e => {
                console.error(e);
                setError('No se pudo conectar con la IA. ¿Estás online?');
                stopConversation(true);
            });

            scriptProcessor.onaudioprocess = (event) => {
                const inputData = event.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromise.then(session => {
                    if (session) session.sendRealtimeInput({ media: pcmBlob });
                });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
            scriptProcessorRef.current = scriptProcessor;

        } catch (err) {
            console.error(err);
            setError('Necesitas dar permiso para usar el micrófono.');
            setStatus('idle');
        }
    }, [stopConversation]);

    const handleMicClick = () => {
        if (status === 'idle') {
            startConversation();
        } else {
            stopConversation();
        }
    };

    useEffect(() => {
        return () => {
            stopConversation(true);
        };
    }, [stopConversation]);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);


    return (
        <div className="animate-fade-in relative flex flex-col h-[70vh] max-h-[70vh]">
            <header className="flex-shrink-0">
                <button onClick={() => { stopConversation(true); onBack(); }} className="absolute top-0 left-0 text-slate-500 font-bold hover:text-slate-800 transition-colors">
                    &larr; Volver al Panel
                </button>
                <h2 className="text-4xl font-black text-slate-800 mb-2 mt-8 sm:mt-0">Charla con el Maestro</h2>
                <p className="text-slate-500 mb-4">¡Habla con el Maestro Digital sobre lo que quieras aprender!</p>
            </header>

            <div className="flex-grow bg-slate-100 rounded-lg p-4 overflow-y-auto mb-4 shadow-inner">
                {transcript.length === 0 && status !== 'idle' && (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-slate-400 font-semibold">Esperando para escuchar...</p>
                    </div>
                )}
                {transcript.map((entry) => (
                    <div key={`${entry.id}-${entry.text.length}`} className={`flex ${entry.source === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                        <p className={`max-w-[80%] p-3 rounded-lg ${entry.source === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-slate-700 shadow'}`}>
                            {entry.text}
                        </p>
                    </div>
                ))}
                 <div ref={transcriptEndRef} />
            </div>

            <div className="flex-shrink-0 flex flex-col items-center justify-center">
                {error && <p className="text-red-500 mb-2">{error}</p>}
                <MicButton status={status} onClick={handleMicClick} />
            </div>
        </div>
    );
};