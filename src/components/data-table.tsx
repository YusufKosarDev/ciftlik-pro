"use client";

import { useMemo, useState } from "react";
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  // sortValue verilirse kolon basligi tiklanarak siralanabilir.
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
};

// Arama + siralama + sayfalama iceren, yeniden kullanilabilir istemci tablosu.
export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchableText,
  searchPlaceholder = "Ara...",
  pageSize = 10,
  emptyState,
}: {
  data: T[];
  columns: Column<T>[];
  searchableText?: (row: T) => string;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyState?: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let rows = data;
    if (query.trim() && searchableText) {
      const q = query.toLowerCase();
      rows = rows.filter((r) => searchableText(r).toLowerCase().includes(q));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        const getVal = col.sortValue;
        rows = [...rows].sort((a, b) => {
          const av = getVal(a);
          const bv = getVal(b);
          if (av < bv) return sort.dir === "asc" ? -1 : 1;
          if (av > bv) return sort.dir === "asc" ? 1 : -1;
          return 0;
        });
      }
    }
    return rows;
  }, [data, query, sort, columns, searchableText]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(current * pageSize, current * pageSize + pageSize);

  function toggleSort(key: string) {
    setPage(0);
    setSort((s) =>
      s?.key === key
        ? s.dir === "asc"
          ? { key, dir: "desc" }
          : null
        : { key, dir: "asc" }
    );
  }

  return (
    <div className="space-y-3">
      {searchableText && (
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        query.trim() ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            “{query}” ile eşleşen kayıt bulunamadı.
          </p>
        ) : (
          emptyState ?? (
            <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              Kayıt bulunamadı.
            </p>
          )
        )
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={cn("px-4 py-3 font-medium", col.headerClassName)}
                    >
                      {col.sortValue ? (
                        <button
                          onClick={() => toggleSort(col.key)}
                          className="inline-flex items-center gap-1 transition hover:text-gray-900"
                        >
                          {col.header}
                          {sort?.key === col.key ? (
                            sort.dir === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {columns.map((col) => (
                      <td key={col.key} className={cn("px-4 py-3", col.className)}>
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{filtered.length} kayıt</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={current === 0}
                  onClick={() => setPage(current - 1)}
                  className="rounded-lg border border-gray-300 p-1.5 transition hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Önceki sayfa"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>
                  {current + 1} / {pageCount}
                </span>
                <button
                  disabled={current >= pageCount - 1}
                  onClick={() => setPage(current + 1)}
                  className="rounded-lg border border-gray-300 p-1.5 transition hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Sonraki sayfa"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
