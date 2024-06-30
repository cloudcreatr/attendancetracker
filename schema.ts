import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
  }
);

export const subjects = sqliteTable("subjects", {
    id: integer("id").primaryKey(),
    sub_name: text("sub_name").notNull(),
    user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull()
    
    
}, (table) => { 
    return {
        users_id_index: index("users_id_index_from_sub").on(table.user_id)
    }
})

export const attendance = sqliteTable("attendance", {
    id: integer("id").primaryKey(),
    date: integer("date").notNull(),
    attendance: text("attendance", { enum: ["A", "B"]}).notNull(),
    sub_id: integer("sub_id").references(() => subjects.id, { onDelete: "cascade" }).notNull(),
    user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull()
}, (table) => { 
    return {
        subjects_id_index: index("subjects_id_index").on(table.sub_id),
        users_id_index: index("users_id_index").on(table.user_id)
    }
})