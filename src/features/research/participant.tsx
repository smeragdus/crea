"use client";

import { ArrowRight, ClipboardCheck } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LinkButton, Notice } from "@/components/ui/primitives";
import { ChoiceField } from "@/features/evaluation/assessment-fields";
import { limaDay } from "@/features/evaluation/session-storage";
import { QUESTION_COUNT, type ParticipantInstrument, type StudyStage } from "@/lib/research-engine";
import { loadParticipant, recordConsent, submitResponses, type ParticipantRole } from "./repository";

export function Participant() {
  const [state, setState] = useState<Awaited<ReturnType<typeof loadParticipant>> | undefined>(undefined);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    loadParticipant().then((result) => { if (active) setState(result); }).catch(() => {
      if (active) setError("No pudimos cargar tu participación. Comprueba tu conexión o consulta con el equipo investigador.");
    });
    return () => { active = false; };
  }, [revision]);

  async function save(write: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await write();
      setState(await loadParticipant());
    } catch {
      setError("No pudimos confirmar el registro. Consulta el estado antes de volver a enviarlo.");
    } finally {
      setBusy(false);
    }
  }

  let content: ReactNode;
  if (state === undefined) content = !error && <p role="status">Cargando etapas del estudio…</p>;
  else if (state === null) content = <EmptyState title="Tu cuenta aún no está inscrita" action={false}>Comunícate con el equipo de investigación para vincular tu cuenta a uno de los restaurantes participantes.</EmptyState>;
  else {
    const { instrument, state: progress } = state;
    const consent = progress.consent;
    const pretest = progress.pretest;
    const laterDay = pretest && limaDay(new Date()) > limaDay(pretest.submittedAt.toDate());
    const stage: StudyStage = pretest ? "postest" : "pretest";
    const activeStage = !consent ? 0 : !pretest ? 1 : !progress.intervention ? 2 : progress.postest ? 4 : 3;
    content = <>
      <p className="eyebrow">Código {progress.code} · Instrumento {instrument.version}</p>
      <ol aria-label="Etapas del estudio" className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm sm:grid-cols-4">
        {["Consentimiento", "Pretest", "Uso de CREA", "Postest"].map((label, index) =>
          <li key={label} aria-current={index === activeStage ? "step" : undefined}
            className={"border-t-2 pt-2 " + (index <= activeStage ? "border-primary font-bold text-primary" : "border-border text-muted-foreground")}>
            {label}{index < activeStage && <span className="sr-only"> (completado)</span>}
          </li>)}
      </ol>
      {!consent ? <ConsentForm text={instrument.consentText} version={instrument.consentVersion} busy={busy}
        accept={(role) => save(() => recordConsent(progress.code, instrument, role))} />
        : progress.postest ? <Card className="grid gap-2 p-5 sm:p-7"><ClipboardCheck className="text-primary" aria-hidden="true" /><h2 className="text-2xl font-bold">Participación registrada</h2><p>El pretest y el postest quedaron guardados.</p></Card>
        : !pretest || (laterDay && progress.intervention) ?
          <Quiz key={stage} stage={stage} instrument={instrument} busy={busy}
            onSubmit={(answers) => save(() => submitResponses(progress.code, stage, instrument.version, answers))} />
        : <Card className="grid justify-items-start gap-3 p-5 sm:p-7">
          <h2 className="text-2xl font-bold">Pretest registrado</h2>
          <p className="text-muted-foreground">{!progress.intervention ? "Usa CREA según las indicaciones del equipo investigador. El equipo confirmará la intervención para habilitar el postest." : "La intervención quedó registrada. Podrás realizar el postest a partir del siguiente día calendario en Perú."}</p>
          <div className="flex flex-wrap gap-2"><LinkButton href="/negocios/nuevo">Ir a la evaluación tributaria <ArrowRight aria-hidden="true" /></LinkButton><Button variant="outline" onClick={() => setRevision((value) => value + 1)}>Actualizar estado</Button></div>
        </Card>}
    </>;
  }
  return <div className="grid max-w-4xl gap-4" aria-busy={busy}>
    {error && <Notice tone="error">{error} <Button variant="ghost" onClick={() => { setError(""); setRevision((value) => value + 1); }}>Consultar estado</Button></Notice>}
    {content}
  </div>;
}

function ConsentForm({ text, version, busy, accept }: { text: string; version: string; busy: boolean; accept: (value: ParticipantRole) => Promise<void> }) {
  const [checked, setChecked] = useState(false);
  const [role, setRole] = useState("");
  return <Card className="grid gap-5 p-5 sm:p-8">
    <div><h2 className="text-2xl font-bold">Consentimiento informado</h2><p className="text-sm text-muted-foreground">Versión {version}</p></div>
    <p className="whitespace-pre-wrap break-words">{text}</p>
    <form className="grid gap-4" onSubmit={(event) => {
      event.preventDefault();
      if (checked && (role === "PROPIETARIO" || role === "ADMINISTRADOR")) void accept(role);
    }}>
      <ChoiceField id="study-role" label="¿Cuál es tu función en el restaurante?" value={role} onChange={setRole}
        options={[["PROPIETARIO", "Propietario/a", ""], ["ADMINISTRADOR", "Administrador/a", ""]]} />
      <label className="flex min-h-11 items-start gap-2"><input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} /> Acepto participar según el consentimiento informado.</label>
      <Button type="submit" className="justify-self-start" disabled={busy || !checked || !role}>{busy ? "Guardando…" : "Registrar consentimiento"}</Button>
    </form>
  </Card>;
}

function Quiz({ stage, instrument, busy, onSubmit }: { stage: StudyStage; instrument: ParticipantInstrument; busy: boolean; onSubmit: (answers: number[]) => Promise<void> }) {
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [error, setError] = useState("");
  const title = useRef<HTMLHeadingElement>(null);
  const start = page * 6;
  const last = start + 6 === QUESTION_COUNT;
  const titleText = stage === "pretest" ? "Pretest" : "Postest";

  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missing = Array.from({ length: 6 }, (_, index) => start + index).find((index) => answers[index] === undefined);
    if (missing !== undefined) {
      setError("Selecciona una respuesta para cada pregunta de este bloque.");
      document.getElementById("item-" + missing)?.focus();
      return;
    }
    setError("");
    if (last) void onSubmit(Array.from({ length: QUESTION_COUNT }, (_, index) => answers[index]));
    else move(page + 1);
  }

  function move(index: number) {
    setError("");
    setPage(index);
    title.current?.focus();
  }

  return <Card className="grid gap-5 p-5 sm:p-8">
    <div><h2 ref={title} tabIndex={-1} className="editorial-title">{titleText}</h2><p className="text-muted-foreground" role="status">Preguntas {start + 1} a {start + 6} de {QUESTION_COUNT}</p></div>
    <form onSubmit={next} className="grid gap-7">
      {instrument.questions.slice(start, start + 6).map(({ prompt, options }, offset) => {
        const index = start + offset;
        return <ChoiceField key={index} id={"item-" + index} label={(index + 1) + ". " + prompt}
          value={answers[index] === undefined ? "" : String(answers[index])}
          onChange={(value) => setAnswers((current) => ({ ...current, [index]: Number(value) }))}
          options={options.map((option, optionIndex) => [String(optionIndex), option, ""])} />;
      })}
      {error && <Notice tone="error">{error}</Notice>}
      <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-4">
        <Button variant="outline" type="button" disabled={page === 0 || busy} onClick={() => move(page - 1)}>Atrás</Button>
        <Button type="submit" disabled={busy}>{busy ? "Enviando…" : last ? "Enviar respuestas" : "Continuar"} <ArrowRight aria-hidden="true" /></Button>
      </div>
    </form>
  </Card>;
}
