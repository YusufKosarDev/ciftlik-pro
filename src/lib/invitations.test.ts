import { describe, it, expect } from "vitest";
import { isInvitationUsable, type InvitationByToken } from "./invitations";

// Davetin kabul edilebilirlik kurali: tek kullanimlik + suresi dolmamis.
// Bu kural hem public davet sayfasinda hem kabul ucunda ayni yerden okunur.
const base: InvitationByToken = {
  id: "inv-1",
  tenantId: "tenant-1",
  email: "davetli@ornek.com",
  role: "WORKER",
  expiresAt: new Date("2026-01-10T00:00:00Z"),
  acceptedAt: null,
};
const now = new Date("2026-01-01T00:00:00Z");

describe("isInvitationUsable", () => {
  it("gecerli davet: kabul edilmemis ve suresi dolmamis", () => {
    expect(isInvitationUsable(base, now)).toBe(true);
  });

  it("token bulunamadiysa (null) kullanilamaz", () => {
    expect(isInvitationUsable(null, now)).toBe(false);
  });

  it("tek kullanimlik: kabul edilmis davet tekrar kullanilamaz", () => {
    expect(isInvitationUsable({ ...base, acceptedAt: new Date("2026-01-05T00:00:00Z") }, now)).toBe(
      false
    );
  });

  it("suresi dolmus davet kullanilamaz", () => {
    expect(isInvitationUsable({ ...base, expiresAt: new Date("2025-12-31T00:00:00Z") }, now)).toBe(
      false
    );
  });

  it("son gecerlilik ani sinirdir: tam o anda artik kullanilamaz", () => {
    expect(isInvitationUsable({ ...base, expiresAt: now }, now)).toBe(false);
  });
});
