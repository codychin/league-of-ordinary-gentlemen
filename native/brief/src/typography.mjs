export const FONT_FAMILY = "TheBriefSevenMedium_b7a72a5c";
export const FONT_SHA256 =
  "b7a72a5c97ecb562b55aa38c07ad6469f0b50c293789aabfb6da089f0397943e";
// Only the supplied Medium master exists. Authored strong/em are temporary
// platform-synthesized bold/oblique, not additional designed font faces.
export function fontStyle(style = {}, strong = false) {
  const { fontFamily, fontWeight, ...layout } = style;
  return {
    ...layout,
    fontFamily: FONT_FAMILY,
    fontWeight: strong ? "700" : "500",
  };
}

export async function loadTypeface(loader, source, isLoaded) {
  await loader({ [FONT_FAMILY]: source });
  if (!isLoaded(FONT_FAMILY)) throw Error("Custom font registration failed");
}
