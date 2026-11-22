import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { advanceTo, choose, fillPurchasesOrigin, fillProfile, fillSalesOrigin } from "../helpers/assessment";

test.describe.configure({ timeout: 90_000 });

test("la nube conserva la conversación, permite cerrarla con Escape y se restringe en investigación", async ({ page }) => {
  await page.goto("/");
  const cloud = page.getByRole("button", { name: "CREA IA, asistente de orientación" });
  await expect(cloud).toBeEnabled();
  await cloud.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "CREA IA" });
  await expect(dialog.getByRole("button", { name: "Cerrar CREA IA" })).toBeFocused();
  await dialog.getByRole("button", { name: "¿Qué es el código CIIU?" }).click();
  await expect(dialog.getByText(/Es el código que identifica/)).toBeVisible();
  await expect(dialog.getByText(/Proveedor de IA sin configurar/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(cloud).toBeFocused();
  await page.getByRole("link", { name: "Comenzar ahora", exact: true }).click();
  await cloud.click();
  await expect(dialog.getByText(/Es el código que identifica/)).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).include("#crea-cloud-panel").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(accessibility.violations.map(({ id }) => id)).toEqual([]);
  await page.goto("/investigacion");
  await cloud.click();
  await expect(dialog.getByText(/La asistencia está deshabilitada/)).toBeVisible();
  await expect(dialog.getByRole("textbox")).toHaveCount(0);
});

test("una idea puede proyectar ventas sin RUC y guardar su ruta", async ({ page }) => {
  await page.goto("/negocios/nuevo");
  const advance = page.getByRole("button", { name: "Continuar" });
  await advance.scrollIntoViewIfNeeded();
  const actionBounds = await advance.boundingBox();
  const cloudBounds = await page.getByRole("button", { name: "CREA IA, asistente de orientación" }).boundingBox();
  expect(actionBounds).not.toBeNull();
  expect(cloudBounds).not.toBeNull();
  if (actionBounds && cloudBounds) {
    expect(actionBounds.x + actionBounds.width).toBeLessThanOrEqual(cloudBounds.x);
  }
  await expect(page.getByText("Para negocios gastronómicos del distrito de Cajamarca, Perú.")).toBeVisible();
  await expect(page.locator("#stage")).toHaveCount(0);
  await expect(page.getByLabel(/Provincia|Distrito/)).toHaveCount(0);
  await fillProfile(page, "Solo tengo una idea de negocio", undefined, { kitchen: true });
  await expect(page.getByRole("radio", { name: "Datos reales del ejercicio" })).toHaveCount(0);
  await fillSalesOrigin(page, "Proyección del ejercicio");
  await page.getByText("Calcula cuánto podrías vender al mes", { exact: true }).click();
  await page.getByLabel("Precio unitario").fill("10");
  await page.getByLabel("Cantidad estimada al mes").fill("400");
  await page.getByLabel("Nombre del plato, bebida o servicio").fill("Almuerzo");
  await page.getByRole("button", { name: "Calcular proyección" }).click();
  await page.getByRole("button", { name: "Usar proyección" }).click();
  await expect(page.getByLabel("Ingresos brutos anuales")).toHaveValue("48000.00");
  await expect(page.getByLabel("Ventas del mes más alto", { exact: true })).toHaveValue("4000.00");
  await expect(page.getByLabel("Compras anuales", { exact: true })).toHaveCount(0);
  await fillPurchasesOrigin(page, "Todavía no tengo cifras");
  await advanceTo(page, "#name");
  await page.getByRole("button", { name: "Ver mi diagnóstico" }).click();
  await expect(page.getByRole("heading", { name: "Tu escenario antes de abrir" })).toBeVisible();
  await expect(page.getByText("Proyectadas", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Ver mi ruta de formalización" }).click();
  const overview = page.getByRole("region", { name: "Tu orientación inicial, paso a paso" });
  await expect(page.getByRole("heading", { name: "Mi ruta de formalización", exact: true })).toBeVisible();
  await expect(overview.getByRole("link", { name: /Ver código 5610 en el INEI/ })).toBeVisible();
  await expect(overview.getByRole("link", { name: /Consultar en SUNAT/ })).toBeVisible();
  await page.getByRole("checkbox", { name: "Definir la forma de operar" }).check();
  await expect(page.getByText(/1 de \d+ tareas marcadas/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Definir la forma de operar" })).toBeChecked();
  await page.getByRole("link", { name: "Ejemplos" }).click();
  await page.getByRole("button", { name: /Abrir ejemplo: Cafetería en preparación/ }).click();
  await expect(page.getByText("Simulación con datos ficticios.")).toBeVisible();
  await page.getByRole("button", { name: "Salir del ejemplo" }).click();
  await expect(page.getByText(/5610 · Actividades de restaurantes/)).toBeVisible();
});

for (const stage of ["Estoy preparando mi negocio", "Mi negocio ya funciona, pero necesito formalizarlo"]) {
  test("adapta inscripción, proyección y origen para: " + stage, async ({ page }) => {
    await page.goto("/negocios/nuevo");
    await fillProfile(page, stage, undefined, { invoice: "Sí" });
    await fillSalesOrigin(page, "Proyección del ejercicio");
    await expect(page.getByLabel("Ingresos brutos anuales")).toHaveCount(0);
    await expect(page.getByLabel("Ventas anuales", { exact: true })).toBeVisible();
  });
}

test("una cafetería ambigua puede continuar y recuperar sus respuestas", async ({ page }) => {
  await page.goto("/negocios/nuevo");
  await fillProfile(page, "Solo tengo una idea de negocio", undefined, {
    establishment: "Cafetería", description: "Café y desayunos en mesas; todavía no sé qué venderé más.",
    ambiguous: true, online: true, invoice: "Todavía no lo sé",
  });
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "WhatsApp" })).toBeChecked();
  await page.getByRole("button", { name: "Atrás" }).click();
  await choose(page, /pedidos por medios digitales/, "No");
  await fillSalesOrigin(page, "Todavía no tengo cifras");
  await expect(page.getByLabel("Ventas anuales", { exact: true })).toHaveCount(0);
  await fillPurchasesOrigin(page, "Todavía no tengo cifras");
  await advanceTo(page, "#name");
  await expect(page.getByText("Café y desayunos en mesas; todavía no sé qué venderé más.")).toBeVisible();
});

test("los casos ficticios se abren con simulador y formalización", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Probar con un ejemplo" }).click();
  await page.getByRole("button", { name: /Abrir ejemplo: Cafetería en preparación/ }).click();
  await expect(page.getByText("Simulación con datos ficticios.")).toBeVisible();
  await expect(page.getByText(/5630 · Actividades de servicio de bebidas/)).toBeVisible();
  await page.getByRole("link", { name: "Ir al simulador" }).click();
  await expect(page.getByLabel("Ventas del mes", { exact: true })).toHaveValue("4500");
  await page.getByRole("button", { name: "Calcular estimación" }).click();
  await expect(page.getByRole("heading", { name: "Resultados del simulador" })).toBeVisible();
  await expect(page.getByText("Saldo estimado antes de impuestos")).toBeVisible();
});


test("conserva la sugerencia al recargar y solo cambia el diagnóstico al confirmar", async ({ page }) => {
  await page.goto("/negocios/nuevo");
  await choose(page, /Qué tipo de establecimiento/, "Pollería");
  await advanceTo(page, "#stage");
  await page.getByRole("radio", { name: /Solo tengo una idea de negocio/ }).check();
  await advanceTo(page, "#mode");
  await page.getByRole("radio", { name: /Atención en el establecimiento/ }).check();
  await advanceTo(page, "#customers");
  await choose(page, /A quiénes venderás principalmente/, "Personas");
  await advanceTo(page, "#activity");
  await page.getByLabel("Descripción de tu negocio").fill("Quiero vender pollo a la brasa en mi local y por delivery");
  await page.getByRole("button", { name: "Identificar mi actividad con CREA IA" }).click();
  await expect(page.getByText("Orientación local del INEI", { exact: true })).toBeVisible();
  await expect(page.getByText("CIIU sugerido 5610")).toBeVisible();
  await page.reload();
  await expect(page.getByText("CIIU sugerido 5610")).toBeVisible();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#activity").getByRole("alert")).toContainText("Confirma el código");
  await page.getByRole("button", { name: "Confirmar actividad" }).click();
  await advanceTo(page, "#legal");
  await page.getByRole("radio", { name: /A mi nombre/ }).check();
  await advanceTo(page, "#invoice");
  await choose(page, /Necesitarás emitir facturas/, "No");
  await fillSalesOrigin(page, "Todavía no tengo cifras");
  await fillPurchasesOrigin(page, "Todavía no tengo cifras");
  await advanceTo(page, "#name");
  await page.getByRole("button", { name: "Ver mi diagnóstico" }).click();
  await expect(page.getByText(/5610 · Actividades de restaurantes/)).toBeVisible();
  await page.getByRole("link", { name: "Cambiar actividad", exact: true }).click();
  await page.getByRole("button", { name: "Corregir descripción" }).click();
  await expect(page.getByLabel("Descripción de tu negocio")).toHaveValue("Quiero vender pollo a la brasa en mi local y por delivery");
  await page.getByLabel("Descripción de tu negocio").fill("Prepararé y serviré comidas para matrimonios y cumpleaños");
  await page.getByRole("button", { name: "Usar orientación local" }).click();
  await expect(page.getByText("CIIU sugerido 5621")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar actividad" }).click();
  await page.getByRole("button", { name: "Guardar cambio" }).click();
  await expect(page.getByText(/5621 · Suministro de comidas por encargo/)).toBeVisible();
});
