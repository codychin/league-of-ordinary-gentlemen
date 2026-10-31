import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parse } from "@babel/parser";
import {
  FONT_SHA256,
  FONT_FAMILY,
  fontStyle,
  loadTypeface,
} from "../src/typography.mjs";
const bytes = readFileSync(
  new URL("../assets/fonts/TheBriefSeven-Medium.ttf", import.meta.url),
);
function cmap() {
  let table;
  for (let i = 0; i < bytes.readUInt16BE(4); i++) {
    const p = 12 + i * 16;
    if (bytes.toString("ascii", p, p + 4) === "cmap")
      table = bytes.readUInt32BE(p + 8);
  }
  assert.ok(table);
  const chars = new Set();
  for (let i = 0; i < bytes.readUInt16BE(table + 2); i++) {
    const p = table + bytes.readUInt32BE(table + 4 + i * 8 + 4),
      format = bytes.readUInt16BE(p);
    if (format !== 4) continue;
    const n = bytes.readUInt16BE(p + 6) / 2,
      end = p + 14,
      start = end + 2 * n + 2,
      delta = start + 2 * n,
      range = delta + 2 * n;
    for (let j = 0; j < n; j++)
      for (
        let c = bytes.readUInt16BE(start + j * 2);
        c <= bytes.readUInt16BE(end + j * 2) && c < 65535;
        c++
      ) {
        const r = bytes.readUInt16BE(range + j * 2),
          d = bytes.readInt16BE(delta + j * 2);
        let glyph = r
          ? bytes.readUInt16BE(
              range + j * 2 + r + 2 * (c - bytes.readUInt16BE(start + j * 2)),
            )
          : c;
        if (!r || glyph) glyph = (glyph + d) & 65535;
        if (glyph) chars.add(c);
      }
  }
  return chars;
}
test("exact approved font covers current content and every literal UI character", () => {
  assert.equal(bytes.length, 33840);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), FONT_SHA256);
  const chars = cmap(),
    strings = [];
  const feed = JSON.parse(
    readFileSync(new URL("../src/generated/feed.json", import.meta.url)),
  );
  function collect(x) {
    if (typeof x === "string") strings.push(x);
    else if (x && typeof x === "object") Object.values(x).forEach(collect);
  }
  collect(feed);
  const tree = parse(
    readFileSync(new URL("../App.js", import.meta.url), "utf8"),
    { sourceType: "module", plugins: ["jsx"] },
  );
  function visit(x) {
    if (!x || typeof x !== "object") return;
    if (x.type === "StringLiteral" || x.type === "JSXText")
      strings.push(x.value);
    Object.values(x).forEach((v) => {
      if (Array.isArray(v)) v.forEach(visit);
      else if (v && typeof v === "object") visit(v);
    });
  }
  visit(tree);
  const missing = [...new Set(strings.join(""))].filter(
    (c) => c.codePointAt(0) >= 32 && !chars.has(c.codePointAt(0)),
  );
  assert.deepEqual(missing, []);
});
test("single Medium policy preserves geometry, color and authored emphasis", () => {
  const style = {
    fontFamily: "Georgia",
    fontWeight: "800",
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -1,
    color: "#abc",
    fontStyle: "italic",
  };
  assert.deepEqual(fontStyle(style), {
    fontFamily: FONT_FAMILY,
    fontWeight: "500",
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -1,
    color: "#abc",
    fontStyle: "italic",
  });
  assert.equal(fontStyle(style, true).fontWeight, "700");
  assert.equal(style.fontWeight, "800");
});

test("font gate only succeeds after registration and propagates load errors", async () => {
  let map;
  await loadTypeface(
    async (value) => {
      map = value;
    },
    42,
    () => true,
  );
  assert.equal(map[FONT_FAMILY], 42);
  await assert.rejects(
    loadTypeface(
      async () => {
        throw Error("missing asset");
      },
      42,
      () => false,
    ),
    /missing asset/,
  );
  await assert.rejects(
    loadTypeface(
      async () => {},
      42,
      () => false,
    ),
    /registration failed/,
  );
});
