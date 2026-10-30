// v1 is a public-only projection. Never accept an edition name as authorization.
export const VERSION = 1;
export const READER_SLUG = "maude-saturation-bombing-daniel-jones";
export function blocks(body) {
  return body.map((item, index) => {
    const id = `block-${index}`;
    if (typeof item === "string") return { id, type: "paragraph", text: item };
    if (item.type === "youtube" && /^[\w-]{11}$/.test(item.id))
      return {
        id,
        type: "external",
        title: item.title,
        url: `https://www.youtube.com/watch?v=${item.id}`,
        offline: false,
      };
    if (
      item.type === "rich" &&
      /^<span class="maudeBlitzLead">[^<>]+<\/span>$/.test(item.html)
    )
      return { id, type: "statistic", text: item.html.replace(/<[^>]*>/g, "") };
    throw new Error(`Unsupported reader block ${index}: ${item.type}`);
  });
}
export function createFeed({
  articles,
  isGlobalArticle,
  crateArticle,
  watchLibrary,
}) {
  const cards = Object.entries(articles)
    .filter(
      ([slug, a]) =>
        isGlobalArticle(slug) &&
        !a.league_id &&
        !a.leagueId &&
        !a.edition &&
        (!a.scope || a.scope === "global") &&
        a.status !== "draft" &&
        a.publicationApproved !== false,
    )
    .map(([slug, a]) => ({
      ...crateArticle({ ...a, slug }),
      scope: { kind: "global" },
      nativeReader: slug === READER_SLUG,
    }));
  if (!cards.some((a) => a.slug === READER_SLUG))
    throw new Error("Reader must be globally eligible");
  const source = articles[READER_SLUG];
  return {
    version: VERSION,
    scope: { kind: "global" },
    cards,
    reader: {
      ...cards.find((a) => a.slug === READER_SLUG),
      imageCredit: source.imageCredit,
      blocks: blocks(source.body),
    },
    watch: watchLibrary("global").features.map((v) => ({
      ...v,
      scope: { kind: "global" },
      offline: false,
    })),
  };
}
