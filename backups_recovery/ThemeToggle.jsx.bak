import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      id="theme-toggle-btn"
      aria-label="Toggle color theme"
      className="p-2.5 rounded-xl border border-plum-700/20 dark:border-coral-300/20 bg-cream-100 dark:bg-plum-900/60 text-plum-800 dark:text-cream-200 hover:bg-cream-200 dark:hover:bg-plum-800 transition-colors duration-150 flex items-center justify-center shadow-xs"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-cream-200" />
      ) : (
        <Moon className="w-4 h-4 text-plum-800" />
      )}
    </button>
  );
}
