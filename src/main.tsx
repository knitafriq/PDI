import React from "react";
import ReactDOM from "react-dom/client";
import AppRoutes from "./routes/AppRoutes";
import { DataProvider } from "./context/DataContext";
import "./index.css";
import "leaflet/dist/leaflet.css";
import "leaflet/dist/leaflet.css";
import "./assets/leaflet-overrides.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DataProvider>
      <AppRoutes />
    </DataProvider>
  </React.StrictMode>
);
