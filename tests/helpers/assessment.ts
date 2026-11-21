import { type Page } from "@playwright/test";

export async function choose(page: Page, question: string | RegExp, answer: string) {
  await page.getByRole("group", { name: question }).getByRole("radio", { name: answer, exact: true }).check();
}

export async function fillProfile(page: Page, stage = "Mi negocio ya está formalizado", regime = "NRUS") {
  await choose(page, /Qué tipo de establecimiento/, "Restaurante");
  await page.getByRole("radio", { name: stage, exact: false }).check();
  await page.getByLabel("Cuéntanos qué comidas o bebidas ofrecerás y cómo atenderás a tus clientes.").fill("Restaurante de menú con delivery");
  await page.getByRole("radio", { name: /Atención en el establecimiento/ }).check();
  await page.getByRole("radio", { name: "Sirvo comidas listas para consumir", exact: true }).check();
  await page.getByRole("checkbox", { name: "Confirmo este código como actividad principal" }).check();
  await page.getByRole("radio", { name: /A mi nombre/ }).check();
  await choose(page, /A quiénes venderás principalmente/, "Personas");
  await choose(page, /Necesitarás emitir facturas/, "No");
  if (stage === "Mi negocio ya está formalizado") {
    await choose(page, /ya cuenta con RUC/, "Sí");
    await page.getByLabel("¿En qué régimen estás inscrito?").selectOption(regime);
  } else if (stage.includes("necesito formalizarlo")) {
    await choose(page, /ya cuenta con RUC/, "No");
  }
}

export async function fillOrigins(page: Page, sales = "Datos reales del ejercicio", purchases = "Datos reales del ejercicio") {
  await choose(page, /cifras de ventas/, sales);
  await choose(page, /cifras de compras/, purchases);
}
