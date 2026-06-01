/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { DataTable, type Column } from "./data-table";

type Row = { id: string; name: string; n: number };

// 12 satir -> varsayilan pageSize=10 ile 2 sayfa.
const data: Row[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i),
  name: `Hayvan ${i}`,
  n: i,
}));

const columns: Column<Row>[] = [
  { key: "name", header: "Ad", sortValue: (r) => r.name, cell: (r) => r.name },
  { key: "n", header: "Sayi", sortValue: (r) => r.n, cell: (r) => String(r.n) },
];

function bodyRows() {
  // thead'deki baslik satirini haric tut.
  const rows = screen.getAllByRole("row");
  return rows.slice(1);
}

describe("DataTable", () => {
  it("sayfa boyutu kadar satir gosterir ve sayfalama kurar", () => {
    render(<DataTable data={data} columns={columns} searchableText={(r) => r.name} />);
    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByText("12 kayıt")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("sonraki sayfaya gecer", () => {
    render(<DataTable data={data} columns={columns} searchableText={(r) => r.name} />);
    fireEvent.click(screen.getByLabelText("Sonraki sayfa"));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(2); // 12 - 10
  });

  it("arama satirlari filtreler", () => {
    render(<DataTable data={data} columns={columns} searchableText={(r) => r.name} />);
    fireEvent.change(screen.getByPlaceholderText("Ara..."), { target: { value: "Hayvan 5" } });
    expect(screen.getByText("Hayvan 5")).toBeInTheDocument();
    expect(screen.queryByText("Hayvan 0")).not.toBeInTheDocument();
  });

  it("eslesme yoksa mesaj gosterir", () => {
    render(<DataTable data={data} columns={columns} searchableText={(r) => r.name} />);
    fireEvent.change(screen.getByPlaceholderText("Ara..."), { target: { value: "zzz" } });
    expect(screen.getByText(/eşleşen kayıt bulunamadı/)).toBeInTheDocument();
  });

  it("kolon basligina tiklayinca siralar (artan -> azalan)", () => {
    render(<DataTable data={data} columns={columns} searchableText={(r) => r.name} />);
    const sortBtn = screen.getByRole("button", { name: /Sayi/ });
    fireEvent.click(sortBtn); // artan: 0 ilk
    expect(within(bodyRows()[0]).getByText("Hayvan 0")).toBeInTheDocument();
    fireEvent.click(sortBtn); // azalan: 11 ilk
    expect(within(bodyRows()[0]).getByText("Hayvan 11")).toBeInTheDocument();
  });

  it("veri yoksa emptyState gosterir", () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        searchableText={(r) => r.name}
        emptyState={<div>Hic kayit yok</div>}
      />
    );
    expect(screen.getByText("Hic kayit yok")).toBeInTheDocument();
  });
});
