/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("etiketi render eder", () => {
    render(<Button>Kaydet</Button>);
    expect(screen.getByRole("button", { name: "Kaydet" })).toBeInTheDocument();
  });

  it("loading durumunda devre disi kalir ve spinner gosterir", () => {
    const { container } = render(<Button loading>Kaydet</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });

  it("variant sinifini uygular", () => {
    render(<Button variant="danger">Sil</Button>);
    expect(screen.getByRole("button", { name: "Sil" }).className).toContain("bg-red-600");
  });
});
