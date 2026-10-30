import { parseDocument } from "htmlparser2";
export function safeLink(value) {
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
export function richNodes(html) {
  const convert = (n) => {
    if (n.type === "text") return { text: n.data };
    if (
      n.type !== "tag" ||
      !["a", "em", "strong", "small", "span", "br", "b", "i"].includes(n.name)
    )
      throw Error("Unsupported reader HTML");
    if (
      Object.keys(n.attribs || {}).some(
        (k) => !["href", "target", "rel", "class"].includes(k),
      )
    )
      throw Error("Unsupported reader HTML attribute");
    if (n.name === "br") return { text: "\n" };
    const node = { kind: n.name, children: (n.children || []).map(convert) };
    if (n.name === "a") {
      node.url = safeLink(n.attribs.href);
      if (!node.url) throw Error("Unsupported reader link");
    }
    return node;
  };
  return parseDocument(html, { decodeEntities: true }).children.map(convert);
}
export function blocks(body) {
  return body.map((item, index) => {
    const id = `block-${index}`;
    if (typeof item === "string") return { id, type: "paragraph", text: item };
    if (item.type === "rich") {
      if (/^<span class="maudeBlitzLead">[^<>]+<\/span>$/.test(item.html))
        return {
          id,
          type: "statistic",
          text: item.html.replace(/<[^>]*>/g, ""),
        };
      return { id, type: "rich", nodes: richNodes(item.html) };
    }
    if (item.type === "youtube" && /^[\w-]{11}$/.test(item.id))
      return {
        id,
        type: "external",
        title: item.title || "YouTube clip",
        url: `https://www.youtube.com/watch?v=${item.id}`,
        offline: false,
      };
    if (item.type === "xclip" && /^\d+$/.test(item.id))
      return {
        id,
        type: "xclip",
        tweetId: item.id,
        url: item.url || `https://x.com/i/status/${item.id}`,
      };
    if (item.type === "heading")
      return { id, type: "heading", text: item.text };
    if (item.type === "break") return { id, type: "break" };
    if (item.type === "image")
      return {
        id,
        type: "image",
        src: item.src,
        alt: item.alt || "",
        caption: item.caption || "",
        credit: item.credit || null,
        aspectRatio: item.aspectRatio || null,
        objectPosition: item.objectPosition || null,
      };
    throw Error(`Unsupported reader block ${index}: ${item.type}`);
  });
}
