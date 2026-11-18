import type { Metadata } from "next";
import { Suspense } from "react";
import { BusinessWizard } from "@/features/evaluation/business-wizard";

export const metadata: Metadata = { title: "Evaluar mi restaurante" };

export default function NewBusinessPage() {
  return <Suspense fallback={<div className="container-site page-shell"><p role="status">Cargando evaluación…</p></div>}><BusinessWizard /></Suspense>;
}
