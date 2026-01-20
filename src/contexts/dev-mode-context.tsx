"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface DevModeContextType {
  isDevMode: boolean;
  setIsDevMode: (enabled: boolean) => void;
}

const DevModeContext = createContext<DevModeContextType | undefined>(undefined);

export function DevModeProvider({ children }: { children: ReactNode }) {
  const [isDevMode, setIsDevModeState] = useState(false);

  useEffect(() => {
    // Carregar do localStorage ao montar
    const saved = localStorage.getItem("devMode");
    if (saved !== null) {
      setIsDevModeState(saved === "true");
    }
  }, []);

  const setIsDevMode = (enabled: boolean) => {
    setIsDevModeState(enabled);
    localStorage.setItem("devMode", String(enabled));
  };

  return (
    <DevModeContext.Provider value={{ isDevMode, setIsDevMode }}>
      {children}
    </DevModeContext.Provider>
  );
}

export function useDevMode() {
  const context = useContext(DevModeContext);
  if (context === undefined) {
    throw new Error("useDevMode must be used within a DevModeProvider");
  }
  return context;
}
