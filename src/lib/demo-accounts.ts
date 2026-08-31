// Vitrin (demo) hesaplari — TEK KAYNAK.
//
// Bu dosya BILEREK hicbir sey import etmez: ne Prisma, ne next-auth, ne
// next/navigation, ne de bir ikon kutuphanesi. Sebep, uc ayri tuketicisinin
// uc ayri calisma ortaminda olmasi:
//
//   src/lib/demo-data.ts        SUNUCU  — hesaplari olusturur (seed/cron)
//   src/lib/authz.ts            SUNUCU  — salt-okunurlugu uygular (isDemoUser)
//   src/app/(auth)/giris/page   ISTEMCI — rol secici dugmeleri
//
// Once bu liste uc dosyaya da KOPYALANMISTI. Bir rol ya da e-posta degisince
// ucunu birden guncellemek gerekiyordu; birini unutmak sessiz ve tehlikeli bir
// hata uretirdi: authz.ts'e eklenmemis bir demo hesabi SALT-OKUNUR OLMAZ, yani
// ziyaretci canli demonun verisini bozabilir ya da parolayi degistirip diger
// ziyaretcileri kilitleyebilirdi. Kopyayi kaldirmak bu hatayi imkansiz kilar.
//
// Rol adlari Prisma'nin `Role` enum'uyla eslesmeli. Bagimlilik eklememek icin
// burada duz bir birlesim tipi kullaniliyor; eslesmenin DERLEME ZAMANINDA
// dogrulanmasi demo-data.ts icinde yapiliyor (orada Prisma zaten import edili).

export const DEMO_PASSWORD = "demo1234";

/** Prisma `Role` enum'unun aynasi. Eslesme demo-data.ts'te dogrulanir. */
export type DemoRole = "ADMIN" | "WORKER" | "VET" | "ACCOUNTANT";

export type DemoAccount = {
  readonly email: string;
  readonly name: string;
  readonly role: DemoRole;
  /**
   * Giris ekranindaki i18n anahtar oneki:
   * `Login.demo<i18nKey>` (dugme etiketi) ve `Login.demo<i18nKey>Note` (aciklama).
   */
  readonly i18nKey: "Admin" | "Worker" | "Vet" | "Accountant";
};

// HER ROL ICIN BIR HESAP.
//
// NEDEN DORT: Projenin manset iddiasi "4 rollu RBAC". Tek bir ADMIN hesabiyla
// ziyaretci butun modulleri gorup "her sey acik" izlenimi aliyordu; yani
// iddianin kaniti demoda GORUNMUYORDU. Rol basina bir hesapla fark gozle
// gorulur oluyor — VET 16 menu ogesinden 5'ini gorur, WORKER finans ve satis
// bolumlerinin hicbirini goremez (bkz. src/lib/nav-permissions.ts navByRole).
//
// PAROLA hepsinde ayni: bunlar herkese acik vitrin hesaplari, sir degil.
// Salt-okunurluk e-posta tabanlidir ve ROLDEN BAGIMSIZDIR; yani WORKER demo
// hesabi da hicbir sey yazamaz.
//
// "demo-" oneki bilincli: prisma/seed.ts ayni tenant'a admin@/ahmet@/vet@
// hesaplarini yaziyor ve User.email GLOBAL benzersiz. Onek olmadan CI'nin
// e2e job'i (once db:seed, sonra db:seed-demo) P2002 ile duserdi.
//
// SIRA ONEMLI: ilk kayit ADMIN olmali (DEMO_EMAIL ondan turetiliyor) ve giris
// ekranindaki dugme sirasi da bu diziden geliyor.
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { email: "demo@ciftlik.com", name: "Demo Yönetici", role: "ADMIN", i18nKey: "Admin" },
  { email: "demo-worker@ciftlik.com", name: "Demo Çalışan", role: "WORKER", i18nKey: "Worker" },
  { email: "demo-vet@ciftlik.com", name: "Demo Veteriner", role: "VET", i18nKey: "Vet" },
  { email: "demo-muhasebe@ciftlik.com", name: "Demo Muhasebeci", role: "ACCOUNTANT", i18nKey: "Accountant" },
];

/**
 * ADMIN vitrin hesabi. Gorevler buna atanir (gorev atama yalnizca ADMIN
 * yetkisindedir) ve `npm run db:seed-demo` ciktisinda bu adres yazilir.
 */
export const DEMO_EMAIL = DEMO_ACCOUNTS[0].email;

/** Salt-okunurluk kontrolu icin hizli arama kumesi (kucuk harfli). */
export const DEMO_EMAILS: ReadonlySet<string> = new Set(
  DEMO_ACCOUNTS.map((a) => a.email.toLowerCase())
);
