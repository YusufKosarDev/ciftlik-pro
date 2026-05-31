import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWrite } from "@/lib/authz";
import { structureSchema } from "@/lib/validations/structure";

// POST /api/structures -> yeni yapi olusturur
export async function POST(request: Request) {
  try {
    const authz = await authorizeWrite("structures");
    if ("error" in authz) return authz.error;

    const body = await request.json();
    const parsed = structureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const structure = await prisma.structure.create({
      data: {
        name: data.name,
        type: data.type,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ structure }, { status: 201 });
  } catch (error) {
    console.error("Yapi ekleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
