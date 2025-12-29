import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Mail, Building } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  department: string;
  email: string | null;
  avatar: string | null;
}

export default function EmployeesPage() {
  const [, setLocation] = useLocation();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/')}
                className="flex items-center gap-2"
                data-testid="back-button"
              >
                <ArrowLeft className="w-4 h-4" />
                戻る
              </Button>
              <h1 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                従業員一覧
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                    {employee.avatar || '👤'}
                  </div>
                  <div>
                    <CardTitle className="text-lg" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                      {employee.name}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="w-4 h-4" />
                    <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                      {employee.department}
                    </span>
                  </div>
                  {employee.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                        {employee.email}
                      </span>
                    </div>
                  )}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/admin/employees/${employee.id}/attendance`)}
                      className="w-full"
                      data-testid={`view-attendance-${employee.id}`}
                    >
                      勤怠詳細を見る
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {employees.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
              従業員が登録されていません
            </p>
          </div>
        )}
      </main>
    </div>
  );
}