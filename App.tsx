
import React, { useState, useEffect, useCallback } from 'react';
import { SettingsPanel } from './components/SettingsPanel';
import { ChatInterface } from './components/ChatInterface';
import { Theme, PrimaryColor, AppSettings }
from './types';
import { 
  DEFAULT_SYSTEM_INSTRUCTION, 
  AVAILABLE_PRIMARY_COLORS, 
  AVAILABLE_FONTS,
  DEFAULT_TEMPERATURE,
  DEFAULT_TOP_K,
  DEFAULT_TOP_P
} from './constants';

// This is the source of truth for default values.
const getInitialSettings = (): AppSettings => {
    const defaultColor = AVAILABLE_PRIMARY_COLORS[0];
    const defaultFont = AVAILABLE_FONTS[0];

    let safePrimaryColor: PrimaryColor;
    if (defaultColor) {
        safePrimaryColor = { ...defaultColor }; // Create a shallow copy
    } else {
        console.error("CRITICAL: AVAILABLE_PRIMARY_COLORS[0] is undefined. Using hardcoded fallback for primaryColor.");
        safePrimaryColor = { 
            name: "Default Fallback Blue", 
            value: "default-fallback-blue", 
            palette: { 
                light: { primary: '#0ea5e9', secondary: '#38bdf8', accent: '#7dd3fc', neutral: '#e0e0e0', base100: '#ffffff', baseContent: '#1f2937' }, 
                dark: { primary: '#38bdf8', secondary: '#0ea5e9', accent: '#0284c7', neutral: '#4b5563', base100: '#1f2937', baseContent: '#f3f4f6' }
            }
        };
    }

    let safeFontFamily: string;
    if (defaultFont) {
        safeFontFamily = defaultFont.value;
    } else {
        console.error("CRITICAL: AVAILABLE_FONTS[0] is undefined. Using hardcoded fallback for fontFamily.");
        safeFontFamily = "sans";
    }

    return {
        systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
        primaryColor: safePrimaryColor,
        fontFamily: safeFontFamily,
        theme: 'light' as Theme,
        temperature: DEFAULT_TEMPERATURE,
        topK: DEFAULT_TOP_K,
        topP: DEFAULT_TOP_P,
    };
};


const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    console.log("Initializing AppSettings.");
    return getInitialSettings();
  });
  const [isPanelVisible, setIsPanelVisible] = useState(true);

  useEffect(() => {
    console.log("Applying visual settings. Current settings:", settings);
    if (!settings.primaryColor || !settings.primaryColor.palette || !settings.primaryColor.palette[settings.theme]) {
        console.error("Error in visual useEffect: settings.primaryColor or its nested properties are invalid.", settings.primaryColor);
        document.documentElement.classList.remove('dark');
        document.body.style.fontFamily = 'sans-serif'; // Basic fallback
        return;
    }

    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    
    let effectiveFontFamily = 'sans-serif'; // Fallback
    const selectedFont = AVAILABLE_FONTS.find(f => f.value === settings.fontFamily);
    if (selectedFont) {
        if (settings.fontFamily === 'sans') {
            effectiveFontFamily = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif';
        } else if (settings.fontFamily === 'serif') {
            effectiveFontFamily = 'Georgia, ui-serif, Cambria, "Times New Roman", Times, serif';
        } else if (settings.fontFamily === 'mono') {
            effectiveFontFamily = 'Menlo, ui-monospace, SFMono-Regular, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
        }
    } else {
        console.warn(`Font family value "${settings.fontFamily}" not found in AVAILABLE_FONTS. Defaulting to sans-serif.`);
    }
    document.body.style.fontFamily = effectiveFontFamily;
    
    const root = document.documentElement;
    const selectedColorPalette = settings.primaryColor.palette[settings.theme];
    root.style.setProperty('--color-primary', selectedColorPalette.primary);
    root.style.setProperty('--color-secondary', selectedColorPalette.secondary);
    root.style.setProperty('--color-accent', selectedColorPalette.accent);
    root.style.setProperty('--color-neutral', selectedColorPalette.neutral);
    root.style.setProperty('--color-base-100', selectedColorPalette.base100);
    root.style.setProperty('--color-base-content', selectedColorPalette.baseContent);
    
    const neutralFocus = settings.theme === 'dark' ? '#71717a' : '#a1a1aa'; 
    root.style.setProperty('--color-neutral-focus', neutralFocus);

  }, [settings.theme, settings.primaryColor, settings.fontFamily]); 
  // settings.primaryColor is an object; this dependency works if its reference changes.

  const handleSettingsChange = useCallback(<K extends keyof AppSettings,>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleResetSettings = useCallback(() => {
    console.log("Resetting settings to defaults.");
    // Create a new object for the state to ensure re-render and useEffect re-evaluation
    // This will pull fresh values and importantly, create a new object for primaryColor.
    setSettings(getInitialSettings());
  }, []);

  const togglePanel = () => setIsPanelVisible(!isPanelVisible);

  // Fallback for primaryColorName if settings.primaryColor is somehow temporarily inconsistent
  const primaryColorNameForChat = settings.primaryColor ? settings.primaryColor.name : (AVAILABLE_PRIMARY_COLORS[0] ? AVAILABLE_PRIMARY_COLORS[0].name : "Default");


  return (
    <div className={`flex h-screen overflow-hidden bg-base-100 text-base-content transition-colors duration-300`}>
      <button 
        onClick={togglePanel} 
        className="fixed top-4 left-4 z-20 p-2 bg-primary text-white rounded-md md:hidden hover:bg-opacity-80 transition-all"
        aria-label={isPanelVisible ? "Hide Settings" : "Show Settings"}
        aria-expanded={isPanelVisible}
      >
        {isPanelVisible ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>

      <div 
        id="settings-panel-container"
        className={`
          fixed inset-y-0 left-0 z-10 
          md:static md:translate-x-0
          transform ${isPanelVisible ? 'translate-x-0' : '-translate-x-full'} 
          transition-transform duration-300 ease-in-out 
          w-80 md:w-96 bg-base-100 border-r border-neutral overflow-y-auto shadow-lg md:shadow-none
        `}
        aria-hidden={!isPanelVisible && typeof window !== 'undefined' && window.innerWidth < 768} 
      >
        <SettingsPanel 
            settings={settings} 
            onSettingsChange={handleSettingsChange} 
            onResetSettings={handleResetSettings} 
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatInterface 
          systemInstruction={settings.systemInstruction}
          temperature={settings.temperature}
          topK={settings.topK}
          topP={settings.topP}
          primaryColorName={primaryColorNameForChat} 
          currentTheme={settings.theme}
        />
      </div>
    </div>
  );
};

export default App;
