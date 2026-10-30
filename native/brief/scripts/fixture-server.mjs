import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
const result = await build({
  entryPoints: [
    fileURLToPath(new URL("./fixture-source.mjs", import.meta.url)),
  ],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const { fixtureFeed } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
const correctionPath = process.argv[2];
if (!correctionPath)
  throw new Error(
    "Supply a local fixture text path, e.g. /tmp/brief-correction.txt",
  );
createServer(async (req, res) => {
  if (req.method !== "GET" || req.url !== "/content") {
    res.writeHead(404).end();
    return;
  }
  try {
    const correction = await readFile(correctionPath, "utf8");
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(fixtureFeed(correction.trim())));
  } catch {
    res.writeHead(503).end("Fixture unavailable");
  }
}).listen(8787, "127.0.0.1", () =>
  console.log("Local fixture only: http://127.0.0.1:8787/content"),
);
