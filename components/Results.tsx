import React, { useEffect, useRef } from 'react';
import { Button } from './common/Button';
import { useSpeech } from '../context/SpeechContext';

interface ResultsProps {
    score: number;
    total: number;
    onBack: () => void;
}

const MIN_SCORE_TO_PASS = 0.8;

const ConfettiCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let W = window.innerWidth;
        let H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;
        
        let animationFrameId: number;
        let p: any[] = [];
        const count = 200;
        const colors = ['#f1c40f','#e67e22','#e74c3c','#9b59b6','#3498db','#1abc9c','#2ecc71'];
        
        for (let i=0; i<count; i++) {
            p.push({ x:Math.random()*W, y:Math.random()*H-H, s:Math.random()*5+3, d:Math.random()*5+2, a:Math.random()*360, c:colors[Math.floor(Math.random()*colors.length)], t:Math.random()*10-5 });
        }
        
        const draw = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            p.forEach((c, i) => {
                c.y += c.d; c.x += Math.sin(c.a*Math.PI/180); c.a += c.t;
                ctx.fillStyle=c.c; ctx.fillRect(c.x, c.y, c.s, c.s*2);
                if (c.y > canvas.height) p.splice(i,1);
            });
            if (p.length > 0) {
                animationFrameId = requestAnimationFrame(draw);
            }
        };

        draw();

        const handleResize = () => {
            W = window.innerWidth;
            H = window.innerHeight;
            if(canvas) {
              canvas.width = W;
              canvas.height = H;
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }} />;
};


export const Results: React.FC<ResultsProps> = ({ score, total, onBack }) => {
    const isPerfectScore = score === total && total > 0;
    const passed = total > 0 && score / total >= MIN_SCORE_TO_PASS;
    const { speak } = useSpeech();

    const title = isPerfectScore ? "¡Puntuación Perfecta!" : "¡Aventura Completada!";

    useEffect(() => {
        const resultText = `${title}. Tu resultado final es ${score} de ${total}.`;
        speak(resultText);
    }, [score, total, title, speak]);
    
    return (
        <div className="animate-fade-in text-center">
            {isPerfectScore && <ConfettiCanvas />}
            <h2 className="text-5xl font-black text-slate-800 mb-4">{title}</h2>
            <p className="text-xl mb-4">Tu resultado final es:</p>
            <div className={`text-7xl font-black my-6 ${passed ? 'text-green-500' : 'text-red-500'}`}>
                {score} / {total}
            </div>
            <Button onClick={onBack}>Volver al Panel</Button>
        </div>
    );
};
