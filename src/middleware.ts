import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Edge-uyumlu hafif yapilandirma ile middleware'i olusturuyoruz.
// (Veritabani/bcrypt iceren auth.ts'i degil; cunku middleware edge'de calisir.)
export const { auth: middleware } = NextAuth(authConfig);

// Hangi yollarda calisacagini belirliyoruz:
// statik dosyalar, _next ve API rotalari haric her sey.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
