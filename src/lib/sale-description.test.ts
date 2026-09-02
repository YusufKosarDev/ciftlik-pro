import { describe, it, expect } from "vitest";
import { saleDescription } from "./sale-description";

// Two write endpoints depend on this producing the same string, so the shape of
// the output is the contract: editing a sale must not reword the income
// transaction it is linked to.
describe("saleDescription", () => {
  it("appends the customer when there is one", () => {
    expect(saleDescription("Süt", "Ahmet Yılmaz")).toBe("Süt — Ahmet Yılmaz");
  });

  it("returns the item alone when there is no customer", () => {
    expect(saleDescription("Süt")).toBe("Süt");
  });

  // A sale can be recorded without a customer, and Prisma hands back null rather
  // than undefined for an unset relation — both have to read as "no customer".
  it("treats null and undefined alike", () => {
    expect(saleDescription("Yumurta", null)).toBe("Yumurta");
    expect(saleDescription("Yumurta", undefined)).toBe("Yumurta");
  });

  // An empty string is falsy, so it takes the same branch; asserting it keeps a
  // future refactor from turning it into a dangling separator.
  it("does not leave a dangling separator for an empty customer", () => {
    expect(saleDescription("Bal", "")).toBe("Bal");
  });
});
