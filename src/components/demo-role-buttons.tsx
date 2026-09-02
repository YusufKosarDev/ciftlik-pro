"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  Calculator,
  Crown,
  HardHat,
  Loader2,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  type DemoAccount,
} from "@/lib/demo-accounts";

// WHY A ROLE PICKER: the headline claim of this project is "four-role RBAC". With
// a single ADMIN account a visitor saw every module and came away with the
// impression that everything is open — the proof of the claim was NOT VISIBLE in
// the demo. Writing what each role cannot reach onto the button is load-bearing
// too: otherwise someone who signs in as WORKER reads the narrower menu as a
// broken page rather than as a permission boundary.
//
// The accounts themselves are in src/lib/demo-accounts.ts (SINGLE SOURCE). The
// icons stay here: that module deliberately imports nothing, lucide included.
const ROLE_ICONS: Record<DemoAccount["i18nKey"], LucideIcon> = {
  Admin: Crown,
  Worker: HardHat,
  Vet: Stethoscope,
  Accountant: Calculator,
};

/**
 * The four read-only showcase accounts as sign-in buttons.
 *
 * Shared by the sign-in page and the landing page. It owns its own error state
 * rather than taking one as a prop, because the sign-in page's error slot belongs
 * to the credentials form and the landing page has no form at all.
 *
 * The button labels come from the `Login.demo*` keys. Those keys are also what
 * the e2e specs select on (e2e/demo-roles.spec.ts, e2e/demo-readonly.spec.ts), so
 * they are not renamed casually.
 */
export function DemoRoleButtons({ className }: { className?: string }) {
  const router = useRouter();
  const t = useTranslations("Login");
  // Which role's sign-in is in flight; null when none.
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // For visitors: a read-only demo sign-in that needs no registration. The
  // account differs per role; all of them see the same farm's data and none of
  // them can write (src/lib/authz.ts isDemoUser).
  async function handleDemo(email: string) {
    setError(null);
    setLoading(email);
    const result = await signIn("credentials", {
      email,
      password: DEMO_PASSWORD,
      redirect: false,
    });
    setLoading(null);
    if (result?.error) {
      setError(t("errorDemo"));
      return;
    }
    router.push("/panel");
    router.refresh();
  }

  return (
    <div className={className}>
      {/*
        Every button carries the role name plus WHAT THAT ROLE CANNOT SEE. The
        description is not cosmetic: a visitor who does not know what to expect
        before clicking will mistake a narrowed menu for a bug.
        `disabled` applies to all buttons (this prevents a double submit); only
        the icon swaps for a spinner, so the layout does not shift.
      */}
      <div className="grid grid-cols-2 gap-2">
        {DEMO_ACCOUNTS.map(({ email, i18nKey }) => {
          const Icon = ROLE_ICONS[i18nKey];
          return (
            <Button
              key={email}
              type="button"
              variant="outline"
              onClick={() => handleDemo(email)}
              disabled={loading !== null}
              className="h-auto flex-col items-start gap-0.5 px-3 py-2.5"
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                {loading === email ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                )}
                {t(`demo${i18nKey}`)}
              </span>
              <span className="text-[11px] font-normal leading-tight text-muted-foreground">
                {t(`demo${i18nKey}Note`)}
              </span>
            </Button>
          );
        })}
      </div>

      {error && (
        <p className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
