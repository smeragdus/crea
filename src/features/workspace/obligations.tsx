"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { LinkButton, Notice, SourceLink } from "@/components/ui/primitives";
import { SelectField } from "@/features/evaluation/assessment-fields";
import { regimes } from "@/features/evaluation/assessment";
import { limaDay, type AssessmentSnapshot } from "@/features/evaluation/session-storage";
import { getRestaurantObligations, OFFICIAL_SUNAT_SCHEDULE } from "@/lib/sunat-calendar";
import type { TaxRecommendation, TaxRegimeCode } from "@/lib/types";

const months = Object.values(OFFICIAL_SUNAT_SCHEDULE);
const digits = Array.from({ length: 10 }, (_, index) => String(index));
const supported = ["NRUS", "RER", "RMT", "RG"] as const;
const extensionUrl = "https://orientacion.sunat.gob.pe/Prorroga-de-vencimientos-por-estado-de-emergencia-a-consecuencia-de-desastres-naturales-de-las-declaraciones-y-pagos-mensuales-2026";
const labels = { MENSUAL: "Mensual", ANUAL: "Anual", PERMANENTE: "Permanente" };

function initialPeriod() {
  const [year, month] = limaDay(new Date()).split("-").map(Number);
  const previous = month === 1 ? (year - 1) + "-12" : year + "-" + String(month - 1).padStart(2, "0");
  return OFFICIAL_SUNAT_SCHEDULE[previous] ? previous : "";
}

export function Obligations({ assessment, uid, recommendations }: { assessment?: AssessmentSnapshot; uid?: string; recommendations?: TaxRecommendation[] }) {
  const declared = assessment?.context.currentRegime;
  const [regime, setRegime] = useState<TaxRegimeCode | "">(supported.some((item) => item === declared) ? declared as TaxRegimeCode : "");
  const [period, setPeriod] = useState(initialPeriod);
  const [digit, setDigit] = useState(assessment?.context.rucLastDigit ?? assessment?.context.ruc?.slice(-1) ?? "");
  const plan = regime ? getRestaurantObligations({ ...assessment?.context, currentRegime: regime, ruc: undefined, rucLastDigit: digit }, period, regime, recommendations) : null;
  const periodField = <SelectField id="period" value={period} onChange={setPeriod} label="Periodo tributario">
    <option value="">Elige un mes</option>
    {months.map(({ period, periodLabel }) => <option key={period} value={period}>{periodLabel}</option>)}
  </SelectField>;

  return <div className="grid gap-5">
    <Card className="grid gap-5 p-5 sm:p-7">
      <div className={assessment && plan ? "grid gap-4 sm:grid-cols-2" : "max-w-md"}>
        <SelectField id="obligation-regime" value={regime} onChange={(value) => setRegime(value as TaxRegimeCode | "")} label="Régimen a consultar">
          <option value="">Elige un régimen</option>
          {regimes.slice(0, 4).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </SelectField>
        {assessment && plan && periodField}
      </div>
      {!plan && <p className="text-sm text-muted-foreground">Puedes encontrar tu régimen en la ficha RUC.</p>}
      {plan && <details className="rule-details border-t border-border">
        <summary>Consultar vencimiento</summary>
        <div className="grid gap-4 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {!assessment && periodField}
            <SelectField id="digit" value={digit} onChange={setDigit} label="Último dígito del RUC">
              <option value="">Elige una opción</option>
              {digits.map((value) => <option key={value} value={value}>{value}</option>)}
              <option value="BC">Buenos Contribuyentes</option>
            </SelectField>
          </div>
          <div className="border-l-2 border-primary bg-muted p-4">
            <p className="font-bold">Vencimiento general</p>
            <p className="mt-1 text-muted-foreground" role="status">
              {plan.scheduleLookup.dueDate
                ? new Intl.DateTimeFormat("es-PE", { dateStyle: "long", timeZone: "UTC" }).format(new Date(plan.scheduleLookup.dueDate))
                : "Elige el periodo y el último dígito de tu RUC para ver la fecha."}
            </p>
            <div className="flex flex-wrap gap-x-4"><SourceLink href={plan.scheduleLookup.sourceUrl}>Cronograma de SUNAT</SourceLink><SourceLink href={extensionUrl}>Consultar prórrogas por distrito</SourceLink></div>
          </div>
        </div>
      </details>}
    </Card>
    {plan && <>
      {plan.alerts.filter(({ id }) => id !== "AL-RUC").map((alert) => <Notice key={alert.id} tone={alert.severity === "INFORMATIVA" ? "info" : "warning"}><strong>{alert.title}</strong><p>{alert.description} {alert.recommendedAction}</p></Notice>)}
      <Checklist key={period + regime + (assessment?.id || assessment?.date || "public")} assessment={assessment} uid={uid} period={period} regime={regime as TaxRegimeCode} plan={plan} />
      <section className="border-t border-border pt-4">
        <h2 className="editorial-title">Documentos para preparar</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{plan.documentsToPrepareMonthly.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
    </>}
    {!assessment && <div><LinkButton href="/negocios/nuevo" variant="ghost">Evalúa tu restaurante</LinkButton></div>}
  </div>;
}

function Checklist({ assessment, uid, period, regime, plan }: {
  assessment?: AssessmentSnapshot;
  uid?: string;
  period: string;
  regime: TaxRegimeCode;
  plan: ReturnType<typeof getRestaurantObligations>;
}) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [busy, setBusy] = useState(Boolean(assessment && period));
  const [error, setError] = useState("");
  const cloudId = uid && assessment?.saved ? assessment.id : undefined;
  const key = assessment ? ["crea:obligations:v2", uid ?? "guest", assessment.id ?? assessment.date, period, regime].join(":") : undefined;

  useEffect(() => {
    if (!period || !key) return;
    const storageKey = key;
    let active = true;
    async function loadStatus() {
      try {
        await Promise.resolve();
        const result = cloudId ? await (await import("@/lib/firebase/businesses")).readTaskStatus(cloudId, period, regime)
          : JSON.parse(sessionStorage.getItem(storageKey) || "[]") as string[];
        if (active) setCompleted(result);
      } catch {
        if (active) setError("No pudimos cargar tus marcas. Vuelve a abrir esta sección e inténtalo de nuevo.");
      } finally {
        if (active) setBusy(false);
      }
    }
    void loadStatus();
    return () => { active = false; };
  }, [cloudId, key, period, regime]);

  async function toggle(task: string) {
    if (!key) return;
    const checked = completed.includes(task);
    const next = checked ? completed.filter((item) => item !== task) : [...completed, task];
    setBusy(true);
    setError("");
    try {
      if (cloudId) await (await import("@/lib/firebase/businesses")).writeTaskStatus(cloudId, period, regime, task, !checked);
      else sessionStorage.setItem(key, JSON.stringify(next));
      setCompleted(next);
    } catch {
      setError("No pudimos guardar tu marca. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="grid gap-3" aria-busy={busy}>
    <h2 className="editorial-title">{assessment ? "Tus tareas para " : "Obligaciones del "}{plan.regimeName}</h2>
    {assessment && <p className="text-sm text-muted-foreground">{period
      ? "Las marcas corresponden a " + OFFICIAL_SUNAT_SCHEDULE[period].periodLabel + ". Confirma tus declaraciones y pagos en SUNAT."
      : "Elige un periodo tributario para marcar tus tareas."}</p>}
    {error && <Notice tone="error">{error}</Notice>}
    {assessment && <p className="text-sm font-semibold text-muted-foreground" role="status">{plan.obligations.filter(({ id }) => completed.includes(id)).length} de {plan.obligations.length} marcadas</p>}
    {plan.obligations.map((item) => <article key={item.id} className="border-t border-border py-3">
      <p className="eyebrow mb-1">{labels[item.frequency]}</p>
      <h3 className="font-bold">{item.title}</h3>
      <p className="my-2 max-w-prose text-sm text-muted-foreground">{item.description}</p>
      {item.documentsToPrepare.length > 0 && <details className="rule-details"><summary>Qué necesitas preparar</summary><ul className="list-disc pl-5 text-sm text-muted-foreground">{item.documentsToPrepare.map((document) => <li key={document}>{document}</li>)}</ul></details>}
      <div className="flex flex-wrap items-center justify-between gap-x-3">
        <SourceLink href={item.sourceUrl}>Consultar fuente</SourceLink>
        {assessment && <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
          <input type="checkbox" aria-label={"Marcar tarea: " + item.title} checked={completed.includes(item.id)} disabled={busy || !period} onChange={() => void toggle(item.id)} /> {completed.includes(item.id) ? "Marcada" : "Marcar tarea"}
        </label>}
      </div>
    </article>)}
  </section>;
}
