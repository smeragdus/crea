"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice, SourceLink } from "@/components/ui/primitives";
import { RegimeStatus } from "@/features/evaluation/results";
import { buildDiagnosticReportData } from "@/lib/report-generator";
import type { FullWorkspaceEvaluation } from "@/lib/rule-engine";
import type { BusinessContext } from "@/lib/types";

export function Reports({ context, evaluation, demo }: { context: BusinessContext; evaluation: FullWorkspaceEvaluation; demo?: boolean }) {
  const report = buildDiagnosticReportData(context, evaluation);
  return <div className="grid gap-5">
    <div className="print-hidden flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
      <p className="max-w-prose text-sm text-muted-foreground">Puedes revisar el informe abajo. En el cuadro de impresión, elige «Guardar como PDF» para descargarlo.</p>
      <Button type="button" onClick={() => window.print()}><Printer aria-hidden="true" /> Guardar como PDF</Button>
    </div>
    <article id="diagnostic-document" className="grid gap-6 rounded-xl border border-border bg-card p-5 sm:p-8" aria-label="Vista previa del reporte">
      <header className="border-b border-border pb-4">
        <p className="eyebrow">CREA · Diagnóstico tributario</p>
        <h2 className="editorial-title mt-2 break-words">{report.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{report.location || "Cajamarca, Perú"} · Evaluación {report.evaluationDate} · Emitido el {report.generatedAtFormatted}</p>
        <p className="text-sm text-muted-foreground">Versión de reglas {report.ruleEngineVersion}</p>
      </header>
      {demo && <Notice tone="warning">Demostración. Este informe contiene datos de ejemplo.</Notice>}
      <section>
        <h3 className="mb-3 text-xl font-bold">Datos evaluados</h3>
        <dl className="grid gap-3 sm:grid-cols-2">{report.evaluatedDataWithOrigins.map(({ field, value, origin }) => <div key={field}><dt className="text-sm text-muted-foreground">{field}</dt><dd className="font-semibold">{value}</dd>{origin !== "Declarado" && <dd className="text-sm">{origin}</dd>}</div>)}</dl>
      </section>
      <section>
        <h3 className="mb-3 text-xl font-bold">Régimen actual</h3>
        <p className="font-bold">{report.current?.regimeName}</p><p>{report.current?.summary}</p>
      </section>
      <section className="grid gap-2">
        <h3 className="mb-2 text-xl font-bold">Compatibilidad por régimen</h3>
        {report.alternatives.map((rec) => <div className="report-entry rounded-lg border border-border p-3.5" key={rec.code}>
          <div className="flex flex-wrap items-center justify-between gap-2"><strong>{rec.title}</strong><RegimeStatus status={rec.status} /></div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{rec.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </div>)}
      </section>
      {report.obligations.length > 0 && <section><h3 className="mb-3 text-xl font-bold">Obligaciones del régimen declarado</h3><ul className="grid gap-2">{report.obligations.map((obligation) => <li key={obligation.id}><strong>{obligation.title}</strong><p className="text-sm">{obligation.description}</p></li>)}</ul></section>}
      <section>
        <h3 className="mb-3 text-xl font-bold">Fuentes oficiales</h3>
        <ul className="grid gap-2">{report.officialSources.map((source) => <li key={source.id} className="report-entry rounded-lg border border-border p-3">
          <SourceLink href={source.url}>{source.title}</SourceLink>
          <p className="text-sm">{source.legalBasis} · Versión {source.version ?? report.ruleEngineVersion} · Revisión {source.reviewedAt}</p>
          <p className="hidden break-all text-xs print:block">{source.url}</p>
        </li>)}</ul>
      </section>
      <p className="rounded-lg bg-muted p-3 text-sm">{report.scope}</p>
    </article>
  </div>;
}
