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
      className={`${heightClass} w-full animate-pulse rounded-xl border border-gray-200 bg-white p-5`}
    >
      <h3 className="mb-4 font-semibold text-gray-400">{title}</h3>
      <div className="h-[78%] w-full rounded bg-gray-100" />
    </div>
  );
}
