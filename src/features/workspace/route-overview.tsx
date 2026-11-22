import { Building2, Store, UserRound } from "lucide-react";
import { SourceLink } from "@/components/ui/primitives";
import { ciiuCatalog, CIIU_TABLE, isCiiuCode } from "@/lib/ciiu-catalog";
import { buildFormalizationRoute } from "@/lib/formalization";
import type { BusinessContext } from "@/lib/types";

export function RouteOverview({ context }: { context: BusinessContext }) {
  const code = isCiiuCode(context.ciiu) ? context.ciiu : undefined;
  const ruc = buildFormalizationRoute(context).find((task) => task.id === "ruc");
  const options = [
    { id: "natural", icon: UserRound, title: "Persona natural", text: "Puedes operar a tu propio nombre." },
    { id: "juridica", icon: Building2, title: "Persona jurídica", text: "Opera a través de una empresa constituida." },
  ] as const;
  return <section aria-labelledby="route-overview" className="print-hidden rounded-[28px] border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
    <p className="text-xs font-bold uppercase text-primary sm:text-sm">Qué hacer para formalizarte</p>
    <h2 id="route-overview" className="mt-1 text-2xl font-black sm:text-3xl">Tu orientación inicial, paso a paso</h2>
    <p className="mb-4 mt-2 text-sm text-slate-700">Revisa cómo se aplican a tu negocio la actividad económica, la forma legal y el registro ante SUNAT.</p>
    <div className="grid gap-3 min-[1160px]:grid-cols-3">
      <article className="rounded-2xl border border-blue-100 bg-[#e6f3ff] p-4">
        <h3 className="font-bold"><span aria-hidden="true" className="mr-2 inline-grid size-6 place-items-center rounded-full bg-primary text-xs text-white">1</span>Tu actividad económica (CIIU)</h3>
        {code ? <div className="my-3 grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-xl bg-white p-3 shadow-sm">
          <Store className="mt-1 size-9 text-primary" aria-hidden="true" />
          <div><p className="text-xs font-bold text-primary">Código de tu evaluación</p><p className="text-2xl font-black text-primary">{code}</p><p className="text-sm font-bold">{ciiuCatalog[code].name}</p></div>
        </div> : <p className="my-3 text-sm">{context.ciiuStatus === "revision" ? "Clasificación por revisar" : "Clasificación pendiente"}. Puedes consultar el catálogo oficial para verificar tu actividad.</p>}
        <SourceLink href={code ? "https://proyectos.inei.gob.pe/CIIU/frm_lista_notas.asp?wc_cod=" + code : CIIU_TABLE}>{code ? "Ver código " + code + " en el INEI" : "Consultar catálogo del INEI"}</SourceLink>
      </article>
      <article className="rounded-2xl border border-blue-100 p-4">
        <h3 className="font-bold"><span aria-hidden="true" className="mr-2 inline-grid size-6 place-items-center rounded-full bg-primary text-xs text-white">2</span>¿Persona natural o empresa?</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {options.map(({ id, icon: Icon, title, text }) => <div key={id} className={"rounded-xl border p-3 " + (context.legalPerson === id ? "border-blue-300 bg-blue-50" : "border-blue-100")}>
            <Icon className="mb-2 size-6 text-primary" aria-hidden="true" />
            <p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs text-slate-700">{text}</p>
            {context.legalPerson === id && <p className="mt-2 text-xs font-bold text-primary">Tu elección</p>}
          </div>)}
        </div>
      </article>
      <article className="rounded-2xl border border-blue-100 p-4">
        <h3 className="font-bold"><span aria-hidden="true" className="mr-2 inline-grid size-6 place-items-center rounded-full bg-primary text-xs text-white">3</span>RUC: qué hacer y cuándo</h3>
        {ruc && <><p className="mt-3 text-sm font-bold">{ruc.title}</p><p className="mt-2 text-sm text-slate-700">{ruc.description}</p><SourceLink href={ruc.url}>Consultar en SUNAT</SourceLink></>}
      </article>
    </div>
  </section>;
}
