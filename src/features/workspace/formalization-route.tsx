"use client";

import { Building2, Check, ClipboardCheck, ListChecks } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { SourceLink } from "@/components/ui/primitives";
import type { AssessmentSnapshot } from "@/features/evaluation/session-storage";
import { buildFormalizationRoute } from "@/lib/formalization";

export function FormalizationRoute({ assessment, uid }: { assessment: AssessmentSnapshot; uid?: string }) {
  const key = "crea:formalizacion:v1:" + (uid ?? "guest") + ":" + (assessment.id ?? assessment.date);
  const tasks = buildFormalizationRoute(assessment.context);
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(sessionStorage.getItem(key) ?? "{}") ?? {}; } catch { return {}; }
  });
  const [storageWarning, setStorageWarning] = useState(false);
  const complete = tasks.filter((task) => checked[task.id] ?? task.declaredComplete).length;

  function toggle(id: string, value: boolean) {
    const next = { ...checked, [id]: value };
    setChecked(next);
    try { sessionStorage.setItem(key, JSON.stringify(next)); } catch { setStorageWarning(true); }
  }

  return <div className="grid gap-6">
    <Card className="route-intro grid gap-3 p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <ListChecks aria-hidden="true" /><h2 className="editorial-title">Tu lista de trámites</h2>
      </div>
      <p id="route-progress-label" aria-live="polite">{complete} de {tasks.length} tareas marcadas</p>
      <progress className="h-3 w-full accent-primary" max={tasks.length} value={complete} aria-labelledby="route-progress-label" />
      <p className="text-sm">Guarda tu progreso en esta pestaña. Las tareas con «Por confirmar» dependen de tu caso y de lo que indique la autoridad.</p>
      {storageWarning && <p role="status">El navegador bloqueó el guardado. El progreso se conserva mientras esta página esté abierta.</p>}
    </Card>
    {(["Identidad y registro", "Permisos y operación"] as const).map((phase, index) => {
      const Icon = index === 0 ? Building2 : ClipboardCheck;
      return <section key={phase} className="grid gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Icon aria-hidden="true" /> {phase}</h2>
        <ol className="overflow-hidden rounded-3xl border border-blue-100 bg-white px-4 sm:px-7">
          {tasks.filter((task) => task.phase === phase).map((task) => {
            const done = checked[task.id] ?? Boolean(task.declaredComplete);
            return <li key={task.id} className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 border-b border-blue-100 py-5 last:border-0 not-last:before:absolute not-last:before:left-[1.3125rem] not-last:before:top-16 not-last:before:bottom-0 not-last:before:w-0.5 not-last:before:bg-blue-100 sm:gap-5">
              <label className="group contents">
                <span className="relative z-10 inline-grid size-11 place-items-center self-start rounded-full border-2 border-blue-200 bg-blue-50 text-primary group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-4 group-has-[:checked]:border-primary group-has-[:checked]:bg-primary group-has-[:checked]:text-white">
                  <input className="absolute inset-0 m-0 size-full cursor-pointer opacity-0" type="checkbox" checked={done}
                    aria-label={task.title} onChange={(event) => toggle(task.id, event.target.checked)} />
                  {done ? <Check className="size-5" aria-hidden="true" /> : <span aria-hidden="true" className="size-2 rounded-full bg-current" />}
                </span>
                <span className="min-w-0 self-center text-base font-bold sm:text-lg">{task.title}</span>
              </label>
              <div className="col-start-2 min-w-0 space-y-2">
                <p className="text-sm text-muted-foreground">{task.description}</p>
                {task.after && <p className="text-sm text-muted-foreground">Paso previo · {task.after}</p>}
                <p className={"w-fit rounded-full px-2.5 py-1 text-xs font-bold " + (done ? "bg-blue-100 text-primary" : "bg-slate-100 text-slate-700")}>
                  {done ? "Completada" : task.conditional ? "Por confirmar" : "Pendiente"}
                </p>
                <details className="rule-details border-t border-border">
                  <summary>Ver pasos y fuente</summary>
                  <ol className="list-decimal space-y-1 pb-2 pl-5 text-sm">{task.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                  <SourceLink href={task.url}>{task.institution}</SourceLink>
                </details>
              </div>
            </li>;
          })}
        </ol>
      </section>;
    })}
  </div>;
}
