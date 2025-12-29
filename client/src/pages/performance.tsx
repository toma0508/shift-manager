import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Activity, Database, Globe, Clock, AlertTriangle, TrendingUp } from "lucide-react";

interface PerformanceStats {
  api: {
    totalRequests: number;
    averageResponseTime: number;
    slowRequests: number;
    errorRate: number;
    requestsPerMinute: number;
  };
  database: {
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: number;
    failedQueries: number;
  };
  timestamp: number;
}

interface APIMetric {
  timestamp: number;
  method: string;
  url: string;
  responseTime: number;
  statusCode: number;
}

interface DBMetric {
  timestamp: number;
  query: string;
  duration: number;
  success: boolean;
}

export default function PerformancePage() {
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'api' | 'database'>('overview');

  const { data: stats, isLoading } = useQuery<PerformanceStats>({
    queryKey: ["/api/performance/stats"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: metrics } = useQuery<{api: APIMetric[], database: DBMetric[]}>({
    queryKey: ["/api/performance/metrics"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Get frontend metrics from localStorage
  const [frontendMetrics, setFrontendMetrics] = useState<any[]>([]);

  useEffect(() => {
    const storedMetrics = JSON.parse(localStorage.getItem('apiMetrics') || '[]');
    setFrontendMetrics(storedMetrics.slice(-20)); // Last 20 frontend calls
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP');
  };

  const getStatusBadge = (value: number, thresholds: {warning: number, danger: number}, unit = 'ms') => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let color = "text-green-600";
    
    if (value > thresholds.danger) {
      variant = "destructive";
      color = "text-red-600";
    } else if (value > thresholds.warning) {
      variant = "secondary";
      color = "text-yellow-600";
    }

    return (
      <Badge variant={variant} className={color}>
        {value}{unit}
      </Badge>
    );
  };

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
                戻る
              </Button>
              <h1 
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
              >
                パフォーマンス監視
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                リアルタイム監視中
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex mt-4 border-b">
            {[
              { id: 'overview', label: '概要', icon: TrendingUp },
              { id: 'api', label: 'API', icon: Globe },
              { id: 'database', label: 'データベース', icon: Database }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedTab(id as any)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  selectedTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                style={{ fontFamily: 'Noto Sans JP, sans-serif' }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {selectedTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                  平均応答時間
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.api.averageResponseTime}ms</div>
                {getStatusBadge(stats.api.averageResponseTime, {warning: 500, danger: 1000})}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                  遅いリクエスト
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.api.slowRequests}</div>
                <p className="text-xs text-muted-foreground">1秒以上のリクエスト</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                  エラー率
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.api.errorRate}%</div>
                {getStatusBadge(stats.api.errorRate, {warning: 5, danger: 10}, '%')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                  DB平均クエリ時間
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.database.averageQueryTime}ms</div>
                {getStatusBadge(stats.database.averageQueryTime, {warning: 200, danger: 500})}
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTab === 'api' && metrics && (
          <Card>
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                最近のAPIリクエスト
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>時刻</TableHead>
                    <TableHead style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>メソッド</TableHead>
                    <TableHead style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>URL</TableHead>
                    <TableHead style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>応答時間</TableHead>
                    <TableHead style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>ステータス</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.api.map((metric, index) => (
                    <TableRow key={index}>
                      <TableCell style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                        {formatTime(metric.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{metric.method}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{metric.url}</TableCell>
                      <TableCell>
                        {getStatusBadge(metric.responseTime, {warning: 500, danger: 1000})}
                      </TableCell>
                      <TableCell>
                        <Badge variant={metric.statusCode >= 400 ? "destructive" : "default"}>
                          {metric.statusCode}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {selectedTab === 'database' && metrics && (
          <Card>
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                最近のデータベースクエリ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>時刻</TableHead>
                    <TableHead style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>クエリ</TableHead>
                    <TableHead style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>実行時間</TableHead>
                    <TableHead style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>結果</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.database.map((metric, index) => (
                    <TableRow key={index}>
                      <TableCell style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                        {formatTime(metric.timestamp)}
                      </TableCell>
                      <TableCell className="font-mono text-sm max-w-md truncate">
                        {metric.query}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(metric.duration, {warning: 200, danger: 500})}
                      </TableCell>
                      <TableCell>
                        <Badge variant={metric.success ? "default" : "destructive"}>
                          {metric.success ? '成功' : '失敗'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}