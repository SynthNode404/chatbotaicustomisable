import { PrimaryColor, FontFamilyOption } from './types';

export const DEFAULT_SYSTEM_INSTRUCTION = "You are a helpful and friendly AI assistant. Keep your responses concise and informative.";

// AI Model Parameters Defaults and Ranges
export const DEFAULT_TEMPERATURE = 0.7;
export const MIN_TEMPERATURE = 0.0;
export const MAX_TEMPERATURE = 1.0; // Gemini API supports up to 2.0 for some models, but 1.0 is a common practical upper bound.
export const TEMPERATURE_STEP = 0.1;

export const DEFAULT_TOP_K = 40;
export const MIN_TOP_K = 1;
export const MAX_TOP_K = 100; // Arbitrary practical limit for UI
export const TOP_K_STEP = 1;

export const DEFAULT_TOP_P = 0.95;
export const MIN_TOP_P = 0.0;
export const MAX_TOP_P = 1.0;
export const TOP_P_STEP = 0.01;


export const AVAILABLE_PRIMARY_COLORS: PrimaryColor[] = [
  {
    name: "Sky Blue",
    value: "sky",
    palette: {
      light: { primary: '#0ea5e9', secondary: '#38bdf8', accent: '#7dd3fc', neutral: '#e0e0e0', base100: '#ffffff', baseContent: '#1f2937' },
      dark: { primary: '#38bdf8', secondary: '#0ea5e9', accent: '#0284c7', neutral: '#4b5563', base100: '#1f2937', baseContent: '#f3f4f6' }
    }
  },
  {
    name: "Emerald Green",
    value: "emerald",
    palette: {
      light: { primary: '#10b981', secondary: '#34d399', accent: '#6ee7b7', neutral: '#e0e0e0', base100: '#ffffff', baseContent: '#1f2937' },
      dark: { primary: '#34d399', secondary: '#10b981', accent: '#059669', neutral: '#4b5563', base100: '#1f2937', baseContent: '#f3f4f6' }
    }
  },
  {
    name: "Indigo Purple",
    value: "indigo",
    palette: {
      light: { primary: '#6366f1', secondary: '#818cf8', accent: '#a5b4fc', neutral: '#e0e0e0', base100: '#ffffff', baseContent: '#1f2937' },
      dark: { primary: '#818cf8', secondary: '#6366f1', accent: '#4f46e5', neutral: '#4b5563', base100: '#1f2937', baseContent: '#f3f4f6' }
    }
  },
  {
    name: "Rose Pink",
    value: "rose",
    palette: {
      light: { primary: '#f43f5e', secondary: '#fb7185', accent: '#fda4af', neutral: '#e0e0e0', base100: '#ffffff', baseContent: '#1f2937' },
      dark: { primary: '#fb7185', secondary: '#f43f5e', accent: '#e11d48', neutral: '#4b5563', base100: '#1f2937', baseContent: '#f3f4f6' }
    }
  }
];

export const AVAILABLE_FONTS: FontFamilyOption[] = [
  { name: "Sans Serif (Inter)", value: "sans" },
  { name: "Serif (Georgia)", value: "serif" },
  { name: "Monospace (Menlo)", value: "mono" },
];

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';