# 9F web staging typography

The exact selected face is `public/fonts/brief-nine-f/BriefNineFNativePreview-Bold.ttf`
(112,048 bytes; SHA-256 `817547b982bd922aff2d243f844ccb7094aded860940441faf829c867961bdd3`).
It is an OFL derivative of Libre Baskerville Bold, not a renamed stock face.
The original license, copyright and supplied provenance manifest accompany it.
The source TTF is served directly: no outline, spacing or naming conversion.

`app/typography.css` scopes the true 700 face to publication mastheads, article
reader titles and headings inside article links, including the Crates cards.
Synthetic weight/style are disabled. A 1.12 line box and 90%/22% ascent/descent
metrics keep the taller face inside its headline containers. Existing type sizes, spacing,
content, labels, controls and body fonts remain unchanged. Two inline Georgia
overrides on edition-local headlines are removed in favor of the same face.
Crates section titles and empty-state headings remain UI typography.

Run `qa/tests/typography.spec.mjs` against an explicit local or preview origin.
It checks all three edition homes, the Daniel Jones article (including née),
and Crates at the configured desktop and mobile widths; checks exact served
font bytes, computed face/weight/synthesis, headline and document overflow,
and body/label font isolation. Viewport screenshots are attached for visual
inspection. Browser tests do not themselves establish deployment identity.

This branch is for a dedicated preview only. No production promotion or shared
staging alias reassignment is part of the typography change.
