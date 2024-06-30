import { unstable_defineAction, unstable_defineLoader } from "@remix-run/cloudflare";
import { Outlet, useFetcher } from "@remix-run/react";
import { Button } from "~/components/ui/button";

import { destroySession, getSession } from "~/session";

export const loader = unstable_defineLoader(async ({ request, response }) => {
    const session = await getSession(request.headers.get("Cookie"))
    if (!session.get("userId")) {
        response.status = 401
        response.headers.set("Location", "/auth")

        return { status: 401, message: "Unauthorized" }
    }
    return { status: "success" }
})


function LogoutButton() {
    const f = useFetcher()
    return (
        <f.Form method="post" action="/">
            <input type="hidden" name="action" value="logout" />
            <Button type="submit">Logout</Button>
        </f.Form>
    )
}

export default function Layout() {
    return (
        <div className="bg-red-500 text-white font-sans text-2xl">
            i am Layout component
            <LogoutButton />
            <Outlet />
          
        </div>
    )
}

