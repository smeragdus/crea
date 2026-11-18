"use client";

import { Download } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/primitives";
import { approvedInstrumentSchema, interventionModules, QUESTION_COUNT, RESEARCH_SAMPLE_SIZE, researchCsv, VALID_PARTICIPANT_CODES } from "@/lib/research-engine";
import { searchText } from "@/lib/utils";
import { confirmIntervention, enrollParticipant, getStudyProgress, publishInstrument, savePairedScore, studyVersion, type ParticipantProgress } from "./repository";

export function ResearchConsole() {
  const [version, setVersion] = useState<string | null>(null);
  const [records, setRecords] = useState<ParticipantProgress[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [status, setStatus] = useState({ message: "", error: false });
  const [opened, setOpened] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([studyVersion(), getStudyProgress()]).then(([study, participants]) => {
      if (!active) return;
      setVersion(study);
      setRecords(participants);
    }).catch(() => {
      if (active) setStatus({ error: true, message: "No pudimos consultar el estudio. Revisa tu acceso e inténtalo otra vez." });
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [refresh]);

  async function perform(action: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(true);
    setStatus({ message: "", error: false });
    try {
      await action();
      setStatus({ message: success, error: false });
      setRefresh((value) => value + 1);
    } catch (error) {
      const message = error instanceof Error && error.name === "InstrumentValidationError"
        ? error.message : "No pudimos confirmar el registro. Actualiza el panel antes de volver a intentarlo.";
      setStatus({ error: true, message });
    } finally {
      setBusy(false);
    }
  }

  function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const file = data.get("instrument");
    if (!(file instanceof File) || file.size === 0 || file.size > 150_000) {
      setStatus({ error: true, message: "Selecciona un archivo JSON válido de hasta 150 KB." });
      return;
    }
    void perform(async () => {
      let input: unknown;
      try { input = JSON.parse(await file.text()); } catch { throw instrumentError("El archivo no contiene JSON válido."); }
      const result = approvedInstrumentSchema.safeParse(input);
      if (!result.success) {
        const detail = result.error.issues[0].path.join(".");
        throw instrumentError("Verifica el esquema, las 18 preguntas y la clave del instrumento. Revisa " + (detail || "los campos del archivo") + ".");
      }
      await publishInstrument(result.data);
    }, "Instrumento publicado para el grupo del estudio.");
  }

  function enroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!version) return;
    const data = new FormData(event.currentTarget);
    const uid = String(data.get("uid") || "").trim();
    const code = String(data.get("code") || "");
    void perform(() => enrollParticipant(uid, code, version), "Cuenta inscrita en el estudio.");
  }

  function exportResults() {
    const scores = records.flatMap(({ result }) => result ? [result] : []);
    const url = URL.createObjectURL(new Blob(["\uFEFF", researchCsv(scores)], { type: "text/csv;charset=utf-8" }));
    const download = document.createElement("a");
    download.href = url;
    download.download = "crea-resultados-pretest-postest.csv";
    download.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  const taken = new Set(records.map(({ code }) => code));
  const results = records.filter(({ result }) => result).length;
  const visible = records.filter(({ code }) => searchText(code).includes(searchText(query)));

  return <div className="grid gap-5" aria-busy={busy || loading}>
    {status.message && <Notice tone={status.error ? "error" : "success"}>{status.message}</Notice>}
    {loading ? <p role="status">Cargando estudio…</p> : <>
      <div className="grid gap-4 border-y border-border py-4 sm:grid-cols-3">
        <Metric title="Inscritos" value={records.length + " / " + RESEARCH_SAMPLE_SIZE} />
        <Metric title="Pretest registrado" value={records.filter(({ pretest }) => pretest).length} />
        <Metric title="Pares calificados" value={results} />
      </div>
      {!version ? <Card className="p-5 sm:p-7">
        <h2 className="editorial-title">Publicar instrumento</h2>
        <p className="my-3 text-sm text-muted-foreground">Carga el JSON aprobado con {QUESTION_COUNT} preguntas cerradas, su clave y el consentimiento. La versión publicada se usará en ambas aplicaciones para todo el grupo.</p>
        <form onSubmit={publish} className="grid gap-4">
          <Field id="instrument" label="Archivo del instrumento"><Input id="instrument" name="instrument" type="file" accept=".json,application/json" required /></Field>
          <label className="flex min-h-11 items-start gap-2"><input type="checkbox" required /> Confirmo que el instrumento y el consentimiento corresponden al protocolo aprobado.</label>
          <Button type="submit" className="justify-self-start" disabled={busy}>Publicar versión</Button>
        </form>
      </Card> : <Card className="p-5 sm:p-7">
        <h2 className="editorial-title">Inscribir restaurante</h2>
        <p className="my-3 text-sm text-muted-foreground">Versión activa {version}. Vincula el UID de la cuenta Firebase del propietario o administrador a un código libre.</p>
        {taken.size === RESEARCH_SAMPLE_SIZE ? <Notice>Los 36 códigos ya están asignados.</Notice> : <form onSubmit={enroll} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="participant-uid" label="UID de Firebase"><Input id="participant-uid" name="uid" required maxLength={128} autoComplete="off" /></Field>
            <Field id="participant-code" label="Código disponible"><select id="participant-code" name="code" required className="min-h-12 rounded-lg border border-input bg-card px-3">
              <option value="">Selecciona un código</option>{VALID_PARTICIPANT_CODES.filter((code) => !taken.has(code)).map((code) => <option key={code} value={code}>{code}</option>)}
            </select></Field>
          </div>
          <Button type="submit" className="justify-self-start" disabled={busy}>Asignar código</Button>
        </form>}
      </Card>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><h2 className="editorial-title">Seguimiento</h2>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setRefresh((value) => value + 1)} disabled={busy}>Actualizar</Button><Button variant="outline" disabled={!results} onClick={exportResults}><Download aria-hidden="true" /> Exportar CSV</Button></div>
      </div>
      {records.length > 0 && <div className="max-w-xs"><Field id="study-search" label="Buscar por código">
        <Input id="study-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </Field></div>}
      {records.length === 0 && <Notice>Aún no hay restaurantes inscritos.</Notice>}
      {records.length > 0 && visible.length === 0 && <p role="status">No encontramos participantes con ese código.</p>}
      {visible.map((record) => <article key={record.code} className="grid gap-4 border-t border-border py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="text-lg font-bold">{record.code}</h3>
            <p className="text-sm text-muted-foreground">{record.consent ? "Consentimiento registrado" : "Consentimiento pendiente"} · {record.pretest ? "Pretest registrado" : "Pretest pendiente"} · {record.intervention ? "Intervención registrada" : "Intervención pendiente"} · {record.postest ? "Postest registrado" : "Postest pendiente"}</p></div>
          {record.pretest && !record.intervention && <Button variant="outline" aria-expanded={opened === record.code} onClick={() => setOpened(opened === record.code ? null : record.code)}>Registrar intervención</Button>}
          {record.postest && !record.result && <Button variant="outline" disabled={busy} onClick={() => void perform(() => savePairedScore(record), "Par calificado.")}>Calificar par</Button>}
        </div>
        {opened === record.code && record.pretest && !record.intervention && <form onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const modules = data.getAll("modules").map(String);
          if (!modules.length) {
            setStatus({ error: true, message: "Selecciona al menos una sección que se utilizó en la intervención." });
            return;
          }
          const assignedVersion = record.pretest!.version;
          void perform(() => confirmIntervention(record.code, assignedVersion, modules), "Intervención registrada.");
        }} className="grid gap-4 rounded-lg bg-muted p-4">
          <fieldset><legend className="font-bold">Secciones utilizadas durante la intervención</legend>
            <div className="grid gap-1 sm:grid-cols-3">{interventionModules.map((module) => <label key={module} className="flex min-h-11 items-center gap-2"><input type="checkbox" name="modules" value={module} /> {module}</label>)}</div>
          </fieldset>
          <Button type="submit" className="justify-self-start" disabled={busy}>Confirmar intervención</Button>
        </form>}
        {record.result && <p className="text-sm font-bold">Pretest {record.result.pretest} · Postest {record.result.postest} · Máximo {record.result.maximum}</p>}
      </article>)}
    </>}
  </div>;
}

function Metric({ title, value }: { title: string; value: number | string }) {
  return <div><p className="text-sm text-muted-foreground">{title}</p><p className="text-3xl font-bold tracking-tight text-primary">{value}</p></div>;
}

function instrumentError(message: string) {
  const error = new Error(message);
  error.name = "InstrumentValidationError";
  return error;
}
