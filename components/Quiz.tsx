import React, { useState, useEffect, useRef } from 'react';
import type { QuizConfig, StudentProfile } from '../types';
import { generateHint, generateExplanation } from '../services/aiService';
import { Button } from './common/Button';
import { useSpeech } from '../context/SpeechContext';

interface QuizProps {
    quizConfig: QuizConfig;
    onQuizEnd: (score: number, total: number, totalTime: number) => void;
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
    const [hintCycleIndex, setHintCycleIndex] = useState(0);
    const [aiHintAttempted, setAiHintAttempted] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());
    const [totalTime, setTotalTime] = useState(0);
    const { speak } = useSpeech();
    const [isNextDisabled, setIsNextDisabled] = useState(false);

    const currentQuestion = quizConfig.questions[questionIndex];
    const inputRef = useRef<HTMLInputElement>(null);
    const nextButtonRef = useRef<HTMLButtonElement>(null);

    // Reset state for new question
    useEffect(() => {
        setIsAnswered(false);
        setFeedback(null);
        setUserAnswer('');
        setHintText(null);
        setHintCycleIndex(0);
        setAiHintAttempted(false);
        setStartTime(Date.now());
        setIsNextDisabled(false);
        inputRef.current?.focus();
    }, [questionIndex]);
    
    // Speak question and options
    useEffect(() => {
        let textToSpeak = currentQuestion.question;
        if (currentQuestion.type === 'mcq' && currentQuestion.options) {
            const optionsText = currentQuestion.options.map(opt => typeof opt === 'string' ? opt : opt.text).join(', ');
            textToSpeak += `. ... Opciones son: ${optionsText}`;
        }
        speak(textToSpeak);
    }, [questionIndex, currentQuestion, speak]);

    // Auto-focus the 'Siguiente' button when it becomes available
    useEffect(() => {
        if (isAnswered && !isNextDisabled) {
            const timer = setTimeout(() => {
                nextButtonRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isAnswered, isNextDisabled]);
    
    const handleHint = async () => {
        if (isAiEnabled && !aiHintAttempted) {
            setIsLoadingAI(true);
            setAiHintAttempted(true);
            try {
                const aiHint = await generateHint(currentQuestion, studentProfile);
                setHintText(aiHint);
                speak(`Pista: ${aiHint}`);
            } catch (error) {
                console.error("AI hint failed, using first local hint", error);
                const localHints = currentQuestion.hints || ["Piensa con cuidado, ¡tú puedes!"];
                const firstHint = localHints[0];
                setHintText(firstHint);
                speak(`Pista: ${firstHint}`);
                setHintCycleIndex(1);
            } finally {
                setIsLoadingAI(false);
            }
        } else {
            const localHints = currentQuestion.hints || ["Piensa con cuidado, ¡tú puedes!"];
            const hintToShow = localHints[hintCycleIndex % localHints.length];
            setHintText(hintToShow);
            speak(`Pista: ${hintToShow}`);
            setHintCycleIndex(prev => prev + 1);
        }
    };

    const checkAnswer = async (answer: string) => {
        if (isAnswered) return;

        const timeTaken = (Date.now() - startTime) / 1000;
        setTotalTime(prev => prev + timeTaken);
        setIsAnswered(true);
        
        const isCorrect = answer.trim().toLowerCase() === currentQuestion.answer.toString().toLowerCase();
        
        if (isCorrect) {
            const feedbackText = "¡Excelente! ✨";
            setScore(prev => prev + 1);
            setFeedback({ text: feedbackText, correct: true });
            speak(feedbackText);
        } else {
            setIsNextDisabled(true);
            setTimeout(() => setIsNextDisabled(false), 3000);

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
            onQuizEnd(score, quizConfig.questions.length, totalTime);
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

            <div className="bg-slate-50 p-6 rounded-2xl min-h-[150px] flex flex-col justify-center items-center text-xl sm:text-2xl font-bold mb-6 shadow-inner text-center">
                {currentQuestion.imageUrl && <img src={currentQuestion.imageUrl} alt="Pregunta" className="max-h-40 mb-4" />}
                <p>{currentQuestion.question}</p>
            </div>
            
            <div className="space-y-4">
                {currentQuestion.type === 'mcq' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {currentQuestion.options?.map((opt, index) => {
                             const optionText = typeof opt === 'string' ? opt : opt.text;
                             const optionImageUrl = typeof opt === 'object' && opt.imageUrl ? opt.imageUrl : undefined;
                             return (
                                 <Button key={index} onClick={() => checkAnswer(optionText)} disabled={isAnswered} className="w-full h-full flex flex-col items-center justify-center p-2">
                                     {optionImageUrl && <img src={optionImageUrl} alt={optionText} className="h-20 w-20 object-contain mb-2" />}
                                     <span>{optionText}</span>
                                 </Button>
                             );
                        })}
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
            
            {!isAnswered && (
                <div className="mt-4 text-center">
                    <Button onClick={handleHint} disabled={isLoadingAI} variant="warning" className="text-sm px-4 py-2">
                        {isLoadingAI ? "Pensando..." : "💡 Pista"}
                    </Button>
                </div>
            )}
            
            {!isAnswered && hintText && (
                 <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-r-lg animate-fade-in text-left">
                    <p><strong className="font-bold">Pista:</strong> {hintText}</p>
                </div>
            )}

            {isAnswered && (
                <div className="mt-6 p-4 rounded-lg bg-slate-100 animate-fade-in text-center">
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
                    <Button ref={nextButtonRef} onClick={handleNextQuestion} className="mt-4" disabled={isNextDisabled}>Siguiente &rarr;</Button>
                </div>
            )}
        </div>
    );
};