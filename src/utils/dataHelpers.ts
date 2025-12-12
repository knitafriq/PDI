// src/utils/dataHelpers.ts
export function numericVal(v: any): number | null {
  if (v == null) return null;
  if (typeof v === "number") {
    if (Number.isFinite(v)) return v;
    return null;
  }
  let s = String(v).trim();

  // empty
  if (s === "" || s.toLowerCase() === "na" || s.toLowerCase() === "n/a" || s.toLowerCase() === "null") return null;

  // remove wrapping quotes if any
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }

  // detect percentage and remove %
  const isPct = s.endsWith("%");
  if (isPct) s = s.slice(0, -1).trim();

  // If contains both comma and dot, assume dot is decimal and commas are thousands separators -> remove commas
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/,/g, "");
  } else if (s.includes(",") && !s.includes(".")) {
    // If only commas, assume comma is decimal separator -> replace with dot
    // But if there are many commas (e.g., "1,234,567") it may be thousands separators;
    // Heuristic: if more than one comma and groups of 3 digits, remove commas; otherwise replace first comma with dot.
    const commas = (s.match(/,/g) || []).length;
    if (commas > 1 && /^[0-9]{1,3}(,[0-9]{3})+(?:\.[0-9]+)?$/.test(s)) {
      s = s.replace(/,/g, "");
    } else {
      // replace last comma (more likely decimal) with dot
      s = s.replace(/,(\d+)$/,".$1");
    }
  }

  // Remove spaces used as separators
  s = s.replace(/\s+/g, "");

  // Remove any currency symbols, non-numeric except dot and minus
  s = s.replace(/[^\d\.\-eE+]/g, "");

  // final parse
  const n = parseFloat(s);
  if (Number.isFinite(n)) {
    return isPct ? n / 100 : n;
  }
  return null;
}

export function mean(arr: number[]) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
