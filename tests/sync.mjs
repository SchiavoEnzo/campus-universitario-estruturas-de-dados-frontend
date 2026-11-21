import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const server = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5179"],
  { stdio: "pipe" },
);
let browser;
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Vite não iniciou")),
      15000,
    );
    server.stdout.on("data", (chunk) => {
      if (chunk.toString().includes("5179")) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Vite saiu: ${code}`));
    });
  });
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  await page.clock.install();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let graph = {
    revision: 1,
    nodes: [
      {
        id: "a",
        name: "Local Atlas A",
        category: "Categoria Atlas",
        x: 100,
        y: 100,
      },
      {
        id: "b",
        name: "Local Atlas B",
        category: "Categoria Atlas",
        x: 200,
        y: 200,
      },
    ],
    edges: [
      {
        id: "ab",
        from: "a",
        to: "b",
        distance: 42,
        time: null,
        accessible: true,
        blocked: false,
      },
    ],
  };
  let fail = false;
  let writes = 0;
  let session = null;
  const user = {
    id: "enzo",
    name: "Enzo",
    username: "enzo",
    role: "admin",
    must_change_password: true,
  };
  await page.route("**/api/**", async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname;
    const fulfill = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    if (path === "/api/auth/me")
      return session
        ? fulfill(session)
        : fulfill({ detail: "Entre na sua conta" }, 401);
    if (path === "/api/auth/login") {
      const body = req.postDataJSON();
      if (body.password !== "temporary-password")
        return fulfill({ detail: "Usuário ou senha inválidos." }, 401);
      session = { user: { ...user }, csrf_token: "test-csrf" };
      return fulfill(session);
    }
    if (path === "/api/auth/password") {
      assert.equal(req.headers()["x-csrf-token"], "test-csrf");
      session = {
        ...session,
        user: { ...session.user, must_change_password: false },
      };
      return fulfill(session);
    }
    if (path === "/api/auth/logout") {
      session = null;
      return route.fulfill({ status: 204 });
    }
    if (path === "/api/graph")
      return fail
        ? fulfill({ detail: "Banco indisponível" }, 503)
        : fulfill(graph);
    if (path === "/api/routes")
      return fulfill({
        revision: graph.revision,
        found: true,
        path: graph.nodes,
        distance: 42,
        time: null,
      });
    assert.equal(req.headers().authorization, undefined);
    if (!session || req.headers()["x-csrf-token"] !== "test-csrf")
      return fulfill({ detail: "Credencial administrativa inválida." }, 401);
    const payload = req.postDataJSON();
    writes++;
    if (path === "/api/points" && req.method() === "POST") {
      graph = {
        ...graph,
        revision: graph.revision + 1,
        nodes: [...graph.nodes, { id: "new", ...payload }],
      };
      return fulfill({ id: "new", ...payload }, 201);
    }
    if (path === "/api/points/new" && req.method() === "DELETE") {
      graph = {
        ...graph,
        revision: graph.revision + 1,
        nodes: graph.nodes.filter((n) => n.id !== "new"),
      };
      return route.fulfill({ status: 204 });
    }
    if (path === "/api/connections/a/b" && req.method() === "PUT") {
      graph = {
        ...graph,
        revision: graph.revision + 1,
        edges: [{ id: "ab", from: "a", to: "b", ...payload }],
      };
      return fulfill(graph.edges[0]);
    }
    return fulfill({ detail: "Unexpected test request" }, 500);
  });
  const nav = (name) =>
    page.locator("aside").getByRole("button", { name, exact: true }).click();
  await page.goto("http://127.0.0.1:5179");
  await page
    .getByRole("button", { name: "Calcular rota", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Rota calculada", exact: true })
    .waitFor();
  graph = {
    ...graph,
    revision: 2,
    nodes: [
      { ...graph.nodes[0], name: "Nome atualizado Atlas" },
      graph.nodes[1],
    ],
  };
  await page
    .getByRole("button", { name: "Atualizar dados", exact: true })
    .click();
  await page
    .getByRole("option", { name: "Nome atualizado Atlas" })
    .first()
    .waitFor({ state: "attached" });
  assert.equal(
    await page
      .getByRole("heading", { name: "Rota calculada", exact: true })
      .count(),
    0,
    "stale route removed",
  );
  await nav("Explorar locais");
  await page
    .getByRole("heading", { name: "Nome atualizado Atlas", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Ver local →" }).first().click();
  graph = {
    ...graph,
    nodes: [
      { ...graph.nodes[0], name: "Nome atualizado no detalhe" },
      graph.nodes[1],
    ],
  };
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page
    .getByRole("dialog")
    .getByRole("heading", { name: "Nome atualizado no detalhe" })
    .waitFor();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  assert.equal(
    await page
      .locator("aside")
      .getByRole("button", { name: "Locais e conexões", exact: true })
      .count(),
    0,
  );
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByLabel("Usuário", { exact: true }).fill("enzo");
  await page.getByLabel("Senha", { exact: true }).fill("wrong");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Entrar", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Usuário ou senha inválidos." })
    .waitFor();
  await page.getByLabel("Senha", { exact: true }).fill("temporary-password");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Entrar", exact: true })
    .click();
  await page
    .getByLabel("Senha atual", { exact: true })
    .fill("temporary-password");
  await page
    .getByLabel("Nova senha", { exact: true })
    .fill("new-password-12345");
  await page
    .getByLabel("Confirme a nova senha", { exact: true })
    .fill("new-password-12345");
  await page
    .getByRole("button", { name: "Salvar nova senha", exact: true })
    .click();
  await page
    .getByText("Senha alterada. Sua sessão está ativa.", { exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Fechar conta", exact: true }).click();
  await page.reload();
  await page.clock.install();
  await page
    .getByRole("button", { name: "Minha conta", exact: true })
    .waitFor();
  await nav("Visão geral");
  assert.equal(await page.locator(".stat strong").first().textContent(), "2");
  await nav("Locais e conexões");
  await page.getByRole("button", { name: "+ Novo local", exact: true }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Criado pela API");
  await page.getByRole("button", { name: "Salvar no banco" }).click();
  await page.getByRole("dialog").waitFor({ state: "detached" });
  await page
    .getByRole("cell", { name: "Criado pela API", exact: true })
    .waitFor();
  await page
    .getByRole("row")
    .filter({ hasText: "Criado pela API" })
    .getByRole("button", { name: "Editar", exact: true })
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Excluir do banco" }).click();
  await page.getByRole("dialog").waitFor({ state: "detached" });
  assert.equal(
    await page
      .getByRole("cell", { name: "Criado pela API", exact: true })
      .count(),
    0,
  );
  await page.getByRole("button", { name: "Conexões", exact: true }).click();
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByLabel("Conexão bloqueada").check();
  await page.getByRole("button", { name: "Salvar no banco" }).click();
  await page.getByRole("dialog").waitFor({ state: "detached" });
  await nav("Interdições");
  await page.getByText("Conexão bloqueada", { exact: true }).waitFor();
  await nav("Acessibilidade");
  await page
    .getByText("Nenhuma conexão acessível disponível.", { exact: true })
    .waitFor();
  // A database change without a revision bump is still picked up by polling.
  graph = { ...graph, edges: [] };
  await page.clock.runFor(15100);
  await page.waitForFunction(
    () => document.querySelectorAll(".stat strong")[1]?.textContent === "0",
  );
  fail = true;
  await page
    .getByRole("button", { name: "Atualizar dados", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Banco indisponível" })
    .waitFor();
  assert.equal(
    await page.locator("aside").count(),
    0,
    "stale data hidden on network failure",
  );
  fail = false;
  graph = { revision: 3, nodes: [], edges: [] };
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await page.getByText("O mapa não tem locais cadastrados.").waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Calcular rota", exact: true })
      .isDisabled(),
    true,
  );
  await page.getByRole("button", { name: "Minha conta", exact: true }).click();
  await page
    .getByRole("button", { name: "Sair da conta", exact: true })
    .click();
  await page.getByRole("button", { name: "Entrar", exact: true }).waitFor();
  assert.equal(
    await page
      .locator("aside")
      .getByRole("button", { name: "Locais e conexões", exact: true })
      .count(),
    0,
  );
  assert.deepEqual(errors, []);
  assert.equal(writes, 3);
  console.log(
    "PASS: shared API data, route invalidation, detail refresh, CRUD authorization, deletion/204, blocked paths, polling, outage recovery and empty database.",
  );
} finally {
  await browser?.close();
  server.kill();
}
