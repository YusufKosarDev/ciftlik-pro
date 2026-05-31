import { describe, it, expect } from "vitest";
import { collectAlerts, renderAlertsHtml } from "./notifications";

const NOW = new Date("2026-05-31T12:00:00");

const baseInput = {
  inventory: [
    { name: "Arpa", quantity: 500, criticalLevel: 100, unit: "kg" }, // normal
    { name: "Antibiyotik", quantity: 5, criticalLevel: 10, unit: "adet" }, // kritik
    { name: "Tuz", quantity: 10, criticalLevel: 10, unit: "kg" }, // kritik (esit)
  ],
  tasks: [
    { title: "Geciken", status: "PENDING", dueDate: new Date("2026-05-20") }, // gecikti
    { title: "Gelecek", status: "PENDING", dueDate: new Date("2026-06-20") }, // gelecek
    { title: "Bitti", status: "DONE", dueDate: new Date("2026-05-20") }, // gecikmis ama DONE
    { title: "Tarihsiz", status: "PENDING", dueDate: null }, // tarih yok
  ],
  vaccinations: [
    { name: "Sap", nextDate: new Date("2026-06-10"), animal: { tagNumber: "TR-1", name: "Sarikiz" } }, // pencere icinde
    { name: "Eski", nextDate: new Date("2026-05-01"), animal: { tagNumber: "TR-2", name: null } }, // gecmis
    { name: "Uzak", nextDate: new Date("2026-09-01"), animal: { tagNumber: "TR-3", name: null } }, // pencere disi
    { name: "Yok", nextDate: null, animal: { tagNumber: "TR-4", name: null } }, // tarih yok
  ],
};

describe("collectAlerts", () => {
  it("kritik stogu dogru secer (quantity <= criticalLevel)", () => {
    const a = collectAlerts(baseInput, NOW);
    expect(a.criticalStock.map((i) => i.name)).toEqual(["Antibiyotik", "Tuz"]);
  });

  it("yalnizca tamamlanmamis ve tarihi gecmis gorevleri secer", () => {
    const a = collectAlerts(baseInput, NOW);
    expect(a.overdueTasks.map((t) => t.title)).toEqual(["Geciken"]);
  });

  it("yalnizca pencere icindeki (now..+30g) asilari secer", () => {
    const a = collectAlerts(baseInput, NOW);
    expect(a.upcomingVaccinations.map((v) => v.name)).toEqual(["Sap"]);
  });

  it("toplam uyari sayisini hesaplar", () => {
    const a = collectAlerts(baseInput, NOW);
    expect(a.total).toBe(2 + 1 + 1);
  });

  it("hic uyari yoksa total 0 olur", () => {
    const a = collectAlerts({ inventory: [], tasks: [], vaccinations: [] }, NOW);
    expect(a.total).toBe(0);
  });
});

describe("renderAlertsHtml", () => {
  it("uyari basliklarini ve ogeleri icerir", () => {
    const html = renderAlertsHtml(collectAlerts(baseInput, NOW));
    expect(html).toContain("Kritik Stok");
    expect(html).toContain("Antibiyotik");
    expect(html).toContain("Geciken Görevler");
    expect(html).toContain("Yaklaşan Aşılar");
    expect(html).toContain("Sarikiz");
  });

  it("bos uyarilarda yalnizca baslik doner, bolum eklenmez", () => {
    const html = renderAlertsHtml(
      collectAlerts({ inventory: [], tasks: [], vaccinations: [] }, NOW)
    );
    expect(html).toContain("Günlük Uyarılar");
    expect(html).not.toContain("Kritik Stok");
    expect(html).not.toContain("Geciken Görevler");
    expect(html).not.toContain("Yaklaşan Aşılar");
  });
});
