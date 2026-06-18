import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { healthRecordSchema } from "@/lib/validations/health";

// POST /api/animals/[id]/health -> hayvana saglik kaydi ekler
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeWrite("animalMedical");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = healthRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const record = await withTenant(authz.session.user.tenantId, async (db) => {
      // Hayvan var mi?
      const animal = await db.animal.findFirst({ where: { id } });
      if (!animal) return null;
      return db.healthRecord.create({
        data: {
          tenantId: authz.session.user.tenantId,
          animalId: id,
          date: new Date(data.date),
          diagnosis: data.diagnosis,
          treatment: data.treatment || null,
          notes: data.notes || null,
        },
      });
    });

    if (!record) {
      return NextResponse.json({ error: "Hayvan bulunamadi" }, { status: 404 });
    }

    await logAudit(authz.session.user, "CREATE", "HealthRecord", record.id, record.diagnosis);

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error("Saglik kaydi ekleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
