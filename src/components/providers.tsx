"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

// The app is wrapped in SessionProvider so useSession / signIn / signOut work on
// the client. ThemeProvider (next-themes) drives dark mode through
// <html class="dark">. Toaster handles the global notifications.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
        <Toaster position="top-right" richColors closeButton />
      </ThemeProvider>
    </SessionProvider>
  );
}
