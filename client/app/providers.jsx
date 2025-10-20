"use client";
import { useEffect } from "react";
import { ThemeProvider } from "../context/ThemeContext";
import useLenis from "../hooks/useLenis";
import { initAnalytics } from "../lib/analytics";

export default function Providers({ children }) {
  useLenis();
  useEffect(() => {
    try {
      initAnalytics();
    } catch (_) {}
  }, []);

  return <ThemeProvider>{children}</ThemeProvider>;
}



