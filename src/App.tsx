import React from "react";
import { useData } from "./context/DataContext";

function App() {
  const { loading, municipalities, pdiMinmax, error } = useData();

  if (loading) return <div style={{ padding: 20 }}>Loading data…</div>;
  if (error) return <div style={{ padding: 20 }}>Error: {error}</div>;

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <h1>Data Loaded Successfully</h1>
      <p>Municipalities: {municipalities.length}</p>
      <p>PDI rows: {pdiMinmax.length}</p>

      <hr />
      <h3>Sample municipality (first row)</h3>
      <pre style={{ whiteSpace: "pre-wrap", maxWidth: 900 }}>
        {JSON.stringify(municipalities[0] || {}, null, 2)}
      </pre>
    </div>
  );
}

export default App;
