import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const inputClassName = "min-h-12 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-foreground placeholder:text-muted-foreground focus-visible:border-ring aria-invalid:border-destructive";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input data-slot="input" className={cn(inputClassName, className)} {...props} />;
}
