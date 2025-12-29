import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, ArrowUpDown, ArrowUp, ArrowDown, Plus, Settings, BarChart3 } from "lucide-react";
import { AttendanceRecord, AttendanceStatus, insertEmployeeSchema, type InsertEmployee, type Department } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface Employee {
  id: string;
  name: string;
  department: string;
  avatar?: string;
  status: 'not-checked-in' | 'working' | 'checked-out';
}

interface AttendanceStats {
  total: number;
  working: number;
  checkedOut: number;
  notCheckedIn: number;
}

type SortField = 'name' | 'department' | 'status';
type SortDirection = 'asc' | 'desc';

export default function AdminEmployeesPage() {
  const [, setLocation] = useLocation();
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [localEmployees, setLocalEmployees] = useState<Employee[]>([]);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: employeesData = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });


  // Sync server data with local state
  useEffect(() => {
    if (employeesData) {
      setLocalEmployees(employeesData);
    }
  }, [employeesData]);

  // Use local employees for immediate UI updates
  const employees = useMemo(() => {
    const sorted = [...localEmployees].sort((a, b) => {
      let valueA: string;
      let valueB: string;

      switch (sortField) {
        case 'name':
          valueA = a.name;
          valueB = b.name;
          break;
        case 'department':
          valueA = a.department;
          valueB = b.department;
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        default:
          valueA = a.name;
          valueB = b.name;
      }

      const comparison = valueA.localeCompare(valueB, 'ja-JP');
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [localEmployees, sortField, sortDirection]);

  const setAttendanceMutation = useMutation({
    mutationFn: ({ employeeId, date, status }: { employeeId: string; date: string; status: AttendanceStatus }) => 
      apiRequest("POST", `/api/employees/${employeeId}/attendance/set`, { date, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/stats"] });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not-checked-in':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            未出勤
          </Badge>
        );
      case 'working':
        return (
          <Badge variant="default" className="bg-green-500 text-white">
            勤務中
          </Badge>
        );
      case 'checked-out':
        return (
          <Badge variant="default" className="bg-gray-400 text-white">
            退勤済
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleStatusChange = (employeeId: string, newStatus: AttendanceStatus) => {
    // Optimistic update - immediately update local state
    setLocalEmployees(prev => 
      prev.map(emp => 
        emp.id === employeeId 
          ? { ...emp, status: newStatus as any }
          : emp
      )
    );
    
    // Background API call
    const today = new Date().toISOString().split('T')[0];
    setAttendanceMutation.mutate(
      { employeeId, date: today, status: newStatus },
      {
        onError: () => {
          // Revert optimistic update on error
          queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
        }
      }
    );
    
    setEditingStatus(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return `${year}年${month}月${day}日(${dayOfWeek})`;
  };

  const formatTime = (timestamp: string | Date | null) => {
    if (!timestamp) return '-';
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4" />
      : <ArrowDown className="w-4 h-4" />;
  };

  // Employee form
  const employeeForm = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      name: "",
      department: "",
      avatar: "👤",
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: (data: InsertEmployee) => apiRequest("POST", "/api/employees", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/stats"] });
      employeeForm.reset();
      setShowEmployeeForm(false);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
          読み込み中...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-25" style={{ backgroundColor: '#fafafa' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/admin')}
                className="flex items-center gap-2"
                style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
              >
                <ArrowLeft className="w-4 h-4" />
                ダッシュボードへ戻る
              </Button>
              <h1 
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
              >
                従業員管理
              </h1>
            </div>
            <Button
              onClick={() => setShowEmployeeForm(true)}
              className="flex items-center gap-2"
              style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
            >
              <Plus className="w-4 h-4" />
              従業員を追加
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Card */}
        <Card className="mb-6 bg-white shadow-sm border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
              <Users className="h-5 w-5" />
              従業員一覧 ({employees.length}名)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                  まだ従業員が登録されていません
                </p>
                <Button onClick={() => setShowEmployeeForm(true)}>
                  最初の従業員を追加
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th 
                        className="text-left py-2 px-4 cursor-pointer hover:bg-gray-50 select-none" 
                        style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-2">
                          従業員
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th 
                        className="text-left py-2 px-4 cursor-pointer hover:bg-gray-50 select-none" 
                        style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                        onClick={() => handleSort('department')}
                      >
                        <div className="flex items-center gap-2">
                          部署
                          {getSortIcon('department')}
                        </div>
                      </th>
                      <th 
                        className="text-left py-2 px-4 cursor-pointer hover:bg-gray-50 select-none" 
                        style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-2">
                          現在の状態
                          {getSortIcon('status')}
                        </div>
                      </th>
                      <th className="text-left py-2 px-4" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">
                              {employee.avatar || '👤'}
                            </div>
                            <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                              {employee.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                          {employee.department}
                        </td>
                        <td className="py-3 px-4">
                          {editingStatus === employee.id ? (
                            <Select
                              value={employee.status}
                              onValueChange={(value: AttendanceStatus) => handleStatusChange(employee.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="not-checked-in">未出勤</SelectItem>
                                <SelectItem value="working">勤務中</SelectItem>
                                <SelectItem value="checked-out">退勤済</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div 
                              className="cursor-pointer"
                              onClick={() => setEditingStatus(employee.id)}
                            >
                              {getStatusBadge(employee.status)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/admin/employees/${employee.id}/settings`)}
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              従業員設定
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/admin/employees/${employee.id}/attendance`)}
                            >
                              <BarChart3 className="w-3 h-3 mr-1" />
                              勤怠詳細
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Employee Registration Dialog */}
      <Dialog open={showEmployeeForm} onOpenChange={setShowEmployeeForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
              従業員登録
            </DialogTitle>
          </DialogHeader>
          <Form {...employeeForm}>
            <form onSubmit={employeeForm.handleSubmit((data) => createEmployeeMutation.mutate(data))} className="space-y-4">
              <FormField
                control={employeeForm.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>アイコン</FormLabel>
                    <FormControl>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="アイコンを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="👤">👤 デフォルト</SelectItem>
                          <SelectItem value="👨">👨 男性</SelectItem>
                          <SelectItem value="👩">👩 女性</SelectItem>
                          <SelectItem value="🧑‍💼">🧑‍💼 ビジネス</SelectItem>
                          <SelectItem value="👨‍💻">👨‍💻 エンジニア</SelectItem>
                          <SelectItem value="👩‍💻">👩‍💻 エンジニア (女性)</SelectItem>
                          <SelectItem value="👨‍💼">👨‍💼 営業</SelectItem>
                          <SelectItem value="👩‍💼">👩‍💼 営業 (女性)</SelectItem>
                          <SelectItem value="🧑‍🔧">🧑‍🔧 技術者</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={employeeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>氏名</FormLabel>
                    <FormControl>
                      <Input placeholder="山田 太郎" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={employeeForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>部門</FormLabel>
                    <FormControl>
                      {departments.length > 0 ? (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="部門を選択してください" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.name || dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm text-gray-500 p-2 border rounded">
                          部門が登録されていません。先に部門を登録してください。
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowEmployeeForm(false)}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={createEmployeeMutation.isPending || departments.length === 0}>
                  {createEmployeeMutation.isPending ? '登録中...' : '登録'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}