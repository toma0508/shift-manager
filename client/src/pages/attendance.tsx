import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { EmployeeWithAttendance } from "@shared/schema";
import EmployeeCard from "@/components/employee-card";
import AttendanceHeader from "@/components/attendance-header";
import AttendanceFooter from "@/components/attendance-footer";
import { useEffect, useState } from "react";

interface AttendanceStats {
  total: number;
  working: number;
  checkedOut: number;
  notCheckedIn: number;
}

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [processingEmployeeId, setProcessingEmployeeId] = useState<string | null>(null);

  const { data: employees = [], isLoading } = useQuery<EmployeeWithAttendance[]>({
    queryKey: ["/api/employees"],
  });

  const { data: stats } = useQuery<AttendanceStats>({
    queryKey: ["/api/attendance/stats"],
  });

  const toggleAttendanceMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const response = await apiRequest("POST", `/api/employees/${employeeId}/toggle-attendance`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch both employees and stats
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/stats"] });
      setProcessingEmployeeId(null);
    },
    onError: () => {
      setProcessingEmployeeId(null);
    },
  });

  const handleToggleAttendance = (employeeId: string) => {
    setProcessingEmployeeId(employeeId);
    toggleAttendanceMutation.mutate(employeeId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16" data-testid="attendance-page">
      <AttendanceHeader stats={stats} />
      
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 gap-1 max-h-[calc(100vh-180px)] overflow-y-auto">
          {employees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onToggleAttendance={handleToggleAttendance}
              isLoading={processingEmployeeId === employee.id}
              data-testid={`employee-card-${employee.id}`}
            />
          ))}
        </div>
      </main>

      <AttendanceFooter stats={stats} />
    </div>
  );
}
