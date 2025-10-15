import React from 'react';

// The data prop will now include the level
interface SkillChartProps {
    data: { score: number; timestamp: number; level: number }[];
}

const levelDetails: Record<number, { color: string; name: string; }> = {
    1: { color: '#2ecc71', name: 'Fácil' },     // Green
    2: { color: '#3498db', name: 'Medio' },     // Blue
    3: { color: '#9b59b6', name: 'Difícil' }  // Purple
};

export const SkillChart: React.FC<SkillChartProps> = ({ data }) => {
    if (!data || data.length < 2) {
        return <p className="text-slate-500 text-center py-8">Necesitas al menos dos intentos para ver tu progreso.</p>;
    }

    const width = 400;
    const height = 200;
    const padding = 30;

    const maxScore = Math.max(...data.map(d => d.score), 0) * 1.1; // 10% buffer
    const minScore = 0;

    const getX = (index: number) => {
        return padding + (index / (data.length - 1)) * (width - padding * 2);
    };

    const getY = (score: number) => {
        if (maxScore === minScore) return height - padding;
        return height - padding - ((score - minScore) / (maxScore - minScore)) * (height - padding * 2);
    };
    
    const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.score)}`).join(' ');

    return (
        <div> {/* Wrapper to contain SVG and Legend */}
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Y Axis */}
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#d1d5db" strokeWidth="1" />
                <text x={padding - 10} y={padding} textAnchor="end" fontSize="10" fill="#6b7280">{Math.round(maxScore)}</text>
                <text x={padding - 10} y={height - padding} textAnchor="end" fontSize="10" fill="#6b7280">{minScore}</text>

                {/* X Axis */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#d1d5db" strokeWidth="1" />
                <text x={padding} y={height - padding + 15} textAnchor="middle" fontSize="10" fill="#6b7280">Inicio</text>
                <text x={width-padding} y={height - padding + 15} textAnchor="middle" fontSize="10" fill="#6b7280">Ahora</text>

                {/* Data line */}
                <path d={linePath} fill="none" stroke="#a5b4fc" strokeWidth="2" />

                {/* Data points with color coding */}
                {data.map((d, i) => (
                    <circle
                        key={i}
                        cx={getX(i)}
                        cy={getY(d.score)}
                        r="4"
                        fill={levelDetails[d.level as keyof typeof levelDetails]?.color || '#6b7280'}
                    >
                      <title>Puntuación: {Math.round(d.score)} (Nivel: {levelDetails[d.level as keyof typeof levelDetails]?.name || d.level})</title>
                    </circle>
                ))}
            </svg>
            {/* Legend */}
            <div className="flex justify-center items-center gap-4 mt-4 text-xs">
                {Object.entries(levelDetails).map(([level, { color, name }]) => (
                    <div key={level} className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                        <span className="font-semibold text-slate-600">{name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};