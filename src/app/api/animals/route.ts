import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { authorizeWrite } from "@/lib/authz";
import { logAudit, logAuditMany } from "@/lib/audit";
import { withTenant } from "@/lib/tenant-prisma";
import { canAddRecord } from "@/lib/plan";
import { animalSchema } from "@/lib/validations/animal";

// POST /api/animals -> yeni hayvan olusturur
export async function POST(request: Request) {
  const te = await getTranslations("Errors");
  try {
    // 1) Yetki kontrolu: sadece ADMIN/WORKER hayvan ekleyebilir
    const authz = await authorizeWrite("animals");
    if ("error" in authz) return authz.error;

    const body = await request.json();

    // 2) Dogrulama
    const parsed = animalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidData"), details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 3) Plan limiti (FREE: en fazla 25 aktif hayvan). Hard block.
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

    // Tum okuma/yazma tenant baglaminda (RLS + forTenant): benzersizlik ve anne
    // dogrulamasi artik TENANT-ICI yapilir.
    const outcome = await withTenant(authz.session.user.tenantId, async (db) => {
      // Kulak numarasi bu tenant'ta zaten kayitli mi? (findFirst: forTenant enjekte eder)
      const existing = await db.animal.findFirst({ where: { tagNumber: data.tagNumber } });
      if (existing) {
        return { error: te("tagTaken"), status: 409 } as const;
      }

      // Anne dogrulamasi: mevcut mu, disi mi, ayni turden mi?
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
    console.error("Hayvan ekleme hatasi:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}

// DELETE /api/animals -> toplu hayvan siler
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
      // Bu tenant altindaki gecerli hayvanlari bul
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

    // Tek createMany: onceden her silinen kayit icin ayri bir INSERT yapiliyordu
    // (200 hayvanlik toplu silme = 200 ayri yazma).
    await logAuditMany(
      authz.session.user,
      "DELETE",
      "Animal",
      result.map((item) => ({ entityId: item.id, summary: item.tagNumber }))
    );

    return NextResponse.json({ success: true, count: result.length });
  } catch (error) {
    console.error("Toplu hayvan silme hatasi:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
