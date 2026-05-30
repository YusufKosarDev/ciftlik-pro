# Çiftlik Pro — Proje Planı

Tek bir çiftliğin tüm operasyonlarını (hayvan, tarla, stok, finans, satış, personel)
tek panelden yöneten, rol bazlı yetkilendirmeye sahip, modern bir
Çiftlik Yönetim Sistemi (ERP).

---

## 1. Vizyon

Çiftlik sahibi ve ekibinin günlük işlerini dijitalleştiren kapsamlı bir yönetim
paneli. Her rol yalnızca kendi yetkili olduğu alanı görür ve yönetir. Tüm veriler
tek ve tutarlı bir veritabanında toplanır, dashboard üzerinden raporlanır.

---

## 2. Teknoloji Yığını

| Katman            | Teknoloji                  | Neden                                     |
| ----------------- | -------------------------- | ----------------------------------------- |
| Dil               | TypeScript                 | Tip güvenliği, hata yakalama              |
| Framework         | Next.js (App Router)       | Frontend + backend tek çatı               |
| Veritabanı        | PostgreSQL                 | İlişkisel veri için ideal                 |
| ORM               | Prisma                     | Tip güvenli DB erişimi, kolay migration   |
| Kimlik doğrulama  | Auth.js (NextAuth v5)      | RBAC için esnek                           |
| UI                | Tailwind CSS + shadcn/ui   | Hızlı, modern, profesyonel arayüz         |
| Form & doğrulama  | React Hook Form + Zod      | Güvenli form yönetimi                     |
| Grafikler         | Recharts                   | Dashboard grafikleri                      |
| Dosya yükleme     | Cloudinary (veya UploadThing) | Resim depolama                         |
| Test              | Vitest + Playwright        | Birim + uçtan uca test                    |
| DevOps            | Docker + GitHub Actions    | Konteyner + CI/CD                         |

---

## 3. Roller ve Yetkiler (RBAC)

| Rol                  | Yetkileri                                              |
| -------------------- | ----------------------------------------------------- |
| Admin                | Her şeye tam erişim, kullanıcı yönetimi               |
| Çalışan (Worker)     | Hayvan / tarla / stok günlük işlemleri                |
| Veteriner (Vet)      | Sağlık kaydı, aşı, tedavi                              |
| Muhasebeci (Accountant) | Finans, gelir-gider, satış                          |

---

## 4. Modüller

1. Hayvan Takibi — kayıt, sağlık, aşı takvimi, süt/et verimi
2. Tarla Yönetimi — ekim, sulama, hasat
3. Stok & Envanter — yem, ilaç, ekipman
4. Finans — gelir-gider, raporlar
5. Satış / E-ticaret — ürün satışı (ileride genişletilebilir)
6. Personel & Görevler — çalışanlar, görev atama

---

## 5. Veri Modeli Taslağı

> Detaylar Prisma şeması yazılırken netleşecek. Bu bir başlangıç haritasıdır.

- **User** — id, ad, e-posta, parola (hash), rol, oluşturulma tarihi
- **Animal** — id, kulak no, tür, cins, doğum tarihi, cinsiyet, durum
- **HealthRecord** — id, animalId, tarih, teşhis, tedavi, veterinerId
- **Vaccination** — id, animalId, aşı adı, tarih, sonraki tarih
- **MilkYield** — id, animalId, tarih, miktar (litre)
- **Field** — id, ad, alan (dönüm), konum
- **Crop** — id, fieldId, ürün adı, ekim tarihi, hasat tarihi, durum
- **InventoryItem** — id, ad, kategori (yem/ilaç/ekipman), miktar, birim, kritik seviye
- **Transaction** — id, tür (gelir/gider), tutar, kategori, tarih, açıklama
- **Product** — id, ad, fiyat, stok, görsel
- **Sale** — id, productId, miktar, toplam, tarih, müşteri
- **Task** — id, başlık, açıklama, atanan kullanıcı, durum, son tarih

İlişkiler: Animal 1-N HealthRecord / Vaccination / MilkYield • Field 1-N Crop •
User 1-N Task • Product 1-N Sale.

---

## 6. Yol Haritası (Fazlar)

> Prensip: Hepsini birden değil, faz faz. Her fazın sonunda çalışan bir şey olacak.
> Her yeni adıma geçmeden önce planlanır, onaylanır, sonra uygulanır.

### Faz 0 — Kurulum
- [x] GitHub deposu oluştur
- [x] Next.js + TypeScript projesi başlat
- [x] Tailwind CSS kurulumu (shadcn/ui sonra eklenecek)
- [x] PostgreSQL (Docker ile) ayağa kaldır (port 5433)
- [x] Prisma 6 kurulumu ve bağlantısı + Client singleton
- [x] .env yönetimi ve .gitignore

### Faz 1 — Kimlik Doğrulama & RBAC
- [x] Auth.js (NextAuth v5) kurulumu
- [x] Kayıt / giriş sayfaları
- [x] Parola hashleme (bcrypt)
- [x] Giriş koruması (middleware) — rol bazlı detay yetki modüllerde eklenecek
- [x] Korumalı panel iskeleti + çıkış (logout) ve menü

### Faz 2 — Çekirdek MVP: Hayvan Modülü
- [x] Animal CRUD (ekle / listele / düzenle / sil) + detay sayfası
- [x] Sağlık kaydı (HealthRecord)
- [x] Aşı takvimi (Vaccination) + tarih uyarıları
- [x] Süt verimi (MilkYield) + özet kartları
- [x] Bu modül diğer modüller için şablon olacak

### Faz 3 — Diğer Modüller
- [ ] Tarla Yönetimi (Field, Crop)
- [ ] Stok & Envanter (InventoryItem)
- [ ] Finans (Transaction)
- [ ] Personel & Görevler (Task)

### Faz 4 — Dashboard & Raporlama
- [ ] Genel özet kartları
- [ ] Süt verimi grafiği
- [ ] Gelir-gider grafiği
- [ ] Kritik stok uyarıları

### Faz 5 — Dosya / Resim Yükleme
- [ ] Hayvan fotoğrafı
- [ ] Ürün görseli
- [ ] Cloudinary entegrasyonu

### Faz 6 — Test
- [x] Vitest ile birim testleri (12 test)
- [x] Playwright ile uçtan uca testler (giriş akışı, koruma)

### Faz 7 — Docker & CI/CD
- [ ] Uygulama için Dockerfile
- [ ] docker-compose (uygulama + veritabanı)
- [x] GitHub Actions ile CI (typecheck + lint + birim testleri)

### Faz 8 — (Opsiyonel) E-ticaret Genişletme
- [ ] Müşteri tarafı vitrin
- [ ] Sepet ve sipariş
- [ ] Ödeme entegrasyonu

---

## 7. Çalışma Prensipleri

- Her adım önce açıklanır, onaylanır, sonra uygulanır. Yavaş ve parça parça.
- Her faz sonunda çalışan bir çıktı olur.
- Kod okunabilir ve tip güvenli tutulur.
