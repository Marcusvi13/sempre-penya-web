"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const test = require("node:test");

const app = fs.readFileSync("app.js", "utf8");
function section(name) {
  const marker = "async function " + name + "(";
  const start = app.indexOf(marker);
  assert.notEqual(start, -1, "Missing function " + name);
  const end = app.indexOf("\n}\n", start);
  assert.notEqual(end, -1);
  return app.slice(start, end + 2);
}
const js = section("fetchWithTimeout") + "\n" + section("adminPublishOrSave");

function scenario(fetcher, { loadFeed, important = "Normal" } = {}) {
  const nodes = new Map();
  const messages = [];
  let refreshes = 0, renders = 0;
  const ctx = {
    AbortController, setTimeout, clearTimeout,
    $: (id) => {
      if (!nodes.has(id)) nodes.set(id, { textContent: "", disabled: false });
      return nodes.get(id);
    },
    adminSession: { token: "test-token" },
    adminEditor: { itemId: "existing-article" },
    SUPABASE_URL: "https://example.test",
    adminHeaders: () => ({ Authorization: "Bearer mock" }),
    buildAdminPayload: () => ({
      url: "https://example.test/news",
      title: "Notícia",
      source: "Diari",
      context: "El Joventut Badalona",
      section: "Mercat",
      tag: "Rumor",
      importance: important,
      is_rumor: true,
      is_media: false
    }),
    canonicalManualSourceId: () => null,
    setFormMessage: (name, value) => messages.push([name, value]),
    setAdminView: () => {},
    clearAdminSession: () => {},
    resetAdminPublishForm: () => { ctx.adminEditor.itemId = null; },
    state: { items: [{ id: "existing-article", importance: "Important" }] },
    renderFeed: () => { renders += 1; },
    loadFeed: () => { refreshes += 1; return loadFeed ? loadFeed() : Promise.resolve(); },
    fetch: fetcher
  };
  vm.createContext(ctx);
  vm.runInContext(js, ctx);
  return { ctx, nodes, messages, stats: () => ({ refreshes, renders }) };
}

test("editing Importance restores button even if feed reload never completes", async () => {
  let method, prefer, patched;
  const env = scenario(async (url, options) => {
    method = options.method;
    prefer = options.headers.Prefer;
    patched = JSON.parse(options.body);
    assert.match(url, /select=id,importance/);
    return { ok: true, status: 200, json: async () =>
      [{ id: "existing-article", importance: "Normal" }] };
  }, { loadFeed: () => new Promise(() => {}) });

  await Promise.race([
    env.ctx.adminPublishOrSave(),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Save stayed pending")), 900))
  ]);
  assert.equal(method, "PATCH");
  assert.equal(prefer, "return=representation");
  assert.equal(patched.importance, "Normal");
  assert.equal(env.ctx.state.items[0].importance, "Normal");
  assert.equal(env.stats().refreshes, 1);
  assert.equal(env.nodes.get("admin-publish").disabled, false);
  assert.equal(env.nodes.get("admin-publish").textContent, "Publicar");
  assert.ok(env.messages.some(([where,msg]) => where === "admin-publish-ok" && msg.includes("confirmats")));
});

test("zero changed rows is reported as error; never claimed as success", async () => {
  const env = scenario(async () => ({ ok: true, status: 200, json: async () => [] }));
  await env.ctx.adminPublishOrSave();
  assert.equal(env.nodes.get("admin-publish").disabled, false);
  assert.equal(env.stats().refreshes, 0);
  assert.ok(env.messages.some(([where,msg]) => where === "admin-publish-error" && msg.includes("confirmar")));
  assert.ok(!env.messages.some(([where,msg]) => where === "admin-publish-ok" && msg));
});

test("HTTP update errors release the button and show the cause", async () => {
  const env = scenario(async () => ({ ok: false, status: 500, json: async () => ({ message: "Database busy" }) }));
  await env.ctx.adminPublishOrSave();
  assert.equal(env.nodes.get("admin-publish").disabled, false);
  assert.ok(env.messages.some(([where,msg]) => where === "admin-publish-error" && msg === "Database busy"));
});

test("network request has deadline and reports uncertainty instead of indefinite spinner", async () => {
  let aborted = false;
  const env = scenario((_, opts) => new Promise((resolve,reject) => {
    opts.signal.addEventListener("abort", () => {
      aborted = true;
      reject(new Error("AbortError"));
    });
  }));
  await assert.rejects(() => env.ctx.fetchWithTimeout("https://example.test", {}, 15), /Temps d.espera esgotat/);
  assert.equal(aborted, true);
});
