import React, { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import Card from "../components/Card";
import SortableTable from "../components/SortableTable";
import MiniHistogram from "../components/MiniHistogram";
import { numericVal } from "../utils/dataHelpers";
import { downloadCsv } from "../utils/exportCsv";
import { useNavigate } from "react-router-dom";

/**
 * Robust PDI Explorer
 * - Autodetects PDI column (tries common names first, then heuristics)
 * - Normalizes municipality name/province from DimMunicipality
 * - Sortable, filterable, exportable
 */

const PDIExplorer: React.FC = () => {
  const { pdiMinmax, municipalities, loading } = useData();
  const navigate = useNavigate();

  const [provinceFilter, setProvinceFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [searchText, setSearchText] = useState<string>("");

  // map municipality code -> dim row (for name/province normalization)
  const muniMap = useMemo(() => {
    const out: Record<string, any> = {};
    (municipalities || []).forEach((m: any) => {
      const code = String(m.MunicipalityCode || "").trim();
      if (code) out[code] = m;
    });
    return out;
  }, [municipalities]);

  // Helper: detect best PDI column name
  const detectedPdiKey = useMemo(() => {
    if (!pdiMinmax || pdiMinmax.length === 0) return null;

    const sampleRow = pdiMinmax[0];
    const keys = Object.keys(sampleRow);

    // priority candidate names (case-insensitive)
    const prioritized = [
      "PDI_MINMAX",
      "PDI_MinMax",
      "PDI_MinMax",
      "PDI_Min_Max",
      "PDI_MIN",
      "PDI",
      "PDI_VALUE",
      "PDI_VALUE_MINMAX",
      "PDI_SCORE",
      "Score",
      "SCORE",
      "PDI-MinMax"
    ];

    // try to match prioritized names with actual keys (case-insensitive)
    const keyLowerMap: Record<string,string> = {};
    keys.forEach(k => { keyLowerMap[k.toLowerCase()] = k; });

    for (const cand of prioritized) {
      const lookup = keyLowerMap[cand.toLowerCase()];
      if (lookup) return lookup;
    }

    // if no prioritized match, auto-detect: choose key with highest numeric count
    // but avoid obvious non-PDI numeric columns (lat/long)
    const numericCounts: { key: string; count: number }[] = [];

    keys.forEach((k) => {
      // ignore obvious metadata
      const lower = k.toLowerCase();
      if (["municipalitycode","municipality","province","provincecode","latitude","longitude","lon","lat","district","districtcode"].some(m => lower.includes(m))) return;
      let count = 0;
      for (const r of pdiMinmax) {
        if (numericVal(r[k]) != null) count++;
      }
      numericCounts.push({ key: k, count });
    });

    // pick highest count if it's significant (> 10% of rows) to avoid picking a rare numeric field
    numericCounts.sort((a,b)=>b.count - a.count);
    if (numericCounts.length === 0) return null;
    const best = numericCounts[0];
    if (best.count > 0 && best.count >= Math.max(3, Math.floor((pdiMinmax.length || 0) * 0.1))) {
      return best.key;
    }

    // fallback: look for any key containing 'min' and 'max' (lowercase)
    for (const k of keys) {
      const lk = k.toLowerCase();
      if (lk.includes("min") && lk.includes("max")) return k;
    }

    // final fallback: try some numeric-looking keys
    for (const k of keys) {
      if (numericVal(sampleRow[k]) != null) return k;
    }

    return null;
  }, [pdiMinmax]);

  // Build processed rows with normalized names and _PDI value
  const processed = useMemo(() => {
    if (!pdiMinmax) return [];
    return pdiMinmax.map((r:any) => {
      const out: any = { ...r };

      // normalize municipality code
      const code = String(r.MunicipalityCode || r.MuniCode || r.MUNI_CODE || "").trim();
      out.MunicipalityCode = code || out.MunicipalityCode || "";

      // use muniMap to populate MunicipalityName / ProvinceName / MIIF_Category when missing
      const mm = muniMap[out.MunicipalityCode];
      if (mm) {
        out.MunicipalityName = out.MunicipalityName || mm.MunicipalityName || mm.Municipality || "";
        out.ProvinceName = out.ProvinceName || mm.ProvinceName || mm.Province || "";
        out.MIIF_Category = out.MIIF_Category || mm.MIIF_Category || "";
      } else {
        // try other fields
        out.MunicipalityName = out.MunicipalityName || out.Municipality || out.Municipality_Name || "";
        out.ProvinceName = out.ProvinceName || out.Province || "";
        out.MIIF_Category = out.MIIF_Category || out.Category || out.MIIF || "";
      }

      // set _PDI using detected key if available or fallback heuristics
      let pdiVal: number | null = null;
      if (detectedPdiKey && r.hasOwnProperty(detectedPdiKey)) {
        pdiVal = numericVal(r[detectedPdiKey]);
      }
      // additional fallbacks
      if (pdiVal == null) {
        pdiVal = numericVal(r.PDI_MINMAX ?? r.PDI_MinMax ?? r.PDI_MIN ?? r.PDI_VALUE ?? r.PDI_SCORE ?? r.Score ?? r.Value ?? r.VALUE);
      }
      out._PDI = pdiVal;
      return out;
    });
  }, [pdiMinmax, muniMap, detectedPdiKey]);

  // Build filter lists
  const provinces = useMemo(() => {
    const s = new Set<string>();
    (processed||[]).forEach((r:any) => {
      if (r.ProvinceName) s.add(r.ProvinceName);
      // if province is short code (like EC) and we didn't map it, try mapping via muniMap using MunicipalityCode
      else if (r.MunicipalityCode && muniMap[r.MunicipalityCode]) s.add(muniMap[r.MunicipalityCode].ProvinceName || muniMap[r.MunicipalityCode].Province);
    });
    return ["All", ...Array.from(s).sort()];
  }, [processed, muniMap]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    (processed||[]).forEach((r:any) => {
      if (r.MIIF_Category) s.add(r.MIIF_Category);
    });
    return ["All", ...Array.from(s).sort()];
  }, [processed]);

  // Apply filters & search
  const filtered = useMemo(() => {
    return (processed || []).filter((r:any) => {
      // normalize province candidate for comparison
      const prov = r.ProvinceName || (r.MunicipalityCode && muniMap[r.MunicipalityCode] ? (muniMap[r.MunicipalityCode].ProvinceName || muniMap[r.MunicipalityCode].Province) : r.Province);
      if (provinceFilter !== "All" && prov !== provinceFilter) return false;
      if (categoryFilter !== "All" && (r.MIIF_Category || "") !== categoryFilter) return false;
      if (searchText) {
        const t = searchText.toLowerCase();
        if (!String(r.MunicipalityName || "").toLowerCase().includes(t)) return false;
      }
      return true;
    });
  }, [processed, provinceFilter, categoryFilter, searchText, muniMap]);

  // table rows and summary lists
  const tableRows = useMemo(() => {
    return (filtered || []).map((r:any) => ({
      MunicipalityCode: r.MunicipalityCode,
      MunicipalityName: r.MunicipalityName,
      ProvinceName: r.ProvinceName || (r.MunicipalityCode && muniMap[r.MunicipalityCode] ? (muniMap[r.MunicipalityCode].ProvinceName || muniMap[r.MunicipalityCode].Province) : r.Province),
      MIIF_Category: r.MIIF_Category,
      PDI: r._PDI == null ? null : (Number.isFinite(r._PDI) ? Number(r._PDI) : null)
    }));
  }, [filtered, muniMap]);

  const top10 = useMemo(() => (tableRows || []).filter(r=>r.PDI!=null).slice().sort((a:any,b:any)=>b.PDI - a.PDI).slice(0,10), [tableRows]);
  const bottom10 = useMemo(() => (tableRows || []).filter(r=>r.PDI!=null).slice().sort((a:any,b:any)=>a.PDI - b.PDI).slice(0,10), [tableRows]);

  const columns = [
    { key: "MunicipalityName", label: "Municipality" },
    { key: "ProvinceName", label: "Province" },
    { key: "MIIF_Category", label: "Category" },
    { key: "PDI", label: "PDI" }
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 28 }}>PDI Explorer</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
        <div style={{ width: 240 }}>
          <label style={{ fontSize: 13 }}>Province</label>
          <select value={provinceFilter} onChange={(e)=>setProvinceFilter(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 8 }}>
            {provinces.map(p=> <option key={p}>{p}</option>)}
          </select>
        </div>

        <div style={{ width: 180 }}>
          <label style={{ fontSize: 13 }}>Category</label>
          <select value={categoryFilter} onChange={(e)=>setCategoryFilter(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 8 }}>
            {categories.map(c=> <option key={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ width: 320 }}>
          <label style={{ fontSize: 13 }}>Search municipality</label>
          <input value={searchText} onChange={(e)=>setSearchText(e.target.value)} placeholder="Search name" style={{ width: "100%", padding: 8, borderRadius: 8 }} />
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={()=>downloadCsv("pdi_export.csv", tableRows)} style={{ padding: "8px 12px", borderRadius: 8, fontWeight: 700 }}>Export CSV</button>
          <button onClick={()=>{
            setProvinceFilter("All");
            setCategoryFilter("All");
            setSearchText("");
          }} style={{ padding: "8px 12px", borderRadius: 8 }}>Reset</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        <Card title="Top 10 PDI">
          <ol style={{ paddingLeft: 16, margin: 0 }}>
            {top10.map((r:any)=> <li key={r.MunicipalityCode}>{r.MunicipalityName} — {r.PDI?.toFixed(3)}</li>)}
          </ol>
        </Card>

        <Card title="Bottom 10 PDI">
          <ol style={{ paddingLeft: 16, margin: 0 }}>
            {bottom10.map((r:any)=> <li key={r.MunicipalityCode}>{r.MunicipalityName} — {r.PDI?.toFixed(3)}</li>)}
          </ol>
        </Card>

        <Card title="PDI Distribution (filtered)">
          <MiniHistogram values={ (tableRows||[]).map((r:any)=>numericVal(r.PDI)).filter(v=>v!=null) as number[] } width={340} height={50} />
        </Card>
      </div>

      <div style={{ marginTop: 18 }}>
        <Card title="PDI Municipalities">
          <div style={{ maxHeight: 520, overflow: "auto" }}>
            <SortableTable rows={tableRows} columns={columns} initialSort={{ key: "PDI", desc: true }} onRowClick={(r)=>navigate(`/profile?muni=${encodeURIComponent(r.MunicipalityCode)}`)} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PDIExplorer;
