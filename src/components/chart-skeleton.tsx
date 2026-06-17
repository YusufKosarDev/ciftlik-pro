// Grafik tembel (dynamic) yuklenirken gosterilen iskelet. Asil grafikle ayni
// dis yuksekligi korur; boylece yukleme sirasinda layout kaymasi olmaz.
export function ChartSkeleton({
  heightClass,
  title,
}: {
  heightClass: string;
  title: string;
}) {
  return (
    <div
      className={`${heightClass} w-full animate-pulse rounded-xl border border-border bg-card p-5`}
    >
      <h3 className="mb-4 font-semibold text-muted-foreground">{title}</h3>
      <div className="h-[78%] w-full rounded bg-muted" />
    </div>
  );
}
