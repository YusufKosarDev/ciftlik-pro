import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      // Giris formundan beklenen alanlar
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Parola", type: "password" },
      },
      // E-posta + parola dogrulama mantigi
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) return null;

        // Girilen parolayi, saklanan hash ile karsilastir
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        // Donen nesne token'a (jwt callback) gider. Parolayi ASLA dondurmuyoruz.
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          onboarded: user.onboardedAt != null,
        };
      },
    }),
  ],
});
