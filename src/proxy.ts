import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Next.js 16 ile "middleware" konvansiyonu yerini "proxy"ye birakti.
// Edge-uyumlu hafif yapilandirma ile istekleri koruyoruz.
// (Veritabani/bcrypt iceren auth.ts'i degil; cunku proxy edge'de calisir.)
const { auth } = NextAuth(authConfig);

export default auth;

// Hangi yollarda calisacagini belirliyoruz:
// statik dosyalar, _next ve API rotalari haric her sey.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
