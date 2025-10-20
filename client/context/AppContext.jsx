"use client";
import { createContext, useMemo, useState } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, setState] = useState({});

  const value = useMemo(() => ({ state, setState }), [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};


