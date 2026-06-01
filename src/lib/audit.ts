import { prisma } from "@/lib/prisma";

// Denetim gunlugu yardimcisi. Yazma islemlerinden SONRA cagrilir.
// "Best-effort": kayit basarisiz olsa bile asil islemi bozmamak icin
// hata firlatmaz, yalnizca loglar.

type Actor = { id?: string | null; name?: string | null; email?: string | null };
type Action = "CREATE" | "UPDATE" | "DELETE";

export async function logAudit(
  actor: Actor | undefined,
  action: Action,
  entity: string,
  entityId?: string | null,
  summary?: string | null
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        actorName: actor?.name ?? actor?.email ?? "Bilinmiyor",
        action,
        entity,
        entityId: entityId ?? null,
        summary: summary ?? null,
      },
    });
  } catch (error) {
    console.error("Denetim kaydi olusturulamadi:", error);
  }
}
