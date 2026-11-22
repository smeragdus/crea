import { practicalGuides } from "./practical-guides";
import type { BusinessContext } from "./types";

export type FormalizationTask = {
  id: string; title: string; phase: "Identidad y registro" | "Permisos y operación";
  description: string; steps: string[]; url: string; institution: string; after?: string;
  prepare?: string[];
  conditional?: boolean; declaredComplete?: boolean;
};

const identity = "Identidad y registro";
const operation = "Permisos y operación";
const localRule = "https://www.gob.pe/institucion/municajamarca/normas-legales/5518154-om_895-2024";
const rucSource = "https://centrovirtual.sunat.gob.pe/tramites/inscribete-ruc";
const generalLicense = "https://www.gob.pe/20844-obtener-licencia-de-funcionamiento-para-negocios-de-riesgo-bajo-o-medio";

export function buildFormalizationRoute(context: BusinessContext): FormalizationTask[] {
  const ciiu = [context.ciiu, ...(context.ciiuClassification?.secondary ?? [])];
  const location = context.district || context.province || "tu lugar de operación";
  const central = (context.district ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() === "cajamarca"
    && context.province === "Cajamarca";
  const municipalSource = central ? localRule : generalLicense;
  const municipality = central ? "Municipalidad Provincial de Cajamarca" : "Municipalidad competente en " + location;
  const knownRegime = context.currentRegime && !["SIN_REGIMEN", "DESCONOCIDO"].includes(context.currentRegime);
  const juridica = context.legalPerson === "juridica";
  const natural = context.legalPerson === "natural";
  const planned = context.stage === "idea" || context.stage === "preparacion";
  const fixedPlace = context.hasLocal ?? (context.hasPhysicalLocation ? true : undefined);
  const unknownActivity = !context.ciiu;
  const tasks: FormalizationTask[] = [
    { id: "form", title: "Definir la forma de operar", phase: identity, institution: natural ? "SUNAT" : "SUNARP",
      description: natural ? "Has elegido operar a tu nombre como persona natural con negocio." : "Decide si operarás a tu nombre o mediante una empresa.",
      steps: natural ? ["Revisa cómo declarar tu actividad económica y domicilio fiscal ante SUNAT."] : practicalGuides.sunarp.steps,
      prepare: ["Datos de quién será titular del negocio y de las personas que aportarán capital, si corresponde."],
      url: natural ? rucSource : practicalGuides.sunarp.officialUrl,
      declaredComplete: Boolean(!planned && context.hasRuc && context.legalPerson !== "aun-no-se") },
  ];
  if (juridica) tasks.push({
    id: "sunarp",
    title: context.constitutionRegistered === true ? "Revisar la inscripción de la empresa"
      : context.stage === "idea" || context.constitutionRegistered === false ? "Inscribir la empresa" : "Confirmar si la empresa está inscrita",
    phase: identity, institution: "SUNARP", declaredComplete: context.constitutionRegistered === true,
    after: "Definir la forma de operar", description: "Confirma el estado de la inscripción de la persona jurídica ante SUNARP.",
    steps: ["Define el tipo de empresa, los socios y los aportes.", "Organiza el acto constitutivo y revisa las modalidades de inscripción en SUNARP."],
    prepare: ["Datos e identificación de titulares o socios.", "Propuesta de nombre y acto constitutivo para revisar con la notaría."],
    url: "https://www.gob.pe/10580-constituir-tu-empresa-a-traves-de-la-plataforma-sistema-de-intermediacion-digital-sid-sunarp",
  });
  tasks.push(
    { id: "ruc", title: context.hasRuc === true ? "Revisar o actualizar la ficha RUC" : (context.hasRuc === false || planned) ? "Inscribir el negocio en el RUC" : "Confirmar si el negocio tiene RUC", phase: identity, institution: "SUNAT",
      after: juridica ? "Inscribir la empresa si corresponde" : "Definir la forma de operar",
      description: context.hasRuc === true ? "Verifica el estado, domicilio fiscal y actividades registradas."
        : (context.hasRuc === false || planned) ? "Prepara los datos de la actividad y tramita la inscripción ante SUNAT."
          : "Confirma si ya existe una inscripción y tramítala si corresponde.",
      steps: ["Identifica tu actividad principal y las actividades secundarias.", "Revisa el domicilio fiscal y la fecha de inicio.", "Si constituiste una empresa, verifica la activación de su RUC."],
      prepare: context.hasRuc
        ? ["Número de RUC y ficha vigente.", "Datos de la actividad y del domicilio fiscal que revisarás."]
        : ["Documento de identidad del titular o representante, según corresponda.", "Datos de la actividad económica y del domicilio fiscal.", ...(juridica ? ["Datos de la inscripción de la empresa y de su representante legal."] : [])],
      url: rucSource },
    { id: "regime", title: knownRegime ? "Verificar el régimen tributario" : "Evaluar el régimen tributario", phase: identity, institution: "SUNAT",
      after: "Preparar o revisar la ficha RUC", description: "Compara compatibilidad, comprobantes y obligaciones con los datos de tu escenario.",
      steps: ["Revisa los requisitos y responde los datos pendientes del diagnóstico.", "Consulta cuándo corresponde inscribirte o cambiar de régimen."],
      prepare: practicalGuides.regime.prepare, url: practicalGuides.regime.officialUrl },
    { id: "receipts", title: "Preparar los comprobantes de pago", phase: identity, institution: "SUNAT",
      after: "Confirmar el régimen tributario", description: "Revisa qué comprobantes puedes emitir y cómo guardar las compras y ventas.",
      steps: practicalGuides.comprobantes.steps, prepare: practicalGuides.comprobantes.prepare, url: practicalGuides.comprobantes.officialUrl },
  );
  if (fixedPlace === true) {
    const equipment = context.kitchenEquipment?.filter((key) => key !== "unknown") ?? [];
    const high = context.municipalRisk === "alto";
    const low = context.municipalRisk === "bajo-medio";
    const license: FormalizationTask = {
      id: "license", title: "Revisar la licencia de funcionamiento", phase: operation, institution: municipality,
      after: high ? "Obtener el certificado ITSE" : "Consultar el nivel de riesgo municipal",
      description: "Confirma el giro, la zonificación y el trámite del establecimiento en " + location + ".",
      steps: ["Consulta la compatibilidad de uso antes de acondicionar el local.", "Pide a la municipalidad los requisitos y costos vigentes para tu giro."],
      prepare: ["Datos del RUC, titular y dirección del local.", "Formulario de solicitud con declaración jurada y datos del giro.", "Si representas a una empresa, reúne los datos del poder y comprueba qué corresponde presentar."],
      url: municipalSource, declaredComplete: context.licenseStatus === "yes",
    };
    const itse: FormalizationTask = {
      id: "itse", title: "Gestionar la inspección de seguridad (ITSE)", phase: operation, institution: municipality,
      after: low ? "Solicitar la licencia de funcionamiento" : "Confirmar la clasificación de riesgo",
      description: high ? "Para riesgo alto o muy alto, el certificado precede a la licencia."
        : low ? "Para riesgo bajo o medio, la ITSE puede tramitarse después de la licencia."
          : "El orden depende del riesgo que determine la municipalidad.",
      steps: [
        "Consulta qué documentos y medidas de seguridad corresponden a la edificación.",
        ...(equipment.length ? ["Lleva una lista de los equipos de cocina, su ubicación y el tipo de energía que usan."] : []),
        ...(context.kitchenSmoke === true ? ["Describe dónde se genera humo, vapor o grasa para consultar las condiciones de ventilación aplicables."] : []),
      ],
      url: high && !central ? "https://www.gob.pe/20866-obtener-licencia-de-funcionamiento-para-negocios-de-riesgo-alto-o-muy-alto" : municipalSource,
      prepare: ["Dirección y distribución del local.", "Datos de las instalaciones y equipos.", "Confirma los planos, certificados y anexos aplicables con la municipalidad."],
      conditional: !high && !low, declaredComplete: context.itseStatus === "yes",
    };
    tasks.push(...(high ? [itse, license] : [license, itse]));
  } else {
    tasks.push({ id: "municipality", title: "Consultar dónde está permitido operar", phase: operation, institution: municipality,
      description: context.operationMode === "movil" ? "Consulta si necesitas autorización para un puesto móvil o para usar el espacio público."
        : "Confirma las autorizaciones aplicables al lugar de preparación, almacenamiento o servicio.",
      steps: ["Describe dónde preparas, almacenas y entregas alimentos.", "Consulta la autorización aplicable a esa modalidad."],
      prepare: ["Ubicación o recorrido previstos y descripción de cómo prepararás y venderás los alimentos."],
      conditional: true, url: municipalSource });
  }
  if (unknownActivity || ciiu.some((code) => code === "5610" || code === "5621" || code === "5630")) tasks.push({
    id: "hygiene", title: "Preparar las condiciones sanitarias", phase: operation, institution: "MINSA · DIGESA",
    description: "Organiza la limpieza, la manipulación segura y la conservación de alimentos y bebidas.",
    steps: ["Verifica el acceso a agua segura y los procedimientos de higiene.", "Revisa con la autoridad qué condiciones corresponden a tu servicio."],
    prepare: ["Descripción de la preparación y conservación de alimentos y de las rutinas de limpieza."],
    url: "https://www.digesa.minsa.gob.pe/normaslegales/normas/rm_822-2018-minsa.pdf", conditional: unknownActivity || ciiu.includes("5621"),
  });
  if (ciiu.includes("5629")) tasks.push({
    id: "collective", title: "Verificar requisitos de alimentación colectiva", phase: operation, institution: "MINSA · DIGESA",
    description: "Si atiendes a grupos bajo contrato, verifica los principios de higiene y la certificación aplicable.",
    steps: ["Revisa el tipo de grupo, el establecimiento y la autoridad sanitaria competente."],
    prepare: ["Datos del establecimiento y del servicio contratado, incluidos los grupos atendidos."],
    url: "https://www.gob.pe/institucion/minsa/normas-legales/1635426-157-2021-minsa", conditional: true,
  });
  if (ciiu.some((code) => code?.startsWith("10"))) tasks.push({
    id: "packaged", title: "Verificar el registro sanitario del producto", phase: operation, institution: "DIGESA",
    description: "Consulta si tu línea de alimentos industrializados requiere registro sanitario y qué información debe ir en el rotulado.",
    steps: ["Prepara la descripción del proceso y la forma de conservación.", "Confirma el trámite para cada producto antes de comercializarlo."],
    prepare: ["Descripción del producto, ingredientes, proceso y condiciones de conservación."],
    url: "https://www.digesa.minsa.gob.pe/Orientacion/REGISTRO_SANITARIO.pdf", conditional: true,
  });
  if (context.hasEmployees !== false) tasks.push({
    id: "labor", title: "Preparar planilla y registro laboral", phase: operation, institution: "SUNAT",
    after: "Contar con un RUC activo", description: "Revisa el alta de trabajadores dependientes, las declaraciones de planilla y los aportes.",
    steps: ["Consulta el alta en T-Registro al incorporar personal.", "Organiza los datos de la planilla mensual (PLAME)."],
    prepare: ["Datos de identificación, fechas de ingreso y condiciones laborales del personal.", "Acceso autorizado a SUNAT Operaciones en Línea para el trámite."],
    url: "https://www.gob.pe/institucion/sunat/pages/8071-planilla-electronica", conditional: context.hasEmployees !== true,
  });
  return tasks;
}
