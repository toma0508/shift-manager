import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Edit, Clock } from "lucide-react";
import { AttendanceRecord, type Employee } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const attendanceEditSchema = z.object({
  checkinTime: z.string().optional(),
  checkoutTime: z.string().optional(),
  status: z.enum(['not-checked-in', 'working', 'checked-out']),
});

type AttendanceEditForm = z.infer<typeof attendanceEditSchema>;

export default function AdminAttendanceCalendarPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Current month for display
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch employees
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Set first employee as default when employees load
  useEffect(() => {
    if (employees.length > 0 && !selectedEmployee) {
      setSelectedEmployee(employees[0].id);
    }
  }, [employees, selectedEmployee]);

  // Fetch attendance history for selected employee
  const { data: attendanceHistory = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/employees", selectedEmployee, "attendance", "history"],
    queryFn: async () => {
      if (!selectedEmployee) return [];
      const response = await apiRequest("GET", `/api/employees/${selectedEmployee}/attendance/history?limit=31`);
      return response as unknown as AttendanceRecord[];
    },
    enabled: !!selectedEmployee,
  });

  // Form for editing attendance
  const form = useForm<AttendanceEditForm>({
    resolver: zodResolver(attendanceEditSchema),
    defaultValues: {
      checkinTime: "",
      checkoutTime: "",
      status: 'not-checked-in',
    },
  });

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async (data: { date: string; checkinTime?: string; checkoutTime?: string; status: string }) => {
      return apiRequest("POST", `/api/employees/${selectedEmployee}/attendance/set`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", selectedEmployee, "attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsDialogOpen(false);
      setEditingDate(null);
      toast({
        title: "勤怠データを更新しました",
        description: "出退勤時刻が正常に保存されました。",
      });
    },
  });

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Get attendance record for specific date
  const getAttendanceRecord = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    if (!Array.isArray(attendanceHistory)) {
      return undefined;
    }
    return attendanceHistory.find((record: AttendanceRecord) => record.date === dateStr);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
    const days = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(selectedYear, selectedMonth, day));
    }

    return days;
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const record = getAttendanceRecord(date);
    
    // Set form values
    form.reset({
      checkinTime: record?.checkinTime ? 
        new Date(record.checkinTime).toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }) : "",
      checkoutTime: record?.checkoutTime ? 
        new Date(record.checkoutTime).toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }) : "",
      status: (record?.status as 'not-checked-in' | 'working' | 'checked-out') || 'not-checked-in',
    });
    
    setEditingDate(dateStr);
    setIsDialogOpen(true);
  };

  // Handle form submit
  const onSubmit = (data: AttendanceEditForm) => {
    if (!editingDate) return;
    
    updateAttendanceMutation.mutate({
      date: editingDate,
      checkinTime: data.checkinTime || undefined,
      checkoutTime: data.checkoutTime || undefined,
      status: data.status,
    });
  };

  // Month navigation
  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const calendarDays = generateCalendarDays();
  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);

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
                勤怠カレンダー
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="従業員を選択" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex items-center gap-2">
                        <span>{employee.avatar}</span>
                        <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                          {employee.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {selectedEmployeeData && (
                  <>
                    <span>{selectedEmployeeData.avatar}</span>
                    <span>{selectedEmployeeData.name}</span>
                    <span className="text-sm text-gray-500">の勤怠カレンダー</span>
                  </>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={prevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-lg font-semibold min-w-[120px] text-center" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                  {selectedYear}年 {monthNames[selectedMonth]}
                </span>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {dayNames.map(day => (
                <div 
                  key={day} 
                  className="p-2 text-center font-semibold text-sm bg-gray-50 border"
                  style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                >
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={index} className="h-24 border border-gray-200 bg-gray-50"></div>;
                }
                
                const record = getAttendanceRecord(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                
                return (
                  <div 
                    key={date.toISOString()} 
                    className={`h-24 border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isToday ? 'bg-blue-50 border-blue-300' : 
                      isWeekend ? 'bg-gray-50' : 'bg-white'
                    }`}
                    onClick={() => handleDateClick(date)}
                  >
                    <div className="flex flex-col h-full">
                      <div className={`text-xs font-semibold mb-1 ${
                        isToday ? 'text-blue-600' : 
                        isWeekend ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {date.getDate()}
                      </div>
                      {record && (
                        <div className="flex-1 text-xs space-y-1">
                          {record.checkinTime && (
                            <div className="text-green-600 font-medium">
                              出勤: {new Date(record.checkinTime).toLocaleTimeString('ja-JP', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false 
                              })}
                            </div>
                          )}
                          {record.checkoutTime && (
                            <div className="text-red-600 font-medium">
                              退勤: {new Date(record.checkoutTime).toLocaleTimeString('ja-JP', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false 
                              })}
                            </div>
                          )}
                          {!record.checkinTime && !record.checkoutTime && (
                            <div className="text-gray-400 text-center">未記録</div>
                          )}
                        </div>
                      )}
                      {!record && (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-gray-300 text-xs">-</div>
                        </div>
                      )}
                      <div className="mt-auto">
                        <Edit className="w-3 h-3 text-gray-400 ml-auto" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 text-sm text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
              <p>• 日付をクリックして出退勤時刻を編集できます</p>
              <p>• 青色の枠は今日の日付です</p>
              <p>• グレーの背景は土日です</p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
              <Clock className="w-4 h-4" />
              勤怠編集 - {editingDate}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="checkinTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>出勤時刻</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="例: 09:00" 
                        {...field} 
                        data-testid="input-checkin-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="checkoutTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>退勤時刻</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="例: 18:00" 
                        {...field} 
                        data-testid="input-checkout-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>ステータス</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="ステータスを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="not-checked-in">未出勤</SelectItem>
                        <SelectItem value="working">勤務中</SelectItem>
                        <SelectItem value="checked-out">退勤済</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  キャンセル
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateAttendanceMutation.isPending}
                  data-testid="button-save"
                >
                  {updateAttendanceMutation.isPending ? "保存中..." : "保存"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}