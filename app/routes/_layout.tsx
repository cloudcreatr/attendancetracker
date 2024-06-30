import { unstable_defineLoader } from "@remix-run/cloudflare";
import { Await, Outlet, useFetcher, useLoaderData, useNavigation } from "@remix-run/react";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Suspense } from "react";
import { attendance } from "schema";
import { Button } from "~/components/ui/button";

import { getSession } from "~/session";

export const loader = unstable_defineLoader(
    async ({ request, response, context }) => {
        const session = await getSession(request.headers.get("Cookie"));
        const userId = session.get("userId");
        if (!userId) {
            response.status = 302;
            response.headers.set("Location", "/auth");
            console.log("userID", session.get("userId"));
            return { status: 401, message: "Unauthorized" };
        }

        const db = drizzle(context.cloudflare.env.DB);
        const attendanceList = db
            .select()
            .from(attendance)
            .where(eq(attendance.user_id, userId))
            .all();

        return { status: "success", attendanceList };
    }
);

function LogoutButton() {
    const f = useFetcher();
    const isLoggedOut =
        f.formData?.get("action") === "logout" && f.state === "submitting";
    return (
        <f.Form method="post" action="/" className="p-4">
            <input type="hidden" name="action" value="logout" />
            <Button type="submit" className="p-4">
                {isLoggedOut ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-6 animate-spin"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                        />
                    </svg>
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25"
                        />
                    </svg>
                )}
            </Button>
        </f.Form>
    );
}

export default function Layout() {
    const { attendanceList } = useLoaderData<typeof loader>();
    const navigation = useNavigation()
    const isNav = navigation.state === "loading"
    return (
        <div className=" h-screen flex flex-col justify-center items-center">
            <div className="bg-blue-50 max-w-2xl w-[90%] rounded-2xl shadow-xl shadow-blue-50 overflow-y-scroll h-[90%]">
                <div className="flex flex-row justify-between w-full items-center">
                    <LogoutButton />
                    {isNav && <div className="mr-4"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6  animate-spin">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    </div>}
                </div>
                <Suspense fallback={<div>loading</div>}>
                    <Await resolve={attendanceList}>
                        {(data) => {
                            if (!data) {
                                return <div>loading</div>;
                            }
                            console.log(data);
                            return (
                                <div>
                                    <TotalAttendancePresent data={data} />
                                    <Outlet context={data} />
                                </div>
                            );
                        }}
                    </Await>
                </Suspense>
            </div>
        </div>
    );
}

type List = {
    attendance: "A" | "B";
    date: number;
    id: number;
    sub_id: number;
    user_id: number;
}[];

function TotalAttendancePresent({ data }: { data: List }) {
    const totalA = data.filter((att) => att.attendance === "A").length;
    const totalB = data.filter((att) => att.attendance === "B").length;
    const total = totalA + totalB;
    let present = 0;
    if (total > 0) {
        present = (totalA / total) * 100;
    }

    return (
        <div className="flex justify-between items-center bg-white p-5 m-4 rounded-xl shadow-md ">
            <div className="text-gray-500 font-semibold">
                <p>Total Class Taken: {total} </p>

                <p>Total Present: {totalA}</p>
                <p>Total Absent: {totalB}</p>
            </div>
            <div className="font-bold text-6xl">{`${present.toFixed(2)}%`}</div>
        </div>
    );
}
