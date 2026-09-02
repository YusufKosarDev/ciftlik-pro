import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";
import { canViewPanelPath } from "@/lib/nav-permissions";

// The lightweight configuration, able to run in the edge runtime (the proxy).
// Nothing heavy — no database, no password hashing — lives here; that is in
// auth.ts.
export const authConfig = {
  // Trust the Host header. Off Vercel (self-hosted, Docker, behind a reverse
  // proxy) Auth.js v5 cannot validate Host and REFUSES by default, failing every
  // /api/auth/* endpoint with a 500 "UntrustedHost". This app runs behind its own
  // proxy, so the trust is granted explicitly; AUTH_TRUST_HOST does the same from
  // the environment (and Vercel sets it automatically).
  trustHost: true,

  // The session lives in a JWT (required by the Credentials provider).
  session: { strategy: "jwt" },

  // Our own sign-in page.
  pages: {
    signIn: "/giris",
  },

  callbacks: {
    // The proxy runs this callback on every request.
    // true -> allow, false -> redirect to the sign-in page.
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      // Protected area
      const isProtected = pathname.startsWith("/panel");

      // A signed-out user cannot enter the protected area
      if (isProtected) {
        if (!isLoggedIn) return false;

        // The per-role section check happens HERE so that a refused request
        // returns a real HTTP 307. Calling redirect() in a server component runs
        // after the layout has streamed, which produced 200 + a client-side
        // redirect; no data leaked, but an unauthorized access was
        // indistinguishable by status code — a weak signal for monitoring and
        // auditing.
        //
        // The server-side requirePageView / requirePageWrite checks REMAIN: this
        // is the first gate, those are defence in depth.
        const role = auth?.user?.role;
        if (role && !canViewPanelPath(role, pathname)) {
          // 307: the same code Auth.js uses for its own sign-in redirect (a bare
          // Response.redirect would return 302), so panel redirects stay uniform.
          return Response.redirect(new URL("/panel", request.nextUrl), 307);
        }
        return true;
      }

      // A signed-in user visiting sign-in or sign-up goes to the dashboard
      if (isLoggedIn && (pathname === "/giris" || pathname === "/kayit")) {
        return Response.redirect(new URL("/panel", request.nextUrl));
      }

      return true;
    },

    // On sign-in, write the user's id, role and onboarding state into the token.
    // The "update" trigger (useSession().update) refreshes the onboarding state
    // without a database query (true once the tour completes, false when reset).
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
    // Carry the token's fields onto the session.
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

  // Providers are added in auth.ts (Credentials).
  providers: [],
} satisfies NextAuthConfig;
