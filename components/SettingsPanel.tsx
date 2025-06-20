import React from 'react';
import { AppSettings, Theme, PrimaryColor, FontFamilyOption } from '../types';
import { 
  AVAILABLE_PRIMARY_COLORS, 
  AVAILABLE_FONTS,
  MIN_TEMPERATURE, MAX_TEMPERATURE, TEMPERATURE_STEP,
  MIN_TOP_K, MAX_TOP_K, TOP_K_STEP,
  MIN_TOP_P, MAX_TOP_P, TOP_P_STEP
} from '../constants';
import Tooltip from './Tooltip'; // Import the new Tooltip component

interface SliderInputProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  tooltipText?: string;
}

const SliderInput: React.FC<SliderInputProps> = ({ id, label, value, min, max, step, onChange, unit = '', tooltipText }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <label htmlFor={id} className="block text-sm font-medium text-base-content">
        {label}{' '}
        {tooltipText && (
          <Tooltip text={tooltipText} delay={300} position="top">
            <span 
              className="cursor-help text-accent inline-block align-middle" 
              tabIndex={0} 
              role="button" 
              aria-label="More information" 
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();}}
            >
              ⓘ
            </span>
          </Tooltip>
        )}
      </label>
      <span className="text-sm text-primary">{value.toFixed(id === 'temperature' || id === 'topP' ? 2 : 0)}{unit}</span>
    </div>
    <input
      type="range"
      id={id}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-neutral rounded-lg appearance-none cursor-pointer accent-primary"
    />
  </div>
);

interface SettingsPanelProps {
  settings: AppSettings;
  onSettingsChange: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onResetSettings: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange, onResetSettings }) => {
  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingsChange('theme', event.target.value as Theme);
  };

  const handlePrimaryColorChange = (color: PrimaryColor) => {
    onSettingsChange('primaryColor', color);
  };

  const handleFontFamilyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingsChange('fontFamily', event.target.value);
  };

  const confirmAndReset = () => {
    if (window.confirm("Are you sure you want to reset all settings to their defaults?")) {
      onResetSettings();
    }
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col bg-base-100 text-base-content">
      <h2 className="text-2xl font-semibold text-primary border-b border-neutral pb-3">Customize Chatbot</h2>
      
      <div className="flex-grow overflow-y-auto space-y-6 pr-2"> {/* Added pr-2 to prevent scrollbar overlap with content */}
        <div>
          <label htmlFor="systemInstruction" className="block text-sm font-medium text-base-content mb-1">
            System Instructions
          </label>
          <textarea
            id="systemInstruction"
            rows={5}
            className="w-full p-3 border border-neutral rounded-lg shadow-sm focus:ring-primary focus:border-primary bg-base-100 text-base-content placeholder-neutral-focus"
            placeholder="e.g., You are a Shakespearean pirate poet..."
            value={settings.systemInstruction}
            onChange={(e) => onSettingsChange('systemInstruction', e.target.value)}
          />
          <p className="mt-1 text-xs text-neutral-focus">Define the chatbot's personality and core behavior.</p>
        </div>

        <div className="border-t border-neutral pt-4 space-y-4">
          <h3 className="text-lg font-medium text-primary mb-2">Generation Parameters</h3>
          <SliderInput
            id="temperature"
            label="Temperature"
            value={settings.temperature}
            min={MIN_TEMPERATURE}
            max={MAX_TEMPERATURE}
            step={TEMPERATURE_STEP}
            onChange={(v) => onSettingsChange('temperature', v)}
            tooltipText="Controls randomness. Lower values are more deterministic, higher values more creative."
          />
          <SliderInput
            id="topK"
            label="Top-K"
            value={settings.topK}
            min={MIN_TOP_K}
            max={MAX_TOP_K}
            step={TOP_K_STEP}
            onChange={(v) => onSettingsChange('topK', v)}
            tooltipText="Model considers the K most likely tokens. Reduces risk of unusual tokens."
          />
           <SliderInput
            id="topP"
            label="Top-P (Nucleus)"
            value={settings.topP}
            min={MIN_TOP_P}
            max={MAX_TOP_P}
            step={TOP_P_STEP}
            onChange={(v) => onSettingsChange('topP', v)}
            tooltipText="Model considers tokens whose cumulative probability exceeds P. Alternative to Top-K sampling."
          />
        </div>
        
        <div className="border-t border-neutral pt-4 space-y-4">
          <h3 className="text-lg font-medium text-primary mb-2">Appearance</h3>
          <div>
            <label htmlFor="theme" className="block text-sm font-medium text-base-content mb-1">
              Theme
            </label>
            <select
              id="theme"
              className="w-full p-3 border border-neutral rounded-lg shadow-sm focus:ring-primary focus:border-primary bg-base-100 text-base-content"
              value={settings.theme}
              onChange={handleThemeChange}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div>
            <span className="block text-sm font-medium text-base-content mb-2">Primary Color</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AVAILABLE_PRIMARY_COLORS.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  title={`Set primary color to ${color.name}`}
                  aria-label={`Set primary color to ${color.name}`}
                  onClick={() => handlePrimaryColorChange(color)}
                  className={`p-2 rounded-lg border-2 h-10
                    ${settings.primaryColor.name === color.name ? `border-accent ring-2 ring-accent` : 'border-neutral hover:border-gray-400'} 
                    transition-all duration-150 ease-in-out`}
                  style={{ backgroundColor: color.palette[settings.theme].primary }}
                >
                  <span className="sr-only">{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="fontFamily" className="block text-sm font-medium text-base-content mb-1">
              Font Family
            </label>
            <select
              id="fontFamily"
              className="w-full p-3 border border-neutral rounded-lg shadow-sm focus:ring-primary focus:border-primary bg-base-100 text-base-content"
              value={settings.fontFamily}
              onChange={handleFontFamilyChange}
            >
              {AVAILABLE_FONTS.map((font: FontFamilyOption) => (
                <option key={font.value} value={font.value}>{font.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-neutral pt-6">
          <button
            type="button"
            onClick={confirmAndReset}
            className="w-full p-3 border border-neutral text-base-content rounded-lg shadow-sm hover:bg-neutral/20 focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-150"
            aria-label="Reset all settings to their default values"
          >
            Reset to Defaults
          </button>
        </div>

      </div>
      <div className="text-xs text-neutral-focus text-center pt-4 border-t border-neutral mt-auto">
          Powered by Gemini
      </div>
    </div>
  );
};