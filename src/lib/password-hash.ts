import bcrypt from "bcryptjs";

// Parola hash maliyet faktoru (bcrypt cost / work factor).
// Yuksek deger = brute-force'a karsi daha guvenli, ama daha yavas hash.
// 12, modern donanim icin guvenlik/performans dengesinde makbul bir degerdir.
// NOT: bcrypt.compare maliyetten bagimsiz calistigi icin eski (cost 10)
// hash'ler dogrulanmaya devam eder; yeni parolalar bu maliyetle uretilir.
// Bagimsiz seed scriptleri (.mjs) bu sabiti import edemez; oralarda ayni deger
// elle (literal 12) kullanilir.
export const BCRYPT_COST = 12;

// Duz metin parolayi hash'ler. Uygulama icindeki tum parola yazma yollari
// (kayit, parola degistirme) bunu kullanir.
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}
