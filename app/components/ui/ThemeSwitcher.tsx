"use client";

import { useTheme } from '@/app/context/ThemeContext';
import { Sun, Moon, MonitorDot } from 'lucide-react'; 

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center space-x-1 p-1 rounded-full bg-[var(--background-accent)] border border-[var(--border-primary)]">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-full hover:bg-[var(--border-accent)]/20 theme-transition ${
          theme === 'light' ? 'bg-[var(--border-accent)] text-[var(--background-primary)]' : 'text-[var(--text-muted)]'
        }`}
        aria-label="Switch to light theme"
      >
        <Sun size={18} />
      </button>
      <button
        onClick={() => setTheme('current')}
        className={`p-2 rounded-full hover:bg-[var(--border-accent)]/20 theme-transition ${
          theme === 'current' ? 'bg-[var(--border-accent)] text-[var(--background-primary)]' : 'text-[var(--text-muted)]'
        }`}
        aria-label="Switch to current theme"
      >
        <MonitorDot size={18} /> {}
      </button>
      <button
        onClick={() => setTheme('deepDark')}
        className={`p-2 rounded-full hover:bg-[var(--border-accent)]/20 theme-transition ${
          theme === 'deepDark' ? 'bg-[var(--border-accent)] text-[var(--background-primary)]' : 'text-[var(--text-muted)]'
        }`}
        aria-label="Switch to deep dark theme"
      >
        <Moon size={18} />
      </button>
    </div>
  );
}