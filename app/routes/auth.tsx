import { unstable_defineAction, unstable_defineLoader } from "@remix-run/cloudflare"
import { useFetcher } from "@remix-run/react"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/d1"
import { users } from "schema"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { commitSession, getSession } from "~/session"

export const loader = unstable_defineLoader(async ({ request, response }) => { 
    const session = await getSession(request.headers.get("Cookie"))

    console.log("userid", session.get("userId"))
    if (session.get("userId")) {
        response.status = 301
        response.headers.set("Location", "/")
        response.headers.set("Set-Cookie", await commitSession(session))
        return { status: 301 }
    }
    return { status: "success", message: "Not logged in"}
})

export default function AuthRoutes() {
    const f = useFetcher<typeof action>()

    console.log("actionData", f.data)
    const islogging = f.state === "submitting" && f.formData?.get("action") === "login"
    const isRegistering = f.state === "submitting" && f.formData?.get("action") === "register"
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="bg-blue-100 p-4 w-[70%] max-w-96 rounded-2xl shadow-lg shadow-blue-100">
                <f.Form method="POST" className="space-y-4">
                    <Input className="bg-white" type="text" required name="username" placeholder="Username" />
                    <Input className="bg-white" type="password" required name="password" placeholder="Password" />
                    <Button className="mr-2" type="submit" name="action" value="login">
                        {islogging ? "Logging in..." : "Login"}
                    </Button>
                    <Button type="submit" name="action" value="register">
                        {isRegistering ? "Registering..." : "Register"}
                    </Button>
                    {f.data && <p className="bg-blue-50 p-4 rounded-md font-semibold capitalize">{f.data.message}</p>}
                </f.Form>
            </div>
        </div>
    )
}



export const action = unstable_defineAction(async ({ request, context, response }) => {
    const formdata = await request.formData()
    const action = formdata.get("action")
    const db = drizzle(context.cloudflare.env.DB)
    const session = await getSession(request.headers.get("Cookie"))
   
    if (action === "login") {
        const data = await db.select().from(users).where(eq(users.username, formdata.get("username")!.toString()))
        console.log("data", data)
        if (data.length === 0) {
            return { status: "error", message: "User not found" }
        }
        if (data[0].password !== formdata.get("password")!.toString()) {
            return { status: "error", message: "Password incorrect" }
        }
       
        session.set("userId", data[0].id)
        response.status = 302
        response.headers.set("Set-Cookie", await commitSession(session))
        response.headers.set("Location", "/")
        return { status: "success", message: "Logged in"}
    } else if (action === "register") {
        try {
            const data = await db.insert(users).values({ username: formdata.get("username")!.toString(), password: formdata.get("password")!.toString() }).returning({ id: users.id})
            session.set("userId", data[0].id)
            response.status = 302
            response.headers.set("Set-Cookie", await commitSession(session))
            response.headers.set("Location", "/")
            return { status: "success", message: "Registered"}
        } catch (e) {
            console.log(e)
            return { status: "error", message: "User name taken" }
        }
    }
    return { status: "error", message: "Invalid action" }
})