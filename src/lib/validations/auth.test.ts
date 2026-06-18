import { describe, it, expect } from "vitest";
import { registerSchema, signupSchema, inviteSchema, slugify } from "./auth";

describe("registerSchema", () => {
  const valid = {
    name: "Veteriner Veli",
    email: "veli@ciftlik.com",
    password: "sifre1234",
    role: "VET",
  };

  it("gecerli kullaniciyi kabul eder", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("e-postayi kucuk harfe cevirir ve bosluklari kirpar", () => {
    const result = registerSchema.safeParse({
      ...valid,
      email: "  VELI@Ciftlik.COM  ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("veli@ciftlik.com");
  });

  it("8 karakterden kisa parolayi reddeder", () => {
    const result = registerSchema.safeParse({ ...valid, password: "kisa12" });
    expect(result.success).toBe(false);
  });

  it("rol verilmezse WORKER varsayar", () => {
    const result = registerSchema.safeParse({
      name: valid.name,
      email: valid.email,
      password: valid.password,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.role).toBe("WORKER");
  });

  it("gecersiz rolu reddeder", () => {
    const result = registerSchema.safeParse({ ...valid, role: "SUPERADMIN" });
    expect(result.success).toBe(false);
  });

  it("gecersiz e-postayi reddeder", () => {
    const result = registerSchema.safeParse({ ...valid, email: "gecersiz" });
    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  const valid = {
    farmName: "Yesil Vadi Ciftligi",
    name: "Ahmet Yilmaz",
    email: "ahmet@vadi.com",
    password: "sifre1234",
  };

  it("gecerli kaydi kabul eder", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("kisa ciftlik adini reddeder", () => {
    expect(signupSchema.safeParse({ ...valid, farmName: "A" }).success).toBe(false);
  });

  it("e-postayi normalize eder", () => {
    const r = signupSchema.safeParse({ ...valid, email: "  Ahmet@Vadi.COM " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("ahmet@vadi.com");
  });

  it("kisa parolayi reddeder", () => {
    expect(signupSchema.safeParse({ ...valid, password: "1234" }).success).toBe(false);
  });
});

describe("inviteSchema", () => {
  it("rol verilmezse WORKER varsayar", () => {
    const r = inviteSchema.safeParse({ email: "x@y.com" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.role).toBe("WORKER");
  });

  it("gecersiz rolu reddeder", () => {
    expect(inviteSchema.safeParse({ email: "x@y.com", role: "ROOT" }).success).toBe(false);
  });
});

describe("slugify", () => {
  it("turkce karakterleri sadelestirir ve bosluklari tireye cevirir", () => {
    expect(slugify("Yeşil Vadi Çiftliği")).toBe("yesil-vadi-ciftligi");
  });

  it("bas/son tireleri ve fazla sembolleri temizler", () => {
    expect(slugify("  --Acme! & Co.--  ")).toBe("acme-co");
  });

  it("uzunlugu 40 karaktere kirpar", () => {
    expect(slugify("a".repeat(60)).length).toBe(40);
  });

  it("yalnizca sembol iceren girdide bos string doner", () => {
    expect(slugify("!!! ???")).toBe("");
  });
});
