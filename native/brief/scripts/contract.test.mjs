import test from "node:test";
import assert from "node:assert/strict";
import { createFeed, READER_SLUG, blocks } from "../src/contract.mjs";
const article = {
  title: "Approved fixture",
  body: [
    "Original",
    { type: "rich", html: '<span class="maudeBlitzLead">85.2%</span>' },
    { type: "youtube", id: "SyYsE_rVZ6g", title: "Source" },
  ],
};
const inputs = () => ({
  articles: {
    [READER_SLUG]: structuredClone(article),
    private: { title: "Secret", body: ["Private"] },
  },
  isGlobalArticle: (s) => s === READER_SLUG,
  crateArticle: (a) => ({ slug: a.slug, title: a.title }),
  watchLibrary: (scope) => {
    assert.equal(scope, "global");
    return { features: [], matchups: [{ title: "Private matchup" }] };
  },
});
test("canonical correction propagates without a second article copy", () => {
  const x = inputs();
  assert.equal(createFeed(x).reader.blocks[0].text, "Original");
  x.articles[READER_SLUG].body[0] = "Corrected fixture";
  assert.equal(createFeed(x).reader.blocks[0].text, "Corrected fixture");
});
test("unknown and league content excluded; explicit local metadata fails closed", () => {
  const x = inputs();
  assert.equal(createFeed(x).cards.length, 1);
  assert.equal(createFeed(x).watch.length, 0);
  x.articles[READER_SLUG].league_id = "secret";
  assert.throws(() => createFeed(x), /globally eligible/);
});
test("drafts excluded even if allowlisted", () => {
  const x = inputs();
  x.articles[READER_SLUG].status = "draft";
  assert.throws(() => createFeed(x), /globally eligible/);
});
test("rich statistic and online-only external media preserved; unknown HTML fails", () => {
  const b = blocks(article.body);
  assert.equal(b[1].text, "85.2%");
  assert.equal(b[2].offline, false);
  assert.throws(
    () => blocks([{ type: "rich", html: '<iframe src="private"></iframe>' }]),
    /Unsupported/,
  );
});
test("explicit scope, edition and withdrawn approval cannot leak through global allowlist", () => {
  for (const metadata of [
    { scope: "local" },
    { scope: { kind: "league", id: "private" } },
    { edition: "doge" },
    { publicationApproved: false },
  ]) {
    const x = inputs();
    Object.assign(x.articles[READER_SLUG], metadata);
    assert.throws(() => createFeed(x), /globally eligible/);
  }
});
test("real generated feed contains only allowlisted global cards and no league video", async () => {
  const { default: feed } = await import("../src/generated/feed.json", {
    with: { type: "json" },
  });
  const { GLOBAL_ARTICLE_SLUGS } = await import(
    "../../../lib/editorial-scope.js"
  );
  assert.equal(feed.version, 1);
  assert.ok(
    feed.cards.every(
      (a) => GLOBAL_ARTICLE_SLUGS.has(a.slug) && a.scope.kind === "global",
    ),
  );
  assert.equal(feed.reader.slug, READER_SLUG);
  assert.equal(feed.reader.blocks.length, 20);
  assert.ok(
    feed.watch.every((v) => v.scope.kind === "global" && v.offline === false),
  );
  assert.ok(!JSON.stringify(feed).includes("marnie-paying-retail"));
});
