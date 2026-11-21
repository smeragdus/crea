import type { ReactNode } from "react";
import { Field } from "@/components/ui/field";
import { Input, inputClassName } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CommonProps = { id: string; label: string; hint?: string; error?: string };

function descriptions({ id, hint, error }: CommonProps) {
  return [hint && id + "-hint", error && id + "-error"].filter(Boolean).join(" ") || undefined;
}

export function TextField({ value, onChange, numeric, whole, maxLength, ...field }: CommonProps & {
  value: string;
  onChange: (value: string) => void;
  numeric?: boolean;
  whole?: boolean;
  maxLength?: number;
}) {
  return <Field {...field}>
    <div className={cn("relative", numeric && "text-foreground")}>
      {numeric && !whole && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3.5 grid items-center text-muted-foreground">S/</span>}
      <Input id={field.id} name={field.id} autoComplete="off" aria-describedby={descriptions(field)}
        aria-invalid={Boolean(field.error)} className={numeric && !whole ? "pl-9" : undefined}
        inputMode={numeric ? whole ? "numeric" : "decimal" : undefined} maxLength={maxLength}
        value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  </Field>;
}

export function SelectField({ value, onChange, children, ...field }: CommonProps & { value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <Field {...field}>
    <select id={field.id} className={inputClassName} value={value} onChange={(event) => onChange(event.target.value)} aria-describedby={descriptions(field)} aria-invalid={Boolean(field.error)}>
      {children}
    </select>
  </Field>;
}

export function ChoiceField({ id, label, options, hint, error, value, onChange, compact }: CommonProps & {
  options: readonly (readonly [string, string, string])[];
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return <fieldset id={id} tabIndex={-1} aria-describedby={descriptions({ id, label, hint, error })}>
    <legend className="font-semibold">{label}</legend>
    {hint && <p id={id + "-hint"} className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    <div className={cn("mt-2.5 grid gap-2", compact && "grid-cols-3")}>
      {options.map(([option, text, detail]) => <label className={cn("choice-card", compact && "choice-card-compact")} key={option}>
        <input type="radio" name={id} value={option} checked={value === option} onChange={() => onChange(option)} />
        <span><span className="block text-sm font-semibold">{text}</span>{detail && <span className="block text-sm text-muted-foreground">{detail}</span>}</span>
      </label>)}
    </div>
    {error && <p id={id + "-error"} className="mt-2 text-sm font-semibold text-destructive">{error}</p>}
  </fieldset>;
}

export function MultiChoiceField({ id, label, options, hint, value, onChange }: CommonProps & {
  options: readonly (readonly [string, string])[];
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = value.split(",").filter(Boolean);
  return <fieldset id={id} tabIndex={-1} aria-describedby={hint ? id + "-hint" : undefined}>
    <legend className="font-semibold">{label}</legend>
    {hint && <p id={id + "-hint"} className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    <div className="mt-2.5 grid gap-2">
      {options.map(([key, text]) => <label className="choice-card" key={key}>
        <input type="checkbox" name={id} value={key} checked={selected.includes(key)} onChange={(event) => {
          if (!event.target.checked) onChange(selected.filter((item) => item !== key).join(","));
          else if (key === "unknown") onChange(key);
          else onChange([...selected.filter((item) => item !== "unknown"), key].join(","));
        }} />
        <span className="text-sm font-semibold">{text}</span>
      </label>)}
    </div>
  </fieldset>;
}
