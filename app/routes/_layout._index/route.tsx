import { unstable_defineAction, unstable_defineLoader, type MetaFunction } from "@remix-run/cloudflare";
import { Await, useFetcher, useLoaderData, useOutletContext } from "@remix-run/react";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Suspense } from "react";
import { attendance, subjects } from "schema";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { getSession } from "~/session";
import { SubjectItem } from "./subitem";


export const meta: MetaFunction = () => {
    return [
        { title: "Attendance Tracker" },
        {
            name: "description",
            content: "Attendance Tracker for students",
        },
    ];
};


export const loader = unstable_defineLoader(async ({ context, request, response }) => {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");
    if (!userId) {
        response.status = 302;
        response.headers.set("Location", "/auth");
        throw response;
    }
    const db = drizzle(context.cloudflare.env.DB)
    const subjectsList = db.select().from(subjects).where(eq(subjects.user_id, userId)).all()
    return {
        SubList: subjectsList
    };
})


type om = Array< {
    date: number;
    id: number;
    user_id: number;
    sub_id: number;
    attendance: "A" | "B";
}>

export default function Index() {
    const f = useFetcher();
    const isAdding = f.formData?.get("action") === "add" && f.state === "submitting";
    const { SubList } = useLoaderData<typeof loader>()
    const data = useOutletContext() as om
    return (
        <div className="font-sans p-4  ">
            <Suspense fallback={<div>loading</div>}>
                <Await resolve={SubList}>

                    {SubList => {
                        return (
                            <div className="space-y-4  max-h-[600px] overflow-y-scroll">
                                {SubList.length !== 0 ?
                                    SubList.map((sub) => {
                                        const list = data.filter((item) => item.sub_id === sub.id)
                                        return <SubjectItem key={sub.id} Sub={sub} attendanceList={list}/>
                                    }) :
                                    <div className="border-2 border-dotted p-5 rounded-md bg-white shadow-sm font-bold text-gray-400">No Subjects</div>}


                            </div>
                        )
                    }}
                </Await>
            </Suspense>

            <f.Form method="post" className="mt-6 space-y-2">

                <Input name="sub_name" className="bg-white" required placeholder="Enter Subject Name" />
                <Button disabled={isAdding} name="action" type="submit" value="add">
                    {isAdding ? "Adding..." : "Add Subject"}
                </Button>
            </f.Form>

        </div>
    );
}


export const action = unstable_defineAction(async ({ request, context, response }) => {
    const formdata = await request.formData();
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");
    if (!userId) {
        response.status = 302
        response.headers.set("Location", "/auth")
        return { status: 401, message: "Unauthorized" }
    }
    if (formdata.get("action") === "add") {
        const db = drizzle(context.cloudflare.env.DB)
        await db.insert(subjects).values({
            sub_name: formdata.get("sub_name")!.toString(),
            user_id: userId
        })
        return {
            status: "success"
        }
    }
    if (formdata.get("action") === "delete") {
        const db = drizzle(context.cloudflare.env.DB)
        await db.delete(subjects).where(eq(subjects.id, Number(formdata.get("sub_id")!)))
        return {
            status: "success"
        }
    }


    if (formdata.get("action") === "present") {
        const db = drizzle(context.cloudflare.env.DB)
        const currentUTCEpochInSeconds = Math.floor(Date.now() / 1000);
        await db.insert(attendance).values({
            user_id: userId,
            sub_id: Number(formdata.get("sub_id")!),
            attendance: "A",
            date: currentUTCEpochInSeconds
        })
        return {
            status: "success"
        }
    }
    if (formdata.get("action") === "absent") {
        const db = drizzle(context.cloudflare.env.DB)
        const currentUTCEpochInSeconds = Math.floor(Date.now() / 1000);
        await db.insert(attendance).values({
            user_id: userId,
            sub_id: Number(formdata.get("sub_id")!),
            attendance: "B",
            date: currentUTCEpochInSeconds
        })
        return {
            status: "success"
        }
    }
})