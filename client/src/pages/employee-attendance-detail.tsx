import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Clock, Edit } from "lucide-react";
import { AttendanceRecord, AttendanceStatus, type Employee as BaseEmployee } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

interface Employee extends BaseEmployee {
  email: string | null;
}

const attendanceEditSchema = z.object({
  checkinTime: z.string().optional(),
  checkoutTime: z.string().optional(),
});

type AttendanceEditForm = z.infer<typeof attendanceEditSchema>;

// Get status style
const getStatusStyle = (status: AttendanceStatus) => {
  switch (status) {
    case 'working':
      return 'bg-blue-500 text-white';
    case 'checked-out':
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-200 text-gray-600';
  }
};

// Get status text
const getStatusText = (status: AttendanceStatus) => {
  switch (status) {
    case 'working':
      return '出勤';
    case 'checked-out':
      return '退勤';
    default:
      return '未出勤';
  }
};

// Format time helper
const formatTime = (timestamp: Date | null) => {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get days in month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// Get first day of month (0 = Sunday, 1 = Monday, etc.)
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export default function EmployeeAttendanceDetailPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/admin/employees/:id/attendance");
  const employeeId = params?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Current month state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Edit dialog state
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: employee, isLoading: employeeLoading } = useQuery<Employee>({
    queryKey: ["/api/employees", employeeId],
    enabled: !!employeeId,
  });

  const { data: attendanceHistory = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/employees", employeeId, "attendance", "history"],
    enabled: !!employeeId,
  });

  // Form for editing attendance
  const form = useForm<AttendanceEditForm>({
    resolver: zodResolver(attendanceEditSchema),
    defaultValues: {
      checkinTime: "",
      checkoutTime: "",
    },
  });

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async (data: { date: string; checkinTime?: string; checkoutTime?: string }) => {
      return apiRequest("POST", `/api/employees/${employeeId}/attendance/set`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "attendance", "history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsDialogOpen(false);
      setEditingDate(null);
      toast({
        title: "勤怠データを更新しました",
        description: "出退勤時刻が正常に保存されました。",
      });
    },
  });

  if (employeeLoading) {
    return (
      <div className="min-h-screen bg-gray-25" style={{ backgroundColor: '#fafafa' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
            読み込み中...
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-25" style={{ backgroundColor: '#fafafa' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
            従業員が見つかりません
          </div>
        </div>
      </div>
    );
  }

  // Navigation functions
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Get current month name
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  // Get attendance record for specific date
  const getAttendanceForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return attendanceHistory.find(record => record.date === dateStr);
  };

  // Handle date click for editing
  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const record = getAttendanceForDate(date);
    
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
    });
    
    setEditingDate(dateStr);
    setIsDialogOpen(true);
  };

  // Handle form submit
  const onSubmit = (data: AttendanceEditForm) => {
    if (!editingDate) return;
    
    // Only send non-empty values
    const payload: { date: string; checkinTime?: string; checkoutTime?: string } = {
      date: editingDate,
    };
    
    if (data.checkinTime && data.checkinTime.trim()) {
      payload.checkinTime = data.checkinTime.trim();
    }
    
    if (data.checkoutTime && data.checkoutTime.trim()) {
      payload.checkoutTime = data.checkoutTime.trim();
    }
    
    updateAttendanceMutation.mutate(payload);
  };

  // Render calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square border border-gray-200 bg-gray-50"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const attendance = getAttendanceForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-colors ${
            isToday ? 'bg-blue-50 border-blue-300' : 
            isWeekend ? 'bg-gray-50' : 'bg-white'
          }`}
          onClick={() => handleDateClick(date)}
        >
          <div className="h-full flex flex-col">
            <div className={`text-xs font-semibold mb-1 ${
              isToday ? 'text-blue-600' : 
              isWeekend ? 'text-gray-500' : 'text-gray-900'
            }`}>
              {day}
            </div>
            {attendance ? (
              <div className="flex-1 text-xs space-y-1">
                {attendance.checkinTime && (
                  <div className="text-green-600 font-medium">
                    出勤: {formatTime(attendance.checkinTime)}
                  </div>
                )}
                {attendance.checkoutTime && (
                  <div className="text-red-600 font-medium">
                    退勤: {formatTime(attendance.checkoutTime)}
                  </div>
                )}
                {!attendance.checkinTime && !attendance.checkoutTime && (
                  <div className="text-gray-400 text-center">未記録</div>
                )}
              </div>
            ) : (
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
    }

    return days;
  };

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
                onClick={() => setLocation('/admin/employees')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                戻る
              </Button>
              <h1 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                {employee.avatar} {employee.name} の勤怠詳細
              </h1>
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
                勤怠カレンダー
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-lg font-semibold px-4" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                  {currentYear}年 {monthNames[currentMonth]}
                </span>
                <Button variant="outline" size="sm" onClick={goToNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
              日付をクリックして出退勤時刻を編集できます
            </p>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-0 mb-2">
              {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                <div 
                  key={day} 
                  className={`text-center text-sm font-medium py-2 ${
                    index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                  }`}
                  style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>

            {/* Legend */}
            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                  <span className="text-sm text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>出勤時刻</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                  <span className="text-sm text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>退勤時刻</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded"></div>
                  <span className="text-sm text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>今日</span>
                </div>
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>クリックで編集</span>
                </div>
              </div>
              <div className="text-sm text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                <p>• 各日付をクリックして出退勤時刻を個別編集できます</p>
                <p>• グレーの背景は土日です</p>
              </div>
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