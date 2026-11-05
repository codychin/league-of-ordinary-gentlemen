import { placements, culturePlacements } from "./placements.mjs";
import { articles } from "../../../app/articles/data.js";
import { isGlobalArticle } from "../../../lib/editorial-scope.js";
import { crateArticle } from "../../../lib/crates.mjs";
import { watchLibrary } from "../../../lib/watch-library.js";
import { createFeed } from "../src/contract.mjs";
export const feed = createFeed({
  articles,
  placements,
  culturePlacements,
  isGlobalArticle,
  crateArticle,
  watchLibrary,
});
import { photoLabels, photoFraming } from './placements.mjs';
import { writerFor } from '../../../app/articles/writers.js';
export const presentation=Object.fromEntries(feed.cards.map(card=>{
 const w=writerFor(card.slug);
 return [card.slug,{// The approved web focal point is 15% down; this wider native frame
 // needs the portrait's top edge to retain the crown (source inspected).
 framing:photoFraming[card.slug],writer:{name:w.name,role:w.title,image:w.image,imageAlt:w.imageAlt},...(photoLabels[card.slug]?{overlay:photoLabels[card.slug]}:{})}];
}));
