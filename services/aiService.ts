import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from "@google/genai";
import type { Question } from "../types";

// Para una futura integración con una IA de Gemini auto-hospedada,
// se modificaría la inicialización del cliente o se usaría un endpoint de fetch aquí.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstructionQuiz = "Eres 'Maestro Digital', un tutor amigable y paciente para un niño de primaria (entre 6 y 10 años). Tus respuestas deben ser simples, alentadoras y fáciles de entender. Usa un lenguaje muy sencillo y positivo. No uses palabras complicadas. Habla siempre en español. Evita caracteres especiales o formato que pueda confundir a un lector de texto a voz.";
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

export async function generateExplanation(question: Question, incorrectAnswer: string): Promise<string> {
    if (!isApiAvailable) {
        return question.explanation || `La respuesta correcta es "${question.answer}". ¡Sigue practicando y lo conseguirás!`;
    }
    
    const prompt = `La pregunta era: "${question.question}". El niño respondió "${incorrectAnswer}", pero la respuesta correcta es "${question.answer}". Explícale de forma muy sencilla y alentadora por qué la respuesta correcta es "${question.answer}". Dale un ejemplo si es útil. No empieces con "La respuesta correcta es..." sino explícaselo directamente.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstructionQuiz,
                temperature: 0.7,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating explanation:", error);
        return question.explanation || "¡Inténtalo de nuevo! La práctica hace al maestro.";
    }
}

export async function generateHint(question: Question): Promise<string> {
    if (!isApiAvailable) {
        return question.hint || "Piensa con cuidado, ¡tú puedes!";
    }

    const prompt = `La pregunta es: "${question.question}". Dame una pista muy corta y sencilla para un niño. La pista no debe dar la respuesta, solo una pequeña ayuda para pensar.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstructionQuiz,
                temperature: 0.8,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating hint:", error);
        return question.hint || "Piensa con cuidado, ¡tú puedes!";
    }
}


export function connectToLive(
    onMessage: (message: LiveServerMessage) => void,
    onError: (error: ErrorEvent) => void,
    onClose: (close: CloseEvent) => void
): Promise<LiveSession> {
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
