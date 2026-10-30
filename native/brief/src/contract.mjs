import { blocks } from "./article-blocks.mjs";
export { blocks };
export const VERSION = 1;
export const READER_SLUG = "maude-saturation-bombing-daniel-jones";
export function createFeed({
  articles,
  isGlobalArticle,
  crateArticle,
  watchLibrary,
  placements = [],
  culturePlacements = [],
}) {
  const eligible = Object.entries(articles).filter(
    ([slug, a]) =>
      isGlobalArticle(slug) &&
      !a.league_id &&
      !a.leagueId &&
      !a.edition &&
      (!a.scope || a.scope === "global") &&
      a.status !== "draft" &&
      a.publicationApproved !== false,
  );
  const cards = eligible.map(([slug, a]) => ({
    ...crateArticle({ ...a, slug }),
    scope: { kind: "global" },
    nativeReader: true,
  }));
  if (!cards.some((a) => a.slug === READER_SLUG))
    throw Error("Reader must be globally eligible");
  const readers = eligible.map(([slug, a]) => {
    let media = null;
    if (a.clipSrc)
      media = {
        type: "video",
        src: a.clipSrc,
        poster: a.clipPoster || null,
        title: a.clipCaption || a.title,
        url: a.tweetUrl || null,
      };
    else if (a.tweetId)
      media = {
        type: "xclip",
        tweetId: a.tweetId,
        url: a.tweetUrl,
        title: a.clipCaption || "Original clip",
      };
    else if (a.instagramEmbed)
      media = {
        type: "instagram",
        url: a.instagramEmbed,
        title: "Instagram reel",
      };
    return {
      ...cards.find((x) => x.slug === slug),
      imageCredit: a.imageCredit || null,
      source: a.source || null,
      receipt: a.receipt || null,
      media,
      heroMode: [
        "hollis-mike-ditka-juice-box-guy",
        "marnie-detroit-school",
        "marnie-joe-mixon-nostalgia-era",
      ].includes(slug)
        ? "hidden"
        : slug === "hollis-body-keeps-score"
          ? "first"
          : "normal",
      blocks: blocks(a.body),
    };
  });
  const home = placements
    .map((p) => ({
      ...p,
      cards: p.cards.filter((x) => cards.some((c) => c.slug === x.slug)),
    }))
    .filter((p) => p.cards.length);
  const culture = culturePlacements.filter((x) =>
    cards.some((c) => c.slug === x.slug),
  );
  const watch = watchLibrary("global").features.map((v) => ({
    ...v,
    scope: { kind: "global" },
    offline: false,
  }));
  return {
    version: VERSION,
    scope: { kind: "global" },
    cards,
    reader: readers.find((a) => a.slug === READER_SLUG),
    readers,
    home,
    culture,
    watch,
  };
}
