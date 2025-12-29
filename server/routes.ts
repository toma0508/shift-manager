import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { performanceMonitor } from "./middleware/performance";
import { insertEmployeeSchema, insertDepartmentSchema, AttendanceStatus } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all employees with today's attendance
  app.get("/api/employees", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const employees = await storage.getEmployeesWithTodayAttendance(today);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  // Toggle attendance status
  app.post("/api/employees/:id/toggle-attendance", async (req, res) => {
    try {
      const { id } = req.params;
      const today = new Date().toISOString().split('T')[0];
      
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const record = await storage.toggleAttendanceStatus(id, today);
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle attendance" });
    }
  });

  // Set attendance status for specific date
  app.post("/api/employees/:id/attendance/set", async (req, res) => {
    try {
      const { id } = req.params;
      const { date, status } = req.body;
      
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const record = await storage.toggleAttendanceStatus(id, date);
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to set attendance" });
    }
  });

  // Bulk update attendance
  app.post("/api/attendance/bulk-update", async (req, res) => {
    try {
      const { changes } = req.body;
      
      if (!Array.isArray(changes)) {
        return res.status(400).json({ message: "Changes must be an array" });
      }

      const results = [];
      for (const change of changes) {
        const { employeeId, date, checkinTime, checkoutTime, status } = change;
        
        // Create or update attendance record
        const record = await storage.setAttendanceRecord(employeeId, date, {
          checkinTime: checkinTime ? new Date(`${date}T${checkinTime}:00`) : null,
          checkoutTime: checkoutTime ? new Date(`${date}T${checkoutTime}:00`) : null,
          status: status || 'not-checked-in'
        });
        
        results.push(record);
      }
      
      res.json({ success: true, updated: results.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to bulk update attendance" });
    }
  });

  // Get attendance statistics for today
  app.get("/api/attendance/stats", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const employees = await storage.getEmployeesWithTodayAttendance(today);
      
      const stats = {
        total: employees.length,
        working: employees.filter(emp => emp.status === 'working').length,
        checkedOut: employees.filter(emp => emp.status === 'checked-out').length,
        notCheckedIn: employees.filter(emp => emp.status === 'not-checked-in').length
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Get attendance history for an employee
  app.get("/api/employees/:id/attendance/history", async (req, res) => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const history = await storage.getAttendanceHistory(id, limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance history" });
    }
  });

  // Department routes
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.post("/api/departments", async (req, res) => {
    try {
      const departmentData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(departmentData);
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid department data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  // Employee management routes
  app.post("/api/employees", async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  // Get individual employee
  app.get("/api/employees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  // Update employee
  app.put("/api/employees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.updateEmployee(id, employeeData);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  // Get employee attendance statistics
  app.get("/api/employees/:id/attendance/stats", async (req, res) => {
    try {
      const { id } = req.params;
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const history = await storage.getAttendanceHistory(id, 1000);
      
      const totalDays = history.length;
      const workingDays = history.filter(r => r.status === 'working' || r.status === 'checked-out').length;
      const absentDays = totalDays - workingDays;
      
      // Calculate average working hours
      const workingRecords = history.filter(r => r.checkinTime && r.checkoutTime);
      const totalHours = workingRecords.reduce((acc, record) => {
        const checkinTime = new Date(record.checkinTime!);
        const checkoutTime = new Date(record.checkoutTime!);
        const hours = (checkoutTime.getTime() - checkinTime.getTime()) / (1000 * 60 * 60);
        return acc + hours;
      }, 0);
      const averageWorkingHours = workingRecords.length > 0 ? totalHours / workingRecords.length : 0;

      // This week and month stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const thisWeekWorkingDays = history.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= weekAgo && (r.status === 'working' || r.status === 'checked-out');
      }).length;
      
      const thisMonthWorkingDays = history.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= monthAgo && (r.status === 'working' || r.status === 'checked-out');
      }).length;

      const stats = {
        totalDays,
        workingDays,
        absentDays,
        averageWorkingHours,
        thisWeekWorkingDays,
        thisMonthWorkingDays
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance statistics" });
    }
  });

  // Set attendance status (admin function)
  app.post("/api/employees/:id/attendance/set", async (req, res) => {
    try {
      const { id } = req.params;
      
      const setAttendanceSchema = z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        status: z.enum(['not-checked-in', 'working', 'checked-out']).optional(),
        checkinTime: z.string().optional(),
        checkoutTime: z.string().optional(),
      });
      
      const validation = setAttendanceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: validation.error.errors
        });
      }
      
      const { date, status, checkinTime, checkoutTime } = validation.data;
      
      console.log('Attendance set request:', { id, date, status, checkinTime, checkoutTime });
      
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Get current record to compare
      const currentRecord = await storage.getAttendanceRecord(id, date);
      console.log('Current record:', currentRecord);

      // Parse time strings to Date objects if provided
      let checkinDate: Date | null = null;
      let checkoutDate: Date | null = null;
      
      if (checkinTime && checkinTime.trim()) {
        const [hours, minutes] = checkinTime.split(':');
        checkinDate = new Date(date);
        checkinDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      
      if (checkoutTime && checkoutTime.trim()) {
        const [hours, minutes] = checkoutTime.split(':');
        checkoutDate = new Date(date);
        checkoutDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      console.log('Parsed times:', { checkinDate, checkoutDate });

      // Check if data actually changed
      if (currentRecord) {
        const currentCheckinTime = currentRecord.checkinTime ? new Date(currentRecord.checkinTime).getTime() : null;
        const currentCheckoutTime = currentRecord.checkoutTime ? new Date(currentRecord.checkoutTime).getTime() : null;
        const newCheckinTime = checkinDate ? checkinDate.getTime() : null;
        const newCheckoutTime = checkoutDate ? checkoutDate.getTime() : null;
        
        if (currentCheckinTime === newCheckinTime && currentCheckoutTime === newCheckoutTime) {
          console.log('No changes detected, returning current record');
          return res.json(currentRecord);
        }
      }

      const record = await storage.setAttendanceWithTimes(id, date, checkinDate, checkoutDate, status);
      res.json(record);
    } catch (error) {
      console.error('Error setting attendance:', error);
      res.status(500).json({ message: "Failed to set attendance status" });
    }
  });

  // Performance monitoring endpoints
  app.get("/api/performance/stats", async (req, res) => {
    try {
      const timeWindow = req.query.window ? parseInt(req.query.window as string) : 300000;
      const apiStats = performanceMonitor.getAPIStats(timeWindow);
      const dbStats = performanceMonitor.getDBStats(timeWindow);
      
      res.json({
        api: apiStats,
        database: dbStats,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch performance stats" });
    }
  });

  app.get("/api/performance/metrics", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const apiMetrics = performanceMonitor.getRecentAPIMetrics(limit);
      const dbMetrics = performanceMonitor.getRecentDBMetrics(limit);
      
      res.json({
        api: apiMetrics,
        database: dbMetrics
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
