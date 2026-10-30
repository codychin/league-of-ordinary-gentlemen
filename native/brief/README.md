# The Brief native reader exploration

Isolated Expo / React Native prototype, based on main `069de32`. No changes to the website, workflows, publishing source, services or credentials. No WebView. Not ready for distribution.

## Run

Requires Node 22.13+ (verified here with 24.19), npm and a full repository checkout.

```sh
cd native/brief
npm ci
npm test
npm start
# Optional browser preview, not native validation:
npm run web
# Compile JS/Hermes bundles for all platforms:
npm run export
```

SDK 58.0.21, React Native 0.88.1 and React 19.3.0. Dependencies selected from Expo's bundled compatibility manifest. Network compatibility lookup was blocked in the executor; `EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1` allowed local bundling. Ordinary developer environments should use the commands above normally.

## What is implemented

- Cream/red/serif front page and one full native article: **On the Saturation Bombing of Daniel Jones (née Dimes)**. Canonical text, metadata, photograph credit, italic spans and large statistic; YouTube opens its source online.
- The Crates: 39 global story cards, search and topic filters from existing editorial assignments. Only the demanding sample article opens in the native reader. Other cards clearly open the website; this avoids silently flattening unsupported story-specific HTML.
- Watch: five existing globally approved videos from the existing Watch collection. One selected `expo-video` player at a time, native controls, fullscreen and error state. Switching tabs unmounts playback. Smooth playback is a device QA goal, not a verified result.
- Reading position saved locally on drag/momentum end and Back, scoped to global/article/version. This is an initial pixel-offset implementation; exact restoration across font-size/layout changes and app termination still needs work.

## Content contract v1

`scripts/source.mjs` imports the existing canonical articles, editorial allowlist, Crates mapper and Watch collection. esbuild resolves the site's extensionless imports at generation time. The app imports only the generated **public projection**, not all canonical source files. `src/generated/feed.json` is ignored and regenerated before start, tests and export. Never hand-edit article copies.

`src/contract.mjs` emits version, global scope, metadata cards, one supported reader body and global videos. Unknown slugs fail closed through the existing allowlist. Explicit league/edition metadata, non-global scope, drafts and withdrawn approval are excluded even if a slug is allowlisted. Unknown reader HTML throws instead of silently losing copy. Tests mutate a fixture in the canonical-input shape to prove a correction propagates without a second edit; published writing is untouched.

This is a **build-time adapter**, not a live publishing API. Copy corrections appear on regeneration/rebuild. A later read-only delivery endpoint, version validation, refresh and withdrawal semantics need design and approval before live distribution. Future league feeds require authenticated server authorization; passing a league ID is not authorization. No league content is bundled here.

## Offline boundary

Only this reader's own text is bundled. Images and videos are remote and have error/fallback states. No media downloads, no YouTube/X caching, no claim of complete offline reading. Next offline milestone: explicit save/remove for owned text and approved owned imagery, with version/withdrawal handling and storage limits. Do not infer ownership from a media URL.

## Verification and next Mac handoff

Container checks: six adapter tests; existing five Crates tests; Metro/Hermes export for iOS, Android and web. Bundling is not an installed native build. No screenshots: Playwright Chromium download was blocked by network policy (`cdn.playwright.dev`, 403 Domain forbidden). No browser or native runtime QA completed.

On an authorized Mac with Xcode 26.4+, iOS 16.4+ simulator and Node:

1. Check out this branch, run the setup above, then `npx expo run:ios` to compile and launch locally. No paid cloud build required. Simulator doesn't require Apple Developer membership.
2. Verify photo framing/credit, title wrapping, serif fallback, large text accessibility and safe areas on small and large iPhones.
3. Open the native article, scroll beyond the statistic, Back, reopen and confirm position. Test after app background/restart; document remaining restoration gaps.
4. Search Crates, combine topic filters, test empty state, open a website-only story and return.
5. Play/pause/seek/fullscreen each Watch video; switch tabs and confirm playback stops. Test slow/offline media errors and returning online. Check source links and VoiceOver focus/labels.
6. Recheck article text after a fixture-only content correction and regenerate; no approved copy edits.

Smallest next milestone: this native simulator review, then improve navigation/position lifecycle and adapt a second rich article. Apple enrollment remains needed for the planned physical-iPhone/TestFlight distribution route. Do not rely on App Store Expo Go for SDK 58 or downgrade to avoid enrollment.

Official references checked 2026-10-30:
- https://docs.expo.dev/versions/latest/ (SDK/RN/React/Node/Xcode matrix)
- https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/ (App Store Expo Go SDK 54 limitation; SDK 55+ TestFlight route)
- https://docs.expo.dev/get-started/set-up-your-environment/?device=simulated&mode=expo-go&platform=ios (Mac/Xcode simulator setup)
