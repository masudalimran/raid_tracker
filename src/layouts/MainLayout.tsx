import {Outlet} from "react-router-dom";
import AppBar from "../components/layout/AppBar.tsx";
import SideNav from "../components/layout/SideNav.tsx";

export default function MainLayout () {
    return (
        <div className="">
            <AppBar />

            <div className="flex h-[95vh]">
                <SideNav />
                <main className="border-2 border-white h-full w-full p-2">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}