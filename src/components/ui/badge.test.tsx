/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("icerigi render eder", () => {
    render(<Badge>Aktif</Badge>);
    expect(screen.getByText("Aktif")).toBeInTheDocument();
  });

  it("tone'a gore renk sinifi uygular", () => {
    render(<Badge tone="red">Kritik</Badge>);
    expect(screen.getByText("Kritik").className).toContain("bg-red-100");
  });

  it("tone verilmezse varsayilan (gray) uygular", () => {
    render(<Badge>Notr</Badge>);
    expect(screen.getByText("Notr").className).toContain("bg-muted");
  });
});
