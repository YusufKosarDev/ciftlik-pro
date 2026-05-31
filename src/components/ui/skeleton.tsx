import { cn } from "@/lib/cn";

// Yukleme sirasinda iskelet (shimmer) yer tutucu.
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  );
}
