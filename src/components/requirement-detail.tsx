import { ArrowLeft } from "lucide-react";
import { EmptyState, LinkButton, Notice, PageHeading, SourceLink } from "@/components/ui/primitives";
import { requirementById, sourceById } from "@/lib/seed-catalog";
import { practicalGuides } from "@/lib/practical-guides";

export function RequirementDetail({ id }: { id: string }) {
  const requirement = requirementById(id);
  if (!requirement) return <div className="container-site page-shell"><EmptyState title="Guía no encontrada" action={false}><LinkButton href="/negocios?seccion=orientacion" variant="outline">Ver guías</LinkButton></EmptyState></div>;
  const source = sourceById(requirement.sourceId);
  const guide = Object.values(practicalGuides).find(({ sourceId }) => sourceId === requirement.sourceId);

  return <div className="container-site page-shell">
    <LinkButton href="/negocios?seccion=orientacion" variant="ghost" className="mb-5 px-0"><ArrowLeft aria-hidden="true" /> Volver a las guías</LinkButton>
    <PageHeading label={requirement.institution} title={requirement.title} description={requirement.description} />
    <div className="grid max-w-4xl gap-4">
      <section className="border-t border-border py-5">
        <h2 className="editorial-title">Qué preparar</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">{requirement.documents.map((document) => <li key={document}>{document}</li>)}</ul>
      </section>
      {guide && <section className="border-t border-border py-5"><h2 className="editorial-title">Pasos de la guía</h2><ol className="mt-3 list-decimal space-y-2 pl-5 text-muted-foreground">{guide.steps.map((step) => <li key={step}>{step}</li>)}</ol></section>}
      {source && <section className="border-t border-border py-5"><h2 className="editorial-title">Fuente oficial</h2><p className="mt-2 text-muted-foreground">{source.evidence}</p><SourceLink href={source.url}>{source.title}</SourceLink></section>}
      {source?.verification === "POR_VERIFICAR" && <Notice tone="warning">La vigencia de esta fuente requiere confirmación.</Notice>}
    </div>
  </div>;
}
