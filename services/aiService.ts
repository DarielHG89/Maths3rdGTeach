import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import type { Question, StudentProfile } from "../types";

// Para una futura integración con una IA de Gemini auto-hospedada,
// se modificaría la inicialización del cliente o se usaría un endpoint de fetch aquí.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstructionQuiz = (profile: StudentProfile) => {
    const genderTerm = profile.gender === 'boy' ? 'un niño' : 'una niña';
    return `Eres 'Maestro Digital', un tutor IA súper divertido, amigable y paciente para ${genderTerm} de ${profile.age} años. Tus respuestas deben ser simples, alentadoras y fáciles de entender. Usa un lenguaje muy sencillo, positivo y creativo, con analogías y ejemplos divertidos. Usa muchos emoticonos relevantes como ✨, 🚀, 🧠, 👍, 💡. Habla siempre en español. Evita caracteres especiales o formato que pueda confundir a un lector de texto a voz.`;
};

const systemInstructionLive = "Eres 'Maestro Digital', un tutor de IA amigable, paciente y divertido para un niño de primaria. Tu objetivo es tener una conversación educativa y atractiva. Responde a sus preguntas, explícale cosas de forma sencilla y mantén la conversación. Usa un lenguaje sencillo y positivo. Habla siempre en español.";

let isApiAvailable = false;

export async function checkGeminiConnection(): Promise<boolean> {
    try {
        // Hacemos una llamada muy ligera para ver si el servicio responde.
        await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "hola",
            config: { thinkingConfig: { thinkingBudget: 0 } }
        });
        isApiAvailable = true;
        console.log("Gemini API connection successful.");
    } catch (error) {
        isApiAvailable = false;
        console.warn("Gemini API connection failed. Falling back to offline mode.", error);
    }
    return isApiAvailable;
}

export async function generateExplanation(question: Question, incorrectAnswer: string, profile: StudentProfile): Promise<string> {
    if (!isApiAvailable) {
        throw new Error("AI service is not available.");
    }
    try {
        const prompt = `La pregunta era: "${question.question}". ${profile.gender === 'boy' ? 'El niño' : 'La niña'} respondió "${incorrectAnswer}", pero la respuesta correcta es "${question.answer}". ¡No pasa nada por equivocarse! Explícale de forma súper positiva, divertida y sencilla por qué la respuesta es "${question.answer}". Usa una analogía o un ejemplo genial para que lo entienda. Anímale a seguir intentándolo. Empieza con algo como "¡Casi! ¡Vamos a ver este pequeño truco! 🕵️‍♂️" o "¡Buena intentona! Así es como lo ven los detectives de las mates: 🧠".`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: getSystemInstructionQuiz(profile),
                temperature: 0.7,
            }
        });
        
        const explanation = response.text;
        if (typeof explanation === 'string' && explanation.trim().length > 0) {
            return explanation;
        } else {
            console.warn("Received empty or invalid explanation from AI.");
            throw new Error("Received empty or invalid explanation from AI.");
        }

    } catch (error) {
        console.error("Error generating AI explanation:", error);
        throw error;
    }
}

export async function generateHint(question: Question, profile: StudentProfile): Promise<string> {
    if (!isApiAvailable) {
        throw new Error("AI service is not available.");
    }
    try {
        const prompt = `La pregunta es: "${question.question}". Dame una pista muy creativa y divertida para un ${profile.gender === 'boy' ? 'niño' : 'niña'} de ${profile.age} años. Usa una analogía o una pequeña historia para explicar el concepto. Por ejemplo, si es una multiplicación, podrías hablar de galaxias de galletas 🌌🍪. ¡Hazlo memorable y nada aburrido! Es crucial que, bajo NINGUNA circunstancia, reveles la respuesta final ("${question.answer}") ni números que lleven directamente a ella.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: getSystemInstructionQuiz(profile),
                temperature: 0.8,
            }
        });

        const hint = response.text;
        if (typeof hint === 'string' && hint.trim().length > 0) {
            return hint;
        } else {
            console.warn("Received empty or invalid hint from AI.");
            throw new Error("Received empty or invalid hint from AI.");
        }
    } catch (error) {
        console.error("Error generating AI hint:", error);
        throw error;
    }
}


export function connectToLive(
    onMessage: (message: LiveServerMessage) => void,
    onError: (error: ErrorEvent) => void,
    onClose: (close: CloseEvent) => void
) {
     if (!isApiAvailable) {
        return Promise.reject(new Error("Gemini API is not available."));
    }
    
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => console.log('Live session opened.'),
            onmessage: onMessage,
            onerror: onError,
            onclose: onClose,
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: systemInstructionLive,
        },
    });
}