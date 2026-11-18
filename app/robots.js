import {SITE_ORIGIN} from '../lib/public-sitemap.mjs';

export default function robots() {
  return {
    rules: {userAgent: '*', allow: '/'},
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
