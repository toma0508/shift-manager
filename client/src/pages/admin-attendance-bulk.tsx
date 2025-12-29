import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Calendar, Edit } from "lucide-react";
import { AttendanceRecord, type Employee } from "@shared/schema";

interface BulkAttendanceEdit {
  employeeId: string;
  date: string;
  checkinTime: string;
  checkoutTime: string;
  status: 'not-checked-in' | 'working' | 'checked-out';
}

interface EditableCell {
  employeeId: string;
  date: string;
  field: 'checkinTime' | 'checkoutTime';
}

export default function AdminAttendanceBulkPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Current month for display
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Editing state
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const [pendingChanges, setPendingChanges] = useState<Record<string, BulkAttendanceEdit>>({});

  // Fetch employees
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Fetch attendance history for current month
  const { data: attendanceHistory = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/attendance/bulk", selectedYear, selectedMonth],
    queryFn: async () => {
      if (employees.length === 0) return [];
      // Get attendance for all employees for current month
      const records = await Promise.all(
        employees.map(async (emp) => {
          const response = await apiRequest("GET", `/api/employees/${emp.id}/attendance/history?limit=31`);
          return response as AttendanceRecord[];
        })
      );
      return records.flat();
    },
    enabled: employees.length > 0,
  });

  // Save bulk changes mutation
  const bulkSaveMutation = useMutation({
    mutationFn: async (changes: BulkAttendanceEdit[]) => {
      return apiRequest("POST", "/api/attendance/bulk-update", { changes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/bulk"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setPendingChanges({});
    },
  });

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get dates for current month
  const getMonthDates = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const dates = [];
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(selectedYear, selectedMonth, day));
    }
    return dates;
  };

  // Get attendance record for specific employee and date
  const getAttendanceRecord = (employeeId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return attendanceHistory.find((record: AttendanceRecord) => 
      record.employeeId === employeeId && record.date === dateStr
    );
  };

  // Get pending change for specific employee and date
  const getPendingChange = (employeeId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return pendingChanges[`${employeeId}-${dateStr}`];
  };

  // Start editing a cell
  const startEdit = (employeeId: string, date: Date, field: 'checkinTime' | 'checkoutTime') => {
    const dateStr = date.toISOString().split('T')[0];
    const record = getAttendanceRecord(employeeId, date);
    const pendingChange = getPendingChange(employeeId, date);
    
    let currentValue = "";
    if (pendingChange) {
      currentValue = pendingChange[field];
    } else if (record && record[field]) {
      currentValue = new Date(record[field]).toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    setEditingCell({ employeeId, date: dateStr, field });
    setEditValue(currentValue);
  };

  // Save edit
  const saveEdit = () => {
    if (!editingCell) return;
    
    const { employeeId, date, field } = editingCell;
    const key = `${employeeId}-${date}`;
    
    const existingChange = pendingChanges[key] || {
      employeeId,
      date,
      checkinTime: "",
      checkoutTime: "",
      status: 'not-checked-in' as const
    };
    
    const updatedChange = {
      ...existingChange,
      [field]: editValue,
      status: field === 'checkinTime' ? 'working' as const : 'checked-out' as const
    };
    
    setPendingChanges(prev => ({
      ...prev,
      [key]: updatedChange
    }));
    
    setEditingCell(null);
    setEditValue("");
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  // Save all changes
  const saveAllChanges = () => {
    const changes = Object.values(pendingChanges);
    if (changes.length > 0) {
      bulkSaveMutation.mutate(changes);
    }
  };

  // Month navigation
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const monthDates = getMonthDates();

  return (
    <div className="min-h-screen bg-gray-25" style={{ backgroundColor: '#fafafa' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/admin')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                戻る
              </Button>
              <h1 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                勤怠一括入力
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {Object.keys(pendingChanges).length > 0 && (
                <Button 
                  onClick={saveAllChanges}
                  disabled={bulkSaveMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {Object.keys(pendingChanges).length}件保存
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                <Calendar className="w-5 h-5" />
                {selectedYear}年 {monthNames[selectedMonth]} - 勤怠一括入力
              </CardTitle>
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                  セルをクリックして編集
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-sm">
                      従業員
                    </th>
                    {monthDates.map(date => (
                      <th 
                        key={date.toISOString()} 
                        className="border border-gray-300 px-2 py-2 text-center font-semibold text-xs min-w-[120px]"
                      >
                        <div style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                          {date.getDate()}日
                        </div>
                        <div className="text-xs text-gray-500">
                          {['日', '月', '火', '水', '木', '金', '土'][date.getDay()]}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map(employee => (
                    <tr key={employee.id} className="hover:bg-gray-25">
                      <td className="border border-gray-300 px-3 py-2 font-medium bg-gray-50">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{employee.avatar}</span>
                          <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                            {employee.name}
                          </span>
                        </div>
                      </td>
                      {monthDates.map(date => {
                        const dateStr = date.toISOString().split('T')[0];
                        const record = getAttendanceRecord(employee.id, date);
                        const pendingChange = getPendingChange(employee.id, date);
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        
                        return (
                          <td 
                            key={dateStr} 
                            className={`border border-gray-300 p-1 ${isWeekend ? 'bg-blue-50' : ''}`}
                          >
                            <div className="space-y-1">
                              {/* Check-in time */}
                              <div
                                className={`text-xs p-1 rounded cursor-pointer hover:bg-gray-100 border ${
                                  editingCell?.employeeId === employee.id && 
                                  editingCell?.date === dateStr && 
                                  editingCell?.field === 'checkinTime'
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200'
                                } ${pendingChange?.checkinTime ? 'bg-yellow-50 border-yellow-300' : ''}`}
                                onClick={() => startEdit(employee.id, date, 'checkinTime')}
                              >
                                {editingCell?.employeeId === employee.id && 
                                 editingCell?.date === dateStr && 
                                 editingCell?.field === 'checkinTime' ? (
                                  <Input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={saveEdit}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEdit();
                                      if (e.key === 'Escape') cancelEdit();
                                    }}
                                    placeholder="09:00"
                                    className="h-6 text-xs border-0 p-0 focus:ring-0"
                                    autoFocus
                                  />
                                ) : (
                                  <div className="text-center">
                                    {pendingChange?.checkinTime || 
                                     (record?.checkinTime ? 
                                       new Date(record.checkinTime).toLocaleTimeString('ja-JP', { 
                                         hour: '2-digit', 
                                         minute: '2-digit',
                                         hour12: false 
                                       }) : 
                                       '-'
                                     )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Check-out time */}
                              <div
                                className={`text-xs p-1 rounded cursor-pointer hover:bg-gray-100 border ${
                                  editingCell?.employeeId === employee.id && 
                                  editingCell?.date === dateStr && 
                                  editingCell?.field === 'checkoutTime'
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200'
                                } ${pendingChange?.checkoutTime ? 'bg-yellow-50 border-yellow-300' : ''}`}
                                onClick={() => startEdit(employee.id, date, 'checkoutTime')}
                              >
                                {editingCell?.employeeId === employee.id && 
                                 editingCell?.date === dateStr && 
                                 editingCell?.field === 'checkoutTime' ? (
                                  <Input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={saveEdit}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEdit();
                                      if (e.key === 'Escape') cancelEdit();
                                    }}
                                    placeholder="18:00"
                                    className="h-6 text-xs border-0 p-0 focus:ring-0"
                                    autoFocus
                                  />
                                ) : (
                                  <div className="text-center">
                                    {pendingChange?.checkoutTime || 
                                     (record?.checkoutTime ? 
                                       new Date(record.checkoutTime).toLocaleTimeString('ja-JP', { 
                                         hour: '2-digit', 
                                         minute: '2-digit',
                                         hour12: false 
                                       }) : 
                                       '-'
                                     )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>土日</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-50 border border-yellow-300 rounded"></div>
                <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>編集済み</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 border border-blue-500 rounded"></div>
                <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>編集中</span>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
              <p>• 各セルをクリックして時刻を入力してください（例：09:00, 18:00）</p>
              <p>• Enterキーで確定、Escapeキーでキャンセルできます</p>
              <p>• 変更された項目は黄色でハイライトされ、「保存」ボタンで一括保存できます</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}