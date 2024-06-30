import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import "./tailwind.css";
import { unstable_defineAction } from "@remix-run/cloudflare";
import { destroySession, getSession } from "./session";


export const action = unstable_defineAction(async ({ request, response }) => {
  const session = await getSession(request.headers.get("Cookie"))
  const formdata = await request.formData()
  const action = formdata.get("action")
  if (action === "logout" && session.get("userId")) {
    response.headers.set("Set-Cookie", await destroySession(session))
    response.status = 301
    response.headers.set("Location", "/auth")
    return { status: 301 }
  }

  return { status: 401, message: "Unauthorized" }
})

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
