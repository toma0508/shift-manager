import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  department: text("department").notNull(),
  email: text("email"),
  avatar: text("avatar").default("👤"), // アイコン/アバター文字列
});

export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  status: text("status").notNull(), // 'not-checked-in' | 'working' | 'checked-out'
  checkinTime: timestamp("checkin_time"),
  checkoutTime: timestamp("checkout_time"),
}, (table) => ({
  employeeDateIdx: index("attendance_employee_date_idx").on(table.employeeId, table.date),
  dateStatusIdx: index("attendance_date_status_idx").on(table.date, table.status),
}));

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;

export type AttendanceStatus = 'not-checked-in' | 'working' | 'checked-out';

export interface EmployeeWithAttendance extends Employee {
  todayRecord?: AttendanceRecord;
  status: AttendanceStatus;
}
