"use client";

import React, { ReactNode } from "react";

// This is necessary to prevent errors during build time
let SessionProvider: React.ComponentType<{ children: ReactNode }>;

try {
  // Dynamically import SessionProvider from next-auth/react
  const nextAuth = require("next-auth/react");
  SessionProvider = nextAuth.SessionProvider;
} catch (error) {
  // Fallback component if next-auth is not installed
  SessionProvider = ({ children }: { children: ReactNode }) => <>{children}</>;
  console.warn("next-auth not installed, sessionProvider will not be available");
}

interface NextAuthProviderProps {
  children: ReactNode;
}

export function NextAuthProvider({ children }: NextAuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
