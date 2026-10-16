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

## Editorial taste calibration — October 16, 2026

**Positive user-supplied benchmark 001:** Image of Tesla Roadsters doing airborne flips *along the descending Tesla stock-price chart*. The original visual joke fuses the company's actual financial performance with the launch demonstration's distinctive physical behavior. It has a second layer: the brand spectacle and market reaction are simultaneously represented by the very same trajectory. No explanatory caption needed.

**Positive benchmark leads, awaiting inspection:** https://x.com/TraderFrankk/status/2111074395787522512 and https://x.com/cyber_humanoid/status/2111183769814384751 . These were explicitly nominated by the editor, but the content of either linked tweet could not be inspected. **Do not invent descriptions or treat them as verified posts.** Request a screenshot, or revisit when direct source access works.

**Middling example:** A police officer loses the ability to conduct a routine traffic stop when the suspect's car can leave vertically; somewhat surprising situational consequence, but only one conceptual step.

**Negative baseline:** flying-car insurance confusion, traffic signs, spilled coffee, generic crash jokes. These are immediate and predictable first-order consequences, not intellectually distinctive material. Do not surface these as 'best of the best' merely because they appear in press roundups.

### Higher-bar selection criteria

- **Collision of systems:** two independent real-world frames unexpectedly interact (markets + vehicle acrobatics; bureaucracy + physics; prestige + farce).
- **Specificity:** a real detail is *necessary* to the joke; could not swap in any trending gadget without losing it.
- **Compression:** the premise and punchline work together without setup or assistant explanation.
- **Reversal or contradiction:** the image/post subverts its source material, not just adds a common mishap.
- **Freshness and provenance:** find primary creator, original date, link and actual media; do not claim verification from an inaccessible X link.
- **Density:** prioritize 3 genuinely strong finds over 10 serviceable ones.

Score each *verified* find 0–3 on collision, specificity, compression and reversal; require at least 9/12 to label an editorial standout. This is a provisional editorial heuristic, not an automated measure of humor. Human editor approval and counterexamples override the score.

For every review round, retain editor feedback in a dated positive/middling/negative example bank, adjust the rubric when a pattern emerges, and compare the next selection against this benchmark rather than chasing viral engagement alone.
