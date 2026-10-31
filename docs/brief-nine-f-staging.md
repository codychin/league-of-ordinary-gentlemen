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
decks 17/24 and article prose 19/28, uppercase categories 14 bold, bylines 14 bold, section
headings 20 bold without tracking, and story links 14 regular with 44px action areas. Section labels
have a 40px red rule; story links are red without underlines. Article internal
subheadings retain title case in 9F at 26–34px, above the 19px prose. Desktop headlines
retain their larger established hierarchy. Editorial colors are paper
#F5F1E8, ink #26241F, red #A43D31, muted #756E63. Mobile content margins are
20px. Header/navigation retain their existing sizes, fonts, palette, icons,
structure and behavior. Media, article order and factual prose are unchanged;
the redundant home LEAD STORY text and short red accent are removed. Homepage bylines now include
the existing correspondent-role metadata beside the original portraits.
Share controls, author roles and dark photo-caption plaques remain present
and are checked in the browser suite. Option 3 removes decorative hero and
carousel rules, including card dividers. Production card widths (82% mobile),
16px mobile gutters and 150px image heights are preserved. Equal-height flex
cards push Read footers to a shared bottom edge without truncating titles or decks. Jay-Z uses the canonical top focal position
to preserve his head. Sharing is a compact inline control beside the writer
row, with native share and explicit Copy Link, Facebook, X, WhatsApp and Email
fallback options. No destination is posted to automatically.

Run `qa/tests/typography.spec.mjs` and `qa/tests/system-a.spec.mjs` and `qa/tests/article-share.spec.mjs` against an
explicit local or preview origin. They check served font hashes, computed
roles, the long née headline, headline/document overflow and functional font
isolation. Share tests mock native success/cancel/failure and clipboard access;
external comments are stubbed to isolate typography from cloud network limits. Local Yahoo home/Crates verification can be blocked by data-host
DNS; do not describe shared-reader checks as full all-edition verification.

This branch is a dedicated preview only. No production promotion or shared
staging alias reassignment is included. Protected deployed visual QA is
performed separately in the owner's existing authenticated browser; no new
public share link is authorized.

Option 3 adds a scoped open-paper homepage lead/carousel treatment. Decorative
hero/carousel rules and the preceding weekly shelf's bottom separator are removed;
header/navigation/table borders, focus outlines and player controls remain intact.
The desktop lead uses a 28px gutter, top-aligned image/category and the reference
612:488 top-focused image proportion. Publication date moves into the existing
writer treatment. All three full canonical carousel stories and bottom-aligned
Read footers remain. Mobile stacks image and copy without clipping or fixed heights.
