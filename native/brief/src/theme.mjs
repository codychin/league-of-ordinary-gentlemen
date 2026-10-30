export const themes = {
  light: {
    canvas: "#f3efe5",
    text: "#211e1a",
    muted: "#625c52",
    accent: "#92342b",
    surface: "#e8e0d2",
    border: "#c9c1b4",
    glass: "rgba(239,234,224,.5)",
    selection: "rgba(255,255,255,.58)",
  },
  dark: {
    canvas: "#201e1a",
    text: "#f3efe5",
    muted: "#c3bbaf",
    accent: "#df8175",
    surface: "#36322c",
    border: "#70685b",
    glass: "rgba(38,35,30,.85)",
    selection: "#484035",
  },
};
export function resolveAppearance(system) {
  return system === "dark" ? "dark" : "light";
}
// Role-based overrides leave media, permanent black chrome and Culture colors untouched.
export function themedStyles(base, p) {
  const s = { ...base };
  const apply = (keys, values) =>
    keys.forEach((k) => {
      s[k] = { ...base[k], ...values };
    });
  apply(
    [
      "headline",
      "leadHeadline",
      "title",
      "byline",
      "body",
      "sectionHeading",
      "menuTitle",
    ],
    { color: p.text },
  );
  apply(["dek", "note"], { color: p.muted });
  apply(["eyebrow", "read", "link", "stat"], { color: p.accent });
  apply(
    ["story", "flag", "receipt", "embedCard", "search", "moreRow", "primary"],
    { borderColor: p.border },
  );
  apply(["search"], { color: p.text });
  apply(["articleRule"], { backgroundColor: p.border });
  apply(["emptyIcon", "menuIcon"], { backgroundColor: p.surface });
  apply(["nav"], { backgroundColor: p.glass, borderColor: p.border });
  apply(["glider"], { backgroundColor: p.selection, borderColor: p.border });
  apply(["flag"], { borderColor: p.text });
  return s;
}
