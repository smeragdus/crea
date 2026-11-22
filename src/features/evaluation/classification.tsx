"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SourceLink } from "@/components/ui/primitives";
import {
  answerCiiuClarification, ciiuCatalog, ciiuClarifications, ciiuInputSchema, ciiuSnapshotSchema, CIIU_TABLE,
  isCiiuCode, readCiiuSnapshot, suggestCiiuLocally, type CiiuCode, type CiiuInput,
} from "@/lib/ciiu-catalog";

const endpoint = process.env.NEXT_PUBLIC_CREA_ASSISTANT_URL;
const prompt = "¿A qué se dedicará principalmente tu negocio?";
const help = "Cuéntanos qué comidas o bebidas prepararás, cómo las venderás y a quiénes atenderás. No necesitas conocer tu código CIIU.";

export function ClassificationField({ profile, primary, secondary, analysis, error, onDescription, onAnalysis, onDecision }: {
  profile: CiiuInput;
  primary: string;
  secondary: string;
  analysis: string;
  error?: string;
  onDescription: (description: string) => void;
  onAnalysis: (value: string) => void;
  onDecision: (primary: CiiuCode | "unknown" | "review" | "", secondary?: CiiuCode[]) => void;
}) {
  const snapshot = readCiiuSnapshot(analysis);
  const result = snapshot?.suggestion;
  const question = result?.clarification ? ciiuClarifications[result.clarification] : undefined;
  const confirmed = isCiiuCode(primary);
  const code = confirmed ? primary : result?.primary;
  const entry = code ? ciiuCatalog[code] : undefined;
  const decisionPending = primary === "unknown" || primary === "review";
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const selected = snapshot?.selectedSecondary?.filter((item) => result?.secondary.includes(item)) ?? [];
  const controller = useRef<AbortController | null>(null);
  const decision = useRef<HTMLDivElement>(null);

  useEffect(() => () => controller.current?.abort(), []);

  function show(value: NonNullable<typeof snapshot>) {
    onAnalysis(JSON.stringify(value));
    requestAnimationFrame(() => decision.current?.focus());
  }

  function editDescription() {
    onAnalysis("");
    onDecision("");
    setStatus("");
    requestAnimationFrame(() => document.getElementById("description")?.focus());
  }

  async function identify(useProvider: boolean) {
    const checked = ciiuInputSchema.safeParse(profile);
    if (!checked.success) {
      setStatus("Describe tu actividad antes de pedir una sugerencia.");
      document.getElementById("description")?.focus();
      return;
    }
    const input = checked.data;
    setStatus("");
    if (useProvider && endpoint && !consent) {
      setStatus("Autoriza el envío del perfil o elige la orientación local.");
      return;
    }
    if (!useProvider || !endpoint) {
      if (useProvider) setStatus("El servicio de IA no está configurado. Usamos el catálogo local del INEI.");
      show({ source: "local", suggestion: suggestCiiuLocally(input), questions: 0 });
      return;
    }
    const request = new AbortController();
    controller.current = request;
    setBusy(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classification: input }), credentials: "omit", referrerPolicy: "no-referrer",
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(7500)]),
      });
      if (!response.ok) throw new Error(String(response.status));
      const value: unknown = await response.json();
      const parsed = ciiuSnapshotSchema.safeParse({ ...(typeof value === "object" ? value : {}), questions: 0 });
      if (!parsed.success) throw new Error("Invalid suggestion");
      if (!request.signal.aborted) show(parsed.data);
    } catch (cause) {
      if (!request.signal.aborted) {
        setStatus(cause instanceof Error && cause.message === "429"
          ? "Alcanzaste el límite de solicitudes a la IA. Puedes continuar con la orientación local."
          : "La IA no pudo completar la consulta. Usamos la orientación local del INEI.");
        show({ source: "local", suggestion: suggestCiiuLocally(input), questions: 0 });
      }
    } finally {
      if (!request.signal.aborted) setBusy(false);
    }
  }

  function answer(value: string) {
    if (!snapshot || !result?.clarification) return;
    const questions = snapshot.questions + 1;
    const suggestion = answerCiiuClarification(profile, result.clarification, value);
    if (questions >= 2 && suggestion.clarification) suggestion.clarification = null;
    show({ source: "local", suggestion, questions });
  }

  return <section id="activity" tabIndex={-1} className="grid max-w-3xl gap-4" aria-labelledby="activity-heading">
    <h2 id="activity-heading" className="text-2xl font-bold">{prompt}</h2>
    <p className="text-sm text-muted-foreground">{help}</p>
    {!snapshot && !confirmed && !decisionPending && <>
      <div className="grid gap-2">
        <label htmlFor="description" className="font-semibold">Cuéntanos brevemente qué ofrecerás en tu negocio</label>
        <textarea id="description" name="description" rows={4} maxLength={500} disabled={busy}
          aria-describedby="description-tip" value={profile.description} onChange={(event) => onDescription(event.target.value)}
          className="w-full rounded-xl border border-input bg-white p-3 placeholder:text-slate-500"
          placeholder="Quiero abrir una pollería en Cajamarca. Venderé pollo a la brasa para consumir en el local, para llevar y por delivery." />
        <p id="description-tip" className="text-sm text-muted-foreground">Omite nombres personales, correos, números de documento y direcciones exactas.</p>
      </div>
      {endpoint && <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={consent} disabled={busy} onChange={(event) => setConsent(event.target.checked)} />
        Autorizo enviar esta descripción, el tipo de negocio, la modalidad y el tipo de clientes al proveedor de IA.
      </label>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => void identify(true)}>Identificar mi actividad con CREA IA</Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => void identify(false)}>Usar orientación local</Button>
      </div>
    </>}
    <p role="status" className="text-sm text-muted-foreground" hidden={!busy && !status}>{busy ? "CREA está revisando tu actividad…" : status}</p>

    <div ref={decision} tabIndex={-1} className="grid gap-3" hidden={!snapshot && !confirmed && !decisionPending}>
      {decisionPending ? <>
        <p className="font-bold">{primary === "review" ? "Clasificación por revisar" : "Clasificación pendiente"}</p>
        <p className="text-sm text-muted-foreground">{primary === "review"
          ? "Confirma la actividad principal con SUNAT o consulta el catálogo del INEI antes de declarar un código."
          : "Puedes continuar con el diagnóstico y completar la clasificación después."}</p>
        <SourceLink href={CIIU_TABLE}>Consultar fuente oficial</SourceLink>
        <Button type="button" variant="outline" className="justify-self-start" onClick={editDescription}>Corregir descripción</Button>
      </> : entry && code ? <div className="grid gap-3 break-words rounded-xl border border-border bg-blue-50/60 p-4">
        <p className="font-bold">{confirmed ? "Actividad confirmada" : "Actividad identificada"}</p>
        <p className="text-sm text-muted-foreground">{snapshot?.source === "ia" ? "Sugerencia de CREA IA" : snapshot ? "Orientación local del INEI" : "Clasificación guardada"}</p>
        <p><strong>{confirmed ? "CIIU" : "CIIU sugerido"} {code}</strong> · {entry.name}</p>
        <details className="rule-details">
          <summary>¿Por qué este código?</summary>
          <p className="pb-2 text-sm">{entry.reason}</p>
        </details>
        <SourceLink href={"https://proyectos.inei.gob.pe/CIIU/frm_lista_notas.asp?wc_cod=" + code}>Consultar fuente oficial</SourceLink>
        {(confirmed ? secondary.split(",").filter(isCiiuCode) : result?.secondary ?? []).map((item) => (
          confirmed ? <p className="text-sm" key={item}>Actividad secundaria {item} · {ciiuCatalog[item].name}</p>
            : <label key={item} className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={selected.includes(item)} onChange={(event) => {
                if (!snapshot) return;
                const selectedSecondary = event.target.checked ? [...selected, item] : selected.filter((key) => key !== item);
                onAnalysis(JSON.stringify({ ...snapshot, selectedSecondary }));
              }} />
              También realizo por separado esta actividad: {ciiuCatalog[item].name}
            </label>
        ))}
        <div className="flex flex-wrap gap-2">
          {!confirmed && <Button type="button" onClick={() => onDecision(code, selected)}>Confirmar actividad</Button>}
          <Button type="button" variant="outline" onClick={editDescription}>Corregir descripción</Button>
          <Button type="button" variant="ghost" onClick={() => onDecision("review")}>No corresponde a mi negocio</Button>
        </div>
      </div> : question ? <fieldset className="grid gap-2">
        <legend className="mb-2 font-bold">{question.question}</legend>
        {question.options.map(([key, label]) => <Button className="h-auto justify-start whitespace-normal py-2 text-left" type="button" variant="outline" key={key} onClick={() => answer(key)}>{label}</Button>)}
        <Button type="button" variant="ghost" className="justify-self-start" onClick={() => onDecision("unknown")}>Todavía no lo sé</Button>
      </fieldset> : snapshot && <div className="grid gap-2">
        <p className="font-bold">{result?.review ? "Clasificación por revisar" : "Clasificación pendiente"}</p>
        <p className="text-sm text-muted-foreground">{result?.review
          ? "La actividad no coincide claramente con las clases que puede orientar CREA."
          : "Aún falta información para sugerir un código."}</p>
        <Button type="button" className="justify-self-start" onClick={() => onDecision(result?.review ? "review" : "unknown")}>Continuar con la clasificación pendiente</Button>
        <Button type="button" variant="ghost" className="justify-self-start" onClick={editDescription}>Corregir descripción</Button>
      </div>}
    </div>
    {!snapshot && !confirmed && !decisionPending && <Button type="button" variant="ghost" disabled={busy} className="justify-self-start" onClick={() => onDecision("unknown")}>Dejar clasificación pendiente</Button>}
    {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
  </section>;
}
