"use client";

import { Check, ListChecks } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SourceLink } from "@/components/ui/primitives";
import { kitchenEquipment } from "@/features/evaluation/assessment";
import type { AssessmentSnapshot } from "@/features/evaluation/session-storage";
import type { BusinessContext } from "@/lib/types";
import { buildFormalizationRoute } from "@/lib/formalization";

export function FormalizationRoute({ assessment, uid }: { assessment: AssessmentSnapshot; uid?: string }) {
  const key = "crea:formalizacion:v1:" + (uid ?? "guest") + ":" + (assessment.id ?? assessment.date);
  const detailsKey = key + ":datos";
  const [details, setDetails] = useState<Partial<BusinessContext>>(() => {
    try { return JSON.parse(sessionStorage.getItem(detailsKey) ?? "{}") ?? {}; } catch { return {}; }
  });
  const context = {
    ...assessment.context,
    ...details,
    hasLocal: ("hasLocal" in details ? details.hasLocal : assessment.context.hasLocal) ?? undefined,
    kitchenSmoke: ("kitchenSmoke" in details ? details.kitchenSmoke : assessment.context.kitchenSmoke) ?? undefined,
    hasEmployees: ("hasEmployees" in details ? details.hasEmployees : assessment.context.hasEmployees) ?? undefined,
    constitutionRegistered: ("constitutionRegistered" in details ? details.constitutionRegistered : assessment.context.constitutionRegistered) ?? undefined,
  };
  const tasks = buildFormalizationRoute(context);
  function updateDetails(change: Partial<BusinessContext>) {
    const next = { ...details, ...change };
    setDetails(next);
    try { sessionStorage.setItem(detailsKey, JSON.stringify(next, (_, value) => value === undefined ? null : value)); } catch { setStorageWarning(true); }
  }
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(sessionStorage.getItem(key) ?? "{}") ?? {}; } catch { return {}; }
  });
  const [storageWarning, setStorageWarning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const complete = tasks.filter((task) => checked[task.id] ?? task.declaredComplete).length;

  function toggle(id: string, value: boolean) {
    const next = { ...checked, [id]: value };
    setChecked(next);
    try { sessionStorage.setItem(key, JSON.stringify(next)); } catch { setStorageWarning(true); }
  }

  return <section className="grid gap-4" aria-labelledby="route-list-title">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="route-list-title" className="flex items-center gap-2 text-lg font-bold"><ListChecks aria-hidden="true" /> Tu lista de trámites</h2>
      {!assessment.demo && <Link href="/negocios/nuevo?editar=1" className="font-bold text-primary hover:underline">Cambiar mis respuestas →</Link>}
    </div>
    <p id="route-progress-label" className="text-sm text-muted-foreground" aria-live="polite">{complete} de {tasks.length} tareas marcadas como completadas</p>
    {storageWarning && <p role="status">El navegador bloqueó el guardado. El progreso se conserva mientras esta página esté abierta.</p>}
    {!assessment.demo && <details className="rule-details rounded-2xl border border-blue-100 bg-white p-4">
      <summary className="font-bold">Agregar datos sobre mi local y personal</summary>
      <p className="mb-3 mt-2 text-sm text-muted-foreground">Completa los datos que conozcas para ajustar tus trámites. Se guardan en esta pestaña.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {(assessment.context.hasLocal === undefined || assessment.context.operationMode === "movil") && <RouteSelect label="¿Tienes un local fijo para preparar o vender?" value={answer(context.hasLocal)} onChange={(value) => updateDetails({ hasLocal: booleanAnswer(value), hasPhysicalLocation: value === "yes" })} />}
        {context.hasLocal === true && <>
          {(context.stage === "operando" || context.stage === "formalizado") && <>
            <RouteSelect label="¿Ya tienes licencia de funcionamiento?" value={context.licenseStatus} onChange={(value) => updateDetails({ licenseStatus: value })} />
            <RouteSelect label="¿Ya tienes certificado ITSE?" value={context.itseStatus} onChange={(value) => updateDetails({ itseStatus: value })} />
          </>}
          <label className="grid gap-1 text-sm font-semibold">Nivel de riesgo del local
            <select className="rounded-lg border border-border bg-white p-2" value={context.municipalRisk ?? "desconocido"} onChange={(event) => {
              const value = event.target.value;
              if (value === "bajo-medio" || value === "alto" || value === "desconocido") updateDetails({ municipalRisk: value });
            }}>
              <option value="desconocido">Todavía no lo sé</option><option value="bajo-medio">Bajo o medio</option><option value="alto">Alto o muy alto</option>
            </select>
          </label>
          <RouteSelect label="¿Al cocinar se genera mucho humo, vapor o grasa?" value={answer(context.kitchenSmoke)} onChange={(value) => updateDetails({ kitchenSmoke: booleanAnswer(value) })} />
          <fieldset className="grid gap-2 rounded-lg border border-border p-3">
            <legend className="px-1 text-sm font-semibold">Equipos que usarás al cocinar</legend>
            {kitchenEquipment.filter(([key]) => key !== "unknown").map(([key, label]) => {
              const equipment = context.kitchenEquipment ?? [];
              return <label key={key} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={equipment.includes(key)} onChange={(event) => updateDetails({ kitchenEquipment: event.target.checked ? [...equipment, key] : equipment.filter((item) => item !== key) })} />{label}
              </label>;
            })}
          </fieldset>
        </>}
        <RouteSelect label="¿Tienes o tendrás trabajadores dependientes?" value={answer(context.hasEmployees)} onChange={(value) => updateDetails({ hasEmployees: booleanAnswer(value) })} />
        {context.legalPerson === "juridica" && context.stage !== "idea" && <RouteSelect label="¿Tu empresa ya está inscrita en SUNARP?" value={answer(context.constitutionRegistered)} onChange={(value) => updateDetails({ constitutionRegistered: booleanAnswer(value) })} />}
      </div>
    </details>}
    <ol className="overflow-hidden rounded-3xl border border-blue-100 bg-white px-4 sm:px-7">
      {tasks.map((task, index) => {
        const done = checked[task.id] ?? Boolean(task.declaredComplete);
        const open = expanded === task.id;
        const detailId = "tramite-" + task.id;
        return <li key={task.id} className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-x-4 gap-y-3 border-b border-blue-100 py-5 last:border-0 not-last:before:absolute not-last:before:left-[1.3125rem] not-last:before:top-16 not-last:before:bottom-0 not-last:before:w-0.5 not-last:before:bg-blue-100 md:grid-cols-[2.75rem_minmax(0,1fr)_auto_auto] md:items-center">
          <label className={"relative z-10 grid size-11 cursor-pointer place-items-center rounded-full has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 " + (done ? "bg-primary text-white" : "bg-slate-200 text-slate-600")}>
            <input className="absolute inset-0 m-0 size-full cursor-pointer opacity-0" type="checkbox" checked={done}
              aria-label={task.title} onChange={(event) => toggle(task.id, event.target.checked)} />
            {done ? <Check className="size-5" aria-hidden="true" /> : <span aria-hidden="true">·</span>}
          </label>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-primary">{task.institution} · Paso {index + 1}</p>
            <h3 className="mt-1 text-lg font-bold">{task.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
            {task.conditional && <p className="mt-1 text-xs font-bold text-amber-800">Confirma si aplica a tu caso</p>}
          </div>
          <p className={"col-start-2 text-sm font-bold md:col-start-auto " + (done ? "text-primary" : "text-slate-600")}>{done ? "Completada" : task.conditional ? "Por confirmar" : "Pendiente"}</p>
          <Button type="button" variant="outline" className="col-start-2 justify-self-start rounded-xl md:col-start-auto" aria-expanded={open} aria-controls={detailId}
            onClick={() => setExpanded(open ? null : task.id)}>{open ? "Ocultar" : "Ver detalle"}<span className="sr-only"> de {task.title}</span></Button>
          <div id={detailId} hidden={!open} className="col-start-2 min-w-0 rounded-2xl bg-blue-50 p-4 text-sm sm:p-5 md:col-end-5">
            <p><strong>Por qué aparece</strong> · {task.description}</p>
            <p className="mt-2"><strong>Entidad</strong> · {task.institution}</p>
            {task.after && <p className="mt-2"><strong>Paso previo</strong> · {task.after}</p>}
            {task.prepare && <div className="mt-4">
              <h4 className="font-bold">Qué llevar o preparar</h4>
              <ul className="mt-1 list-disc space-y-1 pl-5">{task.prepare.map((item) => <li key={item}>{item}</li>)}</ul>
              <p className="mt-2 text-muted-foreground">Lista orientativa. Revisa en la fuente oficial qué se exige para tu caso.</p>
            </div>}
            <h4 className="mt-4 font-bold">Cómo hacerlo</h4>
            <ol className="mt-1 list-decimal space-y-1 pl-5">{task.steps.map((item) => <li key={item}>{item}</li>)}</ol>
            <SourceLink href={task.url}>Consultar requisitos y costos en la fuente oficial</SourceLink>
          </div>
        </li>;
      })}
    </ol>
  </section>;
}

type RouteAnswer = "yes" | "no" | "unknown";

function answer(value?: boolean): RouteAnswer {
  return value === undefined ? "unknown" : value ? "yes" : "no";
}

function booleanAnswer(value: RouteAnswer) {
  return value === "unknown" ? undefined : value === "yes";
}

function RouteSelect({ label, value, onChange }: { label: string; value?: RouteAnswer; onChange: (value: RouteAnswer) => void }) {
  return <label className="grid content-start gap-1 text-sm font-semibold">{label}
    <select className="rounded-lg border border-border bg-white p-2" value={value ?? "unknown"} onChange={(event) => {
      const next = event.target.value;
      if (next === "yes" || next === "no" || next === "unknown") onChange(next);
    }}>
      <option value="unknown">Todavía no lo sé</option><option value="yes">Sí</option><option value="no">No</option>
    </select>
  </label>;
}
