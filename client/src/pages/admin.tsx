import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Building2, Activity, Clock, CheckCircle, XCircle, ArrowRight, Calendar } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  department: string;
  status: 'not-checked-in' | 'working' | 'checked-out';
}

interface AttendanceStats {
  total: number;
  working: number;
  checkedOut: number;
  notCheckedIn: number;
}

interface Department {
  id: string;
  name: string;
  createdAt: string;
}

export default function AdminPage() {
  const [, setLocation] = useLocation();

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: stats = { total: 0, working: 0, checkedOut: 0, notCheckedIn: 0 } } = useQuery<AttendanceStats>({
    queryKey: ["/api/attendance/stats"],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

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
                onClick={() => setLocation('/')}
                className="flex items-center gap-2"
                style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
              >
                <ArrowLeft className="w-4 h-4" />
                メイン画面へ戻る
              </Button>
              <h1 
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
              >
                管理者ダッシュボード
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white shadow-sm border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                    総従業員数
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.working}</div>
                  <div className="text-sm text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                    勤務中
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <XCircle className="h-8 w-8 text-gray-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.checkedOut}</div>
                  <div className="text-sm text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                    退勤済
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Building2 className="h-8 w-8 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{departments.length}</div>
                  <div className="text-sm text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                    部門数
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Options */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Employee Management */}
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-200 bg-white" onClick={() => setLocation('/admin/employees')}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-blue-500" />
                  従業員管理
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                従業員の登録、編集、勤怠状況の管理を行います
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>登録済み従業員</span>
                  <span className="font-semibold">{employees.length}名</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>現在勤務中</span>
                  <span className="font-semibold">{stats.working}名</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department Management */}
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-purple-200 bg-white" onClick={() => setLocation('/admin/departments')}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-purple-500" />
                  部門管理
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                部門の登録、管理、部門別統計の確認を行います
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>登録済み部門</span>
                  <span className="font-semibold">{departments.length}部門</span>
                </div>
                <div className="flex justify-between text-sm text-purple-600">
                  <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>平均従業員数</span>
                  <span className="font-semibold">
                    {departments.length > 0 ? (employees.length / departments.length).toFixed(1) : '0'}名/部門
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Attendance Entry */}
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-green-200 bg-white" onClick={() => setLocation('/admin/attendance-bulk')}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-green-500" />
                  勤怠一括入力
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                エクセルライクな表形式で複数従業員の勤怠を一括編集
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>対象従業員</span>
                  <span className="font-semibold">{employees.length}名</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>表形式編集</span>
                  <span className="font-semibold">セルクリック</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Calendar */}
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-orange-200 bg-white" onClick={() => setLocation('/admin/attendance-calendar')}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-orange-500" />
                  勤怠カレンダー
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                カレンダー形式で出退勤時間を確認・個別編集
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>従業員選択</span>
                  <span className="font-semibold">個別表示</span>
                </div>
                <div className="flex justify-between text-sm text-orange-600">
                  <span style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>日付クリック</span>
                  <span className="font-semibold">個別編集</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white shadow-sm border">
          <CardHeader>
            <CardTitle className="flex items-center gap-3" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
              <Activity className="h-6 w-6 text-orange-500" />
              クイックアクション
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => setLocation('/admin/employees')}
                className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
              >
                <Users className="w-4 h-4" />
                従業員を追加
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation('/admin/departments')}
                className="flex items-center gap-2 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
              >
                <Building2 className="w-4 h-4" />
                部門を追加
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation('/admin/attendance-bulk')}
                className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300 transition-colors"
                style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
              >
                <Calendar className="w-4 h-4" />
                勤怠一括入力
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation('/admin/attendance-calendar')}
                className="flex items-center gap-2 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
              >
                <Clock className="w-4 h-4" />
                勤怠カレンダー
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation('/admin/performance')}
                className="flex items-center gap-2 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
              >
                <Activity className="w-4 h-4" />
                パフォーマンス監視
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        {employees.length === 0 && departments.length === 0 && (
          <Card className="mt-6 border-yellow-300 bg-yellow-50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="bg-yellow-100 rounded-full p-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-2" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                    システム初期設定
                  </h3>
                  <p className="text-yellow-700 mb-4" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                    まだ部門や従業員が登録されていません。システムを使い始めるために、まず部門を登録してから従業員を追加してください。
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setLocation('/admin/departments')}
                      className="bg-yellow-600 hover:bg-yellow-700"
                      style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
                    >
                      部門を登録
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}