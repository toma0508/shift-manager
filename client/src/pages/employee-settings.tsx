import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Save } from "lucide-react";
import { insertEmployeeSchema, type InsertEmployee, type Department } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Employee {
  id: string;
  name: string;
  department: string;
  email?: string;
  avatar?: string;
}

export default function EmployeeSettingsPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/admin/employees/:id/settings");
  const employeeId = params?.id;
  const queryClient = useQueryClient();

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: ["/api/employees", employeeId],
    enabled: !!employeeId,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const employeeForm = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      name: "",
      department: "",
      email: "",
      avatar: "👤",
    },
  });

  // Update form when employee data loads
  useEffect(() => {
    if (employee) {
      employeeForm.reset({
        name: employee.name,
        department: employee.department,
        email: employee.email || "",
        avatar: employee.avatar || "👤",
      });
    }
  }, [employee, employeeForm]);

  const updateEmployeeMutation = useMutation({
    mutationFn: (data: InsertEmployee) => apiRequest("PUT", `/api/employees/${employeeId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId] });
      setLocation('/admin/employees');
    },
  });

  if (isLoading) {
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
          <div className="text-lg text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
            従業員が見つかりません
          </div>
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
                onClick={() => setLocation('/admin/employees')}
                className="flex items-center gap-2"
                style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
              >
                <ArrowLeft className="w-4 h-4" />
                従業員管理へ戻る
              </Button>
              <h1 
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
              >
                従業員設定
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-6">
        <Card className="bg-white shadow-sm border">
          <CardHeader>
            <CardTitle className="flex items-center gap-3" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
              <User className="h-6 w-6 text-blue-500" />
              {employee.name}の設定
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...employeeForm}>
              <form onSubmit={employeeForm.handleSubmit((data) => updateEmployeeMutation.mutate(data))} className="space-y-6">
                {/* Avatar Selection */}
                <FormField
                  control={employeeForm.control}
                  name="avatar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>アイコン</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <div className="text-4xl">
                            {field.value || '👤'}
                          </div>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger className="w-64">
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
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Name */}
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

                {/* Email */}
                <FormField
                  control={employeeForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>メールアドレス</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="yamada@example.com" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Department */}
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
                            部門が登録されていません。
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setLocation('/admin/employees')}
                  >
                    キャンセル
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateEmployeeMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {updateEmployeeMutation.isPending ? '保存中...' : '保存'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}