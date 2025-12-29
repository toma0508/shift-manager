import { EmployeeWithAttendance, AttendanceStatus } from "@shared/schema";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmployeeCardProps {
  employee: EmployeeWithAttendance;
  onToggleAttendance: (employeeId: string) => void;
  isLoading: boolean;
}

const getStatusConfig = (status: AttendanceStatus) => {
  switch (status) {
    case 'not-checked-in':
      return {
        text: '出勤',
        className: 'bg-blue-500 text-white hover:bg-blue-600 font-medium',
        disabled: false
      };
    case 'working':
      return {
        text: '勤務中',
        className: 'bg-green-500 text-white hover:bg-green-600 font-medium',
        disabled: false
      };
    case 'checked-out':
      return {
        text: '退勤済',
        className: 'bg-gray-400 text-white cursor-default font-medium',
        disabled: true
      };
    default:
      return {
        text: '出勤',
        className: 'bg-blue-500 text-white hover:bg-blue-600 font-medium',
        disabled: false
      };
  }
};

export default function EmployeeCard({ employee, onToggleAttendance, isLoading }: EmployeeCardProps) {
  const statusConfig = getStatusConfig(employee.status);

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow"
      data-testid={`employee-card-${employee.id}`}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0"
          data-testid={`avatar-${employee.id}`}
        >
          <User className="w-5 h-5 text-gray-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div 
            className="font-medium text-sm text-gray-900 truncate"
            data-testid={`name-${employee.id}`}
          >
            {employee.name}
          </div>
          <div 
            className="text-xs text-gray-500"
            data-testid={`department-${employee.id}`}
          >
            {employee.department}
          </div>
        </div>
        
        <Button
          size="sm"
          className={`w-16 px-3 py-1 text-xs font-medium rounded-md transition-colors ${statusConfig.className}`}
          onClick={() => onToggleAttendance(employee.id)}
          disabled={statusConfig.disabled || isLoading}
          data-testid={`button-attendance-${employee.id}`}
        >
          {isLoading ? '処理中...' : statusConfig.text}
        </Button>
      </div>
    </div>
  );
}
