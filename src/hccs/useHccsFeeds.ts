import { useEffect, useState } from "react";
import { loadHccsFeeds, type CsvRow } from "./data";

export interface HccsFeedState {
  loading: boolean;
  error: string;
  coverage: CsvRow[];
  municipalityDrivers: CsvRow[];
  provinceDrivers: CsvRow[];
  miifDrivers: CsvRow[];
  sourceMaster: CsvRow[];
  provinceCapacitySummary: CsvRow[];
}

const emptyState: HccsFeedState = {
  loading: true,
  error: "",
  coverage: [],
  municipalityDrivers: [],
  provinceDrivers: [],
  miifDrivers: [],
  sourceMaster: [],
  provinceCapacitySummary: [],
};

export function useHccsFeeds(): HccsFeedState {
  const [state, setState] = useState<HccsFeedState>(emptyState);

  useEffect(() => {
    let alive = true;

    loadHccsFeeds()
      .then((feeds) => {
        if (!alive) return;
        setState({
          loading: false,
          error: "",
          ...feeds,
        });
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setState({
          ...emptyState,
          loading: false,
          error: error instanceof Error ? error.message : String(error),
        });
      });

    return () => {
      alive = false;
    };
  }, []);

  return state;
}