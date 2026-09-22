import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'compact' | 'pill' | 'segmented';
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'compact',
  className = '',
  showLabel = false,
}) => {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();

  if (variant === 'segmented') {
    return (
      <div
        className={`flex items-center rounded-lg border border-[#1F1F23] bg-[#141416] p-0.5 font-mono text-xs ${className}`}
      >
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 transition-all ${
            isDark
              ? 'bg-blue-600/25 border border-blue-500/40 text-blue-300 font-bold shadow-sm'
              : 'text-[#8E9299] hover:text-white'
          }`}
          aria-label="Switch to Dark Theme"
          title="Dark Theme"
        >
          <Moon className="h-3.5 w-3.5" />
          <span>Dark</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 transition-all ${
            !isDark
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-500 font-bold shadow-sm'
              : 'text-[#8E9299] hover:text-white'
          }`}
          aria-label="Switch to Light Theme"
          title="Light Theme"
        >
          <Sun className="h-3.5 w-3.5" />
          <span>Light</span>
        </button>
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center space-x-2 rounded-lg border border-[#1F1F23] bg-[#141416] px-3 py-1.5 text-xs font-mono transition-all hover:border-[#3F3F46] hover:bg-[#1E222E] ${className}`}
        aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
        title={`Current: ${isDark ? 'Dark Mode' : 'Light Mode'} (Click to toggle)`}
      >
        <div className="relative flex items-center justify-center">
          {isDark ? (
            <Moon className="h-4 w-4 text-blue-400 transition-transform duration-200 rotate-0" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500 transition-transform duration-200 rotate-90" />
          )}
        </div>
        <span className="font-semibold text-zinc-200">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      </button>
    );
  }

  // Compact variant (standard in header bars and dock)
  return (
    <button
      id="theme-mode-toggle-btn"
      type="button"
      onClick={toggleTheme}
      className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-[#1F1F23] bg-[#141416] text-[#8E9299] transition-all hover:border-blue-500/40 hover:bg-[#1A1D26] hover:text-white shadow-sm group ${className}`}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
      title={`Switch to ${isDark ? 'Light Mode' : 'Dark Mode'}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400/90 group-hover:text-amber-300 group-hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon className="h-4 w-4 text-blue-500 group-hover:text-blue-400 group-hover:-rotate-12 transition-transform duration-300" />
      )}
      {showLabel && (
        <span className="sr-only">
          {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </span>
      )}
    </button>
  );
};
