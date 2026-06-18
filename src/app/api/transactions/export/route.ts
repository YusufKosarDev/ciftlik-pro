import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { toCsv } from "@/lib/finance-report";

// GET /api/transactions/export -> tum islemleri CSV olarak indirir.
// Finans hassas veridir: ADMIN/ACCOUNTANT ile sinirli (transactions yetkisi).
export async function GET() {
  const authz = await authorizeWrite("transactions");
  if ("error" in authz) return authz.error;

  const transactions = await withTenant(authz.session.user.tenantId, (db) =>
    db.transaction.findMany({
      orderBy: { date: "desc" },
      select: { type: true, amount: true, category: true, date: true, description: true },
    })
  );

  // UTF-8 BOM -> Excel Turkce karakterleri dogru okur.
  const csv = "﻿" + toCsv(transactions);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="finans.csv"',
    },
  });
}
