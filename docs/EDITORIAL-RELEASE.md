# Editorial release contract

Build success is not publication. Release is COMPLETE only when all these conditions are recorded:

1. Stage exact commit, run `npm test` and `npm run build`, and run browser QA on mobile and desktop for changed surfaces.
2. Run `BASE_URL=https://<preview> node scripts/operations/smoke-release.mjs` against the staged preview. Verify images load and external media plays in the browser. A passing HTML smoke test does **not** prove playback.
3. Explicitly promote approved commit to production. Check the alias for `www.ordinarybrief.com` points to the intended deployment ID and SHA, not just READY state.
4. Run the same smoke script against `https://www.ordinarybrief.com` and exercise changed pages in the real browser. If check fails, hold announcement, restore previous alias, investigate.
5. Record tested URL, commit, deployment ID, alias ID, HTTP checks and manual media/browser checks in release notes.

The workflow `Release verification` can be manually dispatched with a concrete URL and approved commit. It checks rendered HTML and route availability for the three editions. This is **not** yet a mandatory GitHub protected-branch check or an automatic Vercel promotion gate; those require repository/production-environment branch protection configuration and integration with the promotion workflow. Never claim this is a fully enforced gate until configured and tested end-to-end.

Retain global editorial story ordering beneath the London feature. Verify every article slug at all three league routes. No iframe playback guarantee from a successful build.
