import {createHash} from 'node:crypto';
// Even published legacy slugs can contain private league nicknames. Never emit them.
export const articleAnalyticsId = slug => 'article_' + createHash('sha256').update('brief-article-v1:' + slug).digest('hex').slice(0,24);
