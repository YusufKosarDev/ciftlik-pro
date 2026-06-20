/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, act } from "@testing-library/react";
import { renderWithIntl as render } from "@/test-utils";
import { DataTable, type Column } from "./data-table";
import type { ListState } from "@/lib/list-query";

// next/navigation mock'u: URL guncellemelerini (router.replace) yakalariz.
const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/panel/test",
  useSearchParams: () => new URLSearchParams(""),
}));

type Row = { id: string; name: string; n: number };

const rows: Row[] = Array.from({ length: 10 }, (_, i) => ({
  id: String(i),
  name: `Hayvan ${i}`,
  n: i,
}));

const columns: Column<Row>[] = [
  { key: "name", header: "Ad", cell: (r) => r.name },
  { key: "n", header: "Sayi", sortKey: "n", cell: (r) => String(r.n) },
];

const list: ListState = { total: 12, page: 1, pageSize: 10, q: "", sort: "name", dir: "asc" };

function bodyRows() {
  return screen.getAllByRole("row").slice(1); // thead satirini cikar
}

describe("DataTable", () => {
  beforeEach(() => replace.mockClear());

  it("verilen satirlari ve sayfalama bilgisini gosterir", () => {
    render(<DataTable data={rows} columns={columns} list={list} searchable />);
    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByText("12 kayıt")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("sonraki sayfa URL'i gunceller (?page=2)", () => {
    render(<DataTable data={rows} columns={columns} list={list} searchable />);
    fireEvent.click(screen.getByLabelText("Sonraki sayfa"));
    expect(replace).toHaveBeenCalledWith("/panel/test?page=2", { scroll: false });
  });

  it("kolon basligina tiklayinca siralama URL'i gunceller", () => {
    render(<DataTable data={rows} columns={columns} list={list} searchable />);
    fireEvent.click(screen.getByRole("button", { name: /Sayi/ }));
    expect(replace).toHaveBeenCalledWith("/panel/test?sort=n&dir=asc", { scroll: false });
  });

  it("arama debounce sonrasi URL'i gunceller (?q=)", () => {
    vi.useFakeTimers();
    try {
      render(<DataTable data={rows} columns={columns} list={list} searchable searchPlaceholder="Ara..." />);
      fireEvent.change(screen.getByPlaceholderText("Ara..."), { target: { value: "inek" } });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(replace).toHaveBeenCalledWith("/panel/test?q=inek", { scroll: false });
    } finally {
      vi.useRealTimers();
    }
  });

  it("arama varken eslesme yoksa mesaj gosterir", () => {
    const empty: ListState = { ...list, total: 0, q: "zzz" };
    render(<DataTable data={[]} columns={columns} list={empty} searchable />);
    expect(screen.getByText(/eşleşen kayıt bulunamadı/)).toBeInTheDocument();
  });

  it("veri yoksa ve arama yoksa emptyState gosterir", () => {
    const empty: ListState = { ...list, total: 0, q: "" };
    render(
      <DataTable
        data={[]}
        columns={columns}
        list={empty}
        emptyState={<div>Hic kayit yok</div>}
      />
    );
    expect(screen.getByText("Hic kayit yok")).toBeInTheDocument();
  });
});
