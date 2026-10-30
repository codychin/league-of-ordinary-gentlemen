import { articles } from "../../../app/articles/data.js";
import { isGlobalArticle } from "../../../lib/editorial-scope.js";
import { crateArticle } from "../../../lib/crates.mjs";
import { watchLibrary } from "../../../lib/watch-library.js";
import { createFeed } from "../src/contract.mjs";
export const feed = createFeed({
  articles,
  isGlobalArticle,
  crateArticle,
  watchLibrary,
});
