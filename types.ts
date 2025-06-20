import { GoogleGenAI, Chat } from "@google/genai";

export type Theme = 'light' | 'dark';

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string; // Typically for borders, dividers
  base100: string; // Base background
  baseContent: string; // Base text content
}
export interface PrimaryColor {
  name: string; // e.g., "Blue"
  value: string; // e.g., "blue" (used for Tailwind class prefix if simple, or as key)
  palette: {
    light: ColorPalette;
    dark: ColorPalette;
  };
}

export interface FontFamilyOption {
  name: string; // e.g., "Sans Serif"
  value: string; // e.g., "sans" (Tailwind class: font-sans)
}

export interface AppSettings {
  systemInstruction: string;
  primaryColor: PrimaryColor;
  fontFamily: string;
  theme: Theme;
  temperature: number; // Range 0.0 - 1.0 (or higher, Gemini specific)
  topK: number;        // Integer
  topP: number;        // Range 0.0 - 1.0
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  meta?: {
    isLoading?: boolean;
    isError?: boolean;
    chunks?: string[]; // For streaming display or debugging
  }
}

// Props for components that interact with Gemini API directly
export interface GeminiChatProps {
  apiKey?: string; // Will be process.env.API_KEY
  systemInstruction: string;
  temperature: number;
  topK: number;
  topP: number;
  primaryColorName: string; // e.g. "blue", "green" - for styling, not API
  currentTheme: Theme;      // for styling, not API
}

// For Gemini Service (if we had one, otherwise directly in component)
export interface GeminiService {
  ai: GoogleGenAI | null;
  chat: Chat | null;
  initialize: (apiKey: string) => void;
  startChat: (
    systemInstruction: string, 
    config: { temperature: number; topK: number; topP: number }, 
    history?: Message[]
  ) => Promise<void>;
  sendMessage: (prompt: string) => Promise<string | null>; // For non-streaming
  sendMessageStream: (
    prompt: string, 
    onChunk: (chunk: string) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ) => Promise<void>;
}