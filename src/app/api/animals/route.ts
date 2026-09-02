import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { authorizeWrite } from "@/lib/authz";
import { logAudit, logAuditMany } from "@/lib/audit";
import { withTenant } from "@/lib/tenant-prisma";
import { canAddRecord } from "@/lib/plan";
import { animalSchema } from "@/lib/validations/animal";

// POST /api/animals -> creates an animal
export async function POST(request: Request) {
  const te = await getTranslations("Errors");
  try {
    // 1) Authorization: only ADMIN and WORKER may add an animal
    const authz = await authorizeWrite("animals");
    if ("error" in authz) return authz.error;

    const body = await request.json();

    // 2) Validation
    const parsed = animalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidData"), details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 3) Plan limit (FREE: at most 25 active animals). A hard block.
    const limit = await canAddRecord(authz.session.user.tenantId, "animals");
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: te("planLimitAnimals", { limit: limit.limit }),
          code: "PLAN_LIMIT",
        },
        { status: 403 }
      );
    }

    // Every read and write happens in the tenant context (RLS + forTenant), so the
    // uniqueness and mother checks are WITHIN THE TENANT.
    const outcome = await withTenant(authz.session.user.tenantId, async (db) => {
      // Is this ear tag already registered in this tenant? (findFirst, so forTenant
      // can inject the filter)
      const existing = await db.animal.findFirst({ where: { tagNumber: data.tagNumber } });
      if (existing) {
        return { error: te("tagTaken"), status: 409 } as const;
      }

      // Mother checks: does she exist, is she female, is she the same species?
      if (data.motherId) {
        const mother = await db.animal.findFirst({
          where: { id: data.motherId },
          select: { gender: true, species: true },
        });
        if (!mother) {
          return { error: te("motherNotFound"), status: 404 } as const;
        }
        if (mother.gender !== "FEMALE") {
          return { error: te("motherMustBeFemale"), status: 400 } as const;
        }
        if (mother.species !== data.species) {
          return { error: te("motherSpeciesMismatch"), status: 400 } as const;
        }
      }

      const animal = await db.animal.create({
        data: {
          tenantId: authz.session.user.tenantId,
          tagNumber: data.tagNumber,
          name: data.name || null,
          species: data.species,
          breed: data.breed || null,
          gender: data.gender,
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          status: data.status,
          imageUrl: data.imageUrl || null,
          notes: data.notes || null,
          motherId: data.motherId || null,
        },
      });
      return { animal } as const;
    });

    if ("error" in outcome) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    }

    await logAudit(
      authz.session.user,
      "CREATE",
      "Animal",
      outcome.animal.id,
      outcome.animal.tagNumber
    );

    return NextResponse.json({ animal: outcome.animal }, { status: 201 });
  } catch (error) {
    console.error("Failed to add animal:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}

// DELETE /api/animals -> bulk-deletes animals
export async function DELETE(request: Request) {
  const te = await getTranslations("Errors");
  try {
    const authz = await authorizeWrite("animals");
    if ("error" in authz) return authz.error;

    const body = await request.json();
    const { ids } = body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: te("invalidIds") }, { status: 400 });
    }

    const result = await withTenant(authz.session.user.tenantId, async (db) => {
      // Find the valid animals belonging to this tenant
      const existing = await db.animal.findMany({
        where: { id: { in: ids } },
        select: { id: true, tagNumber: true },
      });

      if (existing.length === 0) return [];

      const foundIds = existing.map((a) => a.id);
      await db.animal.deleteMany({
        where: { id: { in: foundIds } },
      });

      return existing;
    });

    // One createMany: this previously did a separate INSERT per deleted record
    // (a bulk delete of 200 animals meant 200 separate writes).
    await logAuditMany(
      authz.session.user,
      "DELETE",
      "Animal",
      result.map((item) => ({ entityId: item.id, summary: item.tagNumber }))
    );

    return NextResponse.json({ success: true, count: result.length });
  } catch (error) {
    console.error("Bulk animal delete failed:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
