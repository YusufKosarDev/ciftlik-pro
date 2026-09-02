// The showcase (demo) accounts — SINGLE SOURCE.
//
// This file DELIBERATELY imports nothing: no Prisma, no next-auth, no
// next/navigation, not even an icon library. The reason is that its three
// consumers live in three different runtimes:
//
//   src/lib/demo-data.ts        SERVER  — creates the accounts (seed/cron)
//   src/lib/authz.ts            SERVER  — enforces read-only (isDemoUser)
//   src/components/demo-role-buttons  CLIENT — the role picker buttons
//
// This list used to be COPIED into all three. Changing a role or an email meant
// updating three files, and forgetting one produced a silent, dangerous bug: a
// demo account missing from authz.ts is NOT READ-ONLY, so a visitor could corrupt
// the live demo's data — or change the password and lock every other visitor out.
// Removing the copies makes that mistake impossible.
//
// The role names must match Prisma's `Role` enum. A plain union is used here to
// avoid taking on a dependency; the match is verified AT COMPILE TIME inside
// demo-data.ts, where Prisma is already imported.

export const DEMO_PASSWORD = "demo1234";

/** A mirror of Prisma's `Role` enum. The match is verified in demo-data.ts. */
export type DemoRole = "ADMIN" | "WORKER" | "VET" | "ACCOUNTANT";

export type DemoAccount = {
  readonly email: string;
  readonly name: string;
  readonly role: DemoRole;
  /**
   * The i18n key prefix used by the role picker:
   * `Login.demo<i18nKey>` (button label) and `Login.demo<i18nKey>Note` (the note).
   */
  readonly i18nKey: "Admin" | "Worker" | "Vet" | "Accountant";
};

// ONE ACCOUNT PER ROLE.
//
// WHY FOUR: the headline claim of this project is "four-role RBAC". With a single
// ADMIN account a visitor saw every module and came away thinking everything is
// open — the proof of the claim was NOT VISIBLE in the demo. One account per role
// makes the difference something you can see: VET sees 5 of 16 menu items, WORKER
// sees none of the finance or sales sections (see navByRole in
// src/lib/nav-permissions.ts).
//
// The PASSWORD is the same for all of them: these are public showcase accounts,
// not a secret. Read-only enforcement is keyed on the email address and is
// INDEPENDENT OF ROLE, so the WORKER demo account cannot write either.
//
// The "demo-" prefix is deliberate: prisma/seed.ts writes admin@/ahmet@/vet@ into
// the same tenant and User.email is GLOBALLY unique. Without the prefix, CI's e2e
// job (db:seed first, then db:seed-demo) would fail with P2002.
//
// ORDER MATTERS: the first entry must be the ADMIN (DEMO_EMAIL is derived from
// it), and the button order in the role picker comes from this array.
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { email: "demo@ciftlik.com", name: "Demo Yönetici", role: "ADMIN", i18nKey: "Admin" },
  { email: "demo-worker@ciftlik.com", name: "Demo Çalışan", role: "WORKER", i18nKey: "Worker" },
  { email: "demo-vet@ciftlik.com", name: "Demo Veteriner", role: "VET", i18nKey: "Vet" },
  { email: "demo-muhasebe@ciftlik.com", name: "Demo Muhasebeci", role: "ACCOUNTANT", i18nKey: "Accountant" },
];

/**
 * The ADMIN showcase account. Tasks are assigned to it (task assignment is
 * ADMIN-only) and this is the address printed by `npm run db:seed-demo`.
 */
export const DEMO_EMAIL = DEMO_ACCOUNTS[0].email;

/** A fast lookup set for the read-only check (lower-cased). */
export const DEMO_EMAILS: ReadonlySet<string> = new Set(
  DEMO_ACCOUNTS.map((a) => a.email.toLowerCase())
);
