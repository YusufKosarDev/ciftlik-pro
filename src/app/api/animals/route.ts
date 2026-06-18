import { NextResponse } from "next/server";
import { authorizeWrite } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { withTenant } from "@/lib/tenant-prisma";
import { animalSchema } from "@/lib/validations/animal";

// POST /api/animals -> yeni hayvan olusturur
export async function POST(request: Request) {
  try {
    // 1) Yetki kontrolu: sadece ADMIN/WORKER hayvan ekleyebilir
    const authz = await authorizeWrite("animals");
    if ("error" in authz) return authz.error;

    const body = await request.json();

    // 2) Dogrulama
    const parsed = animalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Tum okuma/yazma tenant baglaminda (RLS + forTenant): benzersizlik ve anne
    // dogrulamasi artik TENANT-ICI yapilir.
    const outcome = await withTenant(authz.session.user.tenantId, async (db) => {
      // Kulak numarasi bu tenant'ta zaten kayitli mi? (findFirst: forTenant enjekte eder)
      const existing = await db.animal.findFirst({ where: { tagNumber: data.tagNumber } });
      if (existing) {
        return { error: "Bu kulak numarasi zaten kayitli", status: 409 } as const;
      }

      // Anne dogrulamasi: mevcut mu, disi mi, ayni turden mi?
      if (data.motherId) {
        const mother = await db.animal.findFirst({
          where: { id: data.motherId },
          select: { gender: true, species: true },
        });
        if (!mother) {
          return { error: "Secilen anne hayvan bulunamadi", status: 404 } as const;
        }
        if (mother.gender !== "FEMALE") {
          return { error: "Anne olarak yalnizca disi hayvan secilebilir", status: 400 } as const;
        }
        if (mother.species !== data.species) {
          return { error: "Anne ve yavru ayni turden olmalidir", status: 400 } as const;
        }
      }

      const animal = await db.animal.create({
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
      "CREATE",
      "Animal",
      outcome.animal.id,
      outcome.animal.tagNumber
    );

    return NextResponse.json({ animal: outcome.animal }, { status: 201 });
  } catch (error) {
    console.error("Hayvan ekleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
