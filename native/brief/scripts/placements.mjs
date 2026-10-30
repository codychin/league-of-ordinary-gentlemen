import { readFileSync } from "node:fs";
import { parse } from "@babel/parser";
import { resolve } from "node:path";
const source = readFileSync(
  resolve(process.cwd(), "../../app/components/SharedEditorialFront.js"),
  "utf8",
);
const tree = parse(source, { sourceType: "module", plugins: ["jsx"] });
function walk(node, fn) {
  if (!node || typeof node !== "object") return;
  fn(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((x) => walk(x, fn));
    else if (value && typeof value === "object") walk(value, fn);
  }
}
function excerpt(n) {
  return source.slice(n.start, n.end);
}
// Placement is authored in the shared website JSX, not in article timestamps.
export const placements = [];
walk(tree, (node) => {
  if (node.type !== "JSXElement" || node.openingElement.name.name !== "section")
    return;
  const raw = excerpt(node);
  const slugs = [...raw.matchAll(/\/articles\/([a-z0-9-]+)/g)].map((x) => x[1]);
  const unique = [...new Set(slugs)];
  if (!unique.length) return;
  const kind = raw.includes("className={front.recent}")
    ? "carousel"
    : placements.length === 0
      ? "lead"
      : raw.includes("ON ASSIGNMENT")
        ? "assignment"
        : "feature";
  const cards = unique.map((slug) => {
    const start = raw.indexOf("/articles/" + slug);
    const tail = raw.slice(start);
    const direct = tail.match(/src="([^\"]+)"/);
    const bg = tail.match(/imageBackground\('([^']+)'/);
    const image =
      direct && (!bg || direct.index < bg.index) ? direct[1] : bg?.[1];
    return { slug, ...(image ? { image } : {}) };
  });
  placements.push({ kind, cards });
});
if (
  placements[0]?.kind !== "lead" ||
  !placements.some((x) => x.kind === "carousel")
)
  throw Error("Unsupported website placement structure");

const cultureSource = readFileSync(
  resolve(process.cwd(), "../../app/components/CultureDesk.jsx"),
  "utf8",
);
const cultureTree = parse(cultureSource, {
  sourceType: "module",
  plugins: ["jsx"],
});
export const culturePlacements = [];
walk(cultureTree, (node) => {
  if (node.type !== "VariableDeclarator" || node.id.name !== "stories") return;
  for (const entry of node.init.elements) {
    const card = {};
    for (const prop of entry.properties) {
      if (
        ["slug", "image", "tag", "title", "dek", "read", "photoClass"].includes(
          prop.key.name,
        ) &&
        prop.value.type === "StringLiteral"
      )
        card[prop.key.name] = prop.value.value;
      if (prop.key.name === "editions") card.editionOnly = true;
    }
    if (card.slug && !card.editionOnly) culturePlacements.push(card);
  }
});
