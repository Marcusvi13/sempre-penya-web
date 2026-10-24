"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const test = require("node:test");

const src = fs.readFileSync("app.js", "utf8");
function fn(name) {
  const marker = "function " + name + "(";
  const start = src.indexOf(marker);
  assert.notEqual(start, -1, "No existeix " + name);
  const end = src.indexOf("\n}", start);
  assert.notEqual(end, -1);
  return src.slice(start, end + 2);
}

const ctx = { URL };
vm.createContext(ctx);
vm.runInContext(
  ["safeUrl","normalizeText","mediaLinks","mediaActionLabel","groupingKey","mergeMultimedia"].map(fn).join("\n"),
  ctx
);

const link = (kind, url) => ({kind, url});
const X = "https://x.com/Penya1930/status/123";
const IG = "https://www.instagram.com/p/123/";
const WEB = "https://www.penya.com/ca/club/noticies/noticia-d-exemple";
const entry = (links, overrides={})=> ({
  id: "social-news",
  title: "Publicació oficial del Joventut",
  url: X,
  content_group: "club-penya-post-123",
  published_at: "2026-10-24T20:00:00Z",
  detected_at: "2026-10-24T20:02:00Z",
  media_links: links,
  importance: "Normal",
  ...overrides,
});

test("Web preserves both verified platforms with distinct labels", () => {
  const result = ctx.mediaLinks(entry([
    link("twitter", X),
    link("instagram", IG),
  ]));
  assert.equal(result.length, 2);
  assert.equal(result[0].kind, "x");
  assert.equal(result[1].kind, "instagram");
  assert.equal(ctx.mediaActionLabel(result[0]), "𝕏 X →");
  assert.equal(ctx.mediaActionLabel(result[1]), "Instagram →");
});

test("Additional article URL remains available alongside paired socials", () => {
  const result = ctx.mediaLinks(entry([link("x", X),link("IG",IG)], {url:WEB}));
  assert.equal(result.length, 3);
  assert.deepEqual(Array.from(result, r=>r.kind), ["read","x","instagram"]);
});

test("Same URL in media_links and url is not duplicated", () => {
  const result = ctx.mediaLinks(entry([link("x",X),link("instagram",IG)]));
  assert.equal(result.length, 2);
});

test("Untrusted social URL cannot be shown as a button", () => {
  const result = ctx.mediaLinks(entry([link("x","javascript:alert(1)"),link("instagram",IG)],{url:""}));
  assert.equal(result.length, 1);
  assert.equal(result[0].kind,"instagram");
});

test("Two equivalent social records merge into one card with both media actions", () => {
  const merged = ctx.mergeMultimedia([
    entry([link("x",X)],{id:"on-x",url:X}),
    entry([link("instagram",IG)],{id:"on-instagram",url:IG})
  ]);
  assert.equal(merged.length,1);
  assert.deepEqual(Array.from(ctx.mediaLinks(merged[0]), l=>l.kind), ["x","instagram"]);
});

test("Different content groups never merge", () => {
  const merged = ctx.mergeMultimedia([
    entry([link("x",X)],{id:"a", content_group:"post-a"}),
    entry([link("instagram",IG)],{id:"b",url:IG,content_group:"post-b"})
  ]);
  assert.equal(merged.length,2);
});

test("Legacy media links remain compatible", () => {
  const old = ctx.mediaLinks(entry([
    link("audio","https://www.ivoox.com/penya"),
    link("video","https://www.youtube.com/watch?v=123")
  ],{url:WEB}));
  assert.deepEqual(Array.from(old,l=>l.kind),["read","audio","video"]);
  assert.equal(ctx.mediaActionLabel(old[0]),"Llegir →");
  assert.equal(ctx.mediaActionLabel(old[1]),"🎧 Escoltar →");
});

test("Web cache bust follows code revision", ()=>{
  const html=fs.readFileSync("index.html","utf8");
  assert.match(html,/app\.js\?v=16/);
});
