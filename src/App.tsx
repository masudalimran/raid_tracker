import { Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import Home from "./screens/Home";
import MainLayout from "./layouts/MainLayout.tsx";
import Champions from "./screens/Champions.tsx";
import Login from "./screens/Login.tsx";
import SignUp from "./screens/SignUp.tsx";
import Onboarding from "./screens/Onboarding.tsx";
import PageNotFound from "./screens/PageNotFound.tsx";
import RtkSync from "./screens/RtkSync.tsx";
import ShardLog from "./screens/ShardLog.tsx";
import ImportJson from "./screens/ImportJson.tsx";
import Analytics from "./screens/Analytics.tsx";
import PriorityQueue from "./screens/PriorityQueue.tsx";
import { useEffect } from "react";
import { AREA_ROUTES } from "./components/modals/AreanRoutes.ts";
import BaseAreaTeam from "./components/base/BaseAreaTeam.tsx";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const supabase_auth = localStorage.getItem("supabase_auth");
    const publicRoutes = ["/login", "/signup"];
    const currentPath = window.location.pathname;

    if (!supabase_auth && !publicRoutes.includes(currentPath) && currentPath !== "/onboarding") {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/champions" element={<Champions />} />
        <Route path="/import-json" element={<ImportJson />} />
        <Route path="/priority-queue" element={<PriorityQueue />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/rtk-sync" element={<RtkSync />} />
        <Route path="/shard-log" element={<ShardLog />} />
        {AREA_ROUTES.map((area) => (
          <Route
            key={area.path}
            path={`/${area.path}`}
            element={
              <BaseAreaTeam
                title={area.title}
                teamKey={area.teamKey}
                maxChampions={area.maxChampions}
                isFaction={!!area.isFaction}
                isHydra={!!area.isHydra}
              />
            }
          />
        ))}
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
