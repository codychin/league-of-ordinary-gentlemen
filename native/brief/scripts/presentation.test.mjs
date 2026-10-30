import test from "node:test";
import assert from "node:assert/strict";
import {
  storySelection,
  creditUrl,
  openImageCredit,
} from "../src/reader-presentation.mjs";
import feed from "../src/generated/feed.json" with { type: "json" };
test("an impossible Crates query/topic cannot remove front-page cards or show its empty state", () => {
  const filters = {
    query: "no-story-can-match-this-fixture",
    topic: "no-topic",
  };
  assert.deepEqual(storySelection(feed, { tab: "The Crates", ...filters }), {
    cards: [],
    empty: true,
  });
  const home = storySelection(feed, { tab: "Front page", ...filters });
  assert.deepEqual(home, storySelection(feed, { tab: "Front page" }));
  assert.equal(home.cards.length, 5);
  assert.equal(home.empty, false);
  assert.equal(home.cards[0].slug, feed.reader.slug);
});
test("image attribution opens its canonical HTTPS credit and retains label", async () => {
  const credit = feed.reader.imageCredit;
  let opened;
  assert.ok(credit.label);
  assert.ok(creditUrl(credit));
  assert.equal(
    await openImageCredit(credit, async (url) => {
      opened = url;
    }),
    true,
  );
  assert.equal(opened, credit.url);
  assert.equal(
    await openImageCredit(credit, async () => {
      throw Error("unavailable");
    }),
    false,
  );
});
test("invalid or unsafe attribution URLs never invoke the native opener", async () => {
  for (const url of [
    "javascript:alert(1)",
    "file:///tmp/private",
    "http://example.com",
    "https://user:password@example.com",
    "//example.com",
    "invalid",
    undefined,
  ]) {
    assert.equal(creditUrl({ url }), null);
    assert.equal(
      await openImageCredit({ url }, () =>
        assert.fail("must not open unsafe URL"),
      ),
      false,
    );
  }
});
