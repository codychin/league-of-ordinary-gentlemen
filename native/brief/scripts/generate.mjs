import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const result = await build({
  entryPoints: [`${root}scripts/source.mjs`],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const { feed } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
await mkdir(`${root}src/generated`, { recursive: true });
await writeFile(
  `${root}src/generated/feed.json`,
  JSON.stringify(feed, null, 2) + "\n",
);
console.log(
  `Content v${feed.version}: ${feed.cards.length} global cards, ${feed.reader.blocks.length} reader blocks, ${feed.watch.length} approved videos`,
);
