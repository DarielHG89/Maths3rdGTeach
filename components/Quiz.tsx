import React, { useState, useEffect, useRef } from 'react';
import type { QuizConfig } from '../types';
import { generateExplanation, generateHint } from '../services/aiService';
import { Button } from './common/Button';
import { useSpeech } from '../context/SpeechContext';

interface QuizProps {
    quizConfig: QuizConfig;
    onQuizEnd: (score: number, total: number) => void;
}

export const Quiz: React.FC<QuizProps> = ({ quizConfig, onQuizEnd }) => {
    const [questionIndex, setQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<{ text: string; correct: boolean; explanation?: string } | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const { speak } = useSpeech();

    const currentQuestion = quizConfig.questions[questionIndex];
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsAnswered(false);
        setFeedback(null);
        setUserAnswer('');
        inputRef.current?.focus();

        speak(currentQuestion.question);
        if (currentQuestion.type === 'mcq' && currentQuestion.options) {
            const optionsText = `Opciones: ${currentQuestion.options.join(', ')}`;
            // Use timeout to let the question be read first
            setTimeout(() => speak(optionsText), 1500);
        }

    }, [questionIndex, currentQuestion, speak]);
    
    const handleHint = async () => {
        setIsLoadingAI(true);
        const hintText = await generateHint(currentQuestion);
        speak(`Pista: ${hintText}`);
        alert(`Pista: ${hintText}`);
        setIsLoadingAI(false);
    }

    const checkAnswer = async (answer: string) => {
        if (isAnswered) return;

        setIsAnswered(true);
        const isCorrect = answer.trim().toLowerCase() === currentQuestion.answer.toString().toLowerCase();
        
        if (isCorrect) {
            const feedbackText = "¡Excelente!";
            setScore(prev => prev + 1);
            setFeedback({ text: feedbackText, correct: true });
            speak(feedbackText);
        } else {
            const feedbackText = "¡Casi! Sigue intentando";
            setIsLoadingAI(true);
            const explanation = await generateExplanation(currentQuestion, answer);
            setIsLoadingAI(false);
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
                <h2 className="text-lg sm:text-2xl font-bold text-slate-800 text-left">{quizConfig.name}</h2>
                <div className="text-lg font-bold bg-yellow-400 text-white px-4 py-2 rounded-full shadow-md">Puntuación: {score}</div>
            </header>
            
            <div className="w-full bg-slate-200 rounded-full h-4 mb-4">
                <div className="bg-green-500 h-4 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl min-h-[150px] flex flex-col justify-center items-center text-xl sm:text-2xl font-bold mb-6 shadow-inner">
                <p>{currentQuestion.question}</p>
                <Button onClick={handleHint} disabled={isLoadingAI || isAnswered} variant="warning" className="mt-4 text-sm px-4 py-2">
                    {isLoadingAI ? "Pensando..." : "💡 Pista"}
                </Button>
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
                            className="flex-grow max-w-sm p-4 text-xl border-2 border-slate-300 rounded-lg text-center"
                            placeholder="Tu respuesta"
                        />
                        <Button type="submit" disabled={isAnswered} variant="special">OK</Button>
                    </form>
                )}
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
