// Safely resolves the server-side pagination, search and sort parameters for list
// pages out of the URL's searchParams. Every list page uses the same contract:
// ?page (1-based), ?q (search), ?sort (column key), ?dir (asc/desc).

export const DEFAULT_PAGE_SIZE = 10;

export type SortDir = "asc" | "desc";

// The current list state handed to DataTable (computed on the server).
export type ListState = {
  total: number; // Filtreye uyan toplam kayit
  page: number; // 1 tabanli mevcut sayfa
  pageSize: number;
  q: string; // Aktif arama metni
  sort: string; // Aktif siralama anahtari
  dir: SortDir;
};

export type ParsedListParams = {
  page: number;
  q: string;
  sort: string;
  dir: SortDir;
  skip: number;
  take: number;
};

type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

// Resolves searchParams. `sort` is accepted only when it is one of the allowed
// keys (otherwise defaultSort), so an arbitrary field name cannot leak into
// orderBy.
export function parseListParams(
  params: RawParams,
  opts: {
    sortableKeys: readonly string[];
    defaultSort: string;
    defaultDir?: SortDir;
    pageSize?: number;
  }
): ParsedListParams {
  const pageSize = opts.pageSize ?? DEFAULT_PAGE_SIZE;

  const pageNum = Number.parseInt(first(params.page), 10);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;

  const q = first(params.q).trim();

  const sortRaw = first(params.sort);
  const sort = opts.sortableKeys.includes(sortRaw) ? sortRaw : opts.defaultSort;

  const dirRaw = first(params.dir);
  const dir: SortDir =
    dirRaw === "asc" || dirRaw === "desc" ? dirRaw : opts.defaultDir ?? "desc";

  return { page, q, sort, dir, skip: (page - 1) * pageSize, take: pageSize };
}
