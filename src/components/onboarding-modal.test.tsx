/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithIntl as render } from "../test-utils";
import { OnboardingModal } from "./onboarding-modal";

// Mock the next/navigation router (the component uses useRouter().refresh).
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
}));

// Mock the next-auth session update (finish -> update({onboarded:true})).
const update = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => ({ update }),
}));

beforeEach(() => {
  refresh.mockClear();
  update.mockClear();
  // Mock fetch, to capture the completion requests.
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }))
  );
});

describe("OnboardingModal", () => {
  it("ilk adimda isimle selamlar ve adim sayacini gosterir", () => {
    render(<OnboardingModal userName="Yusuf Kaan" role="WORKER" />);
    expect(screen.getByText(/Merhaba Yusuf/)).toBeInTheDocument();
    expect(screen.getByText("Adım 1 / 5")).toBeInTheDocument();
  });

  it("Ileri butonu adimi ilerletir", () => {
    render(<OnboardingModal userName="Ayse" role="WORKER" />);
    fireEvent.click(screen.getByRole("button", { name: /İleri/ }));
    expect(screen.getByText("Adım 2 / 5")).toBeInTheDocument();
    expect(screen.getByText("Ana Modüller")).toBeInTheDocument();
  });

  it("role ozel adim, rolun yetkilerini gosterir (VET)", () => {
    render(<OnboardingModal userName="Vet" role="VET" />);
    // Go to step 3
    fireEvent.click(screen.getByRole("button", { name: /İleri/ }));
    fireEvent.click(screen.getByRole("button", { name: /İleri/ }));
    expect(
      screen.getByText(/Veteriner olarak neler yapabilirsin/)
    ).toBeInTheDocument();
    expect(screen.getByText(/aşı takvimini yönet/)).toBeInTheDocument();
  });

  it("Gec butonu tamamlama istegi gonderir ve modali kapatir", async () => {
    render(<OnboardingModal userName="Yusuf" role="ADMIN" />);
    fireEvent.click(screen.getByRole("button", { name: "Geç" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/profile/onboarding", {
        method: "POST",
      });
    });
    await waitFor(() => {
      expect(screen.queryByText("Adım 1 / 5")).not.toBeInTheDocument();
    });
    expect(update).toHaveBeenCalledWith({ onboarded: true });
    expect(refresh).toHaveBeenCalled();
  });

  it("son adimda Basla butonu cikar ve turu tamamlar", async () => {
    render(<OnboardingModal userName="Yusuf" role="ACCOUNTANT" />);
    // Advance to the last step (5 steps -> Next 4 times)
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole("button", { name: /İleri/ }));
    }
    expect(screen.getByText("Adım 5 / 5")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Başla/ }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/profile/onboarding", {
        method: "POST",
      });
    });
  });
});
