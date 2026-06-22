import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isDemoUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { PLAN_LIMITS, countResource } from "@/lib/plan";
import { Badge } from "@/components/ui/badge";
import { BillingActions } from "@/components/billing-actions";

function UsageRow({
  label,
  current,
  limit,
}: {
  label: string;
  current: number;
  limit: number;
}) {
  const unlimited = limit === Infinity;
  const pct = unlimited ? 0 : Math.min(100, Math.round((current / limit) * 100));
  const atLimit = !unlimited && current >= limit;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className={`tabular-nums ${atLimit ? "font-semibold text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
          {current} / {unlimited ? "∞" : limit}
        </span>
      </div>
      {!unlimited && (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${atLimit ? "bg-red-500" : "bg-green-600"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default async function AbonelikPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/giris");
  }
  // Plan/abonelik tenant geneli bir ayardır: yalnızca ADMIN yönetebilir.
  if (session.user.role !== "ADMIN") {
    redirect("/panel");
  }

  const tenantId = session.user.tenantId;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });
  const plan = tenant?.plan ?? "FREE";
  const limits = PLAN_LIMITS[plan];

  const [animals, users] = await Promise.all([
    countResource(tenantId, "animals"),
    countResource(tenantId, "users"),
  ]);

  const stripeEnabled = Boolean(getStripe() && process.env.STRIPE_PRO_PRICE_ID);
  const isDemo = isDemoUser(session.user.email);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
        <span>💳</span> Abonelik
      </h1>

      <div className="space-y-5 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Mevcut plan</p>
            <p className="mt-0.5 flex items-center gap-2 text-xl font-bold text-foreground">
              {plan}
              <Badge tone={plan === "PRO" ? "green" : "blue"}>
                {plan === "PRO" ? "Sınırsız" : "Ücretsiz"}
              </Badge>
            </p>
          </div>
          <BillingActions plan={plan} stripeEnabled={stripeEnabled} isDemo={isDemo} />
        </div>

        <div className="space-y-4 border-t border-border pt-5">
          <UsageRow label="Aktif hayvan" current={animals} limit={limits.animals} />
          <UsageRow label="Personel" current={users} limit={limits.users} />
        </div>

        {plan === "FREE" && (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            PRO planı hayvan ve personel sınırlarını kaldırır.
            {!stripeEnabled && " (Demo: yükseltme anında uygulanır, ödeme alınmaz.)"}
          </p>
        )}
      </div>
    </div>
  );
}
