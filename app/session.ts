// app/sessions.ts
import { createCookieSessionStorage } from "@remix-run/cloudflare"; // or cloudflare/deno

type SessionData = {
  userId: number;
};



const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: "__session",

      // all of these are optional
    //   domain: "tracker.cloudcreatr.com",
      // Expires can also be set (although maxAge overrides it when used in combination).
      // Note that this method is NOT recommended as `new Date` creates only one date on each server deployment, not a dynamic date in the future!
      //
      // expires: new Date(Date.now() + 60_000),
      httpOnly: true,
      maxAge: 2592000,
      path: "/",
      sameSite: "strict",
      secrets: ["s3cret1omm23"],
      secure: true,
    },
  });

export { getSession, commitSession, destroySession };
