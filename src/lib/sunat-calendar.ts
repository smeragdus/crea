import { RuleEngine } from "./rule-engine";
import type { BusinessContext, TaxRecommendation, TaxRegimeCode, VerificationStatus } from "./types";

export interface SunatSchedulePeriod {
  period: string; // YYYY-MM (periodo tributario que se declara al mes siguiente)
  periodLabel: string;
  resolutionReference: string;
  sourceId: string;
  verification: VerificationStatus;
  dueDatesByLastDigit: Record<string, string>; // "0".."9" y "BC" (Buenos Contribuyentes)
}

export interface RestaurantObligationItem {
  id: string;
  title: string;
  category: "DECLARACION" | "LIBROS" | "COMPROBANTES" | "LABORAL" | "DOCUMENTACION";
  frequency: "MENSUAL" | "ANUAL" | "PERMANENTE";
  description: string;
  documentsToPrepare: string[];
  sourceId: string;
  sourceUrl: string;
}

export interface RestaurantAlertItem {
  id: string;
  severity: "ALTA" | "MEDIA" | "INFORMATIVA";
  title: string;
  description: string;
  recommendedAction: string;
}

export interface RestaurantObligationsPlan {
  regimeEvaluated: TaxRegimeCode;
  regimeName: string;
  allowedReceipts: string[];
  prohibitedReceipts: string[];
  declarations: string[];
  accountingBooks: string[];
  obligations: RestaurantObligationItem[];
  documentsToPrepareMonthly: string[];
  alerts: RestaurantAlertItem[];
  scheduleLookup: {
    rucLastDigit: string | null;
    period: string;
    periodLabel: string;
    dueDate: string | null;
    verification: VerificationStatus;
    resolutionReference: string;
    sourceUrl: string;
    note: string;
  };
  completionDisclaimer: string;
}

export const SUNAT_SCHEDULE_2026_URL = "https://www.sunat.gob.pe/orientacion/cronogramas/2026/cObligacionMensual2026.html";

const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const dueDayGroups = [
  [16, 17, 18, 19, 20, 23, 24], [16, 17, 18, 19, 20, 23, 24],
  [17, 20, 21, 22, 23, 24, 27], [18, 19, 20, 21, 22, 25, 26],
  [15, 16, 17, 18, 19, 22, 23], [15, 16, 17, 20, 21, 22, 24],
  [18, 19, 20, 21, 24, 25, 26], [15, 16, 17, 18, 21, 22, 23],
  [16, 19, 20, 21, 22, 23, 26], [16, 17, 18, 19, 20, 23, 24],
  [17, 18, 21, 22, 23, 24, 28], [18, 19, 20, 21, 22, 25, 26],
];
const groups = [["0"], ["1"], ["2", "3"], ["4", "5"], ["6", "7"], ["8", "9"], ["BC"]];
const twoDigits = (value: number) => String(value).padStart(2, "0");

export const OFFICIAL_SUNAT_SCHEDULE: Record<string, SunatSchedulePeriod> = Object.fromEntries(
  dueDayGroups.map((days, index) => {
    const period = "2026-" + twoDigits(index + 1);
    const dueMonth = index === 11 ? "2027-01" : "2026-" + twoDigits(index + 2);
    return [period, {
      period,
      periodLabel: months[index] + " 2026",
      resolutionReference: "Anexo I de la R.S. N.° 281-2022/SUNAT · Ejercicio 2026",
      sourceId: "sunat-cronograma",
      verification: "VIGENTE",
      dueDatesByLastDigit: Object.fromEntries(groups.flatMap((digits, group) =>
        digits.map((digit) => [digit, dueMonth + "-" + twoDigits(days[group])])
      )),
    } satisfies SunatSchedulePeriod];
  }),
);

export function extractRucLastDigit(ruc?: string): string | null {
  if (!ruc) return null;
  const cleaned = ruc.replace(/\D/g, "");
  if (cleaned.length !== 11) return null;
  return cleaned[cleaned.length - 1];
}

export function getSunatDueDate(ruc: string | undefined, period: string = "2026-03", declaredDigit?: string) {
  const lastDigit = declaredDigit && /^(?:[0-9]|BC)$/.test(declaredDigit) ? declaredDigit : extractRucLastDigit(ruc);
  const schedule = OFFICIAL_SUNAT_SCHEDULE[period];

  if (!schedule) {
    return {
      rucLastDigit: lastDigit,
      period,
      periodLabel: `Periodo ${period}`,
      dueDate: null,
      verification: "POR_VERIFICAR" as VerificationStatus,
      resolutionReference: "Periodo no cargado en tabla verificada local",
      sourceUrl:
        SUNAT_SCHEDULE_2026_URL,
      note: "El periodo seleccionado no se encuentra en la tabla local verificada. Consulte directamente el cronograma oficial de SUNAT para no asumir una fecha no confirmada.",
    };
  }

  if (!lastDigit) {
    return {
      rucLastDigit: null,
      period,
      periodLabel: schedule.periodLabel,
      dueDate: null,
      verification: schedule.verification,
      resolutionReference: schedule.resolutionReference,
      sourceUrl:
        SUNAT_SCHEDULE_2026_URL,
      note: "Indica el último dígito del RUC o el padrón de Buenos Contribuyentes para consultar el cronograma general.",
    };
  }

  const dueDate = schedule.dueDatesByLastDigit[lastDigit] ?? null;

  return {
    rucLastDigit: lastDigit,
    period,
    periodLabel: schedule.periodLabel,
    dueDate,
    verification: schedule.verification,
    resolutionReference: schedule.resolutionReference,
    sourceUrl:
      SUNAT_SCHEDULE_2026_URL,
    note: `Fecha del cronograma general para el último dígito del RUC «${lastDigit}» para el periodo ${schedule.periodLabel}.`,
  };
}

export function getRestaurantObligations(
  context: BusinessContext | Pick<BusinessContext, "currentRegime" | "ruc" | "rucLastDigit">,
  selectedPeriod: string = "2026-03",
  fallbackRegime: TaxRegimeCode = "RMT",
  evaluations?: TaxRecommendation[],
): RestaurantObligationsPlan {
  const business = "legalPerson" in context ? context : undefined;
  const activeRegime: TaxRegimeCode =
    context.currentRegime &&
    context.currentRegime !== "SIN_REGIMEN" &&
    context.currentRegime !== "DESCONOCIDO"
      ? context.currentRegime
      : fallbackRegime;

  const scheduleLookup = getSunatDueDate(context.ruc, selectedPeriod, context.rucLastDigit);

  const regimeMeta: Record<
    TaxRegimeCode,
    {
      name: string;
      allowedReceipts: string[];
      prohibitedReceipts: string[];
      declarations: string[];
      accountingBooks: string[];
    }
  > = {
    NRUS: {
      name: "Nuevo RUS (NRUS)",
      allowedReceipts: ["Boleta de Venta", "Tickets sin derecho a crédito fiscal"],
      prohibitedReceipts: [
        "Factura",
        "Liquidación de Compra",
        "Comprobantes que otorguen derecho a crédito fiscal",
      ],
      declarations: [
        "Pago fácil mensual Formulario 1611 (Cuota S/ 20 o S/ 50 según categoría). No presenta Declaración Anual.",
      ],
      accountingBooks: [
        "No está obligado a llevar libros contables. Debe archivar cronológicamente los comprobantes de compras y ventas.",
      ],
    },
    RER: {
      name: "Régimen Especial de Renta (RER)",
      allowedReceipts: [
        "Factura electrónica",
        "Boleta de Venta electrónica",
        "Tickets",
        "Notas de Crédito y Débito",
        "Guías de Remisión",
      ],
      prohibitedReceipts: [],
      declarations: [
        "Declaración y pago mensual PDT 621 / Declara Fácil (IGV 18% y Renta mensual cancelatoria 1.5%). No presenta Declaración Jurada Anual.",
      ],
      accountingBooks: ["Registro de Ventas e Ingresos", "Registro de Compras"],
    },
    RMT: {
      name: "Régimen MYPE Tributario (RMT)",
      allowedReceipts: [
        "Factura electrónica",
        "Boleta de Venta electrónica",
        "Tickets",
        "Notas de Crédito y Débito",
        "Guías de Remisión",
      ],
      prohibitedReceipts: [],
      declarations: [
        "Declaración y pago mensual Declara Fácil 621 (IGV 18% y Pago a cuenta de Renta 1% o 1.5%).",
        "Declaración Jurada Anual del Impuesto a la Renta (10% hasta 15 UIT y 29.5% por el exceso de utilidad neta).",
      ],
      accountingBooks: [
        "Hasta 300 UIT de ingresos: Registro de Ventas, Registro de Compras y Libro Diario de Formato Simplificado.",
        "Más de 300 UIT: Libros conforme al artículo 65° de la Ley del Impuesto a la Renta.",
      ],
    },
    RG: {
      name: "Régimen General (RG)",
      allowedReceipts: [
        "Factura electrónica",
        "Boleta de Venta electrónica",
        "Tickets",
        "Notas de Crédito y Débito",
        "Guías de Remisión",
      ],
      prohibitedReceipts: [],
      declarations: [
        "Declaración y pago mensual Declara Fácil 621 (IGV 18% y Pago a cuenta de Renta 1.5% o coeficiente).",
        "Declaración Jurada Anual del Impuesto a la Renta (29.5% sobre la utilidad neta).",
      ],
      accountingBooks: [
        "Hasta 300 UIT: Registro de Ventas, Registro de Compras y Libro Diario de Formato Simplificado.",
        "Más de 300 UIT hasta 1,700 UIT: Libros según tramos de SUNAT; más de 1,700 UIT: Contabilidad completa.",
      ],
    },
  };

  const meta = regimeMeta[activeRegime];

  const obligations: RestaurantObligationItem[] = [
    {
      id: "OBL-01",
      title:
        activeRegime === "NRUS"
          ? "Pago mensual de cuota del Nuevo RUS"
          : "Declaración y pago mensual de IGV y Renta (Declara Fácil 621)",
      category: "DECLARACION",
      frequency: "MENSUAL",
      description:
        activeRegime === "NRUS"
          ? "Cancelar la cuota mensual de S/ 20 (Categoría 1) o S/ 50 (Categoría 2) hasta la fecha de vencimiento según el último dígito del RUC."
          : "Consolidar las ventas y compras del mes del restaurante y presentar la declaración mensual determinando el IGV y el pago a cuenta o cancelatorio de Renta.",
      documentsToPrepare:
        activeRegime === "NRUS"
          ? [
              "Resumen del total de ventas brutas del mes (boletas emitidas).",
              "Resumen del total de compras de insumos y servicios del mes.",
              "Guía para Pago Fácil del Nuevo RUS (Formulario 1611).",
            ]
          : [
              "Reporte mensual de comprobantes de venta emitidos (facturas y boletas).",
              "Facturas electrónicas de compra de insumos (carnes, abarrotes, bebidas, gas) y recibos de servicios.",
              "Constancia de presentación de registros de ventas y compras.",
            ],
      sourceId: activeRegime === "NRUS" ? "sunat-nrus" : "sunat-cronograma",
      sourceUrl:
        SUNAT_SCHEDULE_2026_URL,
    },
    {
      id: "OBL-02",
      title:
        activeRegime === "NRUS"
          ? "Archivo cronológico de comprobantes de compras y ventas"
          : "Llevado de Registros de Ventas y Compras electrónicos",
      category: "LIBROS",
      frequency: "MENSUAL",
      description:
        activeRegime === "NRUS"
          ? "Conservar ordenadamente las facturas/boletas de compras de insumos y copias de boletas emitidas ante cualquier verificación de SUNAT."
          : "Registrar oportunamente las operaciones de venta y compra del restaurante antes de la declaración mensual.",
      documentsToPrepare: [
        "Comprobantes electrónicos validados en el portal de SUNAT.",
        "Notas de crédito o débito emitidas o recibidas en el periodo.",
      ],
      sourceId: "sunat-libros",
      sourceUrl:
        "https://orientacion.sunat.gob.pe/libros-y-registros-vinculados-asuntos-tributarios",
    },
    {
      id: "OBL-03",
      title: "Emisión obligatoria de comprobantes de pago en el restaurante",
      category: "COMPROBANTES",
      frequency: "PERMANENTE",
      description:
        activeRegime === "NRUS"
          ? "Emitir Boleta de Venta por los consumos en salón o delivery. Si la venta supera S/ 5, emite el comprobante. Para montos de hasta S/ 5, emítelo si el cliente lo pide y aplica el registro diario que indica SUNAT."
          : "Emitir Factura (cuando el cliente con RUC lo solicite para sustentar gasto/costo) o Boleta de Venta por cada consumo de alimentos y bebidas.",
      documentsToPrepare: [
        "Verificación de serie activa de emisión electrónica (Portal SOL o sistema autorizado).",
        "Consulta de validez de RUC de clientes corporativos antes de emitir facturas.",
      ],
      sourceId: "sunat-comprobantes",
      sourceUrl:
        "https://orientacion.sunat.gob.pe/comprobantes-de-pago-empresas",
    },
  ];

  if (activeRegime === "RMT" || activeRegime === "RG") {
    obligations.push({
      id: "OBL-04",
      title: "Declaración Jurada Anual del Impuesto a la Renta",
      category: "DECLARACION",
      frequency: "ANUAL",
      description:
        "Sustentar los costos de insumos, planilla y gastos operativos del ejercicio anual para determinar la utilidad neta y regularizar el Impuesto a la Renta Anual.",
      documentsToPrepare: [
        "Libro Diario de Formato Simplificado o contabilidad anual cerrada.",
        "Sustento de bancarización de compras y gastos mayores al monto legal vigente.",
        "Resumen anual de pagos a cuenta mensuales efectuados.",
      ],
      sourceId: activeRegime === "RMT" ? "sunat-rmt" : "sunat-rg",
      sourceUrl:
        activeRegime === "RMT"
          ? "https://orientacion.sunat.gob.pe/regimen-mype-tributario"
          : "https://orientacion.sunat.gob.pe/concepto-del-impuesto-a-la-renta-regimen-general",
    });
  }

  const workers = business?.employees ?? business?.employeeCountPerShift
    ?? (business?.assessmentVersion === 2 ? undefined : business?.employeeCount);
  const hasEmployees = business?.hasEmployees ?? (workers === undefined ? undefined : workers > 0);
  if (hasEmployees !== false) {
    obligations.push({
      id: "OBL-05",
      title: hasEmployees ? "Declaración mensual de Planilla Electrónica (PLAME) y T-Registro"
        : "Planilla Electrónica y T-Registro si tienes personal dependiente",
      category: "LABORAL",
      frequency: "MENSUAL",
      description:
        "Si tienes personal dependiente, regístralo en el T-Registro y declara mensualmente las remuneraciones, retenciones y aportes (EsSalud / ONP / AFP).",
      documentsToPrepare: [
        "Altas, bajas o modificaciones de trabajadores en el T-Registro.",
        "Boletas de pago de remuneraciones del mes.",
        "Declaración PDT Planilla Electrónica - PLAME según el mismo cronograma SUNAT.",
      ],
      sourceId: "sunat-planilla",
      sourceUrl: "https://orientacion.sunat.gob.pe/planilla-electronica",
    });
  }

  const alerts: RestaurantAlertItem[] = [];

  if (!scheduleLookup.rucLastDigit && selectedPeriod) {
    alerts.push({
      id: "AL-RUC",
      severity: "MEDIA",
      title: "Fecha por consultar",
      description: "Para mostrar un vencimiento general necesitamos el último dígito del RUC o el padrón de Buenos Contribuyentes.",
      recommendedAction: "Selecciona la opción en Obligaciones y consulta si SUNAT publicó una prórroga para tu distrito.",
    });
  }

  const eligibility = (evaluations ?? (business ? RuleEngine.recommendTax(business) : [])).find(({ code }) => code === activeRegime);
  if (eligibility?.status === "INCOMPATIBLE") {
    alerts.push({
      id: "AL-REGIME",
      severity: "ALTA",
      title: "Condiciones incompatibles con el régimen consultado",
      description: eligibility.breachedConditions.join(" "),
      recommendedAction: "Revisa el diagnóstico para confirmar las alternativas aplicables según tus datos.",
    });
  }

  const purchasesWithoutInvoice = business?.monthlyPurchasesWithoutInvoice ?? 0;
  if (purchasesWithoutInvoice > 0 && activeRegime !== "NRUS") {
    alerts.push({
      id: "AL-COMPRAS-SIN-FACTURA",
      severity: "INFORMATIVA",
      title: "Compras de insumos sin factura no reducen el IGV",
      description: `Se han registrado S/ ${purchasesWithoutInvoice.toFixed(2)} mensuales en compras con boleta o sin comprobante. Estas compras no otorgan crédito fiscal de IGV.`,
      recommendedAction:
        "Solicite factura electrónica a sus proveedores de carnes, abarrotes y bebidas para aprovechar el crédito fiscal del IGV.",
    });
  }

  return {
    regimeEvaluated: activeRegime,
    regimeName: meta.name,
    allowedReceipts: meta.allowedReceipts,
    prohibitedReceipts: meta.prohibitedReceipts,
    declarations: meta.declarations,
    accountingBooks: meta.accountingBooks,
    obligations,
    documentsToPrepareMonthly:
      activeRegime === "NRUS"
        ? [
            "Boletas de venta emitidas en el mes",
            "Comprobantes de compras de insumos y servicios del mes",
            "Datos de categoría NRUS (ventas y compras totales) para Pago Fácil 1611",
          ]
        : [
            "Registro de Ventas electrónico del mes cerrado",
            "Registro de Compras electrónico con facturas de insumos y servicios",
            "Reporte de retenciones y planilla PLAME (si cuenta con personal en planilla)",
            "Liquidez disponible para pago de IGV y Renta mensual antes de la fecha de vencimiento",
          ],
    alerts,
    scheduleLookup,
    completionDisclaimer:
      "AVISO IMPORTANTE: Marcar una tarea u obligación como «Completada» dentro de Crea sirve únicamente para la organización interna del propietario o administrador del restaurante y NO significa que SUNAT haya confirmado la presentación o el cumplimiento tributario.",
  };
}
