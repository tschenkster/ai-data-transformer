import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        success: "border-transparent bg-success/10 text-success-foreground hover:bg-success/20",
        warning: "border-transparent bg-warning/10 text-warning-foreground hover:bg-warning/20", 
        error: "border-transparent bg-destructive/10 text-destructive-foreground hover:bg-destructive/20",
        info: "border-transparent bg-primary/10 text-primary-foreground hover:bg-primary/20",
        pending: "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
        approved: "border-transparent bg-success/10 text-success-foreground hover:bg-success/20",
        rejected: "border-transparent bg-destructive/10 text-destructive-foreground hover:bg-destructive/20",
        suspended: "border-transparent bg-warning/10 text-warning-foreground hover:bg-warning/20",
        default: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  icon?: React.ComponentType<{ className?: string }>;
}

function StatusBadge({ className, variant, size, icon: Icon, children, ...props }: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ variant, size }), className)} {...props}>
      {Icon && <Icon className="w-3 h-3 mr-1" />}
      {children}
    </div>
  );
}

export { StatusBadge, statusBadgeVariants };