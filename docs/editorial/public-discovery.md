# The Brief — Public-source cultural discovery (no paid APIs)

This is an **editorial research aid**, not an X scraper, a live X timeline, or an autopublisher.

## Run

From the repository, with Node 20+:

```sh
node scripts/editorial/discover.mjs "Tesla Roadster" > roadster-leads.md
node --test tests/editorial-discovery.test.mjs
```

The script uses publicly available Google News RSS searches in four categories (meme coverage, social reactions, videos and community coverage). It also produces direct X Latest, X Media, Reddit and Google News search links for **manual review**. No X developer account, OAuth, social logins, vendor API keys, subscriptions or added npm packages are required.

## Editorial workflow

1. Pick a specific phenomenon or phrase, ideally when it begins trending.
2. Run the command and review links. A lead is **not** proof that an original post exists or is funny.
3. Follow the original tweet/post/clip; record its canonical URL and creator attribution, original publication date, visual and joke context.
4. Reject recycled material, generic reactions, roundups without primary links, dead embeds, unsourced engagement counts and jokes already made by the article.
5. Editorially score each verified original for original premise, visual payoff, unexpected specificity, relevance to The Brief, provenance and freshness.
6. Pitch the strongest 3–7 with source links to the appropriate desk; stage only after editorial approval. Follow existing release QA and explicit production promotion.

Suggested persona allocation: Marnie for cultural absurdity and meme grammar; Hollis for institutional contradictions; Conrad for prestige, ownership and power; Maude for sports mechanisms. Do not force sports tie-ins.

## Limitations and safeguards

- **No comprehensive X coverage.** Search providers index an unknown subset of posts; Google News surfaces *coverage* and may return duplicate or rewritten links.
- **No unattended publishing.** Output is printed to stdout. Nothing posts to any site or writes to the newsroom database.
- **No secret tokens.** Do not paste X keys into prompts, commits or files. There are no credential hooks in this script.
- **No guaranteed zero infrastructure bill.** The script has no paid API calls and no extra dependencies, but execution on an existing billed CI or hosting platform may count toward its normal usage. Run locally first.
- **No false claims of verification.** An RSS lead or X search link never establishes the contents, popularity or identity of an X post.
- **Graceful source outages.** Individual failed feeds are reported; surviving sources still produce leads.
- **No automated runs yet.** Schedule only after measuring utility and explicitly confirming the hosting/execution budget and scope.

## Next integration step (separate change)

If this prototype proves valuable, connect its *verified, manually approved* leads to a newsroom review queue in staging. Preserve existing multi-league canon and do not auto-post to production.
