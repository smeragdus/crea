import { ArrowRight, ExternalLink, Info } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";
import { Card } from "./card";

type LinkButtonProps = ComponentProps<typeof Link> & Pick<NonNullable<Parameters<typeof buttonVariants>[0]>, "variant" | "size">;

export function LinkButton({ className, variant, size, ...props }: LinkButtonProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  if (!href.startsWith("https://")) return null;
  return <a href={href} target="_blank" rel="noopener noreferrer" className="source-link">{children}<ExternalLink size={15} aria-hidden="true" /><span className="sr-only"> (abre en otra pestaña)</span></a>;
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "error" | "success" | "warning" }) {
  return <div className={cn("notice", "notice-" + tone)} role={tone === "error" ? "alert" : "status"}>
    <Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" /><div>{children}</div>
  </div>;
}

export function PageHeading({ label, title, description, actions, headingRef }: { label?: string; title: string; description?: string; actions?: ReactNode; headingRef?: Ref<HTMLHeadingElement> }) {
  return <div className="page-heading">
    <div>{label && <p className="eyebrow mb-3">{label}</p>}<h1 ref={headingRef} tabIndex={headingRef ? -1 : undefined}>{title}</h1>{description && <p className="page-intro">{description}</p>}</div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>;
}

export function EmptyState({ title, children, action = true }: { title: string; children: ReactNode; action?: boolean }) {
  return <Card className="grid justify-items-start gap-4 p-6 sm:p-9">
    <h2 className="text-2xl font-semibold">{title}</h2>
    <div className="max-w-xl text-muted-foreground">{children}</div>
    {action && <LinkButton href="/negocios/nuevo">Evaluar mi restaurante <ArrowRight aria-hidden="true" /></LinkButton>}
  </Card>;
}
