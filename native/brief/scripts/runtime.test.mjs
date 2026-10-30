import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createContentStore, validateSnapshot } from "../src/content-store.mjs";
import { createFeed, READER_SLUG } from "../src/contract.mjs";
import bundled from "../src/generated/feed.json" with { type: "json" };
const memory = () => {
  const data = new Map();
  return {
    getItem: async (k) => data.get(k),
    setItem: async (k, v) => data.set(k, v),
  };
};
const correction = () => {
  const next = structuredClone(bundled);
  next.reader.blocks[0].text = "Fixture correction, not published copy.";
  return next;
};
test("one canonical fixture revision refreshes the same running model via HTTP without regeneration or rebuild", async (t) => {
  const canonical = { title: "Fixture title", body: ["Fixture original"] };
  const project = () =>
    createFeed({
      articles: { [READER_SLUG]: canonical },
      isGlobalArticle: () => true,
      crateArticle: (a) => ({
        ...bundled.reader,
        blocks: undefined,
        imageCredit: undefined,
        title: a.title,
      }),
      watchLibrary: () => ({ features: bundled.watch }),
    });
  // Canonical fixture uses the real adapter; JSON serialization matches delivery.
  const snapshot = () => JSON.parse(JSON.stringify(project()));
  const baseline = snapshot();
  const server = createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(snapshot()));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const storage = memory();
  const store = createContentStore({
    bundled: baseline,
    storage,
    endpoint: `http://127.0.0.1:${server.address().port}/content`,
  });
  assert.equal(store.get().reader.blocks[0].text, "Fixture original");
  canonical.body[0] = "Fixture corrected at source";
  assert.equal((await store.refresh()).status, "updated");
  assert.equal(
    store.get().reader.blocks[0].text,
    "Fixture corrected at source",
  );
  assert.equal(baseline.reader.blocks[0].text, "Fixture original");
  const offline = createContentStore({
    bundled: baseline,
    storage,
    endpoint: `http://127.0.0.1:${server.address().port}/content`,
  });
  assert.equal(
    (await offline.restore()).reader.blocks[0].text,
    "Fixture corrected at source",
  );
});
test("schema/version, partial snapshots, duplicate IDs, scopes and unapproved media rejected", () => {
  const mutations = [
    (x) => (x.version = 2),
    (x) => delete x.watch,
    (x) => x.cards.pop(),
    (x) => (x.cards[0] = x.cards[1]),
    (x) => delete x.reader.blocks[0].text,
    (x) => x.reader.blocks.pop(),
    (x) => (x.cards[0].scope = { kind: "league" }),
    (x) => (x.scope = { kind: "league" }),
    (x) => (x.reader.league_id = "private"),
    (x) => (x.watch[0].src = "https://example.com/unapproved.mp4"),
    (x) => delete x.cards[0].dek,
  ];
  for (const mutate of mutations) {
    const next = correction();
    mutate(next);
    assert.throws(() => validateSnapshot(next, bundled));
  }
});
test("failed refresh never replaces last good content, including cache write failure", async () => {
  let response = JSON.stringify(correction()),
    mode = "ok";
  const storage = memory();
  const store = createContentStore({
    bundled,
    storage,
    endpoint: "http://fixture",
    fetchImpl: async () => {
      if (mode === "network") throw Error("offline");
      return { ok: mode !== "http", text: async () => response };
    },
  });
  assert.equal((await store.refresh()).status, "updated");
  const good = store.get();
  for (const bad of ["network", "http", "json", "partial", "scope"]) {
    mode = bad;
    response =
      bad === "json"
        ? "{"
        : JSON.stringify(
            bad === "scope" ? { ...bundled, scope: { kind: "league" } } : {},
          );
    assert.equal((await store.refresh()).status, "retained");
    assert.equal(store.get(), good);
  }
  mode = "ok";
  response = JSON.stringify(bundled);
  storage.setItem = async () => {
    throw Error("disk full");
  };
  assert.equal((await store.refresh()).status, "retained");
  assert.equal(store.get(), good);
});
test("invalid cache, missing endpoint, timeout and overlapping requests retain safe content", async () => {
  const store = createContentStore({
    bundled,
    storage: { getItem: async () => "{invalid" },
  });
  assert.equal(await store.restore(), bundled);
  assert.equal((await store.refresh()).status, "unconfigured");
  const slow = createContentStore({
    bundled,
    endpoint: "http://fixture",
    timeoutMs: 5,
    fetchImpl: (_, options) =>
      new Promise((resolve, reject) =>
        options.signal.addEventListener("abort", () =>
          reject(Error("timeout")),
        ),
      ),
  });
  const pending = slow.refresh();
  assert.equal((await slow.refresh()).status, "busy");
  assert.equal((await pending).status, "retained");
  assert.equal(slow.get(), bundled);
});
test("local fixture cache cannot contaminate an unconfigured or different source", async () => {
  const storage = memory();
  const local = createContentStore({
    bundled,
    storage,
    endpoint: "http://127.0.0.1:8787/content",
    fetchImpl: async () => ({
      ok: true,
      text: async () => JSON.stringify(correction()),
    }),
  });
  assert.equal((await local.refresh()).status, "updated");
  assert.equal(
    await createContentStore({ bundled, storage }).restore(),
    bundled,
  );
  assert.equal(
    await createContentStore({
      bundled,
      storage,
      endpoint: "http://127.0.0.1:8788/content",
    }).restore(),
    bundled,
  );
});
