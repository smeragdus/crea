import { describe, expect, it } from "vitest";
import { emptyDraft, toBusinessContext, validateAssessmentStep } from "./assessment";
import { RuleEngine } from "@/lib/rule-engine";
import { simulateRestaurantTaxes } from "@/lib/tax-simulator";

const draft = {
  ...emptyDraft,
  activity: "restaurante" as const,
  legal: "natural" as const,
  regime: "NRUS" as const,
  invoice: "no" as const,
  annualSales: "96000",
  annualPurchases: "60000",
  maxMonthlySales: "8000",
  maxMonthlyPurchases: "6000",
  assets: "20000",
  workers: "5",
  locations: "1",
  linkage: "no" as const,
  foreignBranch: "no" as const,
};

describe("Datos del asistente e integración con el motor", () => {
  it("conserva un cero explícito, valida montos y evita confundir el máximo mensual con el promedio", () => {
    expect(validateAssessmentStep({ ...draft, annualSales: "200" }, 1).maxMonthlySales).toBeTruthy();
    expect(validateAssessmentStep({ ...draft, annualPurchases: "1e3" }, 1).annualPurchases).toBeTruthy();
    const context = toBusinessContext({ ...draft, annualPurchases: "0", maxMonthlyPurchases: "0" });
    expect(context.annualPurchases).toBe(0);
    expect(context.monthlyPurchases).toBeUndefined();
    expect(RuleEngine.evaluate(context).taxRecommendations[0].status).toBe("COMPATIBLE");
    expect(RuleEngine.evaluate(toBusinessContext({ ...draft, maxMonthlySales: "8000,01" })).taxRecommendations[0].status).toBe("INCOMPATIBLE");
  });

  it("distingue límites anuales, máximos mensuales y exclusiones RMT desconocidas", () => {
    const evaluated = RuleEngine.evaluate(toBusinessContext({ ...draft, maxMonthlySales: "", linkage: "unknown" }));
    expect(evaluated.taxRecommendations.map(({ status }) => status)).toEqual([
      "INFORMACION_INSUFICIENTE", "COMPATIBLE", "INFORMACION_INSUFICIENTE", "COMPATIBLE",
    ]);
    const atLimit = RuleEngine.evaluate(toBusinessContext({ ...draft, annualSales: "9350000" }));
    expect(atLimit.taxRecommendations[2].status).toBe("COMPATIBLE");
    const overLimit = RuleEngine.evaluate(toBusinessContext({ ...draft, annualSales: "9350000,01" }));
    expect(overLimit.taxRecommendations[2].status).toBe("INCOMPATIBLE");
  });

  it("estima el IGV especial de ventas y toma el crédito de compras como un dato distinto", () => {
    const result = simulateRestaurantTaxes(toBusinessContext(draft), {
      grossMonthlySales: 11050, grossMonthlyPurchasesWithInvoice: 5900,
      fiscalCreditFromInvoices: 900, monthlyOperatingExpenses: 0, monthlyPurchasesWithoutInvoice: 0, useReducedRestaurantIgv: true,
    });
    expect(result.uitReference).toBe(5500);
    expect(result.igvRateApplied).toBe(0.105);
    expect(result.regimes.RER.igvSales).toBe(1050);
    expect(result.regimes.RER.igvCreditFromPurchases).toBe(900);
    expect(result.regimes.RER.monthlyIgvPayable).toBe(150);
  });
});
