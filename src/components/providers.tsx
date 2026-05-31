"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

// Client tarafinda useSession / signIn / signOut kullanabilmek icin
// uygulamayi SessionProvider ile sariyoruz. Toaster global bildirimler icin.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </SessionProvider>
  );
}
