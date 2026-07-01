export type LiteSnapOcrLanguagePreference = "chinese" | "english";

export function scoreLiteSnapOcrText(text: string): number {
  const cleaned = text.replace(/\s/g, "");
  if (!cleaned) {
    return 0;
  }

  const latin = (cleaned.match(/[A-Za-z0-9]/g) ?? []).length;
  const cjk = (cleaned.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const punctuation = (cleaned.match(/[.,;:!?'"()[\]{}\\/|@#$%^&*+=<>~`-]/g) ?? []).length;
  const replacement = (cleaned.match(/[□■]/g) ?? []).length;

  return latin * 1.2 + cjk + punctuation * 0.4 - replacement * 12;
}

/** Chinese OCR on Latin UI often yields CJK-heavy garbage; retry with English OCR. */
export function looksLikeMisrecognizedEnglish(text: string): boolean {
  const cleaned = text.replace(/\s/g, "");
  if (cleaned.length < 4) {
    return false;
  }

  const latin = (cleaned.match(/[A-Za-z]/g) ?? []).length;
  const cjk = (cleaned.match(/[\u4e00-\u9fff]/g) ?? []).length;
  if (cjk >= 3 && latin < cleaned.length * 0.18) {
    return true;
  }

  const weird = (
    cleaned.match(/[^\w\u4e00-\u9fff\s.,;:!?'"()[\]{}\\/|@#$%^&*+=<>~`%-]/g) ?? []
  ).length;
  return weird > cleaned.length * 0.22;
}
