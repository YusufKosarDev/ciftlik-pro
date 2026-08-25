import { describe, it, expect } from "vitest";
import { navHrefsFor, panelSectionOf, canViewPanelPath, navByRole } from "./nav-permissions";

describe("panelSectionOf", () => {
  it("panel kokunu kendisi olarak dondurur", () => {
    expect(panelSectionOf("/panel")).toBe("/panel");
    expect(panelSectionOf("/panel/")).toBe("/panel");
  });

  it("alt rotalari ust bolume indirger", () => {
    expect(panelSectionOf("/panel/finans")).toBe("/panel/finans");
    expect(panelSectionOf("/panel/finans/yeni")).toBe("/panel/finans");
    expect(panelSectionOf("/panel/finans/abc123/duzenle")).toBe("/panel/finans");
    expect(panelSectionOf("/panel/hayvanlar/abc/duzenle")).toBe("/panel/hayvanlar");
    expect(panelSectionOf("/panel/tarlalar/a/ekim/b/duzenle")).toBe("/panel/tarlalar");
  });
});

describe("navHrefsFor", () => {
  it("her rol icin panel kokunu icerir", () => {
    for (const role of Object.keys(navByRole) as Array<keyof typeof navByRole>) {
      expect(navHrefsFor(role).has("/panel")).toBe(true);
    }
  });

  it("ADMIN en genis kumeye sahiptir", () => {
    const admin = navHrefsFor("ADMIN");
    for (const role of ["WORKER", "VET", "ACCOUNTANT"] as const) {
      for (const href of navHrefsFor(role)) {
        expect(admin.has(href)).toBe(true);
      }
    }
  });
});

describe("canViewPanelPath", () => {
  it("rolun bolumune ve alt rotalarina izin verir", () => {
    expect(canViewPanelPath("ACCOUNTANT", "/panel/finans")).toBe(true);
    expect(canViewPanelPath("ACCOUNTANT", "/panel/finans/yeni")).toBe(true);
    expect(canViewPanelPath("ACCOUNTANT", "/panel/finans/abc/duzenle")).toBe(true);
  });

  it("rolun bolumu disindaki yollari alt rotalariyla birlikte engeller", () => {
    expect(canViewPanelPath("WORKER", "/panel/finans")).toBe(false);
    expect(canViewPanelPath("WORKER", "/panel/finans/yeni")).toBe(false);
    expect(canViewPanelPath("WORKER", "/panel/finans/abc/duzenle")).toBe(false);
    expect(canViewPanelPath("VET", "/panel/personel")).toBe(false);
    expect(canViewPanelPath("VET", "/panel/denetim")).toBe(false);
    expect(canViewPanelPath("ACCOUNTANT", "/panel/hayvanlar")).toBe(false);
  });

  it("panel kokunu herkese acar", () => {
    expect(canViewPanelPath("VET", "/panel")).toBe(true);
    expect(canViewPanelPath("WORKER", "/panel")).toBe(true);
  });

  it("kisisel/ortak sayfalari bolum kisitina tabi tutmaz", () => {
    // Profil kisiseldir; abonelik sayfasi kendi icinde ADMIN kontrolu yapar.
    expect(canViewPanelPath("WORKER", "/panel/profil")).toBe(true);
    expect(canViewPanelPath("VET", "/panel/abonelik")).toBe(true);
  });

  it("bilinmeyen bir bolumu engellemez (fail-open)", () => {
    // Menude tanimli olmayan yeni bir sayfa sessizce erisilemez olmamali;
    // yetkilendirme sunucu tarafinda ayrica uygulanir.
    expect(canViewPanelPath("WORKER", "/panel/yeni-modul")).toBe(true);
  });

  it("ADMIN her bolumu gorebilir", () => {
    for (const href of navByRole.ADMIN) {
      expect(canViewPanelPath("ADMIN", href)).toBe(true);
      expect(canViewPanelPath("ADMIN", `${href}/yeni`)).toBe(true);
    }
  });
});
