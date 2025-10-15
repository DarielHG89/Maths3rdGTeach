import React, { useState, useEffect, useRef } from 'react';
import type { QuizConfig, StudentProfile } from '../types';
// Fix: Import 'generateExplanation' to resolve the undefined function error.
import { generateHint, generateExplanation } from '../services/aiService';
import { Button } from './common/Button';
import { useSpeech } from '../context/SpeechContext';

interface QuizProps {
    quizConfig: QuizConfig;
    onQuizEnd: (score: number, total: number) => void;
    onBack: () => void;
    isAiEnabled: boolean;
    studentProfile: StudentProfile;
}

export const Quiz: React.FC<QuizProps> = ({ quizConfig, onQuizEnd, onBack, isAiEnabled, studentProfile }) => {
    const [questionIndex, setQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<{ text: string; correct: boolean; explanation?: string } | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [hintText, setHintText] = useState<string | null>(null);
    const [hintCycleIndex, setHintCycleIndex] = useState(0); // Tracks local hint cycle
    const [aiHintAttempted, setAiHintAttempted] = useState(false); // Tracks if AI hint was tried
    const { speak, isMuted } = useSpeech();

    const currentQuestion = quizConfig.questions[questionIndex];
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsAnswered(false);
        setFeedback(null);
        setUserAnswer('');
        setHintText(null);
        setHintCycleIndex(0); 
        setAiHintAttempted(false);
        inputRef.current?.focus();

        speak(currentQuestion.question);
        if (currentQuestion.type === 'mcq' && currentQuestion.options) {
            const optionsText = `Opciones: ${currentQuestion.options.join(', ')}`;
            // Use timeout to let the question be read first, if voice is on
            const delay = isMuted ? 0 : 2000;
            setTimeout(() => speak(optionsText), delay);
        }

    }, [questionIndex, currentQuestion, speak, isMuted]);
    
    const handleHint = async () => {
        // AI is enabled and we haven't tried getting an AI hint yet for this question
        if (isAiEnabled && !aiHintAttempted) {
            setIsLoadingAI(true);
            setAiHintAttempted(true); // Mark as attempted to prevent multiple AI calls
            try {
                const aiHint = await generateHint(currentQuestion, studentProfile);
                setHintText(aiHint);
                speak(`Pista: ${aiHint}`);
            } catch (error) {
                console.error("AI hint failed, using first local hint", error);
                // Fallback to the first local hint
                const localHints = currentQuestion.hints || ["Piensa con cuidado, ¡tú puedes!"];
                const firstHint = localHints[0];
                setHintText(firstHint);
                speak(`Pista: ${firstHint}`);
                // Since we used the first local hint, advance the cycle index
                setHintCycleIndex(1);
            } finally {
                setIsLoadingAI(false);
            }
        } else {
            // AI is disabled, or AI hint was already shown/attempted, so cycle local hints
            const localHints = currentQuestion.hints || ["Piensa con cuidado, ¡tú puedes!"];
            const hintToShow = localHints[hintCycleIndex % localHints.length];
            setHintText(hintToShow);
            speak(`Pista: ${hintToShow}`);
    
            // Cycle to the next hint for the next click
            setHintCycleIndex(prev => prev + 1);
        }
    };

    const checkAnswer = async (answer: string) => {
        if (isAnswered) return;

        setIsAnswered(true);
        const isCorrect = answer.trim().toLowerCase() === currentQuestion.answer.toString().toLowerCase();
        
        if (isCorrect) {
            const feedbackText = "¡Excelente! ✨";
            setScore(prev => prev + 1);
            setFeedback({ text: feedbackText, correct: true });
            speak(feedbackText);
        } else {
            const feedbackText = "¡Casi! Sigue intentando 💪";
            let explanation: string;
            const fallbackExplanation = currentQuestion.explanation || `La respuesta correcta es "${currentQuestion.answer}". ¡Sigue practicando y lo conseguirás!`;

            if (isAiEnabled) {
                setIsLoadingAI(true);
                try {
                    explanation = await generateExplanation(currentQuestion, answer, studentProfile);
                } catch (error) {
                    console.error("AI explanation failed, using fallback", error);
                    explanation = fallbackExplanation;
                } finally {
                    setIsLoadingAI(false);
                }
            } else {
                explanation = fallbackExplanation;
            }
            setFeedback({ text: feedbackText, correct: false, explanation });
            speak(`${feedbackText}. La respuesta correcta es ${currentQuestion.answer}. ${explanation}`);
        }
    };

    const handleNextQuestion = () => {
        if (questionIndex < quizConfig.questions.length - 1) {
            setQuestionIndex(prev => prev + 1);
        } else {
            onQuizEnd(score, quizConfig.questions.length);
        }
    };
    
    const progressPercent = ((questionIndex) / quizConfig.questions.length) * 100;

    return (
        <div className="animate-fade-in">
            <header className="flex justify-between items-center mb-4">
                <div className="w-1/3"></div>
                <div className="w-1/3 text-lg font-bold bg-yellow-400 text-white px-4 py-2 rounded-full shadow-md text-center">
                    {score} / {quizConfig.questions.length}
                </div>
                <div className="w-1/3"></div>
            </header>
            
            <div className="w-full bg-slate-200 rounded-full h-4 mb-4">
                <div className="bg-green-500 h-4 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl min-h-[150px] flex flex-col justify-center items-center text-xl sm:text-2xl font-bold mb-6 shadow-inner">
                <p>{currentQuestion.question}</p>
            </div>
            
            <div className="space-y-4">
                {currentQuestion.type === 'mcq' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {currentQuestion.options?.map(opt => (
                            <Button key={opt} onClick={() => checkAnswer(opt)} disabled={isAnswered} className="w-full">{opt}</Button>
                        ))}
                    </div>
                )}
                {currentQuestion.type === 'input' && (
                    <form className="flex items-center justify-center gap-2" onSubmit={(e) => { e.preventDefault(); checkAnswer(userAnswer); }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={userAnswer}
                            onChange={e => setUserAnswer(e.target.value)}
                            disabled={isAnswered}
                            className="flex-grow max-w-sm p-4 text-xl border-2 border-slate-300 rounded-lg text-center text-black bg-white"
                            placeholder="Tu respuesta"
                        />
                        <Button type="submit" disabled={isAnswered} variant="special">OK</Button>
                    </form>
                )}
            </div>
            
            {hintText && (
                 <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-r-lg animate-fade-in text-left">
                    <p><strong className="font-bold">Pista:</strong> {hintText}</p>
                </div>
            )}

            <div className="mt-4 text-center">
                <Button onClick={handleHint} disabled={isLoadingAI || isAnswered} variant="warning" className="text-sm px-4 py-2">
                    {isLoadingAI ? "Pensando..." : "💡 Pista"}
                </Button>
            </div>
            
            {isAnswered && (
                <div className="mt-6 p-4 rounded-lg bg-slate-100 animate-fade-in">
                    {feedback && (
                        <>
                         <p className={`text-2xl font-bold ${feedback.correct ? 'text-green-600' : 'text-red-600'}`}>
                            {feedback.text}
                         </p>
                        {!feedback.correct && (
                            <p className="text-slate-600 mt-2">
                                La respuesta correcta es: <strong className="text-slate-800">{currentQuestion.answer}</strong>
                            </p>
                        )}
                        </>
                    )}
                    {isLoadingAI ? (
                         <p className="text-slate-600 mt-2">Maestro Digital está pensando en una buena explicación...</p>
                    ) : (
                        feedback?.explanation && <p className="text-slate-600 mt-2">{feedback.explanation}</p>
                    )}
                    <Button onClick={handleNextQuestion} className="mt-4">Siguiente &rarr;</Button>
                </div>
            )}
        </div>
    );
};