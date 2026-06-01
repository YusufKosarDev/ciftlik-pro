/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("baslik, aciklama ve aksiyonu render eder", () => {
    render(
      <EmptyState
        title="Kayit yok"
        description="Henuz veri eklenmemis"
        action={<button>Ekle</button>}
      />
    );
    expect(screen.getByText("Kayit yok")).toBeInTheDocument();
    expect(screen.getByText("Henuz veri eklenmemis")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ekle" })).toBeInTheDocument();
  });

  it("aciklama ve aksiyon opsiyoneldir", () => {
    render(<EmptyState title="Bos" />);
    expect(screen.getByText("Bos")).toBeInTheDocument();
  });
});
