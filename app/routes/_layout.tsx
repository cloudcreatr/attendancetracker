import { Outlet } from "@remix-run/react";

export default function Layout() {
    return (
        <div className="bg-red-500 text-white font-sans text-2xl">
            i am Layout component
            <Outlet />
        </div>
    )
}