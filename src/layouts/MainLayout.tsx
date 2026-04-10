import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppBar from "../components/layout/AppBar.tsx";
import SideNav from "../components/layout/SideNav.tsx";

export default function MainLayout() {
  const [sideNavOpen, setSideNavOpen] = useState(false);

  return (
    <div>
      <AppBar onMenuToggle={() => setSideNavOpen((prev) => !prev)} />

      <div className="flex h-[95vh]">
        <SideNav isOpen={sideNavOpen} onClose={() => setSideNavOpen(false)} />

        {/* Backdrop overlay on mobile when nav is open */}
        {sideNavOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSideNavOpen(false)}
          />
        )}

        <main className="border-2 border-white h-full w-full p-2 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
