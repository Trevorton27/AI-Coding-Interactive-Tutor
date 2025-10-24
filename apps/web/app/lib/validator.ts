// apps/web/app/lib/validator.ts
export function looksJapanese(s: string) {
  return /[\u3040-\u30FF\u4E00-\u9FFF]/.test(s);
}
export function ensureJapaneseOrThrow(s: string) {
  if (!looksJapanese(s)) throw new Error("出力は日本語でなければなりません。");
}
