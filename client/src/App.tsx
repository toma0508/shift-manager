import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import NotFound from "@/pages/not-found";
import AttendancePage from "@/pages/attendance-optimistic";
import AdminPage from "@/pages/admin";
import AdminEmployeesPage from "@/pages/admin-employees";
import AdminDepartmentsPage from "@/pages/admin-departments";
import AdminAttendanceBulkPage from "@/pages/admin-attendance-bulk";
import AdminAttendanceCalendarPage from "@/pages/admin-attendance-calendar";
import EmployeeSettingsPage from "@/pages/employee-settings";
import EmployeeAttendanceDetailPage from "@/pages/employee-attendance-detail";
import PerformancePage from "@/pages/performance";
import EmployeesPage from "@/pages/employees";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AttendancePage} />
      <Route path="/employees" component={EmployeesPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/employees" component={AdminEmployeesPage} />
      <Route path="/admin/departments" component={AdminDepartmentsPage} />
      <Route path="/admin/attendance-bulk" component={AdminAttendanceBulkPage} />
      <Route path="/admin/attendance-calendar" component={AdminAttendanceCalendarPage} />
      <Route path="/admin/employees/:id/settings" component={EmployeeSettingsPage} />
      <Route path="/admin/employees/:id/attendance" component={EmployeeAttendanceDetailPage} />
      <Route path="/admin/performance" component={PerformancePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
