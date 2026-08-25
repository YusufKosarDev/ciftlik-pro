import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

// Edge ortaminda (middleware) da calisabilen hafif yapilandirma.
// Veritabani/bcrypt gibi agir islemler burada YOKTUR; onlar auth.ts'tedir.
export const authConfig = {
  // Host basligina guven. Auth.js v5, Vercel disinda (Docker/self-host, ters
  // proxy arkasi) Host'u dogrulayamadigi icin varsayilan olarak REDDEDER ve
  // /api/auth/* uclarini 500 "UntrustedHost" ile dusurur. Uygulama kendi
  // proxy'sinin arkasinda calistigindan bu guveni acikca veriyoruz; ortamdan
  // AUTH_TRUST_HOST ile de gecilebilir (Vercel'de zaten otomatiktir).
  trustHost: true,

  // Oturum bilgisini JWT icinde tutuyoruz (Credentials provider icin gerekli).
  session: { strategy: "jwt" },

  // Ozel giris sayfamiz (ileride olusturulacak).
  pages: {
    signIn: "/giris",
  },

  callbacks: {
    // Middleware bu callback'i her istekte calistirir.
    // true -> erisime izin ver, false -> giris sayfasina yonlendir.
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      // Korumali alanlar
      const isProtected = pathname.startsWith("/panel");

      // Giris yapmamis kullanici korumali alana giremez
      if (isProtected) {
        return isLoggedIn;
      }

      // Giris yapmis kullanici giris/kayit sayfasina giderse panele yonlendir
      if (isLoggedIn && (pathname === "/giris" || pathname === "/kayit")) {
        return Response.redirect(new URL("/panel", request.nextUrl));
      }

      return true;
    },

    // Giris yapildiginda kullanicinin id, rol ve onboarding durumunu token'a yaziyoruz.
    // "update" tetikleyicisi (useSession().update) ile onboarding durumu DB sorgusu
    // olmadan tazelenir (tur tamamlaninca true, sifirlaninca false).
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.tenantId = user.tenantId ?? "";
        token.onboarded = user.onboarded ?? false;
      }
      if (trigger === "update" && typeof session?.onboarded === "boolean") {
        token.onboarded = session.onboarded;
      }
      return token;
    },
    // Token'daki bilgileri oturuma (session) tasiyoruz.
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.tenantId = (token.tenantId as string) ?? "";
        session.user.onboarded = Boolean(token.onboarded);
      }
      return session;
    },
  },

  // Providers auth.ts'te eklenir (Credentials).
  providers: [],
} satisfies NextAuthConfig;
