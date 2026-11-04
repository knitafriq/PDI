/**
 * HCCS canonical 80-indicator integration guard — staging only.
 * No network call, no credentials, no scoring, no old MinMax fallback.
 * Verify signed release and provenance on a trusted backend, not in this browser code.
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

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function scoreInsideRange(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 1 && v <= 4;
}
/** Accepts only trusted server-verified releases. This code does not verify signatures. */
export function decideHccsRelease(payload: unknown): HccsModelDecision {
  const denied = (reason: string): HccsModelDecision => ({status:"NOT_COMPUTED",scores:null,reason});
  if (!isRecord(payload)) return denied("No verified HCCS model release is available.");
  const p = payload as unknown as HccsServerRelease;
  if (p.contract !== "HCCS_80_1_TO_4" || p.status !== "CERTIFIED_RELEASE") {
    return denied("The 80-indicator scoring model is not certified for release.");
  }
  if (p.municipalityCount !== 213 || p.indicatorCount !== 80 || p.themeCount !== 6 ||
      p.factPositions !== 17040 || p.scoreRange?.min !== 1 || p.scoreRange?.max !== 4) {
    return denied("The model scope or strict 1–4 scale does not match the approved registry.");
  }
  if (![p.verifiedRelease,p.sourceAuthoritiesSigned,p.ruleAndThresholdsSigned,
      p.miifAndWeightsSigned,p.missingnessSigned,p.rollupsSigned,p.productionAuthorised]
      .every(v => v === true)) {
    return denied("Signed model and production approvals are incomplete.");
  }
  if (!Array.isArray(p.scores) || p.scores.length === 0) {
    return denied("No verified score payload is available.");
  }
  const keys = new Set<string>();
  let indicatorRows = 0;
  for (const r of p.scores) {
    if (!isRecord(r) || !["INDICATOR","THEME","MUNICIPALITY","DISTRICT","PROVINCE","NATIONAL_SALGA"].includes(r.level)) {
      return denied("An unsupported score record was supplied.");
    }
    if (typeof r.entityCode !== "string" || !r.entityCode) return denied("Missing entity identity.");
    if (!["CERTIFIED","HELD","NOT_COMPUTED"].includes(r.status)) return denied("Invalid score status.");
    if ((r.status === "CERTIFIED" && !scoreInsideRange(r.score1to4)) ||
        (r.status !== "CERTIFIED" && r.score1to4 !== null)) {
      return denied("Uncertified, missing or out-of-range scores are blocked.");
    }
    if (r.level === "INDICATOR") {
      indicatorRows++;
      if (typeof r.indicatorCode !== "string" || !r.indicatorCode) {
        return denied("Indicator identity missing.");
      }
    }
    const k = [r.level,r.entityCode,r.indicatorCode ?? "",r.themeName ?? ""].join("|");
    if (keys.has(k)) return denied("Duplicate score identity blocked.");
    keys.add(k);
  }
  if (indicatorRows !== 17040) return denied("The indicator grid is incomplete.");
  return {status:"CERTIFIED",scores:p.scores,reason:"Trusted server-verified model release accepted."};
}
