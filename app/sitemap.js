import {articles} from './articles/data';
import {isGlobalArticle} from '../lib/editorial-scope';
import {publicSitemap} from '../lib/public-sitemap.mjs';

// Discovery output does not change media preparation inputs.
// Regenerated with each publication deploy. No invented last-modified dates.
export default function sitemap() {
  return publicSitemap(articles, isGlobalArticle);
}
