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
  stopAtSales?: boolean;
};

export async function fillProfile(page: Page, stage = "Mi negocio ya está formalizado", regime = "NRUS", options: ProfileOptions = {}) {
  await advanceTo(page, "#stage");
  await page.getByRole("radio", { name: stage, exact: false }).check();
  await advanceTo(page, "#establishment");
  await choose(page, /Qué tipo de negocio/, options.establishment ?? "Restaurante");
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
  if (options.stopAtSales) {
    await advanceTo(page, "#typicalSales");
    return;
  }
  await advanceTo(page, "#mode");
  await choose(page, /Dónde prepararás/, "En un local donde atenderé clientes");
  if (stage === "Mi negocio ya está formalizado") {
    await advanceTo(page, "#rucStatus");
    await choose(page, /ya cuenta con RUC/, "Sí");
    await advanceTo(page, "#regime");
    await page.locator("#regime").selectOption(regime);
  } else if (stage.includes("trámites pendientes")) {
    await advanceTo(page, "#rucStatus");
    await choose(page, /ya cuenta con RUC/, "No");
  }
}

export async function editReviewField(page: Page, label: string, apply: () => Promise<void>) {
  const button = page.getByRole("button", { name: "Cambiar " + label, exact: true });
  if (!await button.isVisible()) {
    await page.locator("details:not([open])").filter({ has: page.locator("button[aria-label=" + JSON.stringify("Cambiar " + label) + "]") }).locator("summary").click();
  }
  await button.click();
  await apply();
  await page.getByRole("button", { name: "Guardar cambio" }).click();
}
