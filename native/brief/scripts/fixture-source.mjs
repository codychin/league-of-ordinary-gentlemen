import { articles } from "../../../app/articles/data.js";
import { isGlobalArticle } from "../../../lib/editorial-scope.js";
import { crateArticle } from "../../../lib/crates.mjs";
import { watchLibrary } from "../../../lib/watch-library.js";
import { createFeed, READER_SLUG } from "../src/contract.mjs";
// Only a memory copy is edited, never the published article source.
export function fixtureFeed(firstParagraph) {
  const fixture = structuredClone(articles);
  if (firstParagraph) fixture[READER_SLUG].body[0] = firstParagraph;
  return createFeed({
    articles: fixture,
    isGlobalArticle,
    crateArticle,
    watchLibrary,
  });
}
