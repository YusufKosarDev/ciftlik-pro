import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/password-hash";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { rateLimit, resetRateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

// Brute-force / credential-stuffing protection: within a 15-minute window, at
// most this many attempts for the same IP+email pair, plus a wider ceiling for
// the IP on its own.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_IP_EMAIL = 8; // Attempts against one specific account
const MAX_PER_IP = 30; // Attempts from one IP across all accounts

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      // Fields expected from the sign-in form
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Parola", type: "password" },
      },
      // Email + password verification
      async authorize(credentials, request) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const normalizedEmail = email.toLowerCase();

        // Rate limit: IP+email first (narrow), then IP (wide). If either is
        // exceeded we refuse without verifying anything; the message stays
        // generic so no lockout information leaks.
        const ip = clientIp(request as unknown as Request);
        const ipEmail = await rateLimit(`login:${ip}:${normalizedEmail}`, MAX_PER_IP_EMAIL, LOGIN_WINDOW_MS);
        const perIp = await rateLimit(`login:${ip}`, MAX_PER_IP, LOGIN_WINDOW_MS);
        if (!ipEmail.success || !perIp.success) {
          console.warn(`Login rate limit exceeded: ip=${ip} email=${normalizedEmail}`);
          return null;
        }

        // Sign-in happens before the tenant is KNOWN, and User has RLS (FORCE)
        // enabled, so a direct findUnique would return 0 rows under the
        // non-superuser role. The lookup therefore goes through a SECURITY
        // DEFINER function that bypasses RLS for this one query (see migration
        // 20260618167000_auth_lookup_function). Email is globally unique, so at
        // most one row comes back.
        const rows = await prisma.$queryRaw<
          Array<{
            id: string;
            name: string | null;
            email: string;
            password: string;
            role: Role;
            tenantId: string;
            onboardedAt: Date | null;
          }>
        >`SELECT * FROM auth_user_by_email(${normalizedEmail})`;
        const user = rows[0];
        // No user: skip hashing rather than burning a comparison. Wrong password:
        // the comparison returns false.
        const isValid = user ? await verifyPassword(password, user.password) : false;
        if (!user || !isValid) {
          // Record the failed attempt in the audit log (security trail).
          // Best-effort: logAudit never throws. Attempts are already bounded by
          // the rate limit above.
          await logAudit({ email: normalizedEmail }, "LOGIN_FAILED", "Auth", null, `ip=${ip}`);
          return null;
        }

        // Successful sign-in: reset this account's IP+email counter so a
        // legitimate user is not locked out by their own earlier typos.
        await resetRateLimit(`login:${ip}:${normalizedEmail}`);

        // The returned object flows into the token (jwt callback). The password
        // is NEVER returned.
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          onboarded: user.onboardedAt != null,
        };
      },
    }),
  ],
});
