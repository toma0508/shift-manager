import { employees, attendanceRecords, departments, type Employee, type InsertEmployee, type AttendanceRecord, type InsertAttendanceRecord, type EmployeeWithAttendance, type AttendanceStatus, type Department, type InsertDepartment } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { performanceMonitor } from "./middleware/performance";

export interface IStorage {
  // Department methods
  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  
  // Employee methods
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  
  // Attendance methods
  getAttendanceRecord(employeeId: string, date: string): Promise<AttendanceRecord | undefined>;
  getAttendanceHistory(employeeId: string, limit?: number): Promise<AttendanceRecord[]>;
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined>;
  setAttendanceStatus(employeeId: string, date: string, status: AttendanceStatus): Promise<AttendanceRecord>;
  setAttendanceWithTimes(employeeId: string, date: string, checkinTime: Date | null, checkoutTime: Date | null, status?: AttendanceStatus): Promise<AttendanceRecord>;
  
  // Combined methods
  getEmployeesWithTodayAttendance(date: string): Promise<EmployeeWithAttendance[]>;
  toggleAttendanceStatus(employeeId: string, date: string): Promise<AttendanceRecord>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Sample data initialization disabled - start fresh
    // this.initializeSampleDataIfEmpty();
  }

  private async initializeSampleDataIfEmpty() {
    // Disabled for fresh start
    return;
    try {
      const existingEmployees = await db.select().from(employees).limit(1);
      if (existingEmployees.length > 0) {
        return; // Data already exists
      }

      const sampleEmployees = [
        { name: "田中 太郎", department: "営業部" },
        { name: "佐藤 花子", department: "経理部" },
        { name: "高橋 次郎", department: "開発部" },
        { name: "山田 美咲", department: "人事部" },
        { name: "小林 健一", department: "営業部" },
        { name: "鈴木 由美", department: "マーケティング部" },
        { name: "伊藤 雄介", department: "開発部" },
        { name: "渡辺 恵子", department: "総務部" },
        { name: "中村 大輔", department: "営業部" },
        { name: "松本 裕子", department: "経理部" },
        { name: "木村 隆司", department: "開発部" },
        { name: "岡田 真理", department: "人事部" },
        { name: "前田 健太", department: "営業部" },
        { name: "吉田 麻美", department: "経理部" },
        { name: "加藤 信一", department: "開発部" },
        { name: "斎藤 直子", department: "総務部" },
        { name: "清水 宏樹", department: "営業部" },
        { name: "森田 優子", department: "マーケティング部" },
        { name: "橋本 和也", department: "開発部" },
        { name: "村上 千穂", department: "人事部" },
        { name: "石川 浩二", department: "営業部" },
        { name: "青木 里奈", department: "経理部" },
        { name: "藤田 雅之", department: "開発部" },
        { name: "長谷川 美香", department: "総務部" },
        { name: "西村 拓也", department: "営業部" },
        { name: "井上 聡美", department: "マーケティング部" },
        { name: "金子 大介", department: "開発部" },
        { name: "竹内 恵美", department: "人事部" },
        { name: "小川 誠", department: "営業部" },
        { name: "菊池 香織", department: "経理部" },
        { name: "岩田 光男", department: "開発部" },
        { name: "原田 由香", department: "総務部" },
        { name: "平井 修平", department: "営業部" },
        { name: "河野 智子", department: "マーケティング部" },
        { name: "池田 康博", department: "開発部" },
        { name: "安田 美紀", department: "人事部" },
        { name: "川村 亮太", department: "営業部" },
        { name: "田村 典子", department: "経理部" },
        { name: "上田 和彦", department: "開発部" },
        { name: "森本 久美子", department: "総務部" },
        { name: "内田 正人", department: "営業部" },
        { name: "山崎 沙織", department: "マーケティング部" },
        { name: "大野 英樹", department: "開発部" },
        { name: "坂本 理恵", department: "人事部" },
        { name: "柴田 啓介", department: "営業部" },
        { name: "三浦 真由美", department: "経理部" },
        { name: "宮本 孝志", department: "開発部" },
        { name: "今井 良子", department: "総務部" },
        { name: "大西 晃", department: "営業部" },
        { name: "永井 洋子", department: "マーケティング部" }
      ];

      const createdEmployees = [];
      for (const emp of sampleEmployees) {
        const employee = await this.createEmployee(emp);
        createdEmployees.push(employee);
      }

      // Add random attendance data for today
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      
      // Shuffle employees array for random distribution
      const shuffledEmployees = [...createdEmployees].sort(() => Math.random() - 0.5);
      
      // Distribute attendance status:
      // ~40% working, ~20% checked-out, ~40% not-checked-in
      const workingCount = Math.floor(shuffledEmployees.length * 0.4);
      const checkedOutCount = Math.floor(shuffledEmployees.length * 0.2);
      
      for (let i = 0; i < shuffledEmployees.length; i++) {
        const employee = shuffledEmployees[i];
        
        if (i < workingCount) {
          // Working employees (checked in but not out)
          const checkinTime = new Date(now);
          checkinTime.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60)); // 8:00-9:59
          
          await this.createAttendanceRecord({
            employeeId: employee.id,
            date: today,
            status: 'working',
            checkinTime,
            checkoutTime: null
          });
        } else if (i < workingCount + checkedOutCount) {
          // Checked out employees (completed work day)
          const checkinTime = new Date(now);
          checkinTime.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60)); // 8:00-9:59
          
          const checkoutTime = new Date(now);
          checkoutTime.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60)); // 17:00-18:59
          
          await this.createAttendanceRecord({
            employeeId: employee.id,
            date: today,
            status: 'checked-out',
            checkinTime,
            checkoutTime
          });
        }
        // Remaining employees stay as 'not-checked-in' (no record)
      }
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  }

  async getEmployees(): Promise<Employee[]> {
    const startTime = Date.now();
    try {
      const result = await db.select().from(employees);
      performanceMonitor.trackDatabaseQuery('SELECT * FROM employees', Date.now() - startTime, true);
      return result;
    } catch (error) {
      performanceMonitor.trackDatabaseQuery('SELECT * FROM employees', Date.now() - startTime, false);
      throw error;
    }
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db
      .insert(employees)
      .values(insertEmployee)
      .returning();
    return employee;
  }


  async getDepartments(): Promise<Department[]> {
    const result = await db.select().from(departments).orderBy(departments.name);
    return result;
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db
      .insert(departments)
      .values(insertDepartment)
      .returning();
    return department;
  }

  async getAttendanceRecord(employeeId: string, date: string): Promise<AttendanceRecord | undefined> {
    const [record] = await db
      .select()
      .from(attendanceRecords)
      .where(and(eq(attendanceRecords.employeeId, employeeId), eq(attendanceRecords.date, date)));
    return record || undefined;
  }

  async getAttendanceHistory(employeeId: string, limit = 30): Promise<AttendanceRecord[]> {
    return db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.employeeId, employeeId))
      .orderBy(desc(attendanceRecords.date))
      .limit(limit);
  }

  async createAttendanceRecord(insertRecord: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [record] = await db
      .insert(attendanceRecords)
      .values(insertRecord)
      .returning();
    return record;
  }

  async updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined> {
    const [record] = await db
      .update(attendanceRecords)
      .set(updates)
      .where(eq(attendanceRecords.id, id))
      .returning();
    return record || undefined;
  }

  async setAttendanceRecord(employeeId: string, date: string, data: {
    checkinTime: Date | null;
    checkoutTime: Date | null;
    status: AttendanceStatus;
  }): Promise<AttendanceRecord> {
    // Check if record exists
    const [existingRecord] = await db
      .select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.employeeId, employeeId),
        eq(attendanceRecords.date, date)
      ))
      .limit(1);

    if (existingRecord) {
      // Update existing record
      const [updatedRecord] = await db
        .update(attendanceRecords)
        .set({
          status: data.status,
          checkinTime: data.checkinTime,
          checkoutTime: data.checkoutTime,
        })
        .where(eq(attendanceRecords.id, existingRecord.id))
        .returning();
      return updatedRecord;
    } else {
      // Create new record
      const [newRecord] = await db
        .insert(attendanceRecords)
        .values({
          employeeId,
          date,
          status: data.status,
          checkinTime: data.checkinTime,
          checkoutTime: data.checkoutTime,
        })
        .returning();
      return newRecord;
    }
  }

  async getEmployeesWithTodayAttendance(date: string): Promise<EmployeeWithAttendance[]> {
    const startTime = Date.now();
    try {
      // Use a single JOIN query instead of separate queries for better performance
      const employeesWithAttendance = await db
        .select({
          id: employees.id,
          name: employees.name,
          department: employees.department,
          email: employees.email,
          avatar: employees.avatar,
          attendanceId: attendanceRecords.id,
          attendanceStatus: attendanceRecords.status,
          checkinTime: attendanceRecords.checkinTime,
          checkoutTime: attendanceRecords.checkoutTime,
        })
        .from(employees)
        .leftJoin(
          attendanceRecords,
          and(
            eq(attendanceRecords.employeeId, employees.id),
            eq(attendanceRecords.date, date)
          )
        );

      performanceMonitor.trackDatabaseQuery(`JOIN employees with attendance for ${date}`, Date.now() - startTime, true);
      
      // Transform the results
      return employeesWithAttendance.map(row => ({
        id: row.id,
        name: row.name,
        department: row.department,
        email: row.email,
        avatar: row.avatar || '👤',
        todayRecord: row.attendanceId ? {
          id: row.attendanceId,
          employeeId: row.id,
          date,
          status: row.attendanceStatus!,
          checkinTime: row.checkinTime,
          checkoutTime: row.checkoutTime,
        } : undefined,
        status: (row.attendanceStatus as AttendanceStatus) || 'not-checked-in'
      }));
    } catch (error) {
      performanceMonitor.trackDatabaseQuery(`getEmployeesWithTodayAttendance for ${date}`, Date.now() - startTime, false);
      throw error;
    }
  }

  async toggleAttendanceStatus(employeeId: string, date: string): Promise<AttendanceRecord> {
    const startTime = Date.now();
    try {
      // Use a single optimized query instead of multiple round trips
      const [existingRecord] = await db
        .select()
        .from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.employeeId, employeeId),
          eq(attendanceRecords.date, date)
        ))
        .limit(1);
      
      let record: AttendanceRecord;
      
      if (!existingRecord) {
        // Create new record - checking in
        const [newRecord] = await db
          .insert(attendanceRecords)
          .values({
            employeeId,
            date,
            status: 'working',
            checkinTime: new Date(),
            checkoutTime: null
          })
          .returning();
        record = newRecord;
      } else {
        // Update existing record if currently working
        const currentStatus = existingRecord.status as AttendanceStatus;
        
        if (currentStatus === 'working') {
          // Check out
          const [updatedRecord] = await db
            .update(attendanceRecords)
            .set({
              status: 'checked-out',
              checkoutTime: new Date()
            })
            .where(eq(attendanceRecords.id, existingRecord.id))
            .returning();
          record = updatedRecord;
        } else {
          // Already checked out, return existing record
          record = existingRecord;
        }
      }

      performanceMonitor.trackDatabaseQuery(`toggleAttendanceStatus for ${employeeId}`, Date.now() - startTime, true);
      return record;
    } catch (error) {
      performanceMonitor.trackDatabaseQuery(`toggleAttendanceStatus for ${employeeId}`, Date.now() - startTime, false);
      throw error;
    }
  }

  async setAttendanceStatus(employeeId: string, date: string, status: AttendanceStatus): Promise<AttendanceRecord> {
    let record = await this.getAttendanceRecord(employeeId, date);
    const now = new Date();
    
    if (!record) {
      // Create new record
      const insertData: InsertAttendanceRecord = {
        employeeId,
        date,
        status,
        checkinTime: status !== 'not-checked-in' ? now : null,
        checkoutTime: status === 'checked-out' ? now : null
      };
      record = await this.createAttendanceRecord(insertData);
    } else {
      // Update existing record
      const updates: Partial<AttendanceRecord> = { status };
      
      if (status === 'working' && !record.checkinTime) {
        updates.checkinTime = now;
        updates.checkoutTime = null;
      } else if (status === 'checked-out') {
        if (!record.checkinTime) {
          updates.checkinTime = now;
        }
        updates.checkoutTime = now;
      } else if (status === 'not-checked-in') {
        updates.checkinTime = null;
        updates.checkoutTime = null;
      }
      
      const updatedRecord = await this.updateAttendanceRecord(record.id, updates);
      record = updatedRecord!;
    }

    return record;
  }

  async setAttendanceWithTimes(
    employeeId: string, 
    date: string, 
    checkinTime: Date | null, 
    checkoutTime: Date | null, 
    status?: AttendanceStatus
  ): Promise<AttendanceRecord> {
    let record = await this.getAttendanceRecord(employeeId, date);
    
    console.log('setAttendanceWithTimes called with:', { employeeId, date, checkinTime, checkoutTime, status });
    console.log('Existing record:', record);
    
    // Determine status based on times if not provided
    let finalStatus = status;
    if (!finalStatus) {
      if (checkoutTime) {
        finalStatus = 'checked-out';
      } else if (checkinTime) {
        finalStatus = 'working';
      } else {
        finalStatus = 'not-checked-in';
      }
    }
    
    if (!record) {
      // Create new record
      console.log('Creating new record with status:', finalStatus);
      const insertData: InsertAttendanceRecord = {
        employeeId,
        date,
        status: finalStatus,
        checkinTime: checkinTime,
        checkoutTime: checkoutTime
      };
      record = await this.createAttendanceRecord(insertData);
      console.log('Created record:', record);
    } else {
      // Update existing record only if data has changed
      const updates: Partial<AttendanceRecord> = {};
      let hasChanges = false;
      
      if (record.status !== finalStatus) {
        updates.status = finalStatus;
        hasChanges = true;
        console.log('Status changed from', record.status, 'to', finalStatus);
      }
      
      // Compare times more carefully
      const currentCheckinTime = record.checkinTime ? new Date(record.checkinTime).getTime() : null;
      const currentCheckoutTime = record.checkoutTime ? new Date(record.checkoutTime).getTime() : null;
      const newCheckinTime = checkinTime ? checkinTime.getTime() : null;
      const newCheckoutTime = checkoutTime ? checkoutTime.getTime() : null;
      
      console.log('Time comparison:', {
        currentCheckinTime,
        newCheckinTime,
        currentCheckoutTime,
        newCheckoutTime
      });
      
      if (currentCheckinTime !== newCheckinTime) {
        updates.checkinTime = checkinTime;
        hasChanges = true;
        console.log('Checkin time changed');
      }
      
      if (currentCheckoutTime !== newCheckoutTime) {
        updates.checkoutTime = checkoutTime;
        hasChanges = true;
        console.log('Checkout time changed');
      }
      
      if (hasChanges) {
        console.log('Updating record with:', updates);
        const updatedRecord = await this.updateAttendanceRecord(record.id, updates);
        record = updatedRecord!;
        console.log('Updated record:', record);
      } else {
        console.log('No changes detected, returning existing record');
      }
    }

    return record;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const startTime = Date.now();
    
    try {
      const [updated] = await db
        .update(employees)
        .set(employee)
        .where(eq(employees.id, id))
        .returning();
      
      performanceMonitor.trackDatabaseQuery('updateEmployee', Date.now() - startTime, true);
      return updated;
    } catch (error) {
      performanceMonitor.trackDatabaseQuery('updateEmployee', Date.now() - startTime, false);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
