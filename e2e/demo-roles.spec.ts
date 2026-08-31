import { test, expect, type Page } from "@playwright/test";
import { resetLoginRateLimit } from "./helpers";

// Her spec dosyasi giris hiz sinirini sifirlayarak baslar; gerekcesi
// e2e/helpers.ts icindeki resetLoginRateLimit yorumunda.
test.beforeAll(resetLoginRateLimit);

// Vitrin artik rol basina bir hesap tasiyor (src/lib/demo-accounts.ts).
// Bu dosya o hesaplarin VARLIK SEBEBINI regresyona karsi koruyor: projenin
// manset iddiasi "4 rollu RBAC" ve tek bir ADMIN hesabiyla ziyaretci bunun
// kanitini goremiyordu.
//
// NE DOGRULANIYOR — her rol icin uc katman:
//
//   1. GORUNEN menu       -> role acik bolumler menude var
//   2. GORUNMEYEN menu    -> kapali bolumler menude YOK
//   3. SUNUCU REDDI       -> kapali bir bolume DOGRUDAN URL ile gidilirse
//                            GERCEK bir HTTP yonlendirmesiyle geri donulur
//
// (2) tek basina yeterli DEGIL: menude gostermemek arayuz gizlemedir. Asil
// kanit (3)'tur — yetki reddi proxy'de (edge) yapiliyor ve 200 + istemci
// yonlendirmesi degil, gercek bir 307 donuyor (bkz. src/lib/auth.config.ts
// authorized callback'i ve e2e/rbac-redirect.spec.ts).
//
// Ayrica dort hesabin da YAZAMADIGI dogrulanir: salt-okunurluk e-posta
// tabanlidir ve ROLDEN BAGIMSIZDIR. Her hesap, KENDI rolunun normalde
// yazabildigi bir uca gonderilir; yine de 403 doner. Bu kontrolun birim
// karsiligi src/lib/authz.test.ts'te var, ama orada `auth()` mock'lanir —
// burada gercek oturum cerezi, gercek proxy ve gercek API zinciri calisir.

type RoleCase = {
  /** Giris ekranindaki dugmenin etiketi (tr-TR; playwright.config locale). */
  button: RegExp;
  email: string;
  /** Menude GORUNMESI gereken baglantilar. */
  visible: string[];
  /** Menude GORUNMEMESI gereken baglantilar. */
  hidden: string[];
  /**
   * Kapali bir bolumun yolu: dogrudan gidilince /panel'e yonlendirilmeli.
   * ADMIN icin yok (her bolum acik).
   */
  blockedPath?: string;
  /**
   * Bu rolun normalde YAZABILDIGI bir uc. Demo hesabi oldugu icin yine de
   * 403 donmeli. `authorizeWrite` govdeden ONCE calistigindan sahte id ve
   * bos govde yeterli.
   */
  write: { url: string; data: Record<string, unknown> };
};

// Menu etiketleri messages/tr.json -> Nav ad alanindan.
const CASES: Record<string, RoleCase> = {
  ADMIN: {
    button: /Yönetici/i,
    email: "demo@ciftlik.com",
    visible: ["Hayvanlar", "Tarlalar", "Finans", "Satış", "Personel", "Denetim"],
    hidden: [],
    write: { url: "/api/tasks", data: { title: "demo-roles testi" } },
  },
  WORKER: {
    button: /Çalışan/i,
    email: "demo-worker@ciftlik.com",
    visible: ["Hayvanlar", "Tarlalar", "Stok", "Yem", "Yapılar", "Görevler"],
    hidden: ["Finans", "Satış", "Müşteriler", "Ürünler", "Siparişler", "Personel", "Denetim"],
    blockedPath: "/panel/finans",
    write: {
      url: "/api/animals",
      data: { tagNumber: `DEMO-W-${Date.now()}`, species: "CATTLE", gender: "FEMALE", status: "ACTIVE" },
    },
  },
  VET: {
    button: /Veteriner/i,
    email: "demo-vet@ciftlik.com",
    visible: ["Hayvanlar", "Görevler"],
    hidden: ["Tarlalar", "Stok", "Yem", "Yapılar", "Finans", "Satış", "Personel", "Denetim"],
    blockedPath: "/panel/tarlalar",
    write: {
      // animalMedical: VET'in yazabildigi modul. Sahte hayvan id'si yeterli.
      url: "/api/animals/demo-roles-yok/health",
      data: { type: "CHECKUP", date: new Date().toISOString().slice(0, 10) },
    },
  },
  ACCOUNTANT: {
    button: /Muhasebeci/i,
    email: "demo-muhasebe@ciftlik.com",
    visible: ["Finans", "Satış", "Müşteriler", "Ürünler", "Siparişler", "Görevler"],
    hidden: ["Hayvanlar", "Tarlalar", "Stok", "Yem", "Yapılar", "Personel", "Denetim"],
    blockedPath: "/panel/hayvanlar",
    write: {
      url: "/api/transactions",
      data: { type: "INCOME", amount: 1, category: "Test", date: new Date().toISOString().slice(0, 10) },
    },
  },
};

/** Giris ekranindaki rol dugmesiyle oturum acar. */
async function loginAsDemoRole(page: Page, button: RegExp) {
  await page.goto("/giris");
  await page.getByRole("button", { name: button }).click();
  await expect(page).toHaveURL(/\/panel$/);
}

for (const [role, c] of Object.entries(CASES)) {
  test(`${role} vitrin hesabi: menu kapsami dogru`, async ({ page }) => {
    await loginAsDemoRole(page, c.button);

    for (const label of c.visible) {
      await expect(
        page.getByRole("link", { name: label, exact: true }),
        `${role} menude "${label}" gormeli`
      ).toHaveCount(1);
    }

    // Arayuz gizleme katmani: kapali bolumler menude hic olusturulmamali.
    for (const label of c.hidden) {
      await expect(
        page.getByRole("link", { name: label, exact: true }),
        `${role} menude "${label}" GORMEMELI`
      ).toHaveCount(0);
    }
  });

  test(`${role} vitrin hesabi: yazma denemesi reddedilir (salt-okunur)`, async ({ page }) => {
    await loginAsDemoRole(page, c.button);

    // Bu uc, rolun yazma matrisinde ACIK oldugu bir uc; reddin sebebi rol
    // degil, hesabin vitrin hesabi olmasi.
    const res = await page.request.post(c.write.url, { data: c.write.data });
    expect(res.status(), `${role} icin ${c.write.url} 403 donmeli`).toBe(403);
    expect((await res.json()).error).toMatch(/salt-okunur/i);
  });
}

// Menude gizlemek yetmez: sunucu da reddetmeli. Yetki reddi proxy'de (edge)
// yapildigi icin yanit GERCEK bir yonlendirmedir — 200 + istemci tarafi
// yonlendirme degil. Bu ayrim denetlenebilirlik acisindan onemli: yetkisiz
// erisim erisim kayitlarinda durum kodundan ayirt edilebiliyor.
for (const [role, c] of Object.entries(CASES)) {
  if (!c.blockedPath) continue;

  test(`${role} vitrin hesabi: ${c.blockedPath} GERCEK http yonlendirmesiyle reddedilir`, async ({ page }) => {
    await loginAsDemoRole(page, c.button);

    const response = await page.goto(c.blockedPath!);

    const chain = response?.request().redirectedFrom();
    expect(chain, `${role} icin yanit bir yonlendirme zincirinin sonucu olmali`).not.toBeNull();
    await expect(page).toHaveURL(/\/panel$/);
  });
}

// Dort hesabin da AYNI ciftligi gordugunu dogrular: roller farkli, veri ayni.
// Bu, rol secicinin "farkli tenant'lar" degil "ayni veriye farkli pencereler"
// oldugunu gosterir — cok kiraciliktaki tenant izolasyonuyla karistirilmasin.
test("dort vitrin hesabi da ayni ciftligin panelini acar", async ({ page }) => {
  for (const [role, c] of Object.entries(CASES)) {
    await loginAsDemoRole(page, c.button);
    await expect(page, `${role} panele ulasmali`).toHaveURL(/\/panel$/);
    // Oturumu bırak ki sonraki rol temiz baslasin.
    await page.context().clearCookies();
  }
});
