// Editorial scope is intentionally allowlisted.
// Anything not explicitly global is treated as league-local by default.
// This prevents a league-specific story from leaking into another edition.

export const GLOBAL_ARTICLE_SLUGS=new Set([
  'marnie-tee-higgins-ankles',
  'conrad-deshaun-watson-cleveland-hope',
  'hollis-jameis-winston-turing-test',
  'sabine-sunday-maracana',
  'dashiell-man-city-infrastructure',
  'dashiell-favorite-team-asset-class',
  'sabine-michigan-money-privilege-impatience',
  'hollis-arch-manning-compression',
  'conrad-caleb-williams-survived',
  'marnie-manifest-destiny-wembley',
  'marnie-jumbotron-juilliard',
  'marnie-colorado-content-football',
  'marnie-tilly-cantonese',
  'marnie-cruise-swift-football',
  'sabine-chest-statement',
]);

export function articleScope(slug){
  return GLOBAL_ARTICLE_SLUGS.has(slug)?'global':'local';
}

export function isGlobalArticle(slug){
  return articleScope(slug)==='global';
}
