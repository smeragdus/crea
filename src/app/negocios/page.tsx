import type { Metadata } from "next";
import { Suspense } from "react";
import { Workspace } from "@/features/workspace/workspace";

export const metadata: Metadata = { title: "Mi espacio" };

export default function BusinessesPage() {
  return <Suspense fallback={<div className="container-site page-shell"><p role="status">Cargando tu espacio…</p></div>}><Workspace /></Suspense>;
}
