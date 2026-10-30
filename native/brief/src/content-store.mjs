// Correction-only runtime boundary for the prototype. Inventory changes need a
// separate publishing/withdrawal contract; a partial feed must never look valid.
const fail = () => {
  throw new Error("Invalid Brief content snapshot");
};
const text = (v) => typeof v === "string" && v.length <= 100000;
const url = (v) =>
  typeof v === "string" &&
  ((v.startsWith("/") && !v.startsWith("//")) || /^https:\/\//.test(v));
function publicOnly(value) {
  if (!value || typeof value !== "object") return;
  if (["league_id", "leagueId", "edition"].some((k) => k in value)) fail();
  if (
    "scope" in value &&
    (value.scope?.kind !== "global" || Object.keys(value.scope).length !== 1)
  )
    fail();
  for (const child of Object.values(value)) publicOnly(child);
}
function sameKeys(value, baseline) {
  if (
    !value ||
    typeof value !== "object" ||
    Object.keys(value).sort().join("|") !==
      Object.keys(baseline).sort().join("|")
  )
    fail();
}
function sameIds(items, baseline, key) {
  if (!Array.isArray(items) || items.length !== baseline.length) fail();
  const ids = items.map((x) => x?.[key]);
  if (
    new Set(ids).size !== ids.length ||
    baseline.some((x) => !ids.includes(x[key]))
  )
    fail();
}
// New reader structures are typed at generation, then constrained to the exact
// bundled structure and media inventory. Only editorial text leaves may change.
function validateTree(value, original, key = "") {
  if (Array.isArray(original)) {
    if (!Array.isArray(value) || value.length !== original.length) fail();
    original.forEach((item, i) => validateTree(value[i], item, key));
  } else if (original && typeof original === "object") {
    sameKeys(value, original);
    for (const k of Object.keys(original))
      validateTree(value[k], original[k], k);
  } else if (
    typeof original === "string" &&
    [
      "text",
      "title",
      "dek",
      "caption",
      "label",
      "by",
      "imageAlt",
      "alt",
      "receipt",
    ].includes(key)
  ) {
    if (!text(value)) fail();
  } else if (value !== original) fail();
}
export function validateSnapshot(candidate, bundled) {
  if (
    !candidate ||
    candidate.version !== 1 ||
    candidate.version !== bundled.version
  )
    fail();
  sameKeys(candidate, bundled);
  publicOnly(candidate);
  if (candidate.scope?.kind !== "global") fail();
  sameIds(candidate.cards, bundled.cards, "slug");
  for (const card of candidate.cards) {
    const original = bundled.cards.find((x) => x.slug === card.slug);
    sameKeys(card, original);
    if (
      card.scope?.kind !== "global" ||
      card.nativeReader !== original.nativeReader ||
      card.href !== original.href
    )
      fail();
    for (const field of ["title", "dek", "by", "section", "imageAlt"])
      if (!text(card[field])) fail();
    if (!card.title || !card.by || !Number.isFinite(card.timestamp)) fail();
    if (card.image !== null && !url(card.image)) fail();
    if (card.date !== null && !text(card.date)) fail();
    if (card.topic !== null && !text(card.topic)) fail();
  }
  const reader = candidate.reader;
  if (!reader || reader.slug !== bundled.reader.slug) fail();
  sameKeys(reader, bundled.reader);
  const card = candidate.cards.find((x) => x.slug === reader.slug);
  for (const key of Object.keys(card))
    if (JSON.stringify(reader[key]) !== JSON.stringify(card[key])) fail();
  sameIds(reader.blocks, bundled.reader.blocks, "id");
  for (let i = 0; i < reader.blocks.length; i++) {
    const block = reader.blocks[i],
      original = bundled.reader.blocks[i];
    sameKeys(block, original);
    if (block.id !== original.id || block.type !== original.type) fail();
    if (["paragraph", "statistic"].includes(block.type)) {
      if (!text(block.text) || !block.text.trim()) fail();
    } else if (block.type === "external") {
      if (
        !text(block.title) ||
        !/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/.test(block.url) ||
        block.offline !== false
      )
        fail();
    } else fail();
  }
  if (bundled.reader.imageCredit)
    sameKeys(reader.imageCredit, bundled.reader.imageCredit);
  if (
    reader.imageCredit &&
    (!text(reader.imageCredit.label) || !url(reader.imageCredit.url))
  )
    fail();
  sameIds(candidate.watch, bundled.watch, "id");
  for (const video of candidate.watch) {
    // Existing media only. Runtime content correction does not authorize new media.
    const original = bundled.watch.find((x) => x.id === video.id);
    sameKeys(video, original);
    if (
      video.scope?.kind !== "global" ||
      video.offline !== false ||
      video.src !== original.src ||
      video.poster !== original.poster
    )
      fail();
    for (const field of ["title", "correspondent", "kind"])
      if (!text(video[field]) || !video[field]) fail();
  }
  validateTree(candidate.readers, bundled.readers);
  validateTree(candidate.home, bundled.home, "placement");
  validateTree(candidate.culture, bundled.culture, "culture");
  for (const article of candidate.readers) {
    const matching = candidate.cards.find((c) => c.slug === article.slug);
    if (!matching) fail();
    for (const key of Object.keys(matching))
      if (JSON.stringify(article[key]) !== JSON.stringify(matching[key]))
        fail();
  }
  return candidate;
}
export function createContentStore({
  bundled,
  endpoint,
  storage,
  fetchImpl = fetch,
  timeoutMs = 8000,
}) {
  const cacheKey = `brief:global:content:v1:${encodeURIComponent(endpoint || "bundled")}`;
  let current = validateSnapshot(bundled, bundled),
    busy = false;
  const get = () => current;
  async function restore() {
    if (busy) return current;
    busy = true;
    try {
      const raw = await storage?.getItem(cacheKey);
      if (raw) {
        if (raw.length > 2000000) fail();
        current = validateSnapshot(JSON.parse(raw), bundled);
      }
    } catch {
      /* Invalid or unavailable cache leaves bundled content intact. */
    } finally {
      busy = false;
    }
    return current;
  }
  async function refresh() {
    if (busy) return { status: "busy", feed: current };
    if (!endpoint) return { status: "unconfigured", feed: current };
    busy = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(endpoint, {
        method: "GET",
        signal: controller.signal,
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Content request failed");
      const raw = await response.text();
      if (raw.length > 2000000) fail();
      const next = validateSnapshot(JSON.parse(raw), bundled);
      if (storage) await storage.setItem(cacheKey, JSON.stringify(next));
      current = next;
      return { status: "updated", feed: current };
    } catch {
      return { status: "retained", feed: current };
    } finally {
      clearTimeout(timer);
      busy = false;
    }
  }
  return { get, restore, refresh };
}
