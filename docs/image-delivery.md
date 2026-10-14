# Editorial image delivery

Run `npm run assets:images` when adding editorial photos or posters. The production build also runs it. It discovers checked-in public image sources, creates 320/640/1280px WebP variants and a tiny preview, and writes `lib/generated/image-manifest.json`. Commit the manifest and `public/images/cache` files so previously published images do not depend on upstream availability during later builds. To replace an upstream image at the same URL, run `npm run assets:images -- --refresh`; filenames are hashes of image bytes, so readers receive the replacement without clearing caches. Local originals are checked each run.

Use `ResilientImage` for image elements (supply `sizes` for small thumbnails and `loading="eager"` for the leading image). Use `imageSrc` for posters and `imageBackground` for background photos. The build also localizes legacy CSS background URLs. Preserve original photo credits. Sources that cannot be downloaded retain their original URL; the image component shows the branded fallback on failure.

The PWA caches only same-origin image responses in a shared, stable cache, separate from application-version caches. Content-hashed images are cache-first. Other static images revalidate after seven days. The image cache is capped at 180 entries, and cache-write failures cannot block rendering. API requests, management paths, video, and cross-origin requests are excluded. No live-data freshness policy is changed.

ImageWarmup loads up to six images sequentially per pass, prioritizing three Culture images for tab switches. It respects Save-Data and 2G, runs at low fetch priority, and never warms video or API data. Visible images are promoted using IntersectionObserver. Browsers may still evict site storage; this is an optimization rather than a guarantee of offline availability.

Verification: `node --test tests/image-cache.test.mjs tests/production-release-rules.test.mjs tests/global-routing-completeness.test.mjs`, then `npx next build`. Check Home → Culture → Home in `?app-preview=1`, and the archive. Test iOS installed-PWA cold and warm navigation separately when a device is available.
