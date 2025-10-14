
import { useState, useEffect, useCallback } from 'react';
import type { GameState, CategoryId } from '../types';
import { questions } from '../data/questions';

const MIN_SCORE_TO_UNLOCK = 0.8;
const GAME_STATE_KEY = 'maestroDigitalProgress';

const initialGameState = (): GameState => {
    const state: GameState = {};
    (Object.keys(questions) as CategoryId[]).forEach(category => {
        state[category] = { unlockedLevel: 1, highScores: {} };
    });
    return state;
};

export const useGameState = () => {
    const [gameState, setGameState] = useState<GameState>(() => {
        try {
            const savedState = localStorage.getItem(GAME_STATE_KEY);
            return savedState ? JSON.parse(savedState) : initialGameState();
        } catch (error) {
            console.error("Could not load game state", error);
            return initialGameState();
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
        } catch (error) {
            console.error("Could not save game state", error);
        }
    }, [gameState]);

    const updateHighScore = useCallback((categoryId: CategoryId, level: number, score: number) => {
        setGameState(prev => {
            const newGameState = { ...prev };
            const currentHighScore = newGameState[categoryId].highScores[level] || 0;
            if (score > currentHighScore) {
                newGameState[categoryId].highScores[level] = score;
            }
            return newGameState;
        });
    }, []);

    const unlockNextLevel = useCallback((categoryId: CategoryId, level: number, score: number, total: number) => {
        setGameState(prev => {
            const newGameState = { ...prev };
            if (score / total >= MIN_SCORE_TO_UNLOCK && level < 3 && level === newGameState[categoryId].unlockedLevel) {
                newGameState[categoryId].unlockedLevel++;
            }
            return newGameState;
        });
    }, []);
    
    return { gameState, updateHighScore, unlockNextLevel };
};
