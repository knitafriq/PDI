// R776 branch-only synthetic contract tests; no real municipality values.
import test from "node:test";
import assert from "node:assert/strict";
import { decideHccsRelease } from "../src/model/hccsCanonicalGate.ts";

function syntheticRelease() {
  const scores = [];
  const municipalities = Array.from({length: 213}, (_, i) => "TEST_M" + String(i).padStart(3, "0"));
  const indicators = Array.from({length: 80}, (_, i) => "TEST_I" + String(i).padStart(2, "0"));
  const themes = Array.from({length: 6}, (_, i) => "TEST_T" + i);
  for (const code of municipalities) {
    for (const indicatorCode of indicators) {
      scores.push({level:"INDICATOR", entityCode:code, indicatorCode, score1to4:2.5, status:"CERTIFIED"});
    }
    for (const themeName of themes) {
      scores.push({level:"THEME", entityCode:code, themeName, score1to4:2.5, status:"CERTIFIED"});
    }
    scores.push({level:"MUNICIPALITY", entityCode:code, score1to4:2.5, status:"CERTIFIED"});
  }
  for (let i=0;i<44;i++) scores.push({level:"DISTRICT",entityCode:"TEST_D"+i,score1to4:2.5,status:"CERTIFIED"});
  for (let i=0;i<9;i++) scores.push({level:"PROVINCE",entityCode:"TEST_P"+i,score1to4:2.5,status:"CERTIFIED"});
  scores.push({level:"NATIONAL_SALGA",entityCode:"TEST_NATIONAL",score1to4:2.5,status:"CERTIFIED"});
  return {
    contract:"HCCS_80_1_TO_4", status:"CERTIFIED_RELEASE",modelVersion:"SYNTHETIC_FIXTURE_ONLY",
    municipalityCount:213,indicatorCount:80,themeCount:6,factPositions:17040,
    scoreRange:{min:1,max:4}, verifiedRelease:true,sourceAuthoritiesSigned:true,
    ruleAndThresholdsSigned:true,miifAndWeightsSigned:true,missingnessSigned:true,
    rollupsSigned:true,productionAuthorised:true,scores
  };
}
function denied(x) { assert.equal(decideHccsRelease(x).status,"NOT_COMPUTED"); }
test("No backend release fails closed",()=>denied(null));
test("Evidence-only checkpoint fails closed",()=>{
  const p=syntheticRelease();p.status="EVIDENCE_ONLY";denied(p);
});
test("Unsigned synthetic release fails closed",()=>{
  const p=syntheticRelease();p.sourceAuthoritiesSigned=false;denied(p);
});
test("Synthetic 213x80, six themes, 44 districts, nine provinces and national passes shape",()=>{
  const p=syntheticRelease();
  assert.equal(p.scores.length,18585);
  assert.equal(decideHccsRelease(p).status,"CERTIFIED");
});
test("Partial indicator grid fails closed",()=>{
  const p=syntheticRelease();p.scores.splice(0,1);denied(p);
});
test("Duplicate indicator identity fails closed",()=>{
  const p=syntheticRelease();p.scores[1]={...p.scores[0]};denied(p);
});
test("Out-of-range 5 fails closed",()=>{
  const p=syntheticRelease();p.scores[0].score1to4=5;denied(p);
});
test("Held values cannot carry synthetic scores",()=>{
  const p=syntheticRelease();p.scores[0].status="HELD";denied(p);
});
test("Genuinely missing scores stay null and can be structurally represented",()=>{
  const p=syntheticRelease();p.scores[0].status="HELD";p.scores[0].score1to4=null;
  assert.equal(decideHccsRelease(p).status,"CERTIFIED");
});
test("Mismatched municipality identity fails closed",()=>{
  const p=syntheticRelease();p.scores.find(r=>r.level==="MUNICIPALITY").entityCode="UNMATCHED";
  denied(p);
});
test("Wrong number of districts fails closed",()=>{
  const p=syntheticRelease(); const idx=p.scores.findIndex(r=>r.level==="DISTRICT"); p.scores.splice(idx,1);denied(p);
});
test("Extra theme identity fails closed",()=>{
  const p=syntheticRelease();p.scores.find(r=>r.level==="THEME").themeName="TEST_EXTRA";
  denied(p);
});
\ntest("Legacy scale metadata fails closed",()=>{\n  const p=syntheticRelease();p.scoreRange.max=5;denied(p);\n});\n