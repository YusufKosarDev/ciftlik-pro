import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Next.js 16 renamed the "middleware" convention to "proxy".
// Requests are guarded with the edge-compatible slice of the auth config
// (auth.config.ts, not auth.ts — the proxy runs on the edge and auth.ts pulls
// in the database and password hashing).
const { auth } = NextAuth(authConfig);

export default auth;

// Where this runs: everything except static files, _next and the API routes.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
