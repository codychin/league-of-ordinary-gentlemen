# The Brief native prototype

Expo SDK 58 / React Native prototype, isolated under `native/brief`. Production content and site are unchanged. This is a global reader, with no connected league and no signing or distribution setup.

## Run

Requires Node 22.13+ (local Mac verified with workspace-only Node 24.19), npm and the full repository checkout.

```sh
cd native/brief
npm ci
npm test
npm start
npx expo start --go --ios --localhost
npm run export
```

The installed SDK 58 simulator Expo Go client runs on the authorized Mac with Xcode 27.2 and iOS 27.2. This is native simulator execution, not a standalone build or physical-device check. Standalone `expo run:ios` was blocked by CocoaPods installation against system Ruby 2.6's missing SDK headers. No global Ruby/configuration changes were made. Apple enrollment is still needed for the planned TestFlight distribution route.

## Implemented

- Canonical Home placement extracted from SharedEditorialFront: Detroit lead, Daniel Jones / Jay-Z / Sporting Pat carousel, remaining features in author-controlled order, Dashiell video and global dispatch shelf. No date sorting or demo subset.
- All 39 globally eligible articles open in the native reader. Paragraphs, emphasis, rich links, headings, images, captions, credits, receipts, source references and the DJ statistic are preserved. Unknown blocks or executable HTML fail generation rather than disappear.
- Third-party YouTube/X/Instagram media opens in an isolated in-app provider WebView; full articles and app navigation are native. These online embeds remain subject to provider restrictions and need individual playback QA.
- Five approved global videos have visible posters, native controls, loading/error states and natural-aspect playback. League-only Watch entries and matchup videos remain excluded.
- Compact black masthead, safe-area-aware spacing and five glass icon tabs. Scores and Teams provide distinct no-league states with working routes into editorial content; league setup is honestly unavailable in this preview.
- Culture is extracted from the curated CultureDesk array, retains global eligibility and source order, uses the dark desk styling and five-story pagination. It is independent of Crates filters. More includes icon-led archive, Watch, staff and corrections routes; staff/corrections use an explicitly labeled in-app browser fallback.
- Appearance follows the device live, with no manual selection. Retired saved appearance overrides are ignored; other saved data is unchanged. Semantic warm-charcoal surfaces and cream text leave media unchanged; Culture remains dark.
- Tab indicator and content/menu fades respect Reduce Motion. Reader position saves on Back, scroll completion and background. Restoration remains pixel-based, not revision/layout/font-size aware.

## Data and offline boundary

Generated public feed is ignored and recreated from canonical source before start/tests/export. Full article text is bundled; images and video remain remote. This is not a media-download feature or fully offline experience. Runtime refresh accepts existing-inventory corrections only, validates the complete model and preserves bundled/cached content on failure. The trusted loopback fixture is the only configured delivery route; there is no hosted publishing API, revision-order protocol or withdrawal handling. Before hosting, constrain endpoints/media origins, add bounded response streaming and define revisions/withdrawals. Client global filtering is not server authorization.

## Verification

Mac automated checks: 22 tests cover canonical bodies, curated placement, global eligibility, rich text safety, correction-only runtime boundaries, loopback refresh/cache/failure/concurrency. iOS Hermes export passed after the parity and visual refinements. Those checks do not prove UX.

Actual simulator observations: corrected Home lead/header/icon bar; dark curated Culture first page; icon-led More; visible Watch posters. User interaction repeatedly interrupted automated taps, so video play/pause/seek/fullscreen, reading restoration, dynamic type, third-party embeds and live fixture repaint/offline restart are still acceptance work. Keep the preview available during user review. Do not report these pending interactions as passed.

## Native runtime-refresh handoff (local fixture only)

On the authorized Mac, before starting Metro or building the development app:

```sh
cd native/brief
printf '%s\n' '[LOCAL FIXTURE A] Original fixture paragraph.' > /tmp/brief-correction.txt
node scripts/fixture-server.mjs /tmp/brief-correction.txt
# Separate terminal, same directory:
EXPO_PUBLIC_BRIEF_CONTENT_URL=http://127.0.0.1:8787/content npm start
# Launch a compatible simulator client, or compile locally in another terminal:
EXPO_PUBLIC_BRIEF_CONTENT_URL=http://127.0.0.1:8787/content npx expo run:ios
```

The fixture server binds only to loopback and derives each response from a memory copy of canonical content; the only replacement is the first paragraph read from the temporary fixture file. It does not edit approved writing. iOS Simulator can access its host Mac's loopback; this URL is not a physical-device or hosted endpoint. If the native development client's transport policy blocks HTTP loopback, report it; do not change production transport/security settings.

1. Tap Refresh stories, open the native reader and verify the LOCAL FIXTURE A paragraph.
2. Replace the temporary file with `[LOCAL FIXTURE B] Corrected fixture paragraph.` while leaving Metro, the simulator and server running. Back → Refresh stories → reopen. Verify B without rebuilding/restarting the app.
3. Stop the fixture server. Refresh must retain B and show the retained-content notice. Restart the app offline and confirm validated cached B remains.
4. Clear this prototype's simulator app data after the fixture exercise so fixture writing is not mistaken for approved content. Remove the environment override for normal bundled review.

The HTTP test proves the running **model**, not native screen repaint, physical-device networking or simulator storage behavior. Those checks remain pending Mac access. The planned hosted source must provide complete authorized global snapshots and an explicit revision/withdrawal policy before production use; nothing here claims live publishing parity.


The fixture's HTTP tests prove the model refresh, not simulator repaint or persistent storage behavior. The duplicate DJ `reader` alias is retained for the original fixture contract; the other complete articles are in `readers`.

## Custom direction-07 type prototype

The original The Brief Seven Medium TTF is bundled under assets/fonts with its provenance note. SHA256 b7a72a5c97ecb562b55aa38c07ad6469f0b50c293789aabfb6da089f0397943e; Library libfile_ac1abecbf06481919e7fde83876ed493 version 0. Runtime expo-font loading works in Expo Go; registration is versioned to avoid stale font caching. The existing installed/locked expo-font package is now declared directly; no package installation is needed.

All app-owned Text and TextInput use the single Medium 500 master while retaining existing sizes, line heights, spacing, colors and accessibility scaling. SVG navigation and PNG branding are unchanged. Authored strong/em remain temporary renderer-synthesized bold/oblique; no designed Bold/Italic face is claimed. Provider embeds and OS-owned playback controls retain their own fonts. Font loading has a spinner and explicit retry error gate rather than silently displaying another typeface. Error-gate text deliberately uses the system font so a broken font cannot hide recovery controls.

This is an original prototype, not a finished professionally hinted family. Small 8–11pt labels, optical spacing, synthetic emphasis, line clipping and large accessibility text require native visual assessment. Typography may reflow despite unchanged layout values.

Native font QA (2026-10-31): Expo logged the versioned custom family as loaded. Actual iPhone 18 Pro simulator screens checked: Home, Detroit reader, Crates/search placeholder and the long Daniel Jones title with née, More, and cream-on-dark Culture. No obvious clipping at the observed default text size; 8–11pt labels look delicate and are not an accessibility acceptance pass. User interaction interrupted further navigation. Watch typography, full OS-dark mode, enlarged Dynamic Type, interactive search entry and synthetic emphasis still require visual verification. All 25 automated tests and iOS/Android/web exports passed; the font cmap includes every current feed and literal UI character. No production changes.
