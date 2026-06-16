// Liste sayfalari icin sunucu-tarafi sayfalama/arama/siralama parametrelerini
// URL searchParams'tan guvenle cozumler. Tum liste sayfalari ayni sozlesmeyi
// kullanir: ?page (1 tabanli), ?q (arama), ?sort (kolon anahtari), ?dir (asc/desc).

export const DEFAULT_PAGE_SIZE = 10;

export type SortDir = "asc" | "desc";

// DataTable'a aktarilan, mevcut liste durumu (sunucudan hesaplanir).
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

// searchParams'i cozumler. `sort` yalnizca izin verilen anahtarlardan biriyse
// kabul edilir (aksi halde defaultSort); boylece keyfi/sql-disi alan adlari
// orderBy'a sizamaz.
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
