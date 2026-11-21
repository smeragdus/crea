import { z } from "zod";

export const CIIU_VERSION = "PE-INEI-REV4-2026.11";
export const CIIU_SOURCE = "https://www.inei.gob.pe/media/MenuRecursivo/publicaciones_digitales/Est/Lib0883/Libro.pdf";
export const CIIU_TABLE = "https://cdn.www.gob.pe/uploads/document/file/1348266/Tabla_Oficial_CIIU_Rev4.pdf";

export const ciiuCatalog = {
  "5610": { name: "Actividades de restaurantes y de servicio móvil de comidas", evidence: "Sirvo comidas listas para consumir", reason: "Incluye la atención en local, la comida para llevar y la entrega a domicilio de comidas preparadas.", page: 136 },
  "5621": { name: "Suministro de comidas por encargo", evidence: "Sirvo comidas en el lugar acordado para un evento específico", reason: "El servicio se contrata para un evento determinado en el lugar indicado por el cliente.", page: 136 },
  "5629": { name: "Otras actividades de servicio de comidas", evidence: "Opero un comedor por concesión o sirvo comidas bajo un contrato continuo", reason: "El suministro se contrata para un periodo convenido o se presta mediante una concesión.", page: 136 },
  "5630": { name: "Actividades de servicio de bebidas", evidence: "El servicio se centra en preparar y servir bebidas para consumo inmediato como actividad principal", reason: "Incluye juguerías, cafeterías centradas en el servicio de bebidas y puestos ambulantes de bebidas. La reventa de bebidas envasadas requiere otra clase.", page: 136 },
  "1071": { name: "Elaboración de productos de panadería", evidence: "Fabrico pan o productos de pastelería como línea de producción", reason: "La producción de panadería es una actividad separada del servicio de comidas para consumo inmediato.", page: 56 },
  "1075": { name: "Elaboración de comidas y platos preparados", evidence: "Fabrico platos completos conservados, congelados o enlatados para vender como productos", reason: "Corresponde a platos preparados conservados para comercialización. Un envase de delivery, por sí solo, no cambia la actividad de restaurante.", page: 57 },
  "1079": { name: "Elaboración de otros productos alimenticios n.c.p.", evidence: "Elaboro comidas perecederas para su reventa, como sándwiches frescos", reason: "El INEI incluye la elaboración de comidas perecederas para reventa. Otros productos requieren revisar su clase específica.", page: 57 },
} as const;

export type CiiuCode = keyof typeof ciiuCatalog;
export const ciiuCodes = Object.keys(ciiuCatalog) as CiiuCode[];
export const isCiiuCode = (value: unknown): value is CiiuCode => typeof value === "string" && Object.hasOwn(ciiuCatalog, value);

export function confirmedClassification(primary: string, evidence: string, secondary: string) {
  if (!isCiiuCode(primary) || primary !== evidence) return;
  return {
    version: CIIU_VERSION, primary,
    secondary: [...new Set(secondary.split(",").filter((code) => isCiiuCode(code) && code !== primary))],
  };
}

export const ciiuClarifications = {
  offer: {
    question: "¿Cómo venderás principalmente lo que prepares?",
    options: [["meals", "Comidas listas para consumir, para llevar o por delivery"], ["drinks", "Prepararé y serviré principalmente bebidas para consumo inmediato"], ["events", "Serviré comidas en eventos o bajo un contrato"], ["production", "Elaboraré productos para que otras tiendas los revendan"]],
  },
  drinks: {
    question: "¿Qué será lo principal en tu cafetería?",
    options: [["meals", "Servir desayunos, sándwiches u otras comidas"], ["drinks", "Preparar y servir principalmente café u otras bebidas para consumo inmediato"]],
  },
  contract: {
    question: "¿Cómo te contratarán para servir comidas?",
    options: [["event", "Para un evento concreto, en el lugar acordado"], ["recurring", "Para atender durante un periodo o gestionar un comedor por concesión"]],
  },
  product: {
    question: "¿Qué elaborarás principalmente para vender a otras tiendas?",
    options: [["bakery", "Pan, tortas u otros productos de panadería elaborados por mí"], ["preserved", "Platos completos para conservar, por ejemplo, congelados o enlatados"], ["fresh", "Sándwiches frescos u otras comidas perecederas para su reventa"], ["other", "Otro producto"]],
  },
  mixed: {
    question: "¿Cuál de estas actividades será la principal?",
    options: [["meals", "Preparar y servir comidas para consumo inmediato"], ["drinks", "Preparar y servir bebidas para consumo inmediato"], ["events", "Servir comidas en eventos o por contrato"], ["production", "Elaborar alimentos para vender a otras tiendas"]],
  },
} as const;

export const clarificationKeys = Object.keys(ciiuClarifications) as (keyof typeof ciiuClarifications)[];
export type CiiuClarification = keyof typeof ciiuClarifications;
const ciiuCode = z.enum(ciiuCodes);
export const ciiuInputSchema = z.strictObject({
  description: z.string().trim().min(4).max(500),
  establishment: z.enum(["", "restaurante", "cafeteria", "polleria", "cevicheria", "pizzeria", "menu", "rapida", "delivery", "movil", "otro"]),
  mode: z.enum(["", "local", "recojo", "delivery", "eventos", "movil", "desconocido"]),
  customers: z.enum(["", "personas", "empresas", "ambos", "aun-no-se"]),
});
export type CiiuInput = z.infer<typeof ciiuInputSchema>;

export const ciiuSuggestionSchema = z.strictObject({
  primary: ciiuCode.nullable(),
  secondary: z.array(ciiuCode).max(2),
  clarification: z.enum(clarificationKeys).nullable(),
  review: z.boolean(),
}).refine(({ primary, secondary, clarification, review }) => {
  if (primary) return !review && !clarification && new Set(secondary).size === secondary.length && !secondary.includes(primary);
  return !secondary.length && !(review && clarification);
});
export type CiiuSuggestion = z.infer<typeof ciiuSuggestionSchema>;

const supportedCode = z.strictObject({ code: ciiuCode, excerpt: z.string().trim().min(6).max(240) });
export const ciiuProviderSchema = z.strictObject({
  primary: supportedCode.nullable(),
  secondary: z.array(supportedCode).max(2),
  clarification: z.enum(clarificationKeys).nullable(),
  review: z.boolean(),
});
export const ciiuSnapshotSchema = z.strictObject({
  source: z.enum(["local", "ia"]),
  suggestion: ciiuSuggestionSchema,
  questions: z.number().int().min(0).max(2),
  selectedSecondary: z.array(ciiuCode).max(2).optional(),
});

export function readCiiuSnapshot(value: string) {
  try {
    const parsed = ciiuSnapshotSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

const pending = (clarification: CiiuClarification | null, review = false): CiiuSuggestion =>
  ({ primary: null, secondary: [], clarification, review });
const probable = (primary: CiiuCode, secondary: CiiuCode[] = []): CiiuSuggestion =>
  ({ primary, secondary: [...new Set(secondary)].filter((code) => code !== primary), clarification: null, review: false });

function localEvidence(input: CiiuInput) {
  const text = normalize(input.description);
  const resale = /\b(reventa|revendan|otras tiendas|a tiendas|para comercializar)\b/.test(text);
  const distinct = /\b(tambien|ademas|por separado|otra linea)\b/.test(text);
  const preserved = /platos?|pizza|comidas? preparad/.test(text) && /congelad|enlatad|al vacio|conservad/.test(text);
  const fresh = /sandwich|sanguche/.test(text) && /fresc|pereceder/.test(text);
  const bakery = /tortas?|panader|pasteler|\bpan\b/.test(text);
  const production = resale || preserved || /fabric|industrializ|envasad/.test(text) && !/envase.*delivery/.test(text);
  const product = production ? preserved ? "1075" : bakery ? "1071" : fresh && resale ? "1079" : null : null;
  const recurring = /concesion|contrato continuo|varios meses|durante (un|dos|tres|\d+) (mes|ano)|comedores? (escolar|institucional|por contrato)/.test(text);
  const event = /matrimonios?|cumpleanos|bodas?|eventos? (privados?|puntuales?|sociales?)|celebraciones/.test(text)
    && /prepar|servi|sirv|catering|comidas/.test(text);
  const drinks = /cafe|jugos?|bebidas?|coctel|juguer|\bbar\b/.test(text);
  const explicitMeals = /pollo a la brasa|sandu?wich|sanguch|desayun|platos? (?!congelad)|almuerz|menu|pizza|ceviche|hamburgues|comidas? listas|comidas? caseras/.test(text);
  const immediate = /local|delivery|para llevar|consumo inmediato|mesas|recojo|domicilio/.test(text)
    || ["local", "delivery", "recojo", "movil"].includes(input.mode);
  const foodType = /polleria|pizzeria|cevicheria|restaurante|comida rapida/.test(text);
  const meals = immediate && (explicitMeals || foodType);
  return { distinct, product: product as CiiuCode | null, production, recurring, event, drinks, meals, foodType, immediate, text };
}

export function suggestCiiuLocally(input: CiiuInput): CiiuSuggestion {
  const facts = localEvidence(input);
  if (/^solo revendo|^solo reparto|sin preparar alimentos|vendo solamente productos comprados/.test(facts.text)) return pending(null, true);
  if (facts.distinct && (facts.production || (facts.event || facts.recurring) && /en (el|mi) local|delivery|para llevar/.test(facts.text)) && (facts.meals || facts.drinks)) return pending("mixed");
  if (facts.production) return facts.product ? probable(facts.product) : pending("product");
  if (facts.recurring && facts.event) return pending("contract");
  if (facts.recurring) return probable("5629");
  if (facts.event) return probable("5621");
  if (input.mode === "eventos" || /catering|por contrato/.test(facts.text)) return pending("contract");
  if (facts.drinks && (input.establishment === "cafeteria" || (facts.meals && !facts.foodType && ["", "otro"].includes(input.establishment)))) {
    if (/principalmente.{0,25}(cafe|jugos?|bebidas?)/.test(facts.text) && facts.immediate) return probable("5630");
    if (/principalmente.{0,25}(comidas|platos|almuerzos|desayunos)/.test(facts.text) && facts.meals) return probable("5610");
    return pending("drinks");
  }
  if (facts.meals) return probable("5610");
  if (facts.drinks && (input.mode === "movil" || /en el local|en mesas|puesto movil|ambulant/.test(facts.text)) && /prepar|servi|sirv/.test(facts.text)) return probable("5630");
  return pending("offer");
}

export function answerCiiuClarification(input: CiiuInput, key: CiiuClarification, answer: string): CiiuSuggestion {
  if (!ciiuClarifications[key].options.some(([id]) => id === answer)) return pending(null, answer === "other");
  const facts = localEvidence(input);
  const secondary: CiiuCode[] = [];
  if (facts.distinct && facts.product) secondary.push(facts.product);
  if (key === "mixed" && facts.event !== facts.recurring) secondary.push(facts.event ? "5621" : "5629");
  switch (answer) {
    case "meals": return probable("5610", secondary);
    case "drinks": return probable("5630", secondary);
    case "events": return pending("contract");
    case "production": return facts.product ? probable(facts.product) : pending("product");
    case "event": return probable("5621");
    case "recurring": return probable("5629");
    case "bakery": return probable("1071");
    case "preserved": return probable("1075");
    case "fresh": return probable("1079");
    default: return pending(null, true);
  }
}

function supportsUnresolvedSuggestion(code: CiiuCode, excerpt: string, input: CiiuInput) {
  const text = normalize(excerpt);
  switch (code) {
    case "5610":
      return /prepar|cocin|servir|sirv/.test(text)
        && (/consumo inmediato|comensales|en mesas|para llevar|delivery|domicilio/.test(text)
          || (input.mode === "local" && /comidas?|platos?|almuerzos?|desayunos?/.test(text)));
    case "5621":
      return /eventos?|celebracion|fiestas?|banquetes?/.test(text) && /comidas?|servir|catering/.test(text);
    case "5629":
      return /contrat|concesion/.test(text) && /continu|meses|periodo|comedor/.test(text);
    case "5630":
      return /bebidas?|cafe|jugos?/.test(text) && /prepar|servir|sirv/.test(text)
        && (["local", "movil"].includes(input.mode) || /en el local|puesto movil|ambulant/.test(text));
    default:
      return false;
  }
}

export function verifyProviderCiiu(value: unknown, input: CiiuInput): Pick<z.infer<typeof ciiuSnapshotSchema>, "source" | "suggestion"> {
  const result = ciiuProviderSchema.parse(value);
  const evidence = [result.primary, ...result.secondary].filter((item) => item !== null);
  const text = normalize(input.description);
  if (!evidence.every(({ excerpt }) => text.includes(normalize(excerpt)))) {
    throw new Error("El proveedor citó datos ausentes.");
  }
  const local = suggestCiiuLocally(input);
  const facts = localEvidence(input);
  const proposal = ciiuSuggestionSchema.parse({
    ...result, primary: result.primary?.code ?? null, secondary: result.secondary.map(({ code }) => code),
  });
  if (local.review || local.clarification === "mixed" || local.clarification === "drinks"
    || (facts.production && !facts.product)
    || (facts.recurring && facts.event)
    || (local.primary && proposal.primary !== local.primary)
    || (proposal.primary === "5610" && facts.production && !facts.distinct)) return { source: "local", suggestion: local };
  if (result.primary && !local.primary && !supportsUnresolvedSuggestion(result.primary.code, result.primary.excerpt, input)) {
    return { source: "local", suggestion: local };
  }
  const secondary = facts.distinct ? proposal.secondary.filter((code) => code === facts.product) : [];
  return { source: "ia", suggestion: { ...proposal, secondary } };
}
