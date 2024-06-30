import { unstable_defineAction, unstable_defineLoader } from "@remix-run/cloudflare";
import { Await, useFetcher, useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { attendance } from "schema";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { strftime_YYYY_MM } from "./helper";
import { Suspense, useState } from "react";
import { getSession } from "~/session";
import { Progress } from "~/components/ui/progress";

export const loader = unstable_defineLoader(async ({ params, request, context }) => {
    const url = new URL(request.url)
    const date = new Date()

    const month = url.searchParams.get("month") ? Number(url.searchParams.get("month")) : date.getTime() / 1000
    const db = drizzle(context.cloudflare.env.DB)

    const subid = Number(params.subid)
    const attendanceList = db.select().from(attendance).where(and(
        eq(strftime_YYYY_MM(attendance.date), strftime_YYYY_MM(month)),
        eq(attendance.sub_id, subid)
    )).all()

    return {
        attendanceList
    }
})

function BackButton() {
    const navigate = useNavigate()
    return (
        <Button onClick={() => {
            navigate("/")
        }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
        </Button>
    )
}

export default function SubItem() {
    const data = useLoaderData<typeof loader>()
    const [searchParam, setSearchParam] = useSearchParams()
    const month = searchParam.get("month") ? new Date(Number(searchParam.get("month")) * 1000) : new Date()
    const [selectedDate, setSelectedDate] = useState(new Date())
    return (
        <div className="p-4">
            <BackButton />
            <Suspense fallback={<div>
                loading
            </div>}>

                <Await resolve={data.attendanceList}>
                    {
                        (attendanceList) => {

                            const presentArray = attendanceList.filter((a) => a.attendance === "A")
                            const absentArray = attendanceList.filter((a) => a.attendance === "B")
                            const presentDatesArray = presentArray.map((a) => new Date(a.date * 1000))

                            const absentDatesArray = absentArray.map((a) => new Date(a.date * 1000))
                            const totalAttendancePresent = presentArray.length + absentArray.length;

                            let attendancePercentage;
                            if (totalAttendancePresent > 0) {
                                attendancePercentage = (presentArray.length / totalAttendancePresent) * 100;
                            } else {
                                // Set attendancePercentage to 0 or another default value when there are no attendance records
                                attendancePercentage = 0;
                            }


                            return (
                                <div className="flex flex-col justify-center items-center">
                                    <div className="flex flex-col justify-center bg-white  rounded-xl mt-4 mb-4">
                                        <Calendar
                                            classNames={{
                                                day_today: "text-white",

                                            }}
                                            month={month} onMonthChange={(month) => {
                                                console.log(month.getTime() / 1000)
                                                setSearchParam({
                                                    month: (month.getTime() / 1000).toString()
                                                })
                                            }}
                                            mode="single"
                                            selected={selectedDate}
                                            onDayClick={(day) => {
                                                const epoch = day.getTime() / 1000

                                                console.log(epoch)
                                                console.log(new Date(epoch * 1000))
                                                setSelectedDate(day)
                                            }}
                                            modifiers={{
                                                absent: absentDatesArray,
                                                present: presentDatesArray
                                            }}
                                            modifiersClassNames={{ absent: "bg-red-600 shadow-md text-white ", present: "bg-green-500 text-white shadow-md" }}
                                        />

                                    </div>

                                    <div className="w-full">
                                        <Overview DatesList={attendanceList} selectedDate={selectedDate} />
                                    </div>
                                    <div className="bg-white shadow-md rounded-lg p-4 flex flex-col mt-4 w-full">
                                        <span className="font-bold text-gray-800">
                                            Attendance Percentage For {selectedDate.toDateString()}  { attendancePercentage !== null && `${attendancePercentage.toFixed(2)}%` }
                                        </span>
                                        <Progress value={attendancePercentage} max={100} className="w-full mt-4" />
                                    </div>
                                    <AddRecords seletedDay={selectedDate} />
                                </div>
                            )
                        }
                    }
                </Await>
            </Suspense>


        </div>
    )
}

function Overview({
    DatesList,
    selectedDate,
}: {
    DatesList: {
        attendance: "A" | "B";
        date: number;
        id: number;
        sub_id: number;
        user_id: number;
    }[]
    selectedDate: Date

}) {
    const overviewArray = DatesList.filter((a) => new Date(a.date * 1000).toDateString() === selectedDate.toDateString()
    )
    const f = useFetcher()

    if (overviewArray.length === 0) {
        return (
            <div className="border-2 border-gray-200 border-dotted bg-white p-6 rounded-md shadow-md text-gray-600 font-bold">
                No records found
            </div>
        )
    }

    return (
        <div>
            {overviewArray.map((a) => {
                return (
                    <div key={a.id} className={`${a.attendance === "A" ? "bg-green-300" : "bg-red-600"} w-full border-2 mt-3 shadow-md flex justify-between items-center p-4 text-xl font-bold rounded-xl`}>
                        {a.attendance}
                        <Button onClick={() => {
                            f.submit({
                                "action": "delete",
                                "id": a.id.toString()
                            }, {
                                method: "POST"
                            })
                        }}>

                            {
                                f.state === "submitting" && f.formData?.get("action") === "delete" && f.formData?.get("id") === a.id.toString() ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 animate-spin">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                                    : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    </svg>

                            }
                        </Button>
                    </div>
                )
            })}
        </div>
    )
}

function AddRecords({
    seletedDay
}: {
    seletedDay: Date
}) {
    const f = useFetcher()

    const isPresent = f.state === "submitting" && f.formData?.get("action") === "present"
    const isAbsent = f.state === "submitting" && f.formData?.get("action") === "absent"
    return (
        <div>
            <div method="POST" className="flex mt-4 gap-4">
                <Button className="bg-green-800" onClick={() => {
                    f.submit({
                        action: "present",
                        date: (seletedDay.getTime() / 1000).toString(),


                    }, {
                        method: "POST"

                    })

                }}>
                    {
                        isPresent ? "Adding" : "Add Present"
                    }
                </Button>
                <Button className="bg-red-600" onClick={() => {
                    f.submit({
                        action: "absent",
                        date: (seletedDay.getTime() / 1000).toString()
                    }, {
                        method: "POST"

                    })

                }}>
                    {
                        isAbsent ? "Adding" : "Add Absent"

                    } </Button>
            </div>
        </div>
    )
}


export const action = unstable_defineAction(async ({ request, context, params, response }) => {
    const formData = await request.formData()
    const db = drizzle(context.cloudflare.env.DB)
    const session = await getSession(request.headers.get("Cookie"))
    const userID = session.get("userId")
    if (!userID) {
        response.status = 302
        response.headers.set("Location", "/auth")
        throw response
    }
    if (formData.get("action") == "delete") {
        const id = Number(formData.get("id"))
        await db.delete(attendance).where(eq(attendance.id, id))
        return {
            status: "success"
        }
    }
    if (formData.get("action") === "present") {
        const subId = Number(params.subid)
        const date = Number(formData.get("date"))

        await db.insert(attendance).values({
            attendance: "A",
            date,
            sub_id: subId,
            user_id: userID
        })
        return {
            status: "success"
        }
    }
    if (formData.get("action") === "absent") {
        const subId = Number(params.subid)

        const date = Number(formData.get("date"))
        console.log(date)
        await db.insert(attendance).values({
            attendance: "B",
            date,
            sub_id: subId,
            user_id: userID
        })
        return {
            status: "success"
        }
    }
    return {
        status: "error"
    }
})