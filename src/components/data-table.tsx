"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
import type { ListState } from "@/lib/list-query";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  // sortKey verilirse kolon basligi tiklanarak siralanabilir; bu anahtar URL'e
  // (?sort) yazilir ve sunucu tarafinda orderBy'a cevrilir.
  sortKey?: string;
  className?: string;
  headerClassName?: string;
};

// Sunucu-tarafi sayfalama/arama/siralama icin URL-gudumlu sunum tablosu.
// Veri (`data`) zaten sunucuda sayfalanmis/filtrelenmis gelir; bu bilesen yalniz
// gosterir ve etkilesimleri URL searchParams'a yansitir (router.replace).
export function DataTable<T extends { id: string }>({
  data,
  columns,
  list,
  searchable = false,
  searchPlaceholder,
  emptyState,
}: {
  data: T[];
  columns: Column<T>[];
  list: ListState;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyState?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Table");
  const tCommon = useTranslations("Common");

  // URL parametrelerini gunceller; bos/null degerler kaldirilir. scroll:false ile
  // sayfa basina kaymayi onleriz.
  const updateParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, String(value));
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // Arama: yerel girdi durumu + debounce ile URL'e yansitma.
  const [term, setTerm] = useState(list.q);
  useEffect(() => {
    const handle = setTimeout(() => {
      if (term.trim() !== list.q) {
        updateParams({ q: term.trim() || null, page: null });
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [term, list.q, updateParams]);

  const pageCount = Math.max(1, Math.ceil(list.total / list.pageSize));

  function toggleSort(key: string) {
    const dir = list.sort === key && list.dir === "asc" ? "desc" : "asc";
    updateParams({ sort: key, dir, page: null });
  }

  function goToPage(p: number) {
    updateParams({ page: p <= 1 ? null : p });
  }

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={searchPlaceholder ?? tCommon("search")}
            className="pl-9"
          />
        </div>
      )}

      {data.length === 0 ? (
        list.q.trim() ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {t("noMatch", { q: list.q })}
          </p>
        ) : (
          emptyState ?? (
            <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {t("noRecords")}
            </p>
          )
        )
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        "whitespace-nowrap bg-muted px-4 py-3 text-xs font-semibold uppercase tracking-wider",
                        col.headerClassName
                      )}
                    >
                      {col.sortKey ? (
                        <button
                          onClick={() => toggleSort(col.sortKey!)}
                          className="inline-flex items-center gap-1 transition hover:text-foreground"
                        >
                          {col.header}
                          {list.sort === col.sortKey ? (
                            list.dir === "asc" ? (
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
              <tbody className="divide-y divide-border">
                {data.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-muted">
                    {columns.map((col) => (
                      <td key={col.key} className={cn("px-4 py-3 align-middle", col.className)}>
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t("records", { count: list.total })}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={list.page <= 1}
                  onClick={() => goToPage(list.page - 1)}
                  className="rounded-lg border border-border p-1.5 transition hover:bg-muted disabled:opacity-40"
                  aria-label={t("prevPage")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>
                  {list.page} / {pageCount}
                </span>
                <button
                  disabled={list.page >= pageCount}
                  onClick={() => goToPage(list.page + 1)}
                  className="rounded-lg border border-border p-1.5 transition hover:bg-muted disabled:opacity-40"
                  aria-label={t("nextPage")}
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
