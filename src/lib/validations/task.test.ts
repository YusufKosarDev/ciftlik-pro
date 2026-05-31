import { describe, it, expect } from "vitest";
import { taskSchema } from "./task";

describe("taskSchema", () => {
  it("gecerli gorevi kabul eder", () => {
    const result = taskSchema.safeParse({
      title: "Ahir temizligi",
      assignedToId: "abc123",
      status: "PENDING",
      dueDate: "2026-06-01",
    });
    expect(result.success).toBe(true);
  });

  it("bos basligi reddeder", () => {
    const result = taskSchema.safeParse({ title: "   " });
    expect(result.success).toBe(false);
  });

  it("durum verilmezse PENDING varsayar", () => {
    const result = taskSchema.safeParse({ title: "Yem siparisi" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("PENDING");
  });

  it("opsiyonel alanlar bos birakilabilir", () => {
    const result = taskSchema.safeParse({
      title: "Sulama",
      description: "",
      assignedToId: "",
      dueDate: "",
    });
    expect(result.success).toBe(true);
  });

  it("gecersiz durumu reddeder", () => {
    const result = taskSchema.safeParse({ title: "Test", status: "BITTI" });
    expect(result.success).toBe(false);
  });
});
