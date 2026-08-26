import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Davetin token ile, TENANT BAGLAMI OLMADAN okunmasi.
//
// NEDEN RAW: Invitation tablosunda FORCE RLS var (20260826120000_invitation_rls).
// Kabul akisi herkese aciktir — kullanici henuz giris yapmamistir, dolayisiyla
// app.tenant_id ayarlanamaz ve non-superuser rol dogrudan sorguda 0 satir gorur.
// Bu yuzden okuma, SECURITY DEFINER `invitation_by_token` fonksiyonuna tasindi;
// login'deki `auth_user_by_email` ile birebir ayni desen (bkz. src/lib/auth.ts).
//
// Fonksiyon token'in kendisini DONDURMEZ; cagiran zaten elinde tutar.
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

// Davet kabul edilebilir mi? (tek kullanimlik + suresi dolmamis)
export function isInvitationUsable(
  invitation: InvitationByToken | null,
  now: Date = new Date()
): invitation is InvitationByToken {
  return Boolean(invitation && !invitation.acceptedAt && invitation.expiresAt > now);
}
