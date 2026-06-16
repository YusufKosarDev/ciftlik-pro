// Ilk yonetici (ADMIN) bootstrap'i — idempotent ve zararsizdir.
//
// Kayit artik yalnizca ADMIN'e acik oldugundan, bos bir veritabaninda giris
// yapacak ilk yoneticiyi olusturmanin guvenli bir yolu gerekir. Bu script
// ADMIN_EMAIL / ADMIN_PASSWORD ortam degiskenlerinden bir yonetici olusturur:
//   - Zaten bir ADMIN varsa hicbir sey yapmaz.
//   - Env tanimli degilse uyarip atlar (sunucu yine de baslar).
// Container'da tsx bulunmadigi icin duz "node" ile calisacak sekilde .mjs.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Yonetici";

  if (!email || !password) {
    console.log(
      "ADMIN_EMAIL/ADMIN_PASSWORD tanimli degil; ilk yonetici olusturma atlandi."
    );
    return;
  }

  // Zaten bir yonetici varsa dokunma.
  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) {
    console.log("Zaten bir ADMIN mevcut; ilk yonetici olusturma atlandi.");
    return;
  }

  // Ayni e-posta baska bir rolde kayitliysa cakismayi onle.
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    console.log(
      "Bu e-posta zaten kayitli; ilk yonetici olusturma atlandi."
    );
    return;
  }

  // Maliyet 12: src/lib/password-hash.ts BCRYPT_COST ile ayni.
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name, email, password: passwordHash, role: "ADMIN" },
  });
  console.log(`Ilk yonetici olusturuldu: ${email}`);
}

main()
  .catch((e) => {
    console.error("Ilk yonetici olusturma hatasi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
