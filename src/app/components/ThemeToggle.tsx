'use client';

import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('theme') as Theme | null;
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  // Lazy initializer reads the stored/system theme once, so we don't setState
  // inside an effect just to seed initial state.
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Only sync the resolved theme to the DOM; no state updates here.
  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Avoid hydration mismatch: the server can't know the client theme.
  if (!mounted) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={toggleTheme}
        className="btn btn-circle btn-ghost"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <SunIcon className="w-6 h-6" />
        ) : (
          <MoonIcon className="w-6 h-6" />
        )}
      </button>
    </div>
  );
} 