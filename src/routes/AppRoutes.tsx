import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "../layout/Layout";
import DashboardOverview from "../pages/DashboardOverview";
import Themes from "../pages/Themes";
import PDIExplorer from "../pages/PDIExplorer";
import Compare from "../pages/Compare";
import Profile from "../pages/Profile";

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="themes" element={<Themes />} />
          <Route path="pdi" element={<PDIExplorer />} />
          <Route path="compare" element={<Compare />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
