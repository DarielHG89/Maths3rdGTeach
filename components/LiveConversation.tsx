

import React, { useState, useRef, useEffect, useCallback } from 'react';
// Fix: Removed LiveSession as it's no longer exported.
import type { LiveServerMessage } from '@google/genai';
import { connectToLive } from '../services/aiService';
import { createBlob, decode, decodeAudioData } from '../utils/audio';
import type { TranscriptEntry } from '../types';
import { useSpeech } from '../context/SpeechContext';
import { Card } from './common/Card';

interface LiveConversationProps {
    onBack: () => void;
}

type ConversationStatus = 'idle' | 'listening' | 'processing';

const MicButton: React.FC<{ status: ConversationStatus, onClick: () => void }> = ({ status, onClick }) => {
    const statusConfig = {
        idle: { icon: '🎤', text: 'Toca para hablar', color: 'bg-blue-500 hover:bg-blue-600', textColor: 'text-white' },
        listening: { icon: '◼', text: 'Escuchando...', color: 'bg-red-500 hover:bg-red-600', textColor: 'text-white' },
        processing: { icon: '💬', text: 'Pensando...', color: 'bg-yellow-500 hover:bg-yellow-600', textColor: 'text-white' },
    };
    const current = statusConfig[status];

    return (
        <button
            onClick={onClick}
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-lg transform active:scale-95 ${current.color} ${current.textColor} hover:scale-105`}
        >
            <span className="text-5xl">{current.icon}</span>
            <span className="mt-1 font-bold">{current.text}</span>
        </button>
    )
}

export const LiveConversation: React.FC<LiveConversationProps> = ({ onBack }) => {
    const [statusState, setStatusState] = useState<ConversationStatus>('idle');
    const statusRef = useRef<ConversationStatus>('idle');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { speak } = useSpeech();

    const [pastTranscripts, setPastTranscripts] = useState<{timestamp: number, transcript: TranscriptEntry[]}[]>([]);
    const [viewingPast, setViewingPast] = useState(false);
    const [selectedTranscript, setSelectedTranscript] = useState<TranscriptEntry[] | null>(null);

    // Fix: Using `any` for sessionRef as LiveSession type is no longer exported.
    const sessionRef = useRef<any | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const turnCompleteReceivedRef = useRef<boolean>(false);
    const isStoppingRef = useRef<boolean>(false);
    
    const transcriptRef = useRef<TranscriptEntry[]>([]);
    const processMessageRef = useRef<(message: LiveServerMessage) => void>();
    
    useEffect(() => {
        transcriptRef.current = transcript;
    }, [transcript]);

     useEffect(() => {
        try {
            const TRANSCRIPTS_KEY = 'maestroDigitalTranscripts';
            const saved = localStorage.getItem(TRANSCRIPTS_KEY);
            if (saved) {
                setPastTranscripts(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Could not load past transcripts", e);
        }
    }, []);

    const setStatus = (newStatus: ConversationStatus) => {
        statusRef.current = newStatus;
        setStatusState(newStatus);
    };

    const stopConversation = useCallback((force = false) => {
        if ((!force && statusRef.current === 'idle') || isStoppingRef.current) return;

        isStoppingRef.current = true;
        
        const currentTranscript = transcriptRef.current;
        if (currentTranscript.length > 0) {
            try {
                const TRANSCRIPTS_KEY = 'maestroDigitalTranscripts';
                const MAX_TRANSCRIPTS = 10;
                const savedTranscriptsRaw = localStorage.getItem(TRANSCRIPTS_KEY);
                const savedTranscripts = savedTranscriptsRaw ? JSON.parse(savedTranscriptsRaw) : [];
                
                const newTranscriptRecord = {
                    timestamp: Date.now(),
                    transcript: currentTranscript.filter(entry => entry.text.trim() !== '')
                };

                if (newTranscriptRecord.transcript.length > 0) {
                    const updatedTranscripts = [newTranscriptRecord, ...savedTranscripts].slice(0, MAX_TRANSCRIPTS);
                    localStorage.setItem(TRANSCRIPTS_KEY, JSON.stringify(updatedTranscripts));
                    setPastTranscripts(updatedTranscripts); // Update state after saving
                    console.log('Conversation transcript saved.');
                }
            } catch (err) {
                console.error("Failed to save transcript:", err);
            }
        }
        
        setStatus('idle');
        
        // Fix: The session.close() method was called without arguments, but it expects one. Passing an empty object to resolve the error.
        sessionRef.current?.close({});
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
    }, []);


    useEffect(() => {
        // Fix: Refactored message processing to handle API changes (no more `isFinal` property).
        processMessageRef.current = async (message: LiveServerMessage) => {
            if (isStoppingRef.current) return;

             if (message.serverContent) {
                if (message.serverContent.inputTranscription) {
                    const text = message.serverContent.inputTranscription.text;
                    setTranscript(prev => {
                        const last = prev[prev.length - 1];
                        if (last?.source === 'user' && !last.isFinal) {
                            return [...prev.slice(0, -1), { ...last, text, isFinal: false }];
                        }
                        return [...prev, { id: Date.now(), source: 'user', text, isFinal: false }];
                    });
                }
                if (message.serverContent.outputTranscription) {
                    // Set status to processing when model starts responding
                    if (statusRef.current === 'listening') {
                        setStatus('processing');
                    }
                    const text = message.serverContent.outputTranscription.text;
                    // Read the incoming transcribed text from the model aloud.
                    speak(text);
                    setTranscript(prev => {
                        const last = prev[prev.length - 1];
                        if (last?.source === 'model' && !last.isFinal) {
                            return [...prev.slice(0, -1), { ...last, text: last.text + text, isFinal: false }];
                        }
                        return [...prev, { id: Date.now(), source: 'model', text, isFinal: false }];
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
                            if (isStoppingRef.current) return;
                            audioSourcesRef.current.delete(source);
                            if (audioSourcesRef.current.size === 0 && turnCompleteReceivedRef.current) {
                                setStatus('listening');
                                turnCompleteReceivedRef.current = false;
                            }
                        });
                        source.start(nextStartTime);
                        nextStartTimeRef.current = nextStartTime + audioBuffer.duration;
                        audioSourcesRef.current.add(source);
                    }
                }
    
                if (message.serverContent?.interrupted) {
                    audioSourcesRef.current.forEach(source => source.stop());
                    audioSourcesRef.current.clear();
                    nextStartTimeRef.current = 0;
                    turnCompleteReceivedRef.current = false;
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
                    turnCompleteReceivedRef.current = true;
                    // Mark the last transcript entries as final.
                    setTranscript(prev => prev.map((entry, index) => index === prev.length - 1 ? { ...entry, isFinal: true } : entry));
                    if (audioSourcesRef.current.size === 0) {
                        setStatus('listening');
                        turnCompleteReceivedRef.current = false;
                    }
                }
            }
        };
    }, [speak]);

    const startConversation = useCallback(async () => {
        isStoppingRef.current = false;
        setError(null);
        setTranscript([]);
        setStatus('listening');
        try {
            // FIX: Cast window to `any` to allow access to the non-standard `webkitAudioContext` for broader browser compatibility, resolving TypeScript errors.
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            await outputAudioContextRef.current.resume();
            await inputAudioContextRef.current.resume();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            const sessionPromise = connectToLive(
                (message) => processMessageRef.current?.(message),
                (e) => { 
                    console.error('Live connection error:', e); 
                    setError('Hubo un error en la conexión.'); 
                    stopConversation(true); 
                },
                () => {
                    console.log('Live connection closed.');
                    // This catches unexpected closes from the server.
                    // User-initiated closes are handled by the stopConversation function itself.
                    if (!isStoppingRef.current) {
                        stopConversation(true);
                    }
                }
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
            console.error('Error starting conversation:', err);
            setError('Necesitas dar permiso para usar el micrófono.');
            stopConversation(true);
        }
    }, [stopConversation]);

    const handleMicClick = () => {
        if (statusState === 'idle') {
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
    }, [transcript, selectedTranscript]);


    if (viewingPast) {
        return (
            <div className="animate-fade-in relative flex flex-col h-[70vh] max-h-[70vh]">
                {selectedTranscript ? (
                    // Viewing a single past transcript
                    <>
                        <header className="flex-shrink-0">
                             <button onClick={() => setSelectedTranscript(null)} className="absolute top-0 left-0 text-slate-500 font-bold hover:text-slate-800 transition-colors">
                                &larr; Volver al Historial
                            </button>
                            <h2 className="text-3xl font-black text-slate-800 text-center mb-4 mt-8 sm:mt-0">Transcripción</h2>
                        </header>
                         <div className="flex-grow bg-slate-100 rounded-lg p-4 overflow-y-auto shadow-inner">
                            {selectedTranscript.map((entry, index) => (
                                <div key={`${entry.id}-${index}`} className={`flex ${entry.source === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                                    <p className={`max-w-[80%] p-3 rounded-lg ${entry.source === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-slate-700 shadow'}`}>
                                        {entry.text}
                                    </p>
                                </div>
                            ))}
                            <div ref={transcriptEndRef} />
                        </div>
                    </>
                ) : (
                    // Viewing the list of past transcripts
                    <>
                        <header className="flex-shrink-0">
                            <button onClick={() => setViewingPast(false)} className="absolute top-0 left-0 text-slate-500 font-bold hover:text-slate-800 transition-colors">
                                &larr; Volver a la Charla
                            </button>
                            <h2 className="text-4xl font-black text-slate-800 mb-2 mt-8 sm:mt-0">Conversaciones Pasadas</h2>
                             <p className="text-slate-500 mb-4">Revisa tus charlas anteriores con el Maestro.</p>
                        </header>
                         <div className="flex-grow overflow-y-auto space-y-3 p-1">
                            {pastTranscripts.length === 0 ? (
                                <p className="text-slate-500 text-center mt-8">No hay conversaciones guardadas todavía.</p>
                            ) : (
                                pastTranscripts.map((record) => (
                                    <Card key={record.timestamp} onClick={() => setSelectedTranscript(record.transcript)}>
                                        <h3 className="font-bold text-slate-700">Conversación de:</h3>
                                        <p className="text-sm text-slate-500">{new Date(record.timestamp).toLocaleString('es-ES')}</p>
                                    </Card>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }


    return (
        <div className="animate-fade-in relative flex flex-col h-[70vh] max-h-[70vh]">
            <header className="flex-shrink-0 flex justify-between items-start">
                 <div>
                    <button onClick={() => { stopConversation(true); onBack(); }} className="absolute top-0 left-0 text-slate-500 font-bold hover:text-slate-800 transition-colors">
                        &larr; Volver al Panel
                    </button>
                    <h2 className="text-4xl font-black text-slate-800 mb-2 mt-8 sm:mt-0">Charla con el Maestro</h2>
                    <p className="text-slate-500 mb-4">¡Habla con el Maestro Digital sobre lo que quieras aprender!</p>
                 </div>
                 {pastTranscripts.length > 0 && (
                     <button 
                        onClick={() => setViewingPast(true)}
                        className="bg-purple-100 text-purple-700 font-bold py-2 px-3 rounded-lg hover:bg-purple-200 transition-colors text-sm whitespace-nowrap"
                    >
                        Ver Historial 📜
                    </button>
                 )}
            </header>

            <div className="flex-grow bg-slate-100 rounded-lg p-4 overflow-y-auto mb-4 shadow-inner">
                {transcript.length === 0 && statusState !== 'idle' && (
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
                <MicButton status={statusState} onClick={handleMicClick} />
            </div>
        </div>
    );
};