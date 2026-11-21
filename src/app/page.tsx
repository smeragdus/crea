import Image from "next/image";
import Link from "next/link";
import { AssessmentEntry } from "@/features/evaluation/assessment-entry";

const highlights = [
  "Ruta personalizada según tu negocio",
  "Información con fuente y revisión visible",
  "Preguntas simples, incluso si aún no sabes la respuesta",
];

const steps = [
  ["Describe tu negocio", "Indica qué ofrecerás, cómo atenderás y en qué etapa estás."],
  ["Explora tu resultado", "Compara los regímenes tributarios y conoce qué datos faltan."],
  ["Sigue tu ruta", "Abre cada paso para conocer su motivo y consultar su fuente."],
];

const benefits = [
  ["Ruta según tu negocio", "Las preguntas se adaptan a tu actividad y etapa."],
  ["Fuentes visibles", "Cada paso muestra la entidad y el enlace para verificarlo."],
  ["A tu ritmo", "Puedes pausar y retomar el cuestionario en la misma pestaña."],
];

const questions = [
  ["¿Necesito saber mi código CIIU?", "Puedes describir tu actividad con tus propias palabras y revisar las opciones del catálogo."],
  ["¿Y si aún no conozco mis ventas?", "Puedes calcular una proyección o dejar las cifras como pendientes."],
  ["¿Dónde puedo usar CREA?", "El cuestionario está diseñado para negocios gastronómicos del distrito de Cajamarca, Perú."],
];

export default function Home() {
  return <div className="bg-[#edf5fb] px-4 pb-5 font-[Arial,Helvetica,sans-serif] text-[#071c56] sm:px-6">
    <div className="mx-auto max-w-[1500px] overflow-hidden rounded-b-[28px] bg-white shadow-[0_20px_80px_#0b35751c]">
      <section id="inicio" aria-labelledby="landing-title" className="relative grid min-h-[630px] lg:grid-cols-[56%_44%]">
        <div className="relative z-10 px-6 pb-16 pt-12 sm:px-14 sm:pt-20">
          <p className="text-sm font-bold uppercase tracking-[.16em] text-[#5479a5]">Restaurantes, cafeterías y servicios afines</p>
          <h1 id="landing-title" className="mt-6 max-w-3xl text-4xl font-black leading-[1.06] tracking-tight [text-wrap:wrap] sm:text-6xl">Formaliza tu negocio gastronómico en Perú</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#4b6186] sm:text-xl">Cuéntanos cómo prepararás y servirás tus comidas en Cajamarca, en local, para llevar, por delivery o desde un puesto móvil. Te ayudamos a entender los pasos, las entidades involucradas y las decisiones tributarias que debes revisar.</p>
          <ul className="mt-8 space-y-3">
            {highlights.map((text) => <li key={text} className="flex items-center gap-3 text-lg text-[#263e6b]">
              <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-700">✓</span>
              {text}
            </li>)}
          </ul>
          <AssessmentEntry startLabel="Comenzar ahora" className="mt-9 rounded-xl bg-[#1464f6] px-9 py-4 text-lg font-bold text-white shadow-lg shadow-blue-200 hover:bg-[#0a4db7]" />
        </div>
        <div className="relative min-h-80 overflow-hidden lg:min-h-full">
          <Image src="/cajamarca-plaza.jpg" alt="Plaza de Armas de Cajamarca" fill priority className="object-cover" sizes="(max-width: 1023px) 100vw, 44vw" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-white via-white/15 to-transparent lg:-left-px" />
        </div>
      </section>

      <div className="border-t border-blue-100 px-6 py-6 sm:px-14">
        <p className="text-sm text-slate-600">Información para consultar con entidades oficiales</p>
        <div className="mt-4 flex flex-wrap gap-x-10 gap-y-3 font-bold text-[#133d75]">
          <span>SUNAT</span><span>SUNARP</span><span>Municipalidades</span><span>Indecopi</span><span>DIGESA</span>
        </div>
      </div>
      <section id="como-funciona" className="bg-blue-50/70 px-6 py-16 sm:px-14">
        <h2 className="text-3xl font-black">Cómo funciona</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map(([title, copy], index) => <li key={title} className="rounded-2xl border border-blue-100 bg-white p-6">
            <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-full bg-[#1464f6] font-bold text-white">{index + 1}</span>
            <h3 className="mt-5 text-xl font-bold">{title}</h3>
            <p className="mt-2 leading-6 text-slate-600">{copy}</p>
          </li>)}
        </ol>
        <nav aria-label="Consultas directas" className="mt-6 flex flex-wrap gap-x-6 gap-y-1 font-bold text-[#0a4db7]">
          <Link className="py-3 underline" href="/comparar">Comparar regímenes</Link>
          <Link className="py-3 underline" href="/obligaciones">Consultar obligaciones</Link>
          <Link className="py-3 underline" href="/negocios?seccion=simulador">Proyectar ventas</Link>
          <Link className="py-3 underline" href="/negocios?seccion=ejemplos">Probar con un ejemplo</Link>
        </nav>
      </section>
      <section id="beneficios" className="px-6 py-16 sm:px-14">
        <h2 className="text-3xl font-black">Beneficios</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {benefits.map(([title, copy]) => <article key={title} className="rounded-2xl bg-[#f2f7fc] p-6">
            <h3 className="font-bold">{title}</h3>
            <p className="mt-2 text-slate-600">{copy}</p>
          </article>)}
        </div>
      </section>
      <section id="preguntas" className="border-t border-blue-100 px-6 py-14 sm:px-14">
        <h2 className="text-3xl font-black">Preguntas frecuentes</h2>
        <div className="mt-6 max-w-3xl space-y-3">
          {questions.map(([question, answer]) => <details className="rounded-xl border border-blue-100 p-5" key={question}>
            <summary className="font-bold">{question}</summary>
            <p className="mt-3 text-slate-600">{answer}</p>
          </details>)}
        </div>
      </section>
      <div className="border-t border-blue-100 px-6 py-5 text-xs text-slate-600 sm:px-14">
        <a href="https://commons.wikimedia.org/wiki/File:PLAZA_DE_ARMAS_DE_CAJAMARCA.jpg" target="_blank" rel="noreferrer" className="underline">Foto de Carlos jc en Wikimedia Commons · CC BY-SA 4.0</a>
      </div>
    </div>
  </div>;
}
