import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/primitives";
import { Obligations } from "@/features/workspace/obligations";

export const metadata: Metadata = { title: "Consultar obligaciones" };

export default function PublicObligationsPage() {
  return <div className="container-site page-shell">
    <PageHeading title="Consulta tus obligaciones" description="Elige un régimen para ver qué se declara, qué documentos preparar y cómo consultar el vencimiento." />
    <div className="max-w-4xl"><Obligations /></div>
  </div>;
}
