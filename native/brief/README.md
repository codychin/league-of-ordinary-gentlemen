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

The adapter seeds a bundled snapshot. The app now also accepts **runtime corrections** through `src/content-store.mjs`, explicitly configured with `EXPO_PUBLIC_BRIEF_CONTENT_URL`. No URL is configured by default and no hosted endpoint was deployed. Refresh stories requests a complete snapshot, validates schema version 1, global scope, required fields, reader block types and the existing card/video inventory, persists it locally, then atomically replaces the model. Failed HTTP, timeout, malformed/partial data, invalid cache and cache-write errors retain good content. Concurrent loads are serialized. Startup restores a validated last-good snapshot or keeps the bundle. Cache keys include the configured source URL, so local fixture corrections do not populate the normal unconfigured app cache. A later hosted read-only delivery endpoint and withdrawal semantics need design and approval before live distribution. This correction-only contract intentionally rejects inventory/block changes and new media URLs; it does not yet handle additions, deletions or revocations. It cannot detect an otherwise valid but stale response; source revisions/ordering are a next contract decision. Client scope validation is defense in depth, not a replacement for server authorization. Future league feeds require authenticated server authorization; passing a league ID is not authorization. No league content is bundled here.

## Offline boundary

Only this reader's own text is bundled. Images and videos are remote and have error/fallback states. No media downloads, no YouTube/X caching, no claim of complete offline reading. Next offline milestone: explicit save/remove for owned text and approved owned imagery, with version/withdrawal handling and storage limits. Do not infer ownership from a media URL.

## Verification and next Mac handoff

Container checks: eleven adapter/runtime tests (including an actual loopback HTTP source correction, persistent-cache restart, malformed/partial/wrong-scope responses, network/HTTP/cache failure, timeout and concurrency); existing five Crates tests; Metro/Hermes export for iOS, Android and web. Bundling is not an installed native build. No screenshots: Playwright Chromium download was blocked by network policy (`cdn.playwright.dev`, 403 Domain forbidden). No browser or native runtime QA completed.

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
