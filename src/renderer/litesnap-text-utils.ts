// Keep in sync with normalizeLiteSnapOcrText in src/shared/litesnap.ts
function collapseLiteSnapOcrBlankLines(text: string): string {
  const blocks = text.split(/\n\n+/);
  if (blocks.length <= 2) {
    return text.replace(/\n{3,}/g, "\n\n");
  }
  return `${blocks[0]}\n\n${blocks.slice(1).join("\n")}`;
}

function normalizeLiteSnapOcrText(text: string): string {
  const cjk =
    "\\u2e80-\\u2eff\\u31c0-\\u31ef\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff";
  const cjkPunct = "\\u3001-\\u303f\\uff00-\\uffef";
  const cluster = `[${cjk}${cjkPunct}]`;
  const horizontalWhitespace =
    "[ \\t\\f\\v\\u00a0\\u1680\\u2000-\\u200b\\u202f\\u205f\\u3000\\ufeff]+";
  const betweenCjk = new RegExp(`(${cluster})${horizontalWhitespace}(${cluster})`, "gu");
  const punctBeforeLatin = new RegExp(
    `([${cjkPunct}])${horizontalWhitespace}(?=[A-Za-z0-9])`,
    "g"
  );
  const cjkBeforeLatin = new RegExp(
    `([${cjk}])${horizontalWhitespace}(?=[A-Za-z])`,
    "g"
  );

  let normalized = text.replace(/\r\n/g, "\n");
  let previous = "";
  while (normalized !== previous) {
    previous = normalized;
    normalized = normalized.replace(betweenCjk, "$1$2");
  }

  normalized = normalized
    .replace(punctBeforeLatin, "$1")
    .replace(cjkBeforeLatin, "$1");

  return collapseLiteSnapOcrBlankLines(
    normalized.replace(/\r\n/g, "\n")
  );
}

window.__LL_LITESNAP_TEXT_UTILS__ = {
  normalizeLiteSnapOcrText
};
