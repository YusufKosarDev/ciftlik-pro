import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        green: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
        red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
        yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
        blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
        gray: "bg-muted text-muted-foreground",
        amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
      },
    },
    defaultVariants: { tone: "gray" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
