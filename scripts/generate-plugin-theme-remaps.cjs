/**
 * Generate body.mode-plugin / body.mode-cashflow cyan→violet color remaps
 * from styles.css hard-coded sky/cyan tokens. Layout properties are skipped.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const stylesPath = path.join(root, "src/renderer/styles.css");
const outPath = path.join(root, "src/renderer/styles-plugin-theme-remaps.css");

const CYAN_RE =
  /#8de0ff|#67c8f8|#7dd3fc|#38bdf8|#0ea5e9|#0284c7|#0369a1|#075985|#0c4a6e|#062033|#bae6fd|#e0f2fe|#7dd3fc|#93c5fd|#60a5fa|#3b82f6|#2563eb|#1d4ed8|#38bdf8|#22d3ee|#06b6d4|#0891b2|#dcf6ff|#d9f5ff|#c7e9ff|#b8dcff|#eaf7ff|#ecf5ff|#edf7ff|#eff8ff|#f2fbff|#d9ffe7|#d6ffe9|#bbf7d0|#86efac|#34d399|#10b981|#22c55e|#16a34a|#4ade80|#a7f3d0|125\s*,\s*211\s*,\s*252|56\s*,\s*189\s*,\s*248|14\s*,\s*165\s*,\s*233|2\s*,\s*132\s*,\s*199|3\s*,\s*105\s*,\s*161|96\s*,\s*165\s*,\s*250|37\s*,\s*99\s*,\s*235|59\s*,\s*130\s*,\s*246|14\s*,\s*116\s*,\s*144|8\s*,\s*145\s*,\s*178|6\s*,\s*182\s*,\s*212|34\s*,\s*211\s*,\s*238|22\s*,\s*163\s*,\s*74|74\s*,\s*222\s*,\s*128|16\s*,\s*185\s*,\s*129|34\s*,\s*197\s*,\s*94|110\s*,\s*231\s*,\s*183|141\s*,\s*224\s*,\s*255|186\s*,\s*230\s*,\s*253|15\s*,\s*35\s*,\s*52|9\s*,\s*19\s*,\s*31|9\s*,\s*18\s*,\s*30|8\s*,\s*35\s*,\s*58|7\s*,\s*22\s*,\s*39|18\s*,\s*47\s*,\s*84/i;

const HOME_SKIP_RE =
  /\.(launcher-shell|recent-|pinned-chip|plugin-grid|command-|suggestion-|search-backdrop|footer-actions|tool-button|system-grid|quick-panel|workspace-row|pinned-section|plugins-section)\b/;

const COLORISH_RE =
  /^(color|background|background-image|background-color|border|border-color|border-top|border-bottom|border-left|border-right|border-top-color|border-bottom-color|border-left-color|border-right-color|outline|outline-color|box-shadow|accent-color|fill|stroke|text-shadow|caret-color|scrollbar-color)\b/i;

function remapColorValue(v) {
  return (
    v
      .replace(/#8de0ff/gi, "var(--ll-accent-soft)")
      .replace(/#67c8f8/gi, "var(--ll-accent)")
      .replace(/#7dd3fc/gi, "var(--ll-accent)")
      .replace(/#38bdf8/gi, "var(--ll-accent)")
      .replace(/#0ea5e9/gi, "var(--ll-accent-hover)")
      .replace(/#22d3ee/gi, "var(--ll-accent-soft)")
      .replace(/#06b6d4/gi, "var(--ll-accent-hover)")
      .replace(/#0891b2/gi, "var(--ll-accent-strong)")
      .replace(/#93c5fd/gi, "var(--ll-accent-soft)")
      .replace(/#60a5fa/gi, "var(--ll-accent-soft)")
      .replace(/#3b82f6/gi, "var(--ll-accent-hover)")
      .replace(/#2563eb/gi, "var(--ll-accent-strong)")
      .replace(/#1d4ed8/gi, "var(--ll-accent-deep)")
      .replace(/#062033/gi, "var(--ll-on-accent)")
      .replace(/#0284c7/gi, "var(--ll-accent-strong)")
      .replace(/#0369a1/gi, "var(--ll-accent-deep)")
      .replace(/#0c4a6e/gi, "var(--ll-accent-ink)")
      .replace(/#075985/gi, "var(--ll-accent-deep)")
      .replace(/#bae6fd/gi, "var(--ll-text-accent)")
      .replace(/#e0f2fe/gi, "var(--ll-text)")
      .replace(/#dcf6ff/gi, "var(--ll-text-accent)")
      .replace(/#d9f5ff/gi, "var(--ll-text-accent)")
      .replace(/#c7e9ff/gi, "var(--ll-text-accent)")
      .replace(/#b8dcff/gi, "var(--ll-accent-soft)")
      .replace(/#eaf7ff/gi, "var(--ll-text)")
      .replace(/#ecf5ff/gi, "var(--ll-text)")
      .replace(/#edf7ff/gi, "var(--ll-text)")
      .replace(/#eff8ff/gi, "var(--ll-text)")
      .replace(/#f2fbff/gi, "var(--ll-text)")
      .replace(/#d9ffe7/gi, "var(--ll-text-accent)")
      .replace(/#d6ffe9/gi, "var(--ll-text-accent)")
      .replace(/#bbf7d0/gi, "var(--ll-text-accent)")
      .replace(/#86efac/gi, "var(--ll-accent-soft)")
      .replace(/#34d399/gi, "var(--ll-accent-hover)")
      .replace(/#10b981/gi, "var(--ll-accent-strong)")
      .replace(/#22c55e/gi, "var(--ll-accent-hover)")
      .replace(/#16a34a/gi, "var(--ll-accent-strong)")
      .replace(/#4ade80/gi, "var(--ll-accent-soft)")
      .replace(/#a7f3d0/gi, "var(--ll-text-accent)")
      .replace(
        /rgba\(\s*125\s*,\s*211\s*,\s*252\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-rgb), $1)"
      )
      .replace(
        /rgba\(\s*141\s*,\s*224\s*,\s*255\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-hover-rgb), $1)"
      )
      .replace(
        /rgba\(\s*186\s*,\s*230\s*,\s*253\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-soft-rgb), $1)"
      )
      .replace(
        /rgba\(\s*56\s*,\s*189\s*,\s*248\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-rgb), $1)"
      )
      .replace(
        /rgba\(\s*14\s*,\s*165\s*,\s*233\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-strong-rgb), $1)"
      )
      .replace(
        /rgba\(\s*2\s*,\s*132\s*,\s*199\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-strong-rgb), $1)"
      )
      .replace(
        /rgba\(\s*3\s*,\s*105\s*,\s*161\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-deep-rgb), $1)"
      )
      .replace(
        /rgba\(\s*14\s*,\s*116\s*,\s*144\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-deep-rgb), $1)"
      )
      .replace(
        /rgba\(\s*8\s*,\s*145\s*,\s*178\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-deep-rgb), $1)"
      )
      .replace(
        /rgba\(\s*6\s*,\s*182\s*,\s*212\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-strong-rgb), $1)"
      )
      .replace(
        /rgba\(\s*34\s*,\s*211\s*,\s*238\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-soft-rgb), $1)"
      )
      .replace(
        /rgba\(\s*96\s*,\s*165\s*,\s*250\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-soft-rgb), $1)"
      )
      .replace(
        /rgba\(\s*37\s*,\s*99\s*,\s*235\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-strong-rgb), $1)"
      )
      .replace(
        /rgba\(\s*59\s*,\s*130\s*,\s*246\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-hover-rgb), $1)"
      )
      .replace(
        /rgba\(\s*22\s*,\s*163\s*,\s*74\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-strong-rgb), $1)"
      )
      .replace(
        /rgba\(\s*74\s*,\s*222\s*,\s*128\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-soft-rgb), $1)"
      )
      .replace(
        /rgba\(\s*16\s*,\s*185\s*,\s*129\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-strong-rgb), $1)"
      )
      .replace(
        /rgba\(\s*34\s*,\s*197\s*,\s*94\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-hover-rgb), $1)"
      )
      .replace(
        /rgba\(\s*110\s*,\s*231\s*,\s*183\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-accent-soft-rgb), $1)"
      )
      .replace(
        /rgba\(\s*15\s*,\s*35\s*,\s*52\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-surface-input-rgb), $1)"
      )
      .replace(
        /rgba\(\s*9\s*,\s*19\s*,\s*31\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-bg-rgb), $1)"
      )
      .replace(
        /rgba\(\s*9\s*,\s*18\s*,\s*30\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-bg-rgb), $1)"
      )
      .replace(
        /rgba\(\s*8\s*,\s*35\s*,\s*58\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-surface-raised-rgb), $1)"
      )
      .replace(
        /rgba\(\s*7\s*,\s*22\s*,\s*39\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-surface-rgb), $1)"
      )
      .replace(
        /rgba\(\s*18\s*,\s*47\s*,\s*84\s*,\s*([0-9.]+)\s*\)/gi,
        "rgba(var(--ll-surface-raised-rgb), $1)"
      )
  );
}

function stripComments(input) {
  return input.replace(/\/\*[\s\S]*?\*\//g, "");
}

function hasCyan(s) {
  return CYAN_RE.test(s);
}

function walk(text, media, rules) {
  let i = 0;
  while (i < text.length) {
    while (i < text.length && /\s/.test(text[i])) i++;
    if (i >= text.length) break;

    if (text.startsWith("@keyframes", i) || text.startsWith("@font-face", i)) {
      const brace = text.indexOf("{", i);
      if (brace < 0) break;
      let depth = 0;
      let j = brace;
      for (; j < text.length; j++) {
        if (text[j] === "{") depth++;
        else if (text[j] === "}") {
          depth--;
          if (depth === 0) {
            j++;
            break;
          }
        }
      }
      i = j;
      continue;
    }

    if (text[i] === "@" && text.startsWith("@media", i)) {
      const brace = text.indexOf("{", i);
      if (brace < 0) break;
      const mq = text.slice(i, brace).trim();
      let depth = 0;
      let j = brace;
      for (; j < text.length; j++) {
        if (text[j] === "{") depth++;
        else if (text[j] === "}") {
          depth--;
          if (depth === 0) break;
        }
      }
      walk(text.slice(brace + 1, j), mq, rules);
      i = j + 1;
      continue;
    }

    const brace = text.indexOf("{", i);
    if (brace < 0) break;
    const sel = text.slice(i, brace).trim();
    let depth = 0;
    let j = brace;
    for (; j < text.length; j++) {
      if (text[j] === "{") depth++;
      else if (text[j] === "}") {
        depth--;
        if (depth === 0) {
          j++;
          break;
        }
      }
    }
    const body = text.slice(brace + 1, j - 1);
    if (
      !body.includes("{") &&
      hasCyan(body) &&
      sel &&
      !sel.startsWith("@") &&
      !/^(html|body|:root)$/i.test(sel) &&
      !/body\.mode-(plugin|cashflow)/.test(sel) &&
      !HOME_SKIP_RE.test(sel)
    ) {
      const remapped = remapColorValue(body);
      if (remapped !== body) {
        const originalDecls = body
          .split(";")
          .map((d) => d.trim())
          .filter(Boolean);
        const kept = [];
        for (const d of originalDecls) {
          if (!COLORISH_RE.test(d)) continue;
          if (!hasCyan(d)) continue;
          kept.push(remapColorValue(d));
        }
        if (kept.length > 0) {
          rules.push({ sel, decls: kept, media });
        }
      }
    }
    i = j;
  }
}

const css = stripComments(fs.readFileSync(stylesPath, "utf8"));
const rules = [];
walk(css, null, rules);

const lines = [];
lines.push("/* AUTO-GENERATED by scripts/generate-plugin-theme-remaps.cjs — do not edit by hand */");
lines.push("/* Cyan/sky tokens from styles.css remapped to Command Center violet under plugin modes. */");
lines.push("");

let currentMedia = null;
for (const rule of rules) {
  if (rule.media !== currentMedia) {
    if (currentMedia) lines.push("}");
    currentMedia = rule.media;
    if (currentMedia) lines.push(`${currentMedia} {`);
  }
  const pad = currentMedia ? "  " : "";
  const sels = rule.sel
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((s) =>
      s.startsWith("body.mode-")
        ? [s]
        : [`body.mode-plugin ${s}`, `body.mode-cashflow ${s}`]
    );
  lines.push(`${pad}${sels.join(`,\n${pad}`)} {`);
  for (const d of rule.decls) {
    lines.push(`${pad}  ${d};`);
  }
  lines.push(`${pad}}`);
}
if (currentMedia) lines.push("}");
lines.push("");

fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(
  `[generate-plugin-theme-remaps] wrote ${rules.length} rules → ${path.relative(root, outPath)}`
);
