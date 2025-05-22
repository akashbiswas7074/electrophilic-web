"use client"

import * as React from "react"

// Temporary implementation until next-themes is installed
type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  [key: string]: any;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Always use the light theme by default
  const defaultProps = {
    attribute: "class",
    defaultTheme: "light",
    enableSystem: false,
    ...props
  }
  
  // Ensure light theme is applied on mount
  React.useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);
  
  return (
    <div {...defaultProps} className="light-theme">
      {children}
    </div>
  );
}
