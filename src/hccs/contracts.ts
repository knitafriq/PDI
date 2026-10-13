export const HCCS_NOT_COMPUTED = "NOT_COMPUTED" as const;

export const HCCS_THEMES = [
  "Demographic & Social Complexity",
  "Economic Development & Vulnerability",
  "Financial Sustainability & Performance",
  "Leadership, Governance & Institutional Capability",
  "Service Delivery & Infrastructure Pressure",
  "Spatial Access & Service Reach",
] as const;

export type HccsTheme = (typeof HCCS_THEMES)[number];

export const HCCS_FEEDS = {
  coverage: "/hccs/coverage.csv",
  municipalityDrivers: "/hccs/municipality_drivers.csv",
  provinceDrivers: "/hccs/province_drivers.csv",
  miifDrivers: "/hccs/miif_drivers.csv",
  sourceMaster: "/hccs/source_master.csv",
  provinceCapacitySummary: "/hccs/province_capacity_summary_current.csv",
} as const;

export const HCCS_MODEL_CONTRACT = {
  municipalityCount: 213,
  localMunicipalityCount: 205,
  metroCount: 8,
  districtPrimaryScoringCount: 0,
  indicatorCount: 80,
  structuralSlotCount: 17040,
  scoreScaleMin: 1,
  scoreScaleMax: 4,
  currentScoreAssignments: 9133,
  currentUnscoredRows: 7907,
  rollupIncludedIndicators: 37,
  rollupExcludedIndicators: 43,
  overallRequiresCompleteThemeCount: 6,
  equalThemeWeight: 1 / 6,
  capacityAllocationAuthorized: false,
} as const;

export function complexityLevel(score: number | null | undefined): 1 | 2 | 3 | 4 | null {
  if (score == null || !Number.isFinite(score)) return null;
  if (score < 1 || score > 4) return null;
  if (score < 1.5) return 1;
  if (score < 2.5) return 2;
  if (score < 3.5) return 3;
  return 4;
}

export function complexityLevelLabel(level: 1 | 2 | 3 | 4 | null): string {
  if (level === 1) return "Level 1 - Foundational";
  if (level === 2) return "Level 2 - Emerging";
  if (level === 3) return "Level 3 - Intermediate";
  if (level === 4) return "Level 4 - Optimized";
  return HCCS_NOT_COMPUTED;
}

export function completeThemeMean(scores: readonly (number | null | undefined)[]): number | null {
  if (scores.length === 0) return null;
  if (scores.some((score) => score == null || !Number.isFinite(score) || score < 1 || score > 4)) {
    return null;
  }
  return scores.reduce((sum, score) => sum + Number(score), 0) / scores.length;
}

export function equalSixThemeOverall(
  themeScores: readonly (number | null | undefined)[]
): number | null {
  if (themeScores.length !== 6) return null;
  if (themeScores.some((score) => score == null || !Number.isFinite(score) || score < 1 || score > 4)) {
    return null;
  }
  return themeScores.reduce((sum, score) => sum + Number(score), 0) / 6;
}

export function capacityAllocationScore(): typeof HCCS_NOT_COMPUTED {
  return HCCS_NOT_COMPUTED;
}