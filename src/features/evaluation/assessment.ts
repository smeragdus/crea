import { z } from "zod";
import type { BusinessContext, TaxRecommendation } from "@/lib/types";
import { NRUS_ANNUAL_LIMIT, NRUS_MONTHLY_LIMIT_CAT2, RER_ANNUAL_INCOME_LIMIT, RER_ANNUAL_PURCHASES_LIMIT, RER_ASSETS_LIMIT, RMT_INCOME_LIMIT_2026 } from "@/lib/tax-constants";

export const registration = [
  ["natural", "A mi nombre", "Persona natural con negocio"],
  ["juridica", "Como empresa", "Persona jurídica"],
  ["aun-no-se", "No lo sé", ""],
] as const;

export const activities = [
  ["restaurante", "Restaurante, cafetería o similar", "Atención en local, para llevar o por delivery"],
  ["catering", "Servicio de comida para eventos", "Preparación y servicio para eventos"],
  ["unknown", "No sé cómo está registrado", ""],
] as const;

export const regimes = [
  ["NRUS", "Nuevo RUS"],
  ["RER", "Régimen Especial de Renta"],
  ["RMT", "Régimen MYPE Tributario"],
  ["RG", "Régimen General"],
  ["SIN_REGIMEN", "Todavía no tengo régimen"],
  ["DESCONOCIDO", "No lo sé"],
] as const;

export const choices = [["yes", "Sí", ""], ["no", "No", ""], ["unknown", "No lo sé", ""]] as const;

const amountText = z.string().refine((value) => value === "" || (
  /^\d+(?:[.,]\d{1,2})?$/.test(value) && Number(value.replace(",", ".")) <= 999999999999
), "Ingresa un monto en soles con hasta dos decimales.");
const countText = z.string().refine((value) => value === "" || /^\d{1,5}$/.test(value), "Ingresa un número entero entre 0 y 99 999.");
const yesNo = z.enum(["yes", "no", "unknown", ""]);
const draftSchema = z.object({
  name: z.string().trim().max(100),
  activity: z.enum(["restaurante", "catering", "unknown", ""]),
  legal: z.enum(["natural", "juridica", "aun-no-se", ""]),
  regime: z.enum(["NRUS", "RER", "RMT", "RG", "SIN_REGIMEN", "DESCONOCIDO", ""]),
  invoice: yesNo,
  annualSales: amountText,
  annualPurchases: amountText,
  maxMonthlySales: amountText,
  maxMonthlyPurchases: amountText,
  assets: amountText,
  workers: countText,
  locations: countText.refine((value) => value === "" || Number(value) >= 1, "Indica al menos un local o deja el campo en blanco."),
  linkage: yesNo,
  foreignBranch: yesNo,
});

export type AssessmentDraft = z.infer<typeof draftSchema>;

export const emptyDraft: AssessmentDraft = {
  name: "", activity: "", legal: "", regime: "", invoice: "",
  annualSales: "", annualPurchases: "", maxMonthlySales: "", maxMonthlyPurchases: "",
  assets: "", workers: "", locations: "", linkage: "", foreignBranch: "",
};

export type AssessmentField = keyof AssessmentDraft;
export const assessmentFieldLabels: Record<AssessmentField, string> = {
  regime: "Régimen actual",
  activity: "Actividad del negocio",
  legal: "Tipo de registro",
  invoice: "Emisión de facturas",
  annualSales: "Ventas del año",
  annualPurchases: "Compras del año",
  maxMonthlySales: "Ventas del mes más alto",
  maxMonthlyPurchases: "Compras del mes más alto",
  locations: "Número de locales",
  assets: "Valor de equipos y muebles",
  workers: "Trabajadores por turno",
  foreignBranch: "Sucursal de una empresa extranjera",
  linkage: "Vinculación con otras empresas",
  name: "Nombre del restaurante",
};
const required = ["regime", "activity", "legal", "invoice"] as const;
export const assessmentFields = [
  required,
  ["annualSales", "annualPurchases", "maxMonthlySales", "maxMonthlyPurchases"],
  ["locations", "assets", "workers", "foreignBranch", "linkage"],
  ["name"],
] as const;

export function relevantAssessmentFields(draft: AssessmentDraft) {
  const exceeds = (field: AssessmentField, limit: number) => (amount(draft[field]) ?? 0) > limit;
  // Evaluate in question order so a disqualifying answer stays visible and editable.
  const monthly = draft.legal !== "juridica" && draft.invoice !== "yes"
    && !exceeds("annualSales", NRUS_ANNUAL_LIMIT) && !exceeds("annualPurchases", NRUS_ANNUAL_LIMIT);
  const nrusLocations = monthly && !exceeds("maxMonthlySales", NRUS_MONTHLY_LIMIT_CAT2)
    && !exceeds("maxMonthlyPurchases", NRUS_MONTHLY_LIMIT_CAT2);
  const rer = !exceeds("annualSales", RER_ANNUAL_INCOME_LIMIT) && !exceeds("annualPurchases", RER_ANNUAL_PURCHASES_LIMIT);
  const rmt = !exceeds("annualSales", RMT_INCOME_LIMIT_2026);
  const conditional: Partial<Record<AssessmentField, boolean>> = {
    invoice: draft.legal !== "juridica",
    annualPurchases: !exceeds("annualSales", RER_ANNUAL_INCOME_LIMIT),
    maxMonthlySales: monthly,
    maxMonthlyPurchases: monthly,
    locations: nrusLocations,
    assets: rer || (nrusLocations && !exceeds("locations", 1)),
    workers: rer && !exceeds("assets", RER_ASSETS_LIMIT),
    foreignBranch: rmt,
    linkage: rmt && draft.foreignBranch !== "yes",
  };
  return assessmentFields.flat().filter((field) => conditional[field] !== false);
}

export function validateAssessmentStep(draft: AssessmentDraft, step: number, visible = relevantAssessmentFields(draft)) {
  const result = draftSchema.safeParse(draft);
  const issues: Partial<Record<keyof AssessmentDraft, string>> = {};
  const fields = assessmentFields[step] as readonly (keyof AssessmentDraft)[] | undefined;
  if (!fields) return issues;

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof AssessmentDraft;
      if (fields.includes(field) && visible.includes(field)) issues[field] = issue.message;
    }
  }
  if (step === 0) {
    for (const field of required) {
      if (visible.includes(field) && !draft[field]) issues[field] = "Selecciona una opción. Puedes indicar que no sabes.";
    }
  }
  if (step === 1 && visible.includes("maxMonthlySales")) {
    for (const [monthly, yearly] of [["maxMonthlySales", "annualSales"], ["maxMonthlyPurchases", "annualPurchases"]] as const) {
      if (draft[monthly] !== "" && draft[yearly] !== "" && Number(draft[monthly].replace(",", ".")) > Number(draft[yearly].replace(",", "."))) {
        issues[monthly] = "El máximo de un mes debe ser menor o igual al total anual.";
      }
    }
  }
  return issues;
}

type MissingRule = readonly [string, ...AssessmentField[]];
const missingRules: Record<TaxRecommendation["code"], readonly MissingRule[]> = {
  NRUS: [
    ["TR-NRUS-02", "annualSales", "maxMonthlySales"],
    ["TR-NRUS-03", "annualPurchases", "maxMonthlyPurchases"],
    ["TR-NRUS-01", "legal"],
    ["TR-NRUS-04", "invoice"],
    ["TR-NRUS-05", "locations"],
    ["TR-NRUS-06", "assets"],
  ],
  RER: [
    ["TR-RER-01", "annualSales"],
    ["TR-RER-02", "annualPurchases"],
    ["TR-RER-03", "assets"],
    ["TR-RER-04", "workers"],
  ],
  RMT: [["TR-RMT-01", "annualSales"], ["TR-RMT-02", "foreignBranch", "linkage"]],
  RG: [["TR-RG-01", "annualSales"]],
};

export function nextAssessmentGap(regime: TaxRecommendation, context: BusinessContext) {
  if (regime.verification !== "VIGENTE" || regime.breachedConditions.length || !regime.missingDataFields.length) return;
  const draft = fromBusinessContext(context);
  const visible = relevantAssessmentFields(draft);
  for (const [ruleId, ...fields] of missingRules[regime.code]) {
    const rule = regime.evaluatedRules.find((item) => item.ruleId === ruleId && item.passed === null);
    if (!rule) continue;
    const field = fields.find((field) => visible.includes(field) && (!draft[field] || draft[field] === "unknown" || draft[field] === "aun-no-se"));
    if (field) return { field, explanation: rule.explanation };
  }
  if (!context.activityId && !context.ciiu && !context.otherActivity?.trim()) {
    return { field: "activity" as const, explanation: "Falta indicar la actividad registrada de tu restaurante." };
  }
}

export function assessmentEditHref(field?: AssessmentField) {
  return "/negocios/nuevo?editar=1" + (field ? "&campo=" + field : "");
}

function amount(text: string) {
  return text === "" ? undefined : Number(text.replace(",", "."));
}

function boolean(text: string) {
  return text === "yes" ? true : text === "no" ? false : undefined;
}

export function toBusinessContext(draft: AssessmentDraft, previous?: BusinessContext): BusinessContext {
  const visible = relevantAssessmentFields(draft);
  const included = (field: AssessmentField) => visible.includes(field) ? draft[field] : "";
  const locations = amount(included("locations"));
  const workers = amount(included("workers")) ?? (visible.includes("workers") ? undefined : previous?.employeeCountPerShift ?? previous?.employees);
  const needsInvoices = boolean(included("invoice"));
  const activity = draft.activity === "unknown" ? "" : draft.activity;
  return {
    ...previous,
    assessmentVersion: 2,
    businessName: draft.name.trim(),
    purpose: "revisar",
    sectorId: "restaurantes",
    activityId: activity,
    ciiu: activity === "restaurante" ? "5610" : activity === "catering" ? "5621" : undefined,
    otherActivity: "",
    department: "Cajamarca",
    province: previous?.province ?? "",
    district: previous?.district ?? "",
    legalPerson: draft.legal || "aun-no-se",
    personType: draft.legal === "natural" ? "PERSONA_NATURAL" : draft.legal === "juridica" ? "PERSONA_JURIDICA" : undefined,
    hasPartners: previous?.hasPartners ?? false,
    partnerCount: previous?.partnerCount ?? 0,
    hasPhysicalLocation: locations !== undefined,
    servesPublic: previous?.servesPublic ?? true,
    hasEmployees: workers === undefined ? undefined : workers > 0,
    employeeCount: workers ?? 0,
    employeeCountPerShift: workers,
    employees: workers,
    sellsOnline: previous?.sellsOnline ?? false,
    preparesFood: true,
    importsGoods: previous?.importsGoods ?? false,
    exportsGoods: previous?.exportsGoods ?? false,
    providesRegulatedService: previous?.providesRegulatedService ?? false,
    customerType: "aun-no-se",
    needsInvoices: needsInvoices ?? null,
    needsFacturas: needsInvoices,
    emittedReceipts: needsInvoices === true ? ["BOLETA", "FACTURA"] : needsInvoices === false ? ["BOLETA"] : undefined,
    establishmentCount: locations,
    hasMultipleLocations: locations !== undefined && locations > 1,
    foreignSourceIncome: previous?.foreignSourceIncome ?? false,
    collectsPersonalData: previous?.collectsPersonalData ?? false,
    currentRegime: draft.regime || "DESCONOCIDO",
    annualRevenue: amount(draft.annualSales),
    annualPurchases: amount(included("annualPurchases")),
    maxMonthlyRevenue: amount(included("maxMonthlySales")),
    maxMonthlyPurchases: amount(included("maxMonthlyPurchases")),
    fixedAssets: amount(included("assets")),
    fixedAssetsValue: amount(included("assets")),
    hasCorporateLinkageOverLimit: boolean(included("linkage")),
    isForeignBranch: boolean(included("foreignBranch")),
    questionnaire: undefined,
    dataOrigins: undefined,
  };
}

export function fromBusinessContext(context: BusinessContext): AssessmentDraft {
  const value = (input?: number) => input === undefined ? "" : String(input);
  const choice = (input?: boolean | null) => input === true ? "yes" : input === false ? "no" : "unknown";
  const activity = context.ciiu === "5621" || context.activityId === "catering" ? "catering"
    : context.ciiu === "5610" || context.activityId === "restaurante" ? "restaurante" : "unknown";
  return {
    name: context.businessName ?? "",
    activity,
    legal: context.legalPerson,
    regime: context.currentRegime ?? "DESCONOCIDO",
    invoice: choice(context.needsFacturas ?? context.needsInvoices),
    annualSales: value(context.annualRevenue),
    annualPurchases: value(context.annualPurchases),
    maxMonthlySales: value(context.maxMonthlyRevenue),
    maxMonthlyPurchases: value(context.maxMonthlyPurchases),
    assets: value(context.fixedAssetsValue ?? context.fixedAssets),
    workers: value(context.employeeCountPerShift ?? context.employees),
    locations: value(context.establishmentCount),
    linkage: choice(context.hasCorporateLinkageOverLimit),
    foreignBranch: choice(context.isForeignBranch),
  };
}
