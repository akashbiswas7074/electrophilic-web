"use client";

import { ReactNode } from "react";

// Mock session to prevent errors
export function useSession() {
  return {
    data: null,
    status: "unauthenticated",
    update: async () => null
  };
}

export default function SessionWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
