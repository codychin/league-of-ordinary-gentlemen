export const SITE_ORIGIN = 'https://www.ordinarybrief.com';

// Only the published, globally discoverable editorial inventory belongs here.
// Edition-specific content and staging drafts must never leak into this index.
export function publicSitemap(articles, isGlobalArticle) {
  const slugs = Object.entries(articles)
    .filter(([slug, article]) => isGlobalArticle(slug) && !article.stagingOnly)
    .map(([slug]) => slug)
    .filter(slug => slug !== 'sabine-chest-speculation-statement')
    .sort();
  return [
    {url: `${SITE_ORIGIN}/`},
    {url: `${SITE_ORIGIN}/archive`},
    ...slugs.map(slug => ({url: `${SITE_ORIGIN}/articles/${encodeURIComponent(slug)}`})),
  ];
}
