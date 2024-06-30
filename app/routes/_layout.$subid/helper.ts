import { AnyColumn, sql } from "drizzle-orm";

export function strftime_YYYY_MM(Col: AnyColumn | number) {
    return sql`strftime('%Y:%m',${Col}, 'unixepoch', '+05:30')`;
}