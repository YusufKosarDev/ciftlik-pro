import { describe, it, expect } from "vitest";
import { passwordChangeSchema } from "./password";

const valid = {
  currentPassword: "eski1234",
  newPassword: "yeni12345",
  confirmPassword: "yeni12345",
};

describe("passwordChangeSchema", () => {
  it("gecerli girisi kabul eder", () => {
    expect(passwordChangeSchema.safeParse(valid).success).toBe(true);
  });

  it("bos mevcut parolayi reddeder", () => {
    expect(passwordChangeSchema.safeParse({ ...valid, currentPassword: "" }).success).toBe(false);
  });

  it("8 karakterden kisa yeni parolayi reddeder", () => {
    const r = passwordChangeSchema.safeParse({
      ...valid,
      newPassword: "kisa",
      confirmPassword: "kisa",
    });
    expect(r.success).toBe(false);
  });

  it("eslesmeyen tekrari reddeder", () => {
    const r = passwordChangeSchema.safeParse({ ...valid, confirmPassword: "baska12345" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.flatten().fieldErrors.confirmPassword).toBeDefined();
    }
  });
});
