import { createContext, useContext, useState, useEffect } from 'react';

export type ColorTheme = 'dark' | 'light';

interface ThemeCtx {
  theme: ColorTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ theme: 'dark', toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ColorTheme>(() =>
    (localStorage.getItem('rp-color-theme') as ColorTheme) ?? 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rp-color-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Chart-specific colours that must be passed as JS values (SVG attrs / Recharts props). */
export function getChartColors(theme: ColorTheme) {
  if (theme === 'light') {
    return {
      grid: 'rgba(0,0,0,0.07)',
      cursor: 'rgba(0,0,0,0.08)',
      tick: '#8a8f98',
      tooltipBg: '#ffffff',
      tooltipBorder: 'rgba(0,0,0,0.1)',
      tooltipText: '#374151',
      legendText: '#5a6272',
    };
  }
  return {
    grid: 'rgba(255,255,255,0.04)',
    cursor: 'rgba(255,255,255,0.1)',
    tick: '#62666d',
    tooltipBg: '#191a1b',
    tooltipBorder: 'rgba(255,255,255,0.1)',
    tooltipText: '#d0d6e0',
    legendText: '#8a8f98',
  };
}
