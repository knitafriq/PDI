/**
 * Staging-only shape gate for an HCCS model release verified by a trusted server.
 * IMPORTANT: this browser module does NOT verify a cryptographic signature or
 * authenticate any backend. An untrusted JSON object setting booleans to true
 * is not approval. Do not connect it to a public or unsigned data endpoint.
 *
 * No source promotion, score generation, prototype MinMax fallback, or writes.
 */
export type HccsLevel =
  | "INDICATOR" | "THEME" | "MUNICIPALITY" | "DISTRICT" | "PROVINCE" | "NATIONAL_SALGA";
export type HccsScoreStatus = "CERTIFIED" | "HELD" | "NOT_COMPUTED";
export interface HccsScoreRecord {
  level: HccsLevel;
  entityCode: string;
  indicatorCode?: string;
  themeName?: string;
  score1to4: number | null;
  status: HccsScoreStatus;
}
export interface HccsServerRelease {
  contract: "HCCS_80_1_TO_4";
  status: "CERTIFIED_RELEASE" | "EVIDENCE_ONLY";
  modelVersion: string;
  municipalityCount: number;
  indicatorCount: number;
  themeCount: number;
  factPositions: number;
  scoreRange: { min: number; max: number };
  verifiedRelease: boolean;
  sourceAuthoritiesSigned: boolean;
  ruleAndThresholdsSigned: boolean;
  miifAndWeightsSigned: boolean;
  missingnessSigned: boolean;
  rollupsSigned: boolean;
  productionAuthorised: boolean;
  scores: HccsScoreRecord[];
}
export type HccsModelDecision =
  | { status: "NOT_COMPUTED"; scores: null; reason: string }
  | { status: "CERTIFIED"; scores: HccsScoreRecord[]; reason: string };

const EXPECTED = {
  INDICATOR: 17040,
  THEME: 1278,
  MUNICIPALITY: 213,
  DISTRICT: 44,
  PROVINCE: 9,
  NATIONAL_SALGA: 1
} as const;
const LEVELS: HccsLevel[] = Object.keys(EXPECTED) as HccsLevel[];
const STATUSES: HccsScoreStatus[] = ["CERTIFIED", "HELD", "NOT_COMPUTED"];
function record(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function nonblank(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}
function inRange(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 1 && v <= 4;
}

/**
 * A structural validation stage AFTER server authentication, signature
 * verification and source-policy authorisation. Not a security boundary alone.
 */
export function decideHccsRelease(payload: unknown): HccsModelDecision {
  const denied = (reason: string): HccsModelDecision =>
    ({ status: "NOT_COMPUTED", scores: null, reason });
  if (!record(payload)) return denied("No verified HCCS model release is available.");
  const p = payload as unknown as HccsServerRelease;
  if (p.contract !== "HCCS_80_1_TO_4" || p.status !== "CERTIFIED_RELEASE" ||
      !nonblank(p.modelVersion)) {
    return denied("The 80-indicator HCCS release contract is not certified.");
  }
  if (p.municipalityCount !== 213 || p.indicatorCount !== 80 ||
      p.themeCount !== 6 || p.factPositions !== 17040 ||
      p.scoreRange?.min !== 1 || p.scoreRange?.max !== 4) {
    return denied("The source registry or strict 1–4 scale is incompatible.");
  }
  if (![p.verifiedRelease, p.sourceAuthoritiesSigned, p.ruleAndThresholdsSigned,
        p.miifAndWeightsSigned, p.missingnessSigned, p.rollupsSigned,
        p.productionAuthorised].every(v => v === true)) {
    return denied("Source, methodology, hierarchy or production approvals are incomplete.");
  }
  if (!Array.isArray(p.scores)) return denied("The score grid is missing.");
  const count: Record<HccsLevel, number> = {
    INDICATOR: 0, THEME: 0, MUNICIPALITY: 0,
    DISTRICT: 0, PROVINCE: 0, NATIONAL_SALGA: 0
  };
  const uniqueRows = new Set<string>();
  const indicatorIds = new Set<string>();
  const indicatorByMuni = new Map<string, Set<string>>();
  const themes = new Set<string>();
  const themesByMuni = new Map<string, Set<string>>();
  const geography = {
    MUNICIPALITY: new Set<string>(),
    DISTRICT: new Set<string>(),
    PROVINCE: new Set<string>(),
    NATIONAL_SALGA: new Set<string>()
  };
  for (const r of p.scores) {
    if (!record(r) || !LEVELS.includes(r.level as HccsLevel))
      return denied("Unsupported score level.");
    const level = r.level as HccsLevel;
    if (!nonblank(r.entityCode) || !STATUSES.includes(r.status as HccsScoreStatus))
      return denied("Missing score entity or invalid score status.");
    if ((r.status === "CERTIFIED" && !inRange(r.score1to4)) ||
        (r.status !== "CERTIFIED" && r.score1to4 !== null)) {
      return denied("Missing, held, nonnumeric or out-of-range score detected.");
    }
    const indicator = level === "INDICATOR";
    const theme = level === "THEME";
    if (indicator ? !nonblank(r.indicatorCode) : r.indicatorCode !== undefined)
      return denied("Indicator ID is missing or attached to a wrong scoring level.");
    if (theme ? !nonblank(r.themeName) : r.themeName !== undefined)
      return denied("Theme ID is missing or attached to a wrong scoring level.");
    const key = [level, r.entityCode, r.indicatorCode ?? "", r.themeName ?? ""].join("|");
    if (uniqueRows.has(key)) return denied("Duplicate score identity detected.");
    uniqueRows.add(key);
    count[level]++;
    if (count[level] > EXPECTED[level]) return denied("Score level row count exceeded.");
    if (indicator) {
      indicatorIds.add(r.indicatorCode as string);
      const ids = indicatorByMuni.get(r.entityCode as string) ?? new Set<string>();
      ids.add(r.indicatorCode as string);
      indicatorByMuni.set(r.entityCode as string, ids);
    } else if (theme) {
      themes.add(r.themeName as string);
      const ids = themesByMuni.get(r.entityCode as string) ?? new Set<string>();
      ids.add(r.themeName as string);
      themesByMuni.set(r.entityCode as string, ids);
    } else {
      geography[level as keyof typeof geography].add(r.entityCode as string);
    }
  }
  for (const level of LEVELS) {
    if (count[level] !== EXPECTED[level])
      return denied("The indicator, theme or geographic score grid is incomplete.");
  }
  if (indicatorIds.size !== 80 || indicatorByMuni.size !== 213 ||
      [...indicatorByMuni.values()].some(ids => ids.size !== 80)) {
    return denied("The indicator grid is not exactly 80 indicators × 213 municipalities.");
  }
  if (themes.size !== 6 || themesByMuni.size !== 213 ||
      [...themesByMuni.values()].some(ids => ids.size !== 6) ||
      [...themesByMuni.keys()].some(code => !indicatorByMuni.has(code))) {
    return denied("The six-theme grid is not aligned to the 213 municipalities.");
  }
  for (const [level, total] of [
    ["MUNICIPALITY", 213], ["DISTRICT", 44],
    ["PROVINCE", 9], ["NATIONAL_SALGA", 1]
  ] as const) {
    if (geography[level].size !== total)
      return denied("A geographic aggregation has an invalid population.");
  }
  if ([...geography.MUNICIPALITY].some(code => !indicatorByMuni.has(code))) {
    return denied("The municipality score set differs from the indicator grid.");
  }
  return {
    status: "CERTIFIED",
    scores: p.scores,
    reason: "Complete shape validated; server-side signed release authority required."
  };
}
