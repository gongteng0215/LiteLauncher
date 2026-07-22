/**
 * Remap hardcoded purple/violet colors in styles-command-center.css
 * to --ll-* theme tokens so Settings → 外观主题 recolors the whole shell.
 */
const fs = require("fs");
const path = require("path");

const filePath = path.join(
  __dirname,
  "..",
  "src",
  "renderer",
  "styles-command-center.css"
);
let css = fs.readFileSync(filePath, "utf8");

const hexMap = [
  [/#070612/gi, "var(--ll-bg)"],
  [/#090719/gi, "var(--ll-bg)"],
  [/#0d0b1d/gi, "var(--ll-surface)"],
  [/#100d22/gi, "var(--ll-surface)"],
  [/#0f0c21/gi, "var(--ll-surface)"],
  [/#111027/gi, "var(--ll-surface-raised)"],
  [/#111025/gi, "var(--ll-surface-raised)"],
  [/#121027/gi, "var(--ll-surface-raised)"],
  [/#141127/gi, "var(--ll-surface-raised)"],
  [/#151127/gi, "var(--ll-surface-input)"],
  [/#17132d/gi, "var(--ll-surface-raised)"],
  [/#18122f/gi, "var(--ll-surface-raised)"],
  [/#19132f/gi, "var(--ll-surface-raised)"],
  [/#1b1535/gi, "var(--ll-surface-raised)"],
  [/#1b1536/gi, "var(--ll-surface-raised)"],
  [/#1b1438/gi, "var(--ll-surface-raised)"],
  [/#1c1032/gi, "var(--ll-surface-raised)"],
  [/#1d1537/gi, "var(--ll-surface-raised)"],
  [/#21133e/gi, "var(--ll-surface-raised)"],
  [/#21153e/gi, "var(--ll-surface-raised)"],
  [/#22163f/gi, "var(--ll-surface-raised)"],
  [/#8e6dff/gi, "var(--ll-accent)"],
  [/#8f5ce9/gi, "var(--ll-accent)"],
  [/#9d63ff/gi, "var(--ll-accent)"],
  [/#9f72e7/gi, "var(--ll-accent)"],
  [/#ab77f7/gi, "var(--ll-accent-soft)"],
  [/#b47bff/gi, "var(--ll-accent-hover)"],
  [/#b88cff/gi, "var(--ll-accent-hover)"],
  [/#b991ff/gi, "var(--ll-accent-soft)"],
  [/#bb8aff/gi, "var(--ll-accent-soft)"],
  [/#c49cff/gi, "var(--ll-accent-soft)"],
  [/#c4a0ff/gi, "var(--ll-accent-soft)"],
  [/#c8bdf0/gi, "var(--ll-text-accent)"],
  [/#c9b6f5/gi, "var(--ll-text-accent)"],
  [/#d5c2ff/gi, "var(--ll-text-accent)"],
  [/#d8c8ff/gi, "var(--ll-text-accent)"],
  [/#d8cff5/gi, "var(--ll-text-accent)"],
  [/#d9d2e8/gi, "var(--ll-text)"],
  [/#d4cee3/gi, "var(--ll-text)"],
  [/#ded4ff/gi, "var(--ll-text-accent)"],
  [/#ddd7ed/gi, "var(--ll-text)"],
  [/#e6e0f4/gi, "var(--ll-text)"],
  [/#e6dff8/gi, "var(--ll-text)"],
  [/#e6d9ff/gi, "var(--ll-text-accent)"],
  [/#eadfff/gi, "var(--ll-text-accent)"],
  [/#eee8ff/gi, "var(--ll-text)"],
  [/#eee7ff/gi, "var(--ll-text)"],
  [/#efe7ff/gi, "var(--ll-text-accent)"],
  [/#f1edff/gi, "var(--ll-text)"],
  [/#f3e8ff/gi, "var(--ll-text-accent)"],
  [/#f5f0ff/gi, "var(--ll-text)"],
  [/#aaa0c5/gi, "var(--ll-text-muted)"],
  [/#aaa2b9/gi, "var(--ll-text-muted)"],
  [/#aaa3bb/gi, "var(--ll-text-muted)"],
  [/#aba3c4/gi, "var(--ll-text-muted)"],
  [/#a9a1ba/gi, "var(--ll-text-muted)"],
  [/#a29aaf/gi, "var(--ll-text-muted)"],
  [/#8b849b/gi, "var(--ll-text-muted)"],
  [/#8f879f/gi, "var(--ll-text-muted)"],
  [/#8f87a7/gi, "var(--ll-text-muted)"],
  [/#9f96b7/gi, "var(--ll-text-muted)"],
  [/#9d94b2/gi, "var(--ll-text-muted)"],
  [/#817997/gi, "var(--ll-text-muted)"],
  [/#77708f/gi, "var(--ll-text-muted)"],
  [/#bcb2ce/gi, "var(--ll-text-muted)"],
  [/#cdc6dd/gi, "var(--ll-text-muted)"]
];

for (const [re, to] of hexMap) {
  css = css.replace(re, to);
}

const rgbaReplacements = [
  [/rgba\(\s*180\s*,\s*123\s*,\s*255\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-rgb), $1)"],
  [/rgba\(\s*183\s*,\s*120\s*,\s*255\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-rgb), $1)"],
  [/rgba\(\s*178\s*,\s*119\s*,\s*255\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-rgb), $1)"],
  [/rgba\(\s*177\s*,\s*126\s*,\s*255\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-rgb), $1)"],
  [/rgba\(\s*174\s*,\s*127\s*,\s*255\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-rgb), $1)"],
  [/rgba\(\s*166\s*,\s*135\s*,\s*238\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-soft-rgb), $1)"],
  [/rgba\(\s*170\s*,\s*142\s*,\s*227\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-soft-rgb), $1)"],
  [/rgba\(\s*163\s*,\s*146\s*,\s*199\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-soft-rgb), $1)"],
  [/rgba\(\s*164\s*,\s*96\s*,\s*255\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-rgb), $1)"],
  [/rgba\(\s*153\s*,\s*87\s*,\s*255\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-rgb), $1)"],
  [/rgba\(\s*167\s*,\s*139\s*,\s*250\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-soft-rgb), $1)"],
  [/rgba\(\s*196\s*,\s*160\s*,\s*255\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-soft-rgb), $1)"],
  [/rgba\(\s*184\s*,\s*166\s*,\s*255\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-soft-rgb), $1)"],
  [/rgba\(\s*142\s*,\s*111\s*,\s*218\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-strong-rgb), $1)"],
  [/rgba\(\s*138\s*,\s*70\s*,\s*238\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-strong-rgb), $1)"],
  [/rgba\(\s*131\s*,\s*78\s*,\s*225\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-strong-rgb), $1)"],
  [/rgba\(\s*126\s*,\s*70\s*,\s*222\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-strong-rgb), $1)"],
  [/rgba\(\s*124\s*,\s*58\s*,\s*237\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-strong-rgb), $1)"],
  [/rgba\(\s*121\s*,\s*69\s*,\s*212\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-strong-rgb), $1)"],
  [/rgba\(\s*116\s*,\s*61\s*,\s*206\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-strong-rgb), $1)"],
  [/rgba\(\s*111\s*,\s*60\s*,\s*194\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-strong-rgb), $1)"],
  [/rgba\(\s*111\s*,\s*59\s*,\s*194\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-strong-rgb), $1)"],
  [/rgba\(\s*104\s*,\s*72\s*,\s*172\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-strong-rgb), $1)"],
  [/rgba\(\s*91\s*,\s*33\s*,\s*182\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-deep-rgb), $1)"],
  [/rgba\(\s*80\s*,\s*31\s*,\s*163\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-deep-rgb), $1)"],
  [/rgba\(\s*20\s*,\s*16\s*,\s*42\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-surface-rgb), $1)"],
  [/rgba\(\s*19\s*,\s*17\s*,\s*39\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-surface-rgb), $1)"],
  [/rgba\(\s*18\s*,\s*16\s*,\s*39\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-surface-raised-rgb), $1)"],
  [/rgba\(\s*28\s*,\s*18\s*,\s*58\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-ink-rgb), $1)"],
  [/rgba\(\s*31\s*,\s*22\s*,\s*58\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-accent-ink-rgb), $1)"],
  [/rgba\(\s*14\s*,\s*10\s*,\s*28\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-bg-rgb), $1)"],
  [/rgba\(\s*14\s*,\s*11\s*,\s*32\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-bg-rgb), $1)"],
  [/rgba\(\s*13\s*,\s*10\s*,\s*28\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-surface-rgb), $1)"],
  [/rgba\(\s*12\s*,\s*10\s*,\s*28\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-bg-rgb), $1)"],
  [/rgba\(\s*21\s*,\s*17\s*,\s*39\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-surface-input-rgb), $1)"],
  [/rgba\(\s*24\s*,\s*18\s*,\s*48\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-surface-raised-rgb), $1)"],
  [/rgba\(\s*5\s*,\s*4\s*,\s*13\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-bg-rgb), $1)"],
  [/rgba\(\s*4\s*,\s*2\s*,\s*12\s*,\s*([0-9.]+)\s*\)/gi, "rgba(var(--ll-bg-rgb), $1)"]
];

for (const [re, to] of rgbaReplacements) {
  css = css.replace(re, to);
}

// Broken empty-alpha leftovers from earlier remaps
css = css
  .replace(/rgba\(var\(--ll-accent-rgb\),\s*\)/g, "rgba(var(--ll-accent-rgb), 0.45)")
  .replace(
    /rgba\(var\(--ll-accent-strong-rgb\),\s*\)/g,
    "rgba(var(--ll-accent-strong-rgb), 0.28)"
  )
  .replace(
    /rgba\(var\(--ll-accent-soft-rgb\),\s*\)/g,
    "rgba(var(--ll-accent-soft-rgb), 0.28)"
  );

css = css
  .replace(
    /scrollbar-color:\s*rgba\(var\(--ll-accent-rgb\),\s*0\.45\)/g,
    "scrollbar-color: var(--ll-scroll-thumb)"
  )
  .replace(
    /box-shadow:\s*0 0 0 2px rgba\(var\(--ll-accent-rgb\),\s*0\.45\)/g,
    "box-shadow: var(--ll-focus-ring)"
  )
  .replace(
    /radial-gradient\(circle at 100% 0%, rgba\(var\(--ll-accent-rgb\),\s*0\.45\), transparent 30%\)/g,
    "radial-gradient(circle at 100% 0%, rgba(var(--ll-accent-rgb), 0.18), transparent 30%)"
  )
  .replace(
    /radial-gradient\(circle at 88% 8%, rgba\(var\(--ll-accent-rgb\),\s*0\.45\), transparent 40%\)/g,
    "radial-gradient(circle at 88% 8%, rgba(var(--ll-accent-rgb), 0.16), transparent 40%)"
  )
  .replace(
    /linear-gradient\(135deg,\s*rgba\(var\(--ll-accent-strong-rgb\),\s*0\.28\),\s*rgba\(var\(--ll-accent-rgb\),\s*0\.45\)\)/g,
    "linear-gradient(135deg, var(--ll-accent-strong), var(--ll-accent))"
  );

fs.writeFileSync(filePath, css);

const leftHex = [...css.matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0].toLowerCase());
const counts = new Map();
for (const h of leftHex) {
  counts.set(h, (counts.get(h) || 0) + 1);
}
console.log("Remaining hex:");
[...counts.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(v, k));

const empty = css.match(/rgba\(var\(--ll-[^)]+\),\s*\)/g) || [];
console.log("Empty alpha leftovers:", empty.length);

const purpleRgba =
  css.match(
    /rgba\(\s*(180|131|111|166|177|157|174|178|183|167|196|91|80|124)\s*,/g
  ) || [];
console.log("Likely purple rgba leftovers:", purpleRgba.length);
console.log("[remap-cc-theme] updated", filePath);
