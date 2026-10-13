import { HCCS_FEEDS } from "./contracts";

export type CsvRow = Record<string, string>;

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map((value) => value.trim());

  return rows
    .slice(1)
    .filter((values) => values.some((value) => value.trim() !== ""))
    .map((values) => {
      const result: CsvRow = {};
      headers.forEach((header, index) => {
        result[header] = values[index] ?? "";
      });
      return result;
    });
}

export async function loadCsv(url: string): Promise<CsvRow[]> {
  const response = await fetch(url, {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Unable to load " + url + ": HTTP " + response.status);
  }

  return parseCsv(await response.text());
}

export async function loadHccsFeeds() {
  const [
    coverage,
    municipalityDrivers,
    provinceDrivers,
    miifDrivers,
    sourceMaster,
    provinceCapacitySummary,
  ] = await Promise.all([
    loadCsv(HCCS_FEEDS.coverage),
    loadCsv(HCCS_FEEDS.municipalityDrivers),
    loadCsv(HCCS_FEEDS.provinceDrivers),
    loadCsv(HCCS_FEEDS.miifDrivers),
    loadCsv(HCCS_FEEDS.sourceMaster),
    loadCsv(HCCS_FEEDS.provinceCapacitySummary),
  ]);

  return {
    coverage,
    municipalityDrivers,
    provinceDrivers,
    miifDrivers,
    sourceMaster,
    provinceCapacitySummary,
  };
}