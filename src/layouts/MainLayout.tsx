import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppBar from "../components/layout/AppBar.tsx";
import SideNav from "../components/layout/SideNav.tsx";

export default function MainLayout() {
  const [sideNavOpen, setSideNavOpen] = useState(false);

  return (
    <div className="bg-gray-50">
      <AppBar onMenuToggle={() => setSideNavOpen((prev) => !prev)} />

      <div className="flex h-[95vh]">
        <SideNav isOpen={sideNavOpen} onClose={() => setSideNavOpen(false)} />

        {sideNavOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setSideNavOpen(false)}
          />
        )}

        <main className="flex-1 h-full overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
