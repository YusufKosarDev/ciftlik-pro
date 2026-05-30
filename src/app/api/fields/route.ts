import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fieldSchema } from "@/lib/validations/field";

// POST /api/fields -> yeni tarla olusturur
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = fieldSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Gecersiz veri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const field = await prisma.field.create({
      data: {
        name: data.name,
        area: data.area,
        location: data.location || null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ field }, { status: 201 });
  } catch (error) {
    console.error("Tarla ekleme hatasi:", error);
    return NextResponse.json(
      { error: "Sunucu hatasi, lutfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
