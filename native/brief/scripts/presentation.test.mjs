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
  assert.equal(home.cards.length, feed.home.flatMap((p) => p.cards).length);
  assert.equal(home.empty, false);
  assert.equal(home.cards[0].slug, "marnie-detroit-school");
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

test("Home preserves production lead, three-card carousel and feature order", () => {
  assert.equal(feed.home[0].kind, "lead");
  assert.equal(feed.home[0].cards[0].slug, "marnie-detroit-school");
  assert.deepEqual(
    feed.home[1].cards.map((c) => c.slug),
    [
      "maude-saturation-bombing-daniel-jones",
      "conrad-allow-me-to-reintroduce-myself",
      "marnie-delicate-etiquette-sporting-pat",
    ],
  );
  const slugs = feed.home.flatMap((p) => p.cards.map((c) => c.slug));
  assert.equal(slugs.at(-1), "dashiell-jaguars-london-future");
  assert.ok(!slugs.includes("conrad-deshaun-watson-cleveland-hope"));
  assert.ok(!slugs.includes("hollis-jameis-winston-turing-test"));
});
test("every global card has a full native reader and all Detroit plates survive", () => {
  assert.equal(feed.readers.length, feed.cards.length);
  for (const card of feed.cards) {
    const a = feed.readers.find((a) => a.slug === card.slug);
    assert.ok(card.nativeReader);
    assert.ok(a.blocks.length);
  }
  const detroit = feed.readers.find((a) => a.slug === "marnie-detroit-school");
  assert.equal(detroit.blocks.filter((b) => b.type === "heading").length, 9);
  assert.equal(detroit.blocks.filter((b) => b.type === "image").length, 7);
  assert.equal(detroit.media.type, "video");
  assert.ok(detroit.media.src);
});

test("Culture preserves curated desk order and remains globally eligible", () => {
  assert.deepEqual(
    feed.culture.slice(0, 5).map((c) => c.slug),
    [
      "marnie-jumbotron-juilliard",
      "marnie-time-traveling-goblin-paradox",
      "sabine-michigan-money-privilege-impatience",
      "dashiell-favorite-team-asset-class",
      "marnie-manifest-destiny-wembley",
    ],
  );
  for (const c of feed.culture)
    assert.ok(feed.readers.some((a) => a.slug === c.slug));
  assert.ok(
    !feed.culture.some(
      (c) => c.slug === "conrad-white-coaches-lose-individually",
    ),
  );
  assert.ok(feed.culture.length < feed.cards.length);
});
