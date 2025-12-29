import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { EmployeeWithAttendance, AttendanceStatus } from "@shared/schema";
import { useEffect, useState, useMemo } from "react";
import { User, Menu, X, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface AttendanceStats {
  total: number;
  working: number;
  checkedOut: number;
  notCheckedIn: number;
}

interface EmployeeCardProps {
  employee: EmployeeWithAttendance;
  onToggleAttendance: (employeeId: string) => void;
  isLoading: boolean;
}

const getStatusConfig = (status: AttendanceStatus) => {
  switch (status) {
    case "not-checked-in":
      return {
        text: "出勤",
        className: "bg-blue-500 text-white hover:bg-blue-600 font-medium",
        disabled: false,
      };
    case "working":
      return {
        text: "勤務中",
        className: "bg-green-500 text-white hover:bg-green-600 font-medium",
        disabled: false,
      };
    case "checked-out":
      return {
        text: "退勤済",
        className: "bg-gray-400 text-white cursor-default font-medium",
        disabled: true,
      };
    default:
      return {
        text: "出勤",
        className: "bg-blue-500 text-white hover:bg-blue-600 font-medium",
        disabled: false,
      };
  }
};

function EmployeeCard({
  employee,
  onToggleAttendance,
  isLoading,
}: EmployeeCardProps) {
  const statusConfig = getStatusConfig(employee.status);

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 sm:p-3 hover:shadow-sm transition-shadow"
      data-testid={`employee-card-${employee.id}`}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 sm:w-8 sm:h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0"
          data-testid={`avatar-${employee.id}`}
        >
          <User className="w-5 h-5 sm:w-5 sm:h-5 text-gray-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div
            className="font-medium text-base sm:text-sm text-gray-900 truncate"
            data-testid={`name-${employee.id}`}
            style={{ fontFamily: "Noto Sans JP, sans-serif" }}
          >
            {employee.name}
          </div>
          <div
            className="text-sm sm:text-xs text-gray-500"
            data-testid={`department-${employee.id}`}
            style={{ fontFamily: "Noto Sans JP, sans-serif" }}
          >
            {employee.department}
          </div>
        </div>

        <Button
          size="sm"
          className={`w-18 sm:w-16 px-3 py-2 sm:py-1 text-sm sm:text-xs font-medium rounded-md transition-colors ${statusConfig.className}`}
          onClick={() => onToggleAttendance(employee.id)}
          disabled={statusConfig.disabled || isLoading}
          data-testid={`button-attendance-${employee.id}`}
          style={{ fontFamily: "Noto Sans JP, sans-serif" }}
        >
          {isLoading ? "処理中..." : statusConfig.text}
        </Button>
      </div>
    </div>
  );
}

export default function AttendanceOptimisticPage() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [processingEmployeeId, setProcessingEmployeeId] = useState<
    string | null
  >(null);
  const [currentTime, setCurrentTime] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("全て");

  // Hidden click functionality
  const [hiddenClickCount, setHiddenClickCount] = useState(0);
  
  // Hamburger menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Local state for optimistic updates
  const [localEmployees, setLocalEmployees] = useState<
    EmployeeWithAttendance[]
  >([]);
  const [localStats, setLocalStats] = useState<AttendanceStats>({
    total: 0,
    working: 0,
    checkedOut: 0,
    notCheckedIn: 0,
  });

  const { data: employees = [], isLoading } = useQuery<
    EmployeeWithAttendance[]
  >({
    queryKey: ["/api/employees"],
  });

  const { data: stats } = useQuery<AttendanceStats>({
    queryKey: ["/api/attendance/stats"],
  });

  // Get unique departments for tabs
  const departments = useMemo(() => {
    const uniqueDepts = Array.from(
      new Set(localEmployees.map((emp) => emp.department)),
    ).sort();
    return ["全て", ...uniqueDepts];
  }, [localEmployees]);

  // Filter employees by selected department
  const filteredEmployees = useMemo(() => {
    if (selectedDepartment === "全て") {
      return localEmployees;
    }
    return localEmployees.filter(
      (emp) => emp.department === selectedDepartment,
    );
  }, [localEmployees, selectedDepartment]);

  // Sync server data with local state
  useEffect(() => {
    if (employees.length > 0) {
      setLocalEmployees(employees);
    }
  }, [employees]);

  useEffect(() => {
    if (stats) {
      setLocalStats(stats);
    }
  }, [stats]);

  const toggleAttendanceMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/employees/${employeeId}/toggle-attendance`,
      );
      return response.json();
    },
    onSuccess: () => {
      // Background sync with server - no need to clear processing state here
      // as it's already cleared by the timeout
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/stats"] });
    },
    onError: (error, employeeId) => {
      // Revert optimistic update on error
      setLocalEmployees(employees);
      setLocalStats(
        stats || { total: 0, working: 0, checkedOut: 0, notCheckedIn: 0 },
      );
      setProcessingEmployeeId(null);
      console.error("Failed to toggle attendance:", error);

      // Show error feedback
      // Could add toast notification here if needed
    },
  });

  const handleToggleAttendance = (employeeId: string) => {
    const employee = localEmployees.find((emp) => emp.id === employeeId);
    if (!employee || employee.status === "checked-out") return;

    // Set processing state for very brief visual feedback
    setProcessingEmployeeId(employeeId);

    // Optimistic UI update - immediately change the UI
    const updatedEmployees = localEmployees.map((emp) => {
      if (emp.id === employeeId) {
        const newStatus: AttendanceStatus =
          emp.status === "not-checked-in" ? "working" : "checked-out";
        return { ...emp, status: newStatus };
      }
      return emp;
    });

    // Update stats optimistically
    const newStats = { ...localStats };
    if (employee.status === "not-checked-in") {
      newStats.working++;
      newStats.notCheckedIn--;
    } else if (employee.status === "working") {
      newStats.working--;
      newStats.checkedOut++;
    }

    setLocalEmployees(updatedEmployees);
    setLocalStats(newStats);

    // Clear processing state immediately after optimistic update
    setTimeout(() => {
      setProcessingEmployeeId(null);
    }, 300); // Brief 300ms feedback, then clear

    // Execute backend mutation (runs in background)
    toggleAttendanceMutation.mutate(employeeId);
  };

  const updateTime = () => {
    const now = new Date();
    setCurrentTime(
      now.toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
  };

  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][now.getDay()];
    return `${year}年${month}月${day}日(${dayOfWeek})`;
  };

  const handleHiddenClick = () => {
    const newCount = hiddenClickCount + 1;
    setHiddenClickCount(newCount);

    if (newCount >= 10) {
      // 直接管理画面に遷移
      setLocation("/admin");
      setHiddenClickCount(0);
    }
  };

  const handleAdminClick = () => {
    // 直接管理画面に遷移
    setLocation("/admin");
  };

  const handleEmployeeClick = () => {
    // 従業員ページに遷移
    setLocation("/employees");
  };

  useEffect(() => {
    updateTime();

    // Update time every second
    const timeInterval = setInterval(updateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div
          className="text-lg text-gray-600"
          style={{ fontFamily: "Noto Sans JP, sans-serif" }}
        >
          読み込み中...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 pb-16"
      data-testid="attendance-page"
    >
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left Side: Hamburger Menu and Title */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-gray-100"
                data-testid="hamburger-menu"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              
              <h1
                className="text-lg sm:text-2xl font-bold text-gray-900 cursor-pointer select-none"
                style={{ fontFamily: "Noto Sans JP, sans-serif" }}
                onClick={handleHiddenClick}
              >
                勤怠管理システム
              </h1>
              
              {/* Admin and Employee Buttons for Desktop */}
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEmployeeClick}
                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900"
                  style={{ fontFamily: "Noto Sans JP, sans-serif" }}
                  data-testid="employee-button"
                >
                  <Users className="w-4 h-4" />
                  従業員
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAdminClick}
                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900"
                  style={{ fontFamily: "Noto Sans JP, sans-serif" }}
                  data-testid="admin-button"
                >
                  <Settings className="w-4 h-4" />
                  管理者へ
                </Button>
              </div>
            </div>

            {/* Right Side: Date and Time Display */}
            <div className="text-center sm:text-right">
              <div
                className="text-xs text-gray-600 mb-1"
                style={{ fontFamily: "Noto Sans JP, sans-serif" }}
              >
                {getCurrentDate()}
              </div>
              <div
                className="font-bold text-blue-600 text-xl sm:text-[25px]"
                style={{ fontFamily: "Noto Sans JP, sans-serif" }}
              >
                {currentTime}
              </div>
            </div>
          </div>
          
          {/* Status Legend - Below header */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span
                className="text-gray-600"
                style={{ fontFamily: "Noto Sans JP, sans-serif" }}
              >
                未出勤
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span
                className="text-gray-600"
                style={{ fontFamily: "Noto Sans JP, sans-serif" }}
              >
                勤務中
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span
                className="text-gray-600"
                style={{ fontFamily: "Noto Sans JP, sans-serif" }}
              >
                退勤済
              </span>
            </div>
          </div>
        </div>
      </header>
      {/* Hamburger Menu */}
      {isMenuOpen && (
        <div className="bg-white border-b border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="space-y-1">
              <h3 
                className="text-sm font-semibold text-gray-900 mb-3"
                style={{ fontFamily: "Noto Sans JP, sans-serif" }}
              >
                部門を選択
              </h3>
              {departments.map((department) => (
                <button
                  key={department}
                  onClick={() => {
                    setSelectedDepartment(department);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors ${
                    selectedDepartment === department
                      ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                  style={{ fontFamily: "Noto Sans JP, sans-serif" }}
                  data-testid={`menu-item-${department}`}
                >
                  <span className="font-medium">{department}</span>
                  <span className="text-xs text-gray-400">
                    {department !== "全て" 
                      ? `${localEmployees.filter(emp => emp.department === department).length}名`
                      : `${localEmployees.length}名`
                    }
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Main Content - Expanded for better usability */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="mb-3 sm:mb-4">
          <p
            className="text-sm text-gray-600"
            style={{ fontFamily: "Noto Sans JP, sans-serif" }}
          >
            {selectedDepartment === "全て"
              ? `全従業員 (${filteredEmployees.length}名)`
              : `${selectedDepartment} (${filteredEmployees.length}名)`}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-1 max-h-[calc(100vh-250px)] overflow-y-auto">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onToggleAttendance={handleToggleAttendance}
              isLoading={processingEmployeeId === employee.id}
            />
          ))}
        </div>
      </main>
      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-2 sm:py-3">
        <div className="max-w-7xl mx-auto">
          <div
            className="flex items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600 flex-wrap"
            style={{ fontFamily: "Noto Sans JP, sans-serif" }}
          >
            <span className="whitespace-nowrap">総従業員数: {localStats.total}名</span>
            <span className="whitespace-nowrap">出勤中: {localStats.working}名</span>
            <span className="whitespace-nowrap">退勤済: {localStats.checkedOut}名</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
