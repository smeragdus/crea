import type { ReactNode } from "react";

export function Field({ id, label, hint, error, children }: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2" data-invalid={Boolean(error)}>
      <label htmlFor={id} className="font-semibold">{label}</label>
      {hint && <p id={id + "-hint"} className="text-sm text-muted-foreground">{hint}</p>}
      {children}
      {error && <p id={id + "-error"} className="text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}
