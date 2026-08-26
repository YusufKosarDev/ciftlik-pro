import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { withTenant } from "@/lib/tenant-prisma";
import { animalSchema } from "@/lib/validations/animal";

// PUT /api/animals/[id] -> hayvani gunceller. Tum okuma/yazma tenant baglaminda
// (RLS + forTenant); benzersizlik/soy kontrolleri TENANT-ICI yapilir.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const te = await getTranslations("Errors");
  try {
    const authz = await authorizeWrite("animals");
    if ("error" in authz) return authz.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = animalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidData"), details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const outcome = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.animal.findFirst({ where: { id } });
      if (!existing) {
        return { error: te("animalNotFound"), status: 404 } as const;
      }

      // Kulak numarasi bu tenant'ta baska bir hayvanda kullaniliyor mu?
      const tagOwner = await db.animal.findFirst({ where: { tagNumber: data.tagNumber } });
      if (tagOwner && tagOwner.id !== id) {
        return { error: te("tagUsedByAnother"), status: 409 } as const;
      }

      if (data.motherId && data.motherId === id) {
        return { error: te("animalCannotBeOwnMother"), status: 400 } as const;
      }

      // Dongu engelle: secilen anne, bu hayvanin soyundan biri olamaz.
      if (data.motherId) {
        let cursor: string | null = data.motherId;
        const seen = new Set<string>();
        while (cursor && !seen.has(cursor)) {
          if (cursor === id) {
            return {
              error: te("motherCycle"),
              status: 400,
            } as const;
          }
          seen.add(cursor);
          const parent: { motherId: string | null } | null = await db.animal.findFirst({
            where: { id: cursor },
            select: { motherId: true },
          });
          cursor = parent?.motherId ?? null;
        }

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

      // Tur degisiyorsa yavrularla tutarsizlik olmamali.
      if (data.species !== existing.species) {
        const mismatchedOffspring = await db.animal.count({
          where: { motherId: id, species: { not: data.species } },
        });
        if (mismatchedOffspring > 0) {
          return {
            error: te("offspringSpeciesMismatch"),
            status: 400,
          } as const;
        }
      }

      const animal = await db.animal.update({
        where: { id },
        data: {
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
      "UPDATE",
      "Animal",
      outcome.animal.id,
      outcome.animal.tagNumber
    );

    return NextResponse.json({ animal: outcome.animal });
  } catch (error) {
    console.error("Hayvan guncelleme hatasi:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}

// DELETE /api/animals/[id] -> hayvani siler
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const te = await getTranslations("Errors");
  try {
    const authz = await authorizeWrite("animals");
    if ("error" in authz) return authz.error;

    const { id } = await params;

    const deleted = await withTenant(authz.session.user.tenantId, async (db) => {
      const existing = await db.animal.findFirst({ where: { id } });
      if (!existing) return null;
      await db.animal.delete({ where: { id } });
      return existing;
    });

    if (!deleted) {
      return NextResponse.json({ error: te("animalNotFound") }, { status: 404 });
    }

    await logAudit(authz.session.user, "DELETE", "Animal", id, deleted.tagNumber);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Hayvan silme hatasi:", error);
    return NextResponse.json(
      { error: te("serverErrorRetry") },
      { status: 500 }
    );
  }
}
