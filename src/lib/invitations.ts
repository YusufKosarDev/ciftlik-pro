import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Reading an invitation by token, WITH NO TENANT CONTEXT.
//
// WHY RAW: Invitation is under FORCE RLS (20260826120000_invitation_rls). The
// acceptance flow is public — the user has not signed in yet, so app.tenant_id
// cannot be set and a non-superuser role sees 0 rows from a direct query. The
// read therefore goes through the SECURITY DEFINER function
// `invitation_by_token` — exactly the pattern used by `auth_user_by_email` at
// sign-in (see src/lib/auth.ts).
//
// The function DOES NOT return the token itself; the caller already holds it.
export type InvitationByToken = {
  id: string;
  tenantId: string;
  email: string;
  role: Role;
  expiresAt: Date;
  acceptedAt: Date | null;
};

export async function findInvitationByToken(
  token: string
): Promise<InvitationByToken | null> {
  const rows = await prisma.$queryRaw<
    Array<InvitationByToken>
  >`SELECT * FROM invitation_by_token(${token})`;
  return rows[0] ?? null;
}

// Is this invitation still acceptable? (single-use and not expired)
export function isInvitationUsable(
  invitation: InvitationByToken | null,
  now: Date = new Date()
): invitation is InvitationByToken {
  return Boolean(invitation && !invitation.acceptedAt && invitation.expiresAt > now);
}
