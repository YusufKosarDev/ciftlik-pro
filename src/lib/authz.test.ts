import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Role } from "@prisma/client";

// authz.ts imports @/lib/auth (next-auth + prisma + bcrypt), next/server and
// next/navigation. Those are lightly mocked here so the pure policy logic can be
// tested in isolation. The auth mock has to be hoisted.
const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error("REDIRECT:" + url);
  },
}));
// authorizeWrite translates its error messages through the Errors namespace, and
// getTranslations wants a real request context. These tests assert the status code
// rather than the message TEXT, so the translator simply returns the key.
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

import {
  canWrite,
  navHrefsFor,
  authorizeWrite,
  requirePageWrite,
  requirePageView,
  writePermissions,
  DEMO_EMAILS,
  isDemoUser,
  type WriteModule,
} from "@/lib/authz";

// One of the showcase accounts (the ADMIN one). The WHOLE list is also swept
// below, to show the refusal is independent of role.
const DEMO_EMAIL = "demo@ciftlik.com";

describe("canWrite — yazma izin matrisi", () => {
  it("ADMIN her modulde yazabilir", () => {
    for (const m of Object.keys(writePermissions) as WriteModule[]) {
      expect(canWrite("ADMIN", m)).toBe(true);
    }
  });

  it("WORKER: hayvan/tarla/stok/sut evet; digerleri hayir", () => {
    expect(canWrite("WORKER", "animals")).toBe(true);
    expect(canWrite("WORKER", "fields")).toBe(true);
    expect(canWrite("WORKER", "inventory")).toBe(true);
    expect(canWrite("WORKER", "milk")).toBe(true);
    expect(canWrite("WORKER", "animalMedical")).toBe(false);
    expect(canWrite("WORKER", "transactions")).toBe(false);
    expect(canWrite("WORKER", "tasks")).toBe(false);
    expect(canWrite("WORKER", "users")).toBe(false);
  });

  it("VET: sadece saglik/asi (animalMedical)", () => {
    expect(canWrite("VET", "animalMedical")).toBe(true);
    expect(canWrite("VET", "animals")).toBe(false);
    expect(canWrite("VET", "milk")).toBe(false);
    expect(canWrite("VET", "fields")).toBe(false);
    expect(canWrite("VET", "transactions")).toBe(false);
    expect(canWrite("VET", "tasks")).toBe(false);
    expect(canWrite("VET", "users")).toBe(false);
  });

  it("ACCOUNTANT: sadece finans (transactions)", () => {
    expect(canWrite("ACCOUNTANT", "transactions")).toBe(true);
    expect(canWrite("ACCOUNTANT", "animals")).toBe(false);
    expect(canWrite("ACCOUNTANT", "animalMedical")).toBe(false);
    expect(canWrite("ACCOUNTANT", "inventory")).toBe(false);
    expect(canWrite("ACCOUNTANT", "tasks")).toBe(false);
    expect(canWrite("ACCOUNTANT", "users")).toBe(false);
  });

  it("gorev ve personel yalnizca ADMIN", () => {
    for (const role of ["WORKER", "VET", "ACCOUNTANT"] as const) {
      expect(canWrite(role, "tasks")).toBe(false);
      expect(canWrite(role, "users")).toBe(false);
    }
  });
});

describe("navHrefsFor — menu gorunurlugu", () => {
  it("ADMIN tum menuleri gorur (personel dahil)", () => {
    const n = navHrefsFor("ADMIN");
    expect(n.has("/panel/personel")).toBe(true);
    expect(n.has("/panel/finans")).toBe(true);
    expect(n.has("/panel/hayvanlar")).toBe(true);
  });

  it("WORKER finans ve personel gormez", () => {
    const n = navHrefsFor("WORKER");
    expect(n.has("/panel/hayvanlar")).toBe(true);
    expect(n.has("/panel/stok")).toBe(true);
    expect(n.has("/panel/finans")).toBe(false);
    expect(n.has("/panel/personel")).toBe(false);
  });

  it("VET sadece panel/hayvanlar/gorevler gorur", () => {
    const n = navHrefsFor("VET");
    expect(n.has("/panel/hayvanlar")).toBe(true);
    expect(n.has("/panel/gorevler")).toBe(true);
    expect(n.has("/panel/tarlalar")).toBe(false);
    expect(n.has("/panel/finans")).toBe(false);
  });

  it("ACCOUNTANT sadece panel/finans/gorevler gorur", () => {
    const n = navHrefsFor("ACCOUNTANT");
    expect(n.has("/panel/finans")).toBe(true);
    expect(n.has("/panel/gorevler")).toBe(true);
    expect(n.has("/panel/hayvanlar")).toBe(false);
    expect(n.has("/panel/stok")).toBe(false);
  });
});

describe("authorizeWrite — API yetki kontrolu", () => {
  beforeEach(() => authMock.mockReset());

  it("oturum yoksa 401 hatasi doner", async () => {
    authMock.mockResolvedValue(null);
    const r = await authorizeWrite("animals");
    expect("error" in r).toBe(true);
    if ("error" in r) expect(r.error?.status).toBe(401);
  });

  it("yetkisiz rolde 403 hatasi doner", async () => {
    authMock.mockResolvedValue({ user: { role: "VET" } });
    const r = await authorizeWrite("animals");
    expect("error" in r).toBe(true);
    if ("error" in r) expect(r.error?.status).toBe(403);
  });

  it("yetkili rolde session doner (hata yok)", async () => {
    authMock.mockResolvedValue({ user: { role: "WORKER" } });
    const r = await authorizeWrite("animals");
    expect("error" in r).toBe(false);
    expect("session" in r).toBe(true);
  });

  it("demo hesabi yetkili rolde olsa bile 403 (salt-okunur)", async () => {
    // The ADMIN role may write; the demo email address still must not.
    authMock.mockResolvedValue({ user: { role: "ADMIN", email: DEMO_EMAIL } });
    const r = await authorizeWrite("animals");
    expect("error" in r).toBe(true);
    if ("error" in r) expect(r.error?.status).toBe(403);
  });

  it("demo e-postasi buyuk/kucuk harf duyarsiz reddedilir", async () => {
    authMock.mockResolvedValue({ user: { role: "ADMIN", email: DEMO_EMAIL.toUpperCase() } });
    const r = await authorizeWrite("animals");
    expect("error" in r).toBe(true);
    if ("error" in r) expect(r.error?.status).toBe(403);
  });

  // The showcase now carries one account per role. Each is checked to be refused
  // even in a module its OWN role may write — the guard comes from the email
  // address, not the role. Without this test, adding a demo account and forgetting
  // to put it in the isDemoUser list would go unnoticed.
  it("TUM demo hesaplari, kendi rollerinin yazabildigi modulde bile reddedilir", async () => {
    const rolePerEmail: Record<string, { role: Role; module: WriteModule }> = {
      "demo@ciftlik.com": { role: "ADMIN", module: "tasks" },
      "demo-worker@ciftlik.com": { role: "WORKER", module: "animals" },
      "demo-vet@ciftlik.com": { role: "VET", module: "animalMedical" },
      "demo-muhasebe@ciftlik.com": { role: "ACCOUNTANT", module: "transactions" },
    };

    // Are the list and the test table the same set? (if one grows, so must the
    // other)
    expect(Object.keys(rolePerEmail).sort()).toEqual([...DEMO_EMAILS].sort());

    for (const [email, { role, module }] of Object.entries(rolePerEmail)) {
      // Sanity check: this role should normally be ABLE to write in this module.
      expect(canWrite(role, module), `${role} ${module} yazabilmeli`).toBe(true);
      expect(isDemoUser(email), `${email} demo sayilmali`).toBe(true);

      authMock.mockResolvedValue({ user: { role, email } });
      const r = await authorizeWrite(module);
      expect("error" in r, `${email} reddedilmeli`).toBe(true);
      if ("error" in r) expect(r.error?.status).toBe(403);
    }
  });
});

describe("requirePageWrite — sayfa korumasi", () => {
  beforeEach(() => authMock.mockReset());

  it("oturum yoksa panele yonlendirir", async () => {
    authMock.mockResolvedValue(null);
    await expect(requirePageWrite("animals")).rejects.toThrow("REDIRECT:/panel");
  });

  it("yetkisiz rolde panele yonlendirir", async () => {
    authMock.mockResolvedValue({ user: { role: "ACCOUNTANT" } });
    await expect(requirePageWrite("animals")).rejects.toThrow("REDIRECT:/panel");
  });

  it("demo hesabi panele yonlendirir (yazma yok)", async () => {
    authMock.mockResolvedValue({ user: { role: "ADMIN", email: DEMO_EMAIL } });
    await expect(requirePageWrite("animals")).rejects.toThrow("REDIRECT:/panel");
  });

  it("yetkili rolde oturumu doner", async () => {
    authMock.mockResolvedValue({ user: { role: "ADMIN" } });
    const s = await requirePageWrite("animals");
    expect(s.user.role).toBe("ADMIN");
  });
});

describe("requirePageView — hassas sayfa okuma korumasi", () => {
  beforeEach(() => authMock.mockReset());

  it("oturum yoksa girise yonlendirir", async () => {
    authMock.mockResolvedValue(null);
    await expect(requirePageView("/panel/finans")).rejects.toThrow("REDIRECT:/giris");
  });

  it("rol menude gormeyen yolu acmaya calisirsa panele yonlendirir", async () => {
    // WORKER cannot see finance; opening it by URL is blocked.
    authMock.mockResolvedValue({ user: { role: "WORKER" } });
    await expect(requirePageView("/panel/finans")).rejects.toThrow("REDIRECT:/panel");
  });

  it("rol menude goren yolu acabilir (oturum doner)", async () => {
    authMock.mockResolvedValue({ user: { role: "ACCOUNTANT" } });
    const s = await requirePageView("/panel/finans");
    expect(s.user.role).toBe("ACCOUNTANT");
  });
});
