import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ModelAccessGate from "./components/ModelAccessGate";
import AudienceLanding from "./pages/AudienceLanding";
import ConsultationStudio from "./pages/ConsultationStudio";
import Overview from "./pages/Overview";
import Themes from "./pages/Themes";
import Compare from "./pages/Compare";
import Profile from "./pages/Profile";
import Glossary from "./pages/Glossary";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AudienceLanding />} />
        <Route path="/consultation" element={<ConsultationStudio />} />

        <Route element={<ModelAccessGate />}>
          <Route element={<Layout />}>
            <Route path="/glossary" element={<Glossary />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/themes" element={<Themes />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}