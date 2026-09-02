import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { withTenant } from "@/lib/tenant-prisma";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { vaccinationSchema } from "@/lib/validations/vaccination";

// POST /api/animals/[id]/vaccinations -> hayvana asi kaydi ekler
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const te = await getTranslations("Errors");
  try {
    const authz = await authorizeWrite("animalMedical");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = vaccinationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidData"), details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const vaccination = await withTenant(authz.session.user.tenantId, async (db) => {
      const animal = await db.animal.findFirst({ where: { id } });
      if (!animal) return null;
      return db.vaccination.create({
        data: {
          tenantId: authz.session.user.tenantId,
          animalId: id,
          name: data.name,
          date: new Date(data.date),
          nextDate: data.nextDate ? new Date(data.nextDate) : null,
          notes: data.notes || null,
        },
      });
    });

    if (!vaccination) {
      return NextResponse.json({ error: te("animalNotFound") }, { status: 404 });
    }

    await logAudit(authz.session.user, "CREATE", "Vaccination", vaccination.id, vaccination.name);

    return NextResponse.json({ vaccination }, { status: 201 });
  } catch (error) {
    console.error("Failed to add vaccination record:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
