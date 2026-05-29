import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Auth.js'in varsayilan tiplerini genisletiyoruz:
// oturumda kullanicinin id ve rol bilgisi de tip guvenli sekilde bulunsun.

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
