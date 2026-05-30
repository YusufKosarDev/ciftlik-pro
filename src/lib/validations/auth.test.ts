import { describe, it, expect } from "vitest";
import { registerSchema } from "./auth";

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
