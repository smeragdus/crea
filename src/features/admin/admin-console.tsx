"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, inputClassName } from "@/components/ui/input";
import { LinkButton, Notice, PageHeading, SourceLink } from "@/components/ui/primitives";
import { AccessGate } from "@/features/auth/access-gate";
import { CATALOG_VERSION, sources, taxRules } from "@/lib/seed-catalog";
import { searchText } from "@/lib/utils";
import { createRevision, listRevisions, reviewRevision, revisionSchema, type StoredRevision } from "./catalog-revisions";

type Section = "rules" | "sources" | "history";
const tabs = [
  { key: "rules", text: "Reglas" },
  { key: "sources", text: "Fuentes" },
  { key: "history", text: "Revisiones" },
] as const;

export function AdminConsole() {
  return <div className="container-site page-shell">
    <PageHeading label="Administración" title="Catálogo normativo" description="Consulta la versión en uso y registra cambios propuestos con su sustento oficial."
      actions={<LinkButton href="/investigacion" variant="outline">Ir a investigación</LinkButton>} />
    <AccessGate section="/admin" role="admin"><CatalogEditor /></AccessGate>
  </div>;
}

function CatalogEditor() {
  const [active, setActive] = useState<Section>("rules");
  const [target, setTarget] = useState<{ id: string; title: string; url: string; kind: "rule" | "source" } | null>(null);
  const [revisions, setRevisions] = useState<StoredRevision[] | null>(null);
  const [revisionLoad, setRevisionLoad] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const revisionTitle = useRef<HTMLHeadingElement>(null);
  const term = searchText(query);
  const matchingRules = taxRules.filter(({ id, title, regime }) => searchText(id + " " + title + " " + regime).includes(term));
  const matchingSources = sources.filter(({ title, institution }) => searchText(title + " " + institution).includes(term));
  const count = active === "rules" ? matchingRules.length : matchingSources.length;

  useEffect(() => {
    if (active === "history" && target) revisionTitle.current?.focus();
  }, [active, target]);

  useEffect(() => {
    let current = true;
    listRevisions().then((items) => { if (current) setRevisions(items); }).catch(() => {
      if (current) setError("No pudimos cargar el historial. Comprueba tu conexión e inténtalo otra vez.");
    });
    return () => { current = false; };
  }, [revisionLoad]);

  function openRevision(next: NonNullable<typeof target>) {
    setTarget(next);
    setActive("history");
    setError("");
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target || busy) return;
    const data = new FormData(event.currentTarget);
    const result = revisionSchema.safeParse({
      kind: target.kind, targetId: target.id, title: data.get("title"), version: data.get("version"),
      proposedChange: data.get("proposedChange"), sourceUrl: data.get("sourceUrl"),
    });
    if (!result.success) {
      setError("Revisa el título, la versión sin espacios, el enlace HTTPS y la descripción del cambio (al menos 15 caracteres).");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await createRevision(result.data);
      setMessage("Borrador registrado.");
      setTarget(null);
      setRevisionLoad((value) => value + 1);
    } catch {
      setError("No pudimos registrar el borrador. Comprueba tu acceso e inténtalo nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  async function approve(id: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await reviewRevision(id);
      setMessage("Revisión aprobada para una próxima publicación del catálogo.");
      setRevisionLoad((value) => value + 1);
    } catch {
      setError("No pudimos aprobar la revisión. Actualiza el historial y vuelve a intentarlo.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="grid gap-5">
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
      <p className="text-sm text-muted-foreground">Versión en uso <strong className="text-primary">{CATALOG_VERSION}</strong></p>
      <div role="group" aria-label="Secciones del catálogo" className="flex flex-wrap gap-2">{tabs.map(({ key, text }) => <Button key={key} variant={active === key ? "default" : "outline"} aria-pressed={active === key} onClick={() => { setActive(key); setQuery(""); }}>{text}</Button>)}</div>
    </div>
    {error && <Notice tone="error">{error} <Button variant="ghost" onClick={() => { setError(""); setRevisionLoad((value) => value + 1); }}>Recargar historial</Button></Notice>}
    {message && <Notice tone="success">{message}</Notice>}
    {active !== "history" && <div className="max-w-md">
      <Field id="catalog-search" label={active === "rules" ? "Buscar reglas" : "Buscar fuentes"}>
        <Input id="catalog-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={active === "rules" ? "Título, código o régimen" : "Título o institución"} />
      </Field>
      {term && <p className="mt-2 text-sm text-muted-foreground" role="status">{count ? count + (count === 1 ? " resultado" : " resultados") : "La búsqueda no encontró resultados."}</p>}
    </div>}
    {active === "rules" && <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Reglas tributarias">
      {matchingRules.map((rule) => {
        const source = sources.find(({ id }) => id === rule.sourceId);
        return <Card key={rule.id} className="grid content-start gap-2 p-5">
          <p className="eyebrow">{rule.regime} · {rule.id}</p><h2 className="text-lg font-bold">{rule.title}</h2>
          <p className="text-sm text-muted-foreground">{rule.conditionDescription}</p>
          <p className="text-sm text-muted-foreground">v{rule.version} · Desde {rule.effectiveFrom}</p>
          {source && <SourceLink href={source.url}>{rule.legalBasis}</SourceLink>}
          <Button variant="outline" className="mt-1 justify-self-start" onClick={() => openRevision({ id: rule.id, title: rule.title, url: source?.url ?? "", kind: "rule" })}>Proponer ajuste</Button>
        </Card>;
      })}
    </section>}
    {active === "sources" && <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Fuentes normativas">
      {matchingSources.map((source) => <Card key={source.id} className="grid content-start gap-2 p-5">
        <p className="eyebrow">{source.institution}</p><h2 className="text-lg font-bold">{source.title}</h2>
        <p className="text-sm text-muted-foreground">{source.verification === "VIGENTE" ? "Vigente" : "Requiere revisión"} · {source.reviewedAt}</p>
        <SourceLink href={source.url}>Abrir fuente</SourceLink>
        <Button variant="outline" className="justify-self-start" onClick={() => openRevision({ id: source.id, title: source.title, url: source.url, kind: "source" })}>Proponer ajuste</Button>
      </Card>)}
    </section>}
    {active === "history" && <section className="grid gap-4">
      {target && <Card className="p-5 sm:p-7">
        <h2 ref={revisionTitle} tabIndex={-1} className="editorial-title mb-4">Nueva revisión · {target.id}</h2>
        <form key={target.id} onSubmit={submit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <Field id="title" label="Título"><Input name="title" id="title" defaultValue={target.title} required maxLength={180} /></Field>
            <Field id="version" label="Versión propuesta" hint="Por ejemplo, 2026.4"><Input name="version" id="version" aria-describedby="version-hint" required maxLength={60} /></Field>
          </div>
          <Field id="sourceUrl" label="Enlace oficial"><Input id="sourceUrl" name="sourceUrl" type="url" defaultValue={target.url} required maxLength={512} /></Field>
          <Field id="proposedChange" label="Cambio y sustento"><textarea className={inputClassName} id="proposedChange" name="proposedChange" required maxLength={2000} rows={4} /></Field>
          <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy}>Guardar borrador</Button><Button variant="outline" onClick={() => setTarget(null)}>Cancelar</Button></div>
        </form>
      </Card>}
      <h2 className="editorial-title">Historial de revisiones</h2>
      <p className="text-sm text-muted-foreground">Las revisiones aprobadas quedan disponibles para incorporarlas en la próxima versión del catálogo de evaluación.</p>
      {revisions === null ? <p role="status">Cargando historial…</p> : revisions.length === 0 ? <Notice>Todavía no hay revisiones registradas.</Notice>
      : revisions.map((revision) => <Card key={revision.id} className="grid gap-2 p-5">
        <p className="eyebrow">{revision.status === "BORRADOR" ? "Borrador" : "Aprobada"} · v{revision.version} · {revision.targetId}</p>
        <h3 className="text-lg font-bold">{revision.title}</h3><p className="whitespace-pre-wrap text-sm text-muted-foreground">{revision.proposedChange}</p>
        <SourceLink href={revision.sourceUrl}>Sustento oficial</SourceLink>
        {revision.status === "BORRADOR" && <Button variant="outline" className="justify-self-start" disabled={busy} onClick={() => void approve(revision.id)}><Check aria-hidden="true" /> Aprobar revisión</Button>}
      </Card>)}
    </section>}
  </div>;
}
