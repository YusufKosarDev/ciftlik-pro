import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password-hash";

describe("password-hash", () => {
  it("parolayi scrypt formatinda basariyla hash'ler", async () => {
    const plain = "parola1234";
    const hash = await hashPassword(plain);
    expect(hash.startsWith("scrypt$")).toBe(true);
    const parts = hash.split("$");
    expect(parts.length).toBe(3);
    expect(parts[1]).toHaveLength(32); // 16 byte salt hex string
    expect(parts[2]).toHaveLength(128); // 64 byte keyLen hex string
  });

  it("dogru parolayi scrypt ile dogrular", async () => {
    const plain = "benimGucluSifrem";
    const hash = await hashPassword(plain);
    const isValid = await verifyPassword(plain, hash);
    expect(isValid).toBe(true);
  });

  it("yanlis parolayi scrypt ile reddeder", async () => {
    const plain = "benimGucluSifrem";
    const hash = await hashPassword(plain);
    const isValid = await verifyPassword("farkliSifre", hash);
    expect(isValid).toBe(false);
  });

  it("gecersiz scrypt formatlarinda false doner", async () => {
    expect(await verifyPassword("sifre", "scrypt$saltHexOnly")).toBe(false);
    expect(await verifyPassword("sifre", "gecersizFormat")).toBe(false);
  });

  it("eski bcrypt hashlerini geriye donuk uyumlu sekilde dogrular", async () => {
    // A bcrypt hash of the password "sifre1234", generated at cost 10
    const bcryptHash = "$2b$10$wmoGyVt7NUGydA7ffQ4t2OzWmzp1RfPQf2wEF8GtEXTR63ApZjDbm";
    
    const isValid = await verifyPassword("sifre1234", bcryptHash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword("yanlisSifre", bcryptHash);
    expect(isInvalid).toBe(false);
  });
});

// The seed and bootstrap scripts run in Docker without tsx, so they use a separate
// .mjs implementation (prisma/password-hash.mjs). The two implementations MUST
// produce the same format: otherwise the seeded accounts cannot sign in.
describe("seed script'i ile uyum (prisma/password-hash.mjs)", () => {
  it("mjs uygulamasinin urettigi hash, uygulama tarafinda dogrulanir", async () => {
    const { hashPassword: hashFromSeed } = await import("../../prisma/password-hash.mjs");
    const hash = await hashFromSeed("sifre1234");

    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(hash.split("$")).toHaveLength(3);
    await expect(verifyPassword("sifre1234", hash)).resolves.toBe(true);
    await expect(verifyPassword("yanlisparola", hash)).resolves.toBe(false);
  });
});
