import { cn } from "@/lib/cn";

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/30 disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}
