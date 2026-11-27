import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AssessmentEntry } from "@/features/evaluation/assessment-entry";
import {
  AnimatedFaqList,
  ClipRevealCajamarca,
  HeroPhotoStage,
  LandingMotionRoot,
  Reveal,
  ScrollProgressBar,
} from "@/features/landing/motion-primitives";
import { ScenarioExplorer } from "@/features/landing/scenario-explorer";
import "@/features/landing/landing.css";

const highlights = [
  "Ruta personalizada según tu negocio",
  "Información con fuente y revisión visible",
  "Preguntas simples, incluso si aún no sabes la respuesta",
];

const entities = [
  {
    name: "SUNAT",
    tag: "Impuestos y RUC",
    role: "Inscripción en el RUC, régimen tributario y boletas o facturas.",
    logo: "/entidades/sunat.svg",
    logoAlt: "Logo oficial de SUNAT",
    logoBg: "bg-white",
    logoClass: "h-10 w-auto object-contain",
    accentBar: "bg-[#ae0d41]",
  },
  {
    name: "SUNARP",
    tag: "Registro de empresa",
    role: "Reserva de nombre y constitución si operas como EIRL o SAC.",
    logo: "/entidades/sunarp.png",
    logoAlt: "Logo oficial de SUNARP",
    logoBg: "bg-white",
    logoClass: "h-9 w-auto object-contain",
    accentBar: "bg-[#157a49]",
  },
  {
    name: "Municipalidades",
    tag: "Licencia local",
    role: "Licencia de funcionamiento e inspección de seguridad ITSE.",
    logo: "/entidades/municajamarca.png",
    logoAlt: "Logo oficial de la Municipalidad Provincial de Cajamarca",
    logoBg: "bg-[#234d68]",
    logoClass: "h-10 w-auto object-contain",
    accentBar: "bg-[#234d68]",
  },
  {
    name: "Indecopi",
    tag: "Marca y consumo",
    role: "Registro de marca comercial y libro de reclamaciones.",
    logo: "/entidades/indecopi.png",
    logoAlt: "Logo oficial de Indecopi",
    logoBg: "bg-white",
    logoClass: "h-8 w-auto object-contain",
    accentBar: "bg-[#d96b1f]",
  },
  {
    name: "DIGESA",
    tag: "Higiene y salud",
    role: "Normas sanitarias y buenas prácticas de manipulación.",
    logo: "/entidades/digesa.png",
    logoAlt: "Logo oficial de DIGESA - Ministerio de Salud",
    logoBg: "bg-white",
    logoClass: "h-10 w-auto object-contain",
    accentBar: "bg-[#2b1073]",
  },
];

const steps = [
  {
    num: "1",
    title: "Cuéntanos de tu negocio",
    copy: "Indica qué ofrecerás, cómo atenderás y en qué etapa estás: desde una idea inicial hasta un restaurante en marcha.",
    meta: "Toma unos 3 minutos",
  },
  {
    num: "2",
    title: "Explora tu resultado",
    copy: "Compara los regímenes tributarios compatibles, simula tus impuestos y mira con claridad qué datos faltan completar.",
    meta: "NRUS · RER · RMT · RG",
  },
  {
    num: "3",
    title: "Sigue tu ruta paso a paso",
    copy: "Abre cada trámite para saber por qué aplica a tu local en Cajamarca, qué llevar y consultar el enlace oficial.",
    meta: "Lista clara y verificable",
  },
];

const directTools = [
  {
    href: "/comparar",
    label: "Comparar regímenes",
    caption: "Mira topes, comprobantes y obligaciones lado a lado.",
  },
  {
    href: "/obligaciones",
    label: "Consultar obligaciones",
    caption: "Revisa declaraciones y fechas de vencimiento según tu RUC.",
  },
  {
    href: "/negocios?seccion=simulador",
    label: "Proyectar ventas",
    caption: "Calcula cuánto podrías vender al mes antes de inscribirte.",
  },
  {
    href: "/negocios?seccion=ejemplos",
    label: "Probar con un ejemplo",
    caption: "Explora casos listos con simulador y ruta completa.",
  },
];

const benefits = [
  {
    tag: "A tu medida",
    title: "Ruta según tu negocio",
    copy: "Las preguntas se adaptan a tu etapa y forma de atender. Si solo tienes una idea, proyectas ventas sin que te pidamos RUC ni compras pasadas; si ya vendes, evaluamos tus cifras reales.",
  },
  {
    tag: "Transparente",
    title: "Fuentes visibles",
    copy: "Cada paso y regla tributaria muestra la entidad oficial, la fecha de revisión y el enlace directo a SUNAT, INEI o la Municipalidad de Cajamarca.",
  },
  {
    tag: "Sin apuros",
    title: "A tu ritmo",
    copy: "Pausa y retoma el cuestionario en la misma pestaña sin perder tus respuestas, o guarda tu diagnóstico completo en un reporte listo para imprimir en PDF.",
  },
];

const questions = [
  {
    question: "¿Necesito saber mi código CIIU?",
    answer:
      "No hace falta memorizar códigos. Puedes describir tu actividad con tus propias palabras, recibir una sugerencia de CREA IA y revisar las opciones del catálogo del INEI antes de confirmar.",
  },
  {
    question: "¿Y si aún no conozco mis ventas?",
    answer:
      "Puedes usar nuestra calculadora para proyectar tus ventas mensuales por plato o bebida, o dejar las cifras como pendientes y completarlas más adelante.",
  },
  {
    question: "¿Dónde puedo usar CREA?",
    answer:
      "El cuestionario y las referencias municipales están diseñados especialmente para negocios gastronómicos del distrito de Cajamarca, Perú.",
  },
  {
    question: "¿Tiene algún costo o debo crear una cuenta primero?",
    answer:
      "Puedes comenzar la evaluación gratis y sin registrarte. Si luego quieres guardar tus avances en la nube o revisar varios escenarios, puedes crear una cuenta en segundos.",
  },
];

export default function Home() {
  return (
    <LandingMotionRoot>
      <div className="crea-landing">
        <ScrollProgressBar />

        {/* HERO — WARM, FRIENDLY & INTUITIVE */}
        <section
          id="inicio"
          aria-labelledby="landing-title"
          className="landing-hero-atmosphere relative border-b border-[#e5dfd3]"
        >
          <div className="mx-auto grid max-w-[1360px] items-center gap-12 px-5 pb-16 pt-10 sm:px-10 sm:pb-24 sm:pt-14 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] lg:gap-16">
            <div className="min-w-0">
              <p className="landing-reveal text-sm font-extrabold text-[#9a3b22]">
                Para restaurantes, cafeterías y negocios de comida en Cajamarca
              </p>

              <h1
                id="landing-title"
                className="landing-display landing-reveal landing-reveal-d1 mt-4 max-w-[16ch] text-[clamp(2.55rem,5vw,4.35rem)] font-bold leading-[1.06] tracking-[-0.03em] text-[#0a1a3c]"
              >
                Formaliza tu negocio gastronómico en Perú
              </h1>

              <p className="landing-reveal landing-reveal-d2 mt-6 max-w-[52ch] text-lg leading-[1.7] text-[#3b4b6b] sm:text-[1.15rem]">
                Cuéntanos cómo prepararás y servirás tus comidas —en local, para llevar, por
                delivery o en un puesto móvil— y te mostramos en lenguaje simple tus pasos,
                entidades y opciones tributarias.
              </p>

              <div className="landing-reveal landing-reveal-d3 mt-8 flex flex-wrap items-center gap-3.5">
                <AssessmentEntry
                  startLabel="Comenzar ahora"
                  className="landing-press landing-lift landing-arrow-shift min-h-[3.5rem] rounded-full bg-[#0b4ac9] px-8 py-4 text-base font-extrabold text-white shadow-[0_14px_30px_-10px_rgba(11,74,201,0.5)] hover:bg-[#0839a0]"
                />
                <a
                  href="#escenarios"
                  className="landing-press inline-flex min-h-[3.5rem] items-center justify-center rounded-full border border-[#d4ccbe] bg-white px-6 py-3.5 text-base font-extrabold text-[#0a1a3c] hover:border-[#0b4ac9] hover:text-[#0b4ac9]"
                >
                  Ver ejemplos reales
                </a>
              </div>

              <p className="landing-reveal landing-reveal-d3 mt-3.5 text-xs font-bold text-[#52607a]">
                Gratis · Toma unos 3 minutos
              </p>

              <ul className="landing-reveal landing-reveal-d4 mt-9 space-y-3 border-t border-[#e5dfd3] pt-7">
                {highlights.map((text) => (
                  <li key={text} className="flex items-center gap-3 text-base font-bold text-[#0a1a3c]">
                    <span
                      aria-hidden="true"
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e3f5eb] text-[#115e38]"
                    >
                      <Check className="h-3.5 w-3.5 stroke-[2.8]" />
                    </span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <HeroPhotoStage />
          </div>
        </section>

        {/* OFFICIAL ENTITIES — INTUITIVE VISUAL CARDS */}
        <section
          aria-labelledby="entidades-title"
          className="border-b border-[#e5dfd3] bg-white py-14 sm:py-16"
        >
          <div className="mx-auto max-w-[1360px] px-5 sm:px-10">
            <Reveal className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-extrabold text-[#0b4ac9]">Entidades oficiales</p>
                <h2
                  id="entidades-title"
                  className="landing-display mt-1 text-2xl font-bold tracking-[-0.02em] text-[#0a1a3c] sm:text-3xl"
                >
                  Información organizada para consultar con entidades oficiales
                </h2>
              </div>
              <p className="max-w-md text-sm font-semibold leading-relaxed text-[#52607a]">
                Cada trámite corresponde a una institución distinta. En tu ruta te indicamos a cuál
                acudir y qué preparar.
              </p>
            </Reveal>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {entities.map((entity, index) => (
                <li key={entity.name}>
                  <Reveal delay={index * 0.05} y={12} className="h-full">
                    <div className="landing-press landing-lift group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[#e5dfd3] bg-[#faf8f4] p-5 transition-colors hover:border-[#c9d4e8] hover:bg-white hover:shadow-[0_14px_30px_-18px_rgba(10,26,60,0.2)]">
                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-0 top-0 h-1 ${entity.accentBar} opacity-85`}
                      />
                      <div>
                        <div
                          className={`flex h-16 items-center justify-center rounded-xl border border-[#e5dfd3]/80 px-3 ${entity.logoBg}`}
                        >
                          <Image
                            src={entity.logo}
                            alt={entity.logoAlt}
                            width={180}
                            height={48}
                            className={entity.logoClass}
                          />
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-1.5">
                          <h3 className="landing-display text-lg font-bold text-[#0a1a3c]">
                            {entity.name}
                          </h3>
                          <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-extrabold text-[#52607a] ring-1 ring-[#e5dfd3]">
                            {entity.tag}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-[#3b4b6b]">
                          {entity.role}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* INTERACTIVE SCENARIO EXPLORER */}
        <section id="escenarios" aria-labelledby="escenarios-title" className="py-16 sm:py-24">
          <div className="mx-auto max-w-[1360px] px-5 sm:px-10">
            <Reveal className="mb-8 max-w-2xl">
              <p className="text-sm font-extrabold text-[#0b4ac9]">¿Cómo funciona en la práctica?</p>
              <h2
                id="escenarios-title"
                className="landing-display mt-2 text-[clamp(2rem,3.6vw,3.1rem)] font-bold leading-[1.1] tracking-[-0.025em] text-[#0a1a3c]"
              >
                Elige un ejemplo parecido al tuyo
              </h2>
              <p className="mt-3 text-base leading-[1.7] text-[#3b4b6b] sm:text-lg">
                Toca cualquiera de estos negocios para ver qué actividad CIIU, regímenes y primeros
                trámites en Cajamarca te mostraría CREA.
              </p>
            </Reveal>

            <Reveal delay={0.06}>
              <ScenarioExplorer />
            </Reveal>
          </div>
        </section>

        {/* HOW IT WORKS — WARM ROYAL NAVY STAGE */}
        <section
          id="como-funciona"
          aria-labelledby="como-funciona-title"
          className="landing-navy-stage py-16 text-white sm:py-24"
        >
          <div className="relative z-10 mx-auto max-w-[1360px] px-5 sm:px-10">
            <Reveal className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-extrabold text-[#ffc400]">Fácil de principio a fin</p>
                <h2
                  id="como-funciona-title"
                  className="landing-display mt-2 text-[clamp(2rem,3.8vw,3.2rem)] font-bold leading-[1.08] tracking-[-0.025em] text-white"
                >
                  Cómo funciona
                </h2>
              </div>
              <p className="max-w-md text-base leading-[1.7] text-[#cbd5e8]">
                En tres pasos sencillos pasas de la duda a tener una hoja de ruta clara para tu
                negocio.
              </p>
            </Reveal>

            <ol className="mt-10 grid gap-5 lg:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.num}>
                  <Reveal
                    delay={index * 0.08}
                    className="flex h-full flex-col justify-between rounded-3xl border border-white/14 bg-white/[0.07] p-7 backdrop-blur-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span
                          aria-hidden="true"
                          className="landing-display grid h-11 w-11 place-items-center rounded-full bg-[#ffc400] text-lg font-extrabold text-[#0b2254]"
                        >
                          {step.num}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#e2eaf8]">
                          {step.meta}
                        </span>
                      </div>
                      <h3 className="landing-display mt-6 text-xl font-bold text-white sm:text-2xl">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-base leading-[1.68] text-[#cbd5e8]">{step.copy}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>

            {/* Direct queries friendly dock */}
            <Reveal delay={0.1} className="mt-12 rounded-3xl border border-white/14 bg-white/[0.06] p-6 sm:p-8">
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="landing-display text-lg font-bold text-[#ffc400]">
                  ¿Prefieres ir directo a una herramienta?
                </h3>
                <p className="text-xs font-semibold text-[#cbd5e8]">
                  Acceso libre · sin iniciar el cuestionario
                </p>
              </div>
              <nav
                aria-label="Consultas directas"
                className="grid gap-3 sm:grid-cols-2"
              >
                {directTools.map(({ href, label, caption }) => (
                  <Link
                    key={href}
                    href={href}
                    className="landing-press landing-arrow-shift group flex items-center justify-between gap-4 rounded-2xl border border-white/12 bg-white/[0.06] p-5 transition-colors hover:border-[#ffc400]/65 hover:bg-white/[0.11]"
                  >
                    <span className="min-w-0">
                      <span className="landing-display block text-lg font-bold text-white group-hover:text-[#ffc400]">
                        {label}
                      </span>
                      <span className="mt-1 block text-sm text-[#cbd5e8]">{caption}</span>
                    </span>
                    <ArrowUpRight
                      className="h-5 w-5 shrink-0 text-[#ffc400]"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </nav>
            </Reveal>
          </div>
        </section>

        {/* BENEFITS — WARM, CLEAR & APPROACHABLE */}
        <section id="beneficios" aria-labelledby="beneficios-title" className="py-16 sm:py-24">
          <div className="mx-auto max-w-[1360px] px-5 sm:px-10">
            <Reveal className="max-w-2xl">
              <p className="text-sm font-extrabold text-[#9a3b22]">Pensado para acompañarte</p>
              <h2
                id="beneficios-title"
                className="landing-display mt-2 text-[clamp(2rem,3.8vw,3.2rem)] font-bold leading-[1.08] tracking-[-0.025em] text-[#0a1a3c]"
              >
                Beneficios
              </h2>
            </Reveal>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {benefits.map((item, index) => (
                <Reveal key={item.title} delay={index * 0.08}>
                  <article className="h-full rounded-3xl border border-[#e5dfd3] bg-white p-7 shadow-[0_14px_34px_-24px_rgba(10,26,60,0.18)]">
                    <span className="inline-block rounded-full bg-[#e8f0fe] px-3 py-1 text-xs font-extrabold text-[#0b4ac9]">
                      {item.tag}
                    </span>
                    <h3 className="landing-display mt-5 text-2xl font-bold text-[#0a1a3c]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-base leading-[1.7] text-[#3b4b6b]">{item.copy}</p>
                  </article>
                </Reveal>
              ))}
            </div>

            {/* Cajamarca local spotlight */}
            <div className="mt-10 grid overflow-hidden rounded-[28px] border border-[#e5dfd3] bg-white shadow-[0_18px_46px_-26px_rgba(10,26,60,0.18)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <Reveal className="flex flex-col justify-center p-7 sm:p-11">
                <p className="text-sm font-extrabold text-[#0b4ac9]">Hecho para Cajamarca</p>
                <h3 className="landing-display mt-2 text-2xl font-bold leading-tight tracking-[-0.02em] text-[#0a1a3c] sm:text-3xl">
                  Pensado para los negocios gastronómicos de nuestra ciudad
                </h3>
                <p className="mt-4 max-w-lg text-base leading-[1.7] text-[#3b4b6b]">
                  Desde cafeterías en el centro histórico hasta pollerías, picanterías, caterings y
                  módulos familiares. Incluimos la tasa especial de IGV para restaurantes MYPE y
                  las referencias del distrito.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Restaurantes", "Cafeterías", "Pollerías", "Catering", "Delivery", "Puestos móviles"].map(
                    (tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#faf8f4] px-3.5 py-1.5 text-xs font-extrabold text-[#0a1a3c] ring-1 ring-[#e5dfd3]"
                      >
                        {tag}
                      </span>
                    ),
                  )}
                </div>
              </Reveal>
              <ClipRevealCajamarca />
            </div>
          </div>
        </section>

        {/* FAQ — FRIENDLY ANIMATED CARDS */}
        <section
          id="preguntas"
          aria-labelledby="preguntas-title"
          className="border-t border-[#e5dfd3] bg-white py-16 sm:py-24"
        >
          <div className="mx-auto grid max-w-[1360px] gap-10 px-5 sm:px-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-start">
            <Reveal className="lg:sticky lg:top-28">
              <p className="text-sm font-extrabold text-[#0b4ac9]">¿Tienes dudas?</p>
              <h2
                id="preguntas-title"
                className="landing-display mt-2 text-[clamp(2rem,3.6vw,3.1rem)] font-bold leading-[1.1] tracking-[-0.025em] text-[#0a1a3c]"
              >
                Preguntas frecuentes
              </h2>
              <p className="mt-4 max-w-md text-base leading-[1.7] text-[#3b4b6b]">
                Si tienes una consulta puntual, también puedes tocar{" "}
                <strong className="font-extrabold text-[#0a1a3c]">CREA IA</strong> abajo a la
                derecha y preguntarle con tus propias palabras.
              </p>
            </Reveal>

            <Reveal delay={0.06}>
              <AnimatedFaqList items={questions} />
            </Reveal>
          </div>
        </section>

        {/* CLOSING CALL TO ACTION */}
        <section aria-labelledby="cta-title" className="px-5 py-16 sm:px-10 sm:py-20">
          <Reveal>
            <div className="landing-navy-stage mx-auto max-w-[1360px] rounded-[32px] px-7 py-12 text-white shadow-[0_28px_70px_-28px_rgba(11,34,84,0.45)] sm:px-14 sm:py-16">
              <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
                <div className="max-w-2xl">
                  <p className="text-sm font-extrabold text-[#ffc400]">
                    Gratis · En menos de 3 minutos
                  </p>
                  <h2
                    id="cta-title"
                    className="landing-display mt-2 text-[clamp(2rem,3.8vw,3.2rem)] font-bold leading-[1.08] tracking-[-0.025em] text-white"
                  >
                    Empieza hoy con claridad, paso a paso
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-[1.7] text-[#cbd5e8] sm:text-lg">
                    Obtén tu diagnóstico tributario, proyecta tus ventas y organiza la formalización
                    de tu negocio gastronómico sin complicaciones.
                  </p>
                </div>
                <Link
                  href="/negocios/nuevo"
                  className="landing-press landing-lift landing-arrow-shift inline-flex min-h-[3.5rem] shrink-0 items-center gap-2.5 rounded-full bg-[#ffc400] px-8 py-4 text-base font-black text-[#0b2254] shadow-[0_14px_30px_-10px_rgba(255,196,0,0.45)] hover:bg-[#ffd033]"
                >
                  Evaluar mi negocio ahora
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

        {/* PHOTO ATTRIBUTION */}
        <div className="border-t border-[#e5dfd3] bg-[#faf8f4] px-5 py-4 text-xs font-semibold text-[#52607a] sm:px-10">
          <div className="mx-auto max-w-[1360px]">
            <a
              href="https://commons.wikimedia.org/wiki/File:PLAZA_DE_ARMAS_DE_CAJAMARCA.jpg"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[#9aa7bd] underline-offset-2 hover:text-[#0b4ac9]"
            >
              Foto de Plaza de Armas de Cajamarca por Carlos jc en Wikimedia Commons · CC BY-SA 4.0
            </a>
          </div>
        </div>
      </div>
    </LandingMotionRoot>
  );
}
