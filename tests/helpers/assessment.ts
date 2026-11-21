import { expect, type Page } from "@playwright/test";

export async function choose(page: Page, question: string | RegExp, answer: string) {
  await page.getByRole("group", { name: question }).getByRole("radio", { name: answer, exact: true }).check();
}

export async function advanceTo(page: Page, selector: string) {
  const target = page.locator(selector);
  for (let i = 0; i < 30; i++) {
    if (await target.isVisible()) return;
    const forward = page.getByRole("button", { name: "Continuar", exact: true });
    if (!await forward.isVisible()) break;
    await forward.click();
  }
  await expect(target).toBeVisible();
}

type ProfileOptions = {
  establishment?: string;
  description?: string;
  legal?: "natural" | "juridica";
  invoice?: string;
  ambiguous?: boolean;
  online?: boolean;
  kitchen?: boolean;
};

export async function fillProfile(page: Page, stage = "Mi negocio ya está formalizado", regime = "NRUS", options: ProfileOptions = {}) {
  await expect(page.locator("#establishment")).toBeVisible();
  await choose(page, /Qué tipo de establecimiento/, options.establishment ?? "Restaurante");
  await advanceTo(page, "#stage");
  await page.getByRole("radio", { name: stage, exact: false }).check();
  await advanceTo(page, "#mode");
  await page.getByRole("radio", { name: /Atención en el establecimiento/ }).check();
  await advanceTo(page, "#customers");
  await choose(page, /A quiénes venderás principalmente/, options.ambiguous ? "Personas y empresas" : "Personas");
  await advanceTo(page, "#activity");
  await page.locator("#description").fill(options.description ?? "Restaurante de menú con delivery");
  await page.getByRole("button", { name: "Usar orientación local" }).click();
  if (options.ambiguous) {
    await page.getByRole("button", { name: "Todavía no lo sé", exact: true }).click();
    await expect(page.getByText("Clasificación pendiente", { exact: true })).toBeVisible();
  } else {
    await expect(page.getByText("CIIU sugerido 5610")).toBeVisible();
    await page.getByRole("button", { name: "Confirmar actividad" }).click();
    await expect(page.getByText("Actividad confirmada", { exact: true })).toBeVisible();
  }
  await advanceTo(page, "#legal");
  await page.getByRole("radio", { name: options.legal === "juridica" ? /Como empresa/ : /A mi nombre/ }).check();
  await advanceTo(page, "#invoice");
  await choose(page, /Necesitarás emitir facturas/, options.invoice ?? "No");
  if (options.online) {
    await advanceTo(page, "#onlineOrders");
    await choose(page, /pedidos por medios digitales/, "Sí");
    await advanceTo(page, "#channels");
    await page.getByRole("checkbox", { name: "WhatsApp" }).check();
    await page.getByRole("checkbox", { name: "Aplicaciones de delivery" }).check();
    return;
  }
  if (stage === "Mi negocio ya está formalizado") {
    await advanceTo(page, "#rucStatus");
    await choose(page, /ya cuenta con RUC/, "Sí");
    await advanceTo(page, "#regime");
    await page.locator("#regime").selectOption(regime);
  } else if (stage.includes("necesito formalizarlo")) {
    await advanceTo(page, "#rucStatus");
    await choose(page, /ya cuenta con RUC/, "No");
  }
  if (options.kitchen) {
    await advanceTo(page, "#equipment");
    await page.getByRole("checkbox", { name: "Cocina a gas", exact: true }).check();
    await page.getByRole("checkbox", { name: "Hornos, parrillas o freidoras", exact: true }).check();
    await advanceTo(page, "#smoke");
    await choose(page, /bastante humo/, "Sí");
  }
  await advanceTo(page, "#salesOrigin");
}

export async function fillSalesOrigin(page: Page, value = "Datos reales del ejercicio") {
  await advanceTo(page, "#salesOrigin");
  await choose(page, /cifras de ventas/, value);
}

export async function fillPurchasesOrigin(page: Page, value = "Datos reales del ejercicio") {
  await advanceTo(page, "#purchasesOrigin");
  await choose(page, /cifras de compras/, value);
}
