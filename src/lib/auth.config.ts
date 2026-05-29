import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

// Edge ortaminda (middleware) da calisabilen hafif yapilandirma.
// Veritabani/bcrypt gibi agir islemler burada YOKTUR; onlar auth.ts'tedir.
export const authConfig = {
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

      // Giris yapmis kullanici giris/kayit sayfalarina giderse panele yonlendir
      if (isLoggedIn && (pathname === "/giris" || pathname === "/kayit")) {
        return Response.redirect(new URL("/panel", request.nextUrl));
      }

      return true;
    },

    // Giris yapildiginda kullanicinin id ve rolunu token'a yaziyoruz.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    // Token'daki bilgileri oturuma (session) tasiyoruz.
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },

  // Providers auth.ts'te eklenir (Credentials).
  providers: [],
} satisfies NextAuthConfig;
