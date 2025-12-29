import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Building2, Plus, Users } from "lucide-react";
import { insertDepartmentSchema, type InsertDepartment, type Department } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface Employee {
  id: string;
  name: string;
  department: string;
}

export default function AdminDepartmentsPage() {
  const [, setLocation] = useLocation();
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Count employees by department
  const departmentStats = departments.map(dept => ({
    ...dept,
    employeeCount: employees.filter(emp => emp.department === dept.name).length
  }));

  // Department form
  const departmentForm = useForm<InsertDepartment>({
    resolver: zodResolver(insertDepartmentSchema),
    defaultValues: {
      name: "",
    },
  });

  const createDepartmentMutation = useMutation({
    mutationFn: (data: InsertDepartment) => {
      console.log("Creating department with data:", data);
      return apiRequest("POST", "/api/departments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      departmentForm.reset();
      setShowDepartmentForm(false);
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
                部門管理
              </h1>
            </div>
            <Button
              onClick={() => setShowDepartmentForm(true)}
              className="flex items-center gap-2"
              style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
            >
              <Plus className="w-4 h-4" />
              部門を追加
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <Card className="bg-white shadow-sm border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
              <Building2 className="h-5 w-5" />
              部門一覧 ({departments.length}部門)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {departments.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                  まだ部門が登録されていません
                </p>
                <Button onClick={() => setShowDepartmentForm(true)}>
                  最初の部門を追加
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departmentStats.map((department) => (
                  <Card key={department.id} className="border-l-4 border-l-blue-500 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 
                          className="font-semibold text-lg"
                          style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                        >
                          {department.name}
                        </h3>
                        <Building2 className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                          {department.employeeCount}名の従業員
                        </span>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        登録日: {new Date(department.createdAt!).toLocaleDateString('ja-JP')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Stats */}
        {departments.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{departments.length}</div>
                  <div className="text-sm text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                    総部門数
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{employees.length}</div>
                  <div className="text-sm text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                    総従業員数
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {employees.length > 0 ? (employees.length / departments.length).toFixed(1) : '0'}
                  </div>
                  <div className="text-sm text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                    部門あたりの平均従業員数
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Department Registration Dialog */}
      <Dialog open={showDepartmentForm} onOpenChange={setShowDepartmentForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
              部門登録
            </DialogTitle>
          </DialogHeader>
          <Form {...departmentForm}>
            <form onSubmit={departmentForm.handleSubmit((data) => createDepartmentMutation.mutate(data))} className="space-y-4">
              <FormField
                control={departmentForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>部門名</FormLabel>
                    <FormControl>
                      <Input placeholder="営業部" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDepartmentForm(false)}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={createDepartmentMutation.isPending}>
                  {createDepartmentMutation.isPending ? '登録中...' : '登録'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}