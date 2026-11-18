import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-transparent px-4 text-sm font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.98] focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-55 [&_svg]:size-[1.1em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        outline: "border-border bg-card text-foreground hover:bg-muted",
        ghost: "text-primary hover:bg-accent",
        destructive: "bg-destructive text-white hover:bg-red-900",
      },
      size: {
        default: "",
        lg: "min-h-[3.25rem] px-5 text-base",
        icon: "size-11 px-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({ className, variant, size, ...props }: Omit<ButtonPrimitive.Props, "className"> & { className?: string } & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
