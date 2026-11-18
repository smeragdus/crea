"use client";

import { useState } from "react";
import { PageHeading, SourceLink } from "@/components/ui/primitives";
import { AssessmentEntry } from "./assessment-entry";
import { SelectField } from "./assessment-fields";
import { sourceById } from "@/lib/seed-catalog";
import { NRUS_ANNUAL_LIMIT, NRUS_ASSETS_LIMIT, NRUS_MONTHLY_LIMIT_CAT2, RER_ANNUAL_INCOME_LIMIT, RER_ASSETS_LIMIT, RER_WORKERS_PER_SHIFT_LIMIT, RMT_INCOME_LIMIT_2026, UIT_2026, UIT_SOURCE_URL } from "@/lib/tax-constants";
import { soles } from "@/lib/utils";

const regimes = [
  { code: "NRUS", option: "Nuevo RUS", name: "Nuevo Régimen Único Simplificado", source: "sunat-nrus",
    receipts: "Boletas y tickets que no dan derecho a crédito fiscal.",
    limits: `Hasta ${soles(NRUS_MONTHLY_LIMIT_CAT2)} al mes y ${soles(NRUS_ANNUAL_LIMIT)} al año en ventas y en compras. Activos computables hasta ${soles(NRUS_ASSETS_LIMIT)}.`,
    operation: "Personas naturales con una sola unidad de operación.",
    duties: "Cuota mensual de S/ 20 o S/ 50. Conserva comprobantes. Sin libros contables ni declaración anual de renta." },
  { code: "RER", option: "RER", name: "Régimen Especial de Renta", source: "sunat-rer",
    receipts: "Boletas y facturas.",
    limits: `Ventas netas y compras de hasta ${soles(RER_ANNUAL_INCOME_LIMIT)} al año cada una. Activos computables hasta ${soles(RER_ASSETS_LIMIT)}.`,
    operation: `Hasta ${RER_WORKERS_PER_SHIFT_LIMIT} trabajadores por turno. Algunas actividades quedan excluidas.`,
    duties: "Renta mensual del 1,5 % de ingresos netos e IGV. Registros de compras y ventas. Sin declaración anual de renta." },
  { code: "RMT", option: "RMT", name: "Régimen MYPE Tributario", source: "sunat-rmt",
    receipts: "Boletas y facturas.",
    limits: `Hasta 1 700 UIT de ingresos netos anuales (${soles(RMT_INCOME_LIMIT_2026)} en 2026).`,
    operation: "Revisa las exclusiones por vinculación de capital y por establecimientos de empresas constituidas en el extranjero.",
    duties: "IGV y anticipos mensuales de renta. Declaración anual con tasas por tramo de utilidad. Libros según ingresos." },
  { code: "RG", option: "General (RG)", name: "Régimen General", source: "sunat-rg",
    receipts: "Boletas y facturas.",
    limits: "Sin topes de ingresos, compras o activos para el régimen.",
    operation: "Disponible para personas y empresas con rentas empresariales.",
    duties: "IGV y anticipos mensuales de renta. Renta anual del 29,5 % sobre utilidad tributaria. Libros según ingresos." },
] as const;

const rows = [
  ["receipts", "Comprobantes que puedes emitir"],
  ["limits", "Topes de ventas, compras y activos"],
  ["operation", "Otras condiciones"],
  ["duties", "Declaraciones y registros"],
] as const;

export function ComparePage() {
  const [left, setLeft] = useState<string>("NRUS");
  const [right, setRight] = useState<string>("RER");
  const first = regimes.find(({ code }) => code === left) ?? regimes[0];
  const second = regimes.find(({ code }) => code === right) ?? regimes[1];

  function options(excluded: string) {
    return regimes.map(({ code, option }) => <option key={code} value={code} disabled={code === excluded}>{option}</option>);
  }

  return <div className="container-site page-shell">
    <PageHeading label="Guía tributaria · 2026" title="Compara los regímenes"
      description="Elige dos regímenes para ver en paralelo qué comprobantes admiten, cuáles son sus límites y qué debes declarar." />
    <div className="grid grid-cols-2 gap-3 sm:gap-5">
      <SelectField id="compare-left" label="Primer régimen" value={left} onChange={setLeft}>{options(right)}</SelectField>
      <SelectField id="compare-right" label="Segundo régimen" value={right} onChange={setRight}>{options(left)}</SelectField>
    </div>
    <div className="mt-5 overflow-hidden rounded-lg border border-border">
      <table className="comparison-table text-sm sm:text-base">
        <caption className="sr-only">Condiciones de {first.code} y {second.code}</caption>
        <thead><tr>{[first, second].map(({ code, name }) => <th key={code} id={"comparison-" + code} scope="col">
          <span className="block text-sm font-extrabold text-primary">{code}</span>{name}
        </th>)}</tr></thead>
        {rows.map(([field, title]) => <tbody key={field}>
          <tr><th id={"comparison-" + field} scope="rowgroup" colSpan={2}>{title}</th></tr>
          <tr>{[first, second].map((regime) => <td key={regime.code} headers={"comparison-" + regime.code + " comparison-" + field}>{regime[field]}</td>)}</tr>
        </tbody>)}
        <tbody>
          <tr><th id="comparison-sources" scope="rowgroup" colSpan={2}>Fuentes oficiales</th></tr>
          <tr>{[first, second].map(({ code, source }) => <td key={code} headers={"comparison-" + code + " comparison-sources"}><SourceLink href={sourceById(source)!.url}>Ver {code} en SUNAT</SourceLink></td>)}</tr>
        </tbody>
      </table>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground"><p>UIT de 2026 {soles(UIT_2026)}.</p><SourceLink href={UIT_SOURCE_URL}>Consultar el decreto en el MEF</SourceLink></div>
    <section className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
      <div><h2 className="editorial-title">Evalúa con tus datos</h2><p className="mt-1 text-muted-foreground">CREA revisa las condiciones de los cuatro regímenes para tu restaurante.</p></div>
      <AssessmentEntry />
    </section>
  </div>;
}
