"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "@/components/theme/ThemeProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <ThemedToaster />
      </ThemeProvider>
    </SessionProvider>
  );
}

function ThemedToaster() {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-right"
      theme={theme}
      toastOptions={{
        style: {
          background: "var(--surface-elevated)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
        },
      }}
    />
  );
}
