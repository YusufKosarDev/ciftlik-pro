"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

// Client tarafinda useSession / signIn / signOut kullanabilmek icin
// uygulamayi SessionProvider ile sariyoruz. ThemeProvider (next-themes) dark
// mode'u <html class="dark"> ile yonetir. Toaster global bildirimler icin.
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
