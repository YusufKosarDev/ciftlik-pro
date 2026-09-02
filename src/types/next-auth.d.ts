import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Extending Auth.js's default types, so the session carries the user's id and role
// in a type-safe way.

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      tenantId: string; // Cok-kiracilik: kullanicinin ait oldugu tenant
      onboarded: boolean; // Hos geldin turunu tamamladi mi (JWT'den)
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    tenantId?: string | null;
    onboarded?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    tenantId: string;
    onboarded: boolean;
  }
}
