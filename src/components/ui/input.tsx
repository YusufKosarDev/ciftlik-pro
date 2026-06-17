import { cn } from "@/lib/cn";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/30 disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}
