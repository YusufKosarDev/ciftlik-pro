import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { rateLimit, resetRateLimit, clientIp } from "@/lib/rate-limit";

// Brute-force / kimlik bilgisi doldurma (credential stuffing) korumasi:
// 15 dakikalik pencerede ayni IP+e-posta ikilisi icin en fazla bu kadar
// giris denemesi; ayrica ayni IP icin daha genis bir ust sinir.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_IP_EMAIL = 8; // Belirli bir hesaba yonelik denemeler
const MAX_PER_IP = 30; // Bir IP'den tum hesaplara toplam denemeler

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
      async authorize(credentials, request) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const normalizedEmail = email.toLowerCase();

        // Hiz siniri: once IP+e-posta (dar), sonra IP (genis). Asilirsa
        // dogrulama yapmadan reddederiz; mesaj genel kalir (kilit bilgisi sizmaz).
        const ip = clientIp(request as unknown as Request);
        const ipEmail = rateLimit(`login:${ip}:${normalizedEmail}`, MAX_PER_IP_EMAIL, LOGIN_WINDOW_MS);
        const perIp = rateLimit(`login:${ip}`, MAX_PER_IP, LOGIN_WINDOW_MS);
        if (!ipEmail.success || !perIp.success) {
          console.warn(`Giris hiz siniri asildi: ip=${ip} email=${normalizedEmail}`);
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (!user) return null;

        // Girilen parolayi, saklanan hash ile karsilastir
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        // Basarili giris: bu hesaba ait IP+e-posta sayacini sifirla ki mesru
        // kullanici onceki yanlis denemelerden dolayi kilitlenmesin.
        resetRateLimit(`login:${ip}:${normalizedEmail}`);

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
