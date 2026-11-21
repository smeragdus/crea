import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { classify, createAssistantServer } from "../../server/assistant.mjs";

const providerReply = (data) => Response.json({ output: [{
  type: "message", content: [{ type: "output_text", text: JSON.stringify(data) }],
}] });

const profile = { description: "Prepararé pollo a la brasa para servir en mi local y por delivery", establishment: "polleria", mode: "local", customers: "personas" };
const successfulClassification = {
  primary: { code: "5610", excerpt: "pollo a la brasa para servir en mi local" }, secondary: [], clarification: null, review: false,
};

test("envía el perfil al proveedor con esquema estricto y valida el catálogo y el extracto", async () => {
  const result = await classify({ kind: "classification", profile }, {
    key: "test-key", model: "test-model",
    fetcher: async (url, request) => {
      assert.equal(url, "https://api.openai.com/v1/responses");
      const body = JSON.parse(request.body);
      assert.equal(body.store, false);
      assert.equal(body.text.format.strict, true);
      assert.equal(body.text.format.name, "crea_ciiu");
      assert.deepEqual(JSON.parse(body.input), profile);
      assert.match(body.instructions, /5629/);
      return providerReply(successfulClassification);
    },
  });
  assert.deepEqual(result, { source: "ia", suggestion:{ primary:"5610", secondary:[], clarification:null, review:false } });
  await assert.rejects(classify({ kind: "classification", profile }, {
    key: "test-key", model: "test-model", fetcher: async () => providerReply({ ...successfulClassification, primary:{ code:"9999", excerpt:profile.description } }),
  }));
});

async function withServer(options, run) {
  const server = createAssistantServer(options).listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    await run("http://127.0.0.1:" + server.address().port + "/api/crea-assistant");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("rechaza orígenes ajenos, identificadores, datos extra y peticiones sobre el límite", async () => {
  const origin = "https://crea.example";
  let forwarded = 0;
  await withServer({ origin, key: "test-key", model: "test-model",
    fetcher: async () => { forwarded++; return providerReply({ topic: "sales" }); },
  }, async (url) => {
    const submit = (body, from = origin) => fetch(url, { method: "POST", headers: { Origin: from, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    assert.equal((await submit({ question: "Cómo proyecto mis ventas" }, "https://other.example")).status, 403);
    assert.equal((await submit({ question: "Mi RUC es 11111111111" })).status, 400);
    assert.equal((await submit({ question: "Cómo proyecto mis ventas", answers: ["private"] })).status, 400);
    assert.equal((await submit({ question: "x".repeat(3000) })).status, 413);
    for (let i = 0; i < 4; i++) {
      assert.deepEqual(await (await submit({ question: "Cómo proyecto mis ventas" })).json(), { topic: "sales" });
    }
    assert.equal((await submit({ question: "Cómo proyecto mis ventas" })).status, 429);
    assert.equal(forwarded, 4);
  });
});

test("devuelve indisponibilidad para que el sitio mantenga la ayuda local", async () => {
  const origin = "https://crea.example";
  await withServer({ origin }, async (url) => {
    const response = await fetch(url, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Cómo se clasifican las cafeterías" }) });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "no-store");
  });
});


test("el mismo servidor gestiona clasificación, perfiles inválidos y errores del modelo", async () => {
  const origin = "https://crea.example";
  let forwarded = 0;
  await withServer({ origin, key:"test-key", model:"test-model", fetcher: async () => {
    forwarded++;
    return forwarded === 1 ? providerReply(successfulClassification) : providerReply({ primary: "no estructurado" });
  } }, async (url) => {
    const send = (classification) => fetch(url, { method:"POST", headers:{ Origin:origin, "Content-Type":"application/json" }, body:JSON.stringify({ classification }) });
    assert.equal((await send({ ...profile, email:"persona@example.test" })).status, 400);
    assert.equal((await send({ ...profile, description:"Mi nombre es Una Persona" })).status, 400);
    const response = await send(profile);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).suggestion.primary, "5610");
    assert.equal((await send(profile)).status, 502);
    assert.equal(forwarded, 2);
  });
});
