"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type Theme = "current" | "light" | "deepDark";
interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme?: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("current");

  useEffect(() => {
    const storedTheme = localStorage.getItem("nova-ai-theme") as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.setAttribute("data-theme", storedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "current");
    }
  }, []);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("nova-ai-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const toggleTheme = () => {
    const themes: Theme[] = ["current", "light", "deepDark"];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    handleSetTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme: handleSetTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
