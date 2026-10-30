import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { richNodes } from "../src/article-blocks.mjs";
import { validateSnapshot } from "../src/content-store.mjs";
import feed from "../src/generated/feed.json" with { type: "json" };
test("all canonical body entries, source links and receipts have native counterparts", async () => {
  const result = await build({
    stdin: {
      contents: 'export {articles} from "../../app/articles/data.js";',
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: "node",
    format: "esm",
    write: false,
  });
  const { articles } = await import(
    "data:text/javascript;base64," +
      Buffer.from(result.outputFiles[0].text).toString("base64")
  );
  for (const a of feed.readers) {
    const original = articles[a.slug];
    assert.equal(a.blocks.length, original.body.length, a.slug);
    original.body.forEach((b, i) => {
      const native = a.blocks[i];
      if (typeof b === "string") assert.equal(native.text, b);
      else if (b.type === "rich" && native.type === "rich")
        assert.deepEqual(native.nodes, richNodes(b.html));
      else if (b.type === "image") {
        assert.equal(native.src, b.src);
        assert.equal(native.caption, b.caption || "");
        assert.deepEqual(native.credit, b.credit || null);
      } else if (b.type === "heading") assert.equal(native.text, b.text);
    });
    assert.equal(a.receipt, original.receipt || null);
    assert.deepEqual(a.source, original.source || null);
  }
});
test("rich text retains semantic emphasis and links but rejects executable HTML", () => {
  assert.deepEqual(
    richNodes("A <em>word</em> &amp; <strong>another</strong>")[1],
    { kind: "em", children: [{ text: "word" }] },
  );
  for (const html of [
    "<script>alert(1)</script>",
    '<img src="x" onerror="x">',
    '<a href="javascript:x">x</a>',
    '<span style="color:red">x</span>',
  ])
    assert.throws(() => richNodes(html), /Unsupported/);
});
test("runtime updates cannot introduce new reader media, rich links or placements", () => {
  for (const mutate of [
    (f) => (f.readers[1].media.src = "https://evil.example/a.mp4"),
    (f) => (f.home[0].cards[0].slug = f.cards[0].slug),
    (f) => f.readers[1].blocks.pop(),
    (f) => (f.readers[1].scope = { kind: "league" }),
  ]) {
    const f = structuredClone(feed);
    mutate(f);
    assert.throws(() => validateSnapshot(f, feed));
  }
});
