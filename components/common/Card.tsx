import React from 'react';

interface CardProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, onClick, className = '' }) => {
    const cursorClass = onClick ? 'cursor-pointer' : '';
    const hoverClass = onClick ? 'hover:transform hover:-translate-y-1 hover:shadow-xl' : '';

    return (
        <div 
            className={`bg-slate-50 p-4 rounded-xl shadow-lg transition-all duration-200 ease-in-out border-2 border-slate-200 relative ${cursorClass} ${hoverClass} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
