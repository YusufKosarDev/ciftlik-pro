"use client";

import { SessionProvider } from "next-auth/react";

// Client tarafinda useSession / signIn / signOut kullanabilmek icin
// uygulamayi SessionProvider ile sariyoruz.
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
