export type Theme = {
  accent: string; // brand / button color (brass)
  dark: string; // dark text / footer (ink)
  bg: string; // page background (ivory)
  font: "default" | "cairo";
};

export const DEFAULT_THEME: Theme = { accent: "#a97c3f", dark: "#1b1a17", bg: "#faf6ef", font: "default" };

const hex = /^#[0-9a-fA-F]{6}$/;

export function sanitizeTheme(t: Partial<Theme> | null | undefined): Theme {
  return {
    accent: t?.accent && hex.test(t.accent) ? t.accent : DEFAULT_THEME.accent,
    dark: t?.dark && hex.test(t.dark) ? t.dark : DEFAULT_THEME.dark,
    bg: t?.bg && hex.test(t.bg) ? t.bg : DEFAULT_THEME.bg,
    font: t?.font === "cairo" ? "cairo" : "default",
  };
}

function mix(a: string, b: string, w: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const m = pa.map((v, i) => Math.round(v * (1 - w) + pb[i] * w));
  return `#${m.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** CSS that overrides the design tokens at runtime (only emitted when the owner changed something). */
export function themeCss(t: Theme) {
  if (JSON.stringify(t) === JSON.stringify(DEFAULT_THEME)) return "";
  const rules = [
    `--color-brass:${t.accent}`,
    `--color-brass-light:${mix(t.accent, "#ffffff", 0.25)}`,
    `--color-brass-dark:${mix(t.accent, "#000000", 0.25)}`,
    `--color-ink:${t.dark}`,
    `--color-charcoal:${mix(t.dark, "#ffffff", 0.12)}`,
    `--color-ivory:${t.bg}`,
    `--color-sand:${mix(t.bg, t.accent, 0.1)}`,
    `--color-stone-warm:${mix(t.bg, t.accent, 0.2)}`,
  ];
  if (t.font === "cairo") rules.push(`--font-display:var(--font-cairo)`, `--font-body:var(--font-cairo)`);
  return `html[dir]{${rules.join(";")}}`;
}
