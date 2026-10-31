# 9F and System A web staging typography

The exact selected face is `public/fonts/brief-nine-f/BriefNineFNativePreview-Bold.ttf`
(112,048 bytes; SHA-256 `817547b982bd922aff2d243f844ccb7094aded860940441faf829c867961bdd3`).
It is an OFL derivative of Libre Baskerville Bold, not a renamed stock face.
The original license, copyright and supplied provenance manifest accompany it.
The source TTF is served directly: no outline, spacing or naming conversion.

The subsequent System A selection expands editorial content typography while
preserving the existing header and navigation. `app/system-a.css` scopes roles
to explicitly marked editorial containers, leaving controls and navigation
outside those font rules. Supporting Liberation Sans 2.1.5 Regular 400 and
Bold 700 assets, copyright and OFL are in `public/fonts/liberation-sans`.
Their hashes are verified in the browser tests. No synthetic bold is used.

Mobile editorial roles: 9F headlines 31/35 and cards 23/26; Liberation Sans
body/decks 17/24, uppercase categories 14 regular, bylines 14 bold, section
headings 20 bold without tracking, and story links 16 bold. Section labels
have a 40px red rule; story links have a 112px ink rule. Desktop headlines
retain their larger established hierarchy. Editorial colors are paper
#F5F1E8, ink #26241F, red #A43D31, muted #756E63. Mobile content margins are
20px. Header/navigation retain their existing sizes, fonts, palette, icons,
structure and behavior. Media, article order and factual prose are unchanged;
only the redundant lead label is shortened to LEAD STORY.

Run `qa/tests/typography.spec.mjs` and `qa/tests/system-a.spec.mjs` against an
explicit local or preview origin. They check served font hashes, computed
roles, the long née headline, headline/document overflow and functional font
isolation. Local Yahoo home/Crates verification can be blocked by data-host
DNS; do not describe shared-reader checks as full all-edition verification.

This branch is a dedicated preview only. No production promotion or shared
staging alias reassignment is included. Protected deployed visual QA is
performed separately in the owner's existing authenticated browser; no new
public share link is authorized.
