import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'special' | 'warning';
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseClasses = 'px-6 py-3 text-lg font-bold text-white rounded-xl shadow-md transition-all duration-200 ease-in-out transform hover:-translate-y-1 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';
    
    const variantClasses = {
        primary: 'bg-blue-500 hover:bg-blue-600 border-b-4 border-blue-700 active:border-b-2',
        secondary: 'bg-purple-500 hover:bg-purple-600 border-b-4 border-purple-700 active:border-b-2',
        special: 'bg-green-500 hover:bg-green-600 border-b-4 border-green-700 active:border-b-2',
        warning: 'bg-yellow-500 hover:bg-yellow-600 border-b-4 border-yellow-700 active:border-b-2',
    };
    
    return (
        <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};
