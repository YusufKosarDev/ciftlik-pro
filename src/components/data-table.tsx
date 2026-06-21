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
  enableSelection = false,
  onBulkDelete,
  csvExportFilename,
}: {
  data: T[];
  columns: Column<T>[];
  list: ListState;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyState?: React.ReactNode;
  enableSelection?: boolean;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  csvExportFilename?: string;
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

  // Çoklu seçim durumu
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map((row) => row.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return;
    if (!confirm(`Seçilen ${selectedIds.length} kaydı kalıcı olarak silmek istediğinize emin misiniz?`)) return;
    setDeleting(true);
    try {
      await onBulkDelete(selectedIds);
      setSelectedIds([]);
    } catch (err) {
      console.error("Toplu silme hatası:", err);
      alert("Toplu silme işlemi sırasında bir hata oluştu.");
    } finally {
      setDeleting(false);
    }
  };

  // Kolon görünürlüğü durumu
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Set<string>>(new Set());
  const [showColMenu, setShowColMenu] = useState(false);

  const toggleColumn = (key: string) => {
    setHiddenColumnKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderedColumns = columns.filter((col) => !hiddenColumnKeys.has(col.key));
  const showSelectionColumn = enableSelection && data.length > 0;

  // CSV İndirme fonksiyonu
  const downloadCSV = () => {
    if (!data || data.length === 0) return;
    const exportCols = renderedColumns.filter((col) => col.key !== "actions");
    const headers = exportCols.map((col) => col.header).join(",");
    const rows = data.map((row) =>
      exportCols
        .map((col) => {
          let val = row[col.key as keyof T];
          if (val === undefined || val === null) {
            val = "";
          }
          if (val instanceof Date) {
            val = val.toLocaleDateString();
          }
          // Tırnak işaretlerini kaçış karakteriyle koru
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    );
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([`\ufeff${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${csvExportFilename || "export"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3">
      {/* Üst İşlem Çubuğu (Arama + CSV + Sütunlar) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {searchable && (
          <div className="relative max-w-xs flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={searchPlaceholder ?? tCommon("search")}
              className="pl-9"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {csvExportFilename && data.length > 0 && (
            <button
              onClick={downloadCSV}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition shadow-sm"
            >
              📥 CSV İndir
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowColMenu(!showColMenu)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition shadow-sm"
            >
              👁️ Sütunlar
            </button>
            {showColMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowColMenu(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card p-2 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="space-y-1.5">
                    {columns
                      .filter((col) => col.key !== "actions")
                      .map((col) => (
                        <label
                          key={col.key}
                          className="flex items-center gap-2 text-xs font-medium cursor-pointer text-foreground hover:bg-muted p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={!hiddenColumnKeys.has(col.key)}
                            onChange={() => toggleColumn(col.key)}
                            className="rounded border-border text-green-600 focus:ring-green-500 h-3.5 w-3.5"
                          />
                          {col.header}
                        </label>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toplu İşlem Çubuğu */}
      {selectedIds.length > 0 && onBulkDelete && (
        <div className="flex items-center justify-between rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium">
            <span>🗑️</span>
            <span>{selectedIds.length} satır seçildi.</span>
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition cursor-pointer"
          >
            {deleting ? "Siliniyor..." : "Seçilenleri Sil"}
          </button>
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
                  {showSelectionColumn && (
                    <th className="bg-muted px-4 py-3 text-xs w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === data.length}
                        onChange={toggleSelectAll}
                        className="rounded border-border text-green-600 focus:ring-green-500 h-4 w-4 cursor-pointer"
                      />
                    </th>
                  )}
                  {renderedColumns.map((col) => (
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
                          className="inline-flex items-center gap-1 transition hover:text-foreground cursor-pointer"
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
                  <tr
                    key={row.id}
                    className={cn(
                      "transition-colors hover:bg-muted",
                      selectedIds.includes(row.id) && "bg-muted/40"
                    )}
                  >
                    {showSelectionColumn && (
                      <td className="px-4 py-3 align-middle w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={() => toggleSelectRow(row.id)}
                          className="rounded border-border text-green-600 focus:ring-green-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                    )}
                    {renderedColumns.map((col) => (
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
