import type { CsvRow } from "./data";
import { HCCS_NOT_COMPUTED } from "./contracts";

export function firstValue(row: CsvRow | undefined, keys: readonly string[]): string {
  if (!row) return "";
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

export function numberValue(row: CsvRow | undefined, keys: readonly string[]): number | null {
  const raw = firstValue(row, keys);
  if (!raw) return null;
  const parsed = Number(raw.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function displayValue(value: string | number | null | undefined): string {
  if (value == null || value === "") return HCCS_NOT_COMPUTED;
  return String(value);
}

export function canonicalProvinceCode(row: CsvRow): string {
  return firstValue(row, ["province_code", "province", "prov_code"]);
}

export function canonicalMunicipalityCode(row: CsvRow): string {
  return firstValue(row, ["muni_code", "municipality_code", "municipality_key", "code"]);
}

export function canonicalMunicipalityName(row: CsvRow): string {
  return firstValue(row, ["municipality_name", "muni_name", "name"]);
}

export function canonicalTheme(row: CsvRow): string {
  return firstValue(row, ["theme", "theme_name"]);
}