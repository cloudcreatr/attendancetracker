interface Sub {
    id: number;
    sub_name: string;
    user_id: number;
}
import { Link, useFetcher } from "@remix-run/react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"



function Statusbox({ placeholder }: {
    placeholder: string;

}) {
    return (
        <div className="text-sm italic font-medium text-gray-500 animate-pulse">
            {placeholder}
        </div>
    )
}

type AttendanceList = Array<{
    date: number;
    id: number;
    user_id: number;
    sub_id: number;
    attendance: "A" | "B";
}>

export function SubjectItem({
    Sub,
    attendanceList
}: {
    Sub: Sub;
    attendanceList: AttendanceList;

}) {
    const f = useFetcher()
    const isDeleting = f.formData?.get("action") === "delete" && f.state === "submitting" && f.formData?.get("sub_id") === Sub.id.toString()
    const isPresent = f.formData?.get("action") === "present" && f.state === "submitting" && f.formData?.get("sub_id") === Sub.id.toString()
    const isAbsent = f.formData?.get("action") === "absent" && f.state === "submitting" && f.formData?.get("sub_id") === Sub.id.toString()

    const present = attendanceList.filter((att) => att.attendance === "A" && att.sub_id === Sub.id).length
    const total = attendanceList.filter((att) => att.sub_id === Sub.id).length
    const precentage = total > 0 ? (present / total) * 100 : 0

    return (
        <div className="bg-white rounded-md p-4 font-bold border-2 border-gray-50 shadow-md flex justify-between items-center">
            <div>

                <div>{isDeleting ? <div>Deleting...</div> : <div>{Sub.sub_name}</div>}
                    <p className="text-sm font-medium mt-2 text-gray-600">
                        {`${precentage.toFixed(2)}% you have attended ${present} out of ${total} classes`}
                </p>
                </div>
                {isPresent && <Statusbox placeholder="(Marking as Present)" />}
                {isAbsent && <Statusbox placeholder="(Marking as Absent)" />}
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                </svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>More Settings</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => {
                        f.submit({
                            "action": "delete",
                            "sub_id": Sub.id
                        }, {
                            method: "post"
                        })
                    }}>Delete Subject</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => {
                        f.submit({
                            "action": "present",
                            "sub_id": Sub.id
                        }, {
                            method: "post"
                        })


                    }}>Add Present</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => {
                        f.submit({
                            "action": "absent",
                            "sub_id": Sub.id
                        }, {
                            method: "post"
                        })
                    }}> Add Absent</DropdownMenuItem>
                    <DropdownMenuItem>
                        <Link to={`/${Sub.id}`}>View More</Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

        </div>
    )
}