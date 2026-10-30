import test from "node:test";
import assert from "node:assert/strict";
import { themes, resolveAppearance, themedStyles } from "../src/theme.mjs";
test("appearance follows live OS values with a light fallback", () => {
  for (const system of ["dark", "light", null, undefined]) {
    assert.equal(
      resolveAppearance(system),
      system === "dark" ? "dark" : "light",
    );
  }
});
function luminance(hex) {
  const c = hex
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
}
test("semantic text and accent colors meet normal-text contrast on both canvas and controls", () => {
  for (const p of Object.values(themes))
    for (const foreground of ["text", "muted", "accent"])
      for (const surface of ["canvas", "surface"]) {
        const a = luminance(p[foreground]),
          b = luminance(p[surface]);
        assert.ok(
          (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5,
          `${foreground} on ${surface}`,
        );
      }
  const base = {
    header: { backgroundColor: "#11100e" },
    videoCard: { backgroundColor: "#111" },
    cream: { color: "#f3efe5" },
  };
  const dark = themedStyles(base, themes.dark);
  assert.deepEqual(dark.header, base.header);
  assert.deepEqual(dark.videoCard, base.videoCard);
  assert.deepEqual(dark.cream, base.cream);
});
