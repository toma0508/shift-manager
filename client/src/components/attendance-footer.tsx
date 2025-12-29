import { useEffect, useState } from "react";

interface AttendanceStats {
  total: number;
  working: number;
  checkedOut: number;
  notCheckedIn: number;
}

interface AttendanceFooterProps {
  stats?: AttendanceStats;
}

export default function AttendanceFooter({ stats }: AttendanceFooterProps) {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (stats) {
      setLastUpdate(new Date());
    }
  }, [stats]);

  const lastUpdateString = lastUpdate.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <footer 
      className="bg-white border-t border-gray-200 px-6 py-3 fixed bottom-0 left-0 right-0"
      data-testid="attendance-footer"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-6">
          <span data-testid="total-employees">
            総従業員数: <strong>{stats?.total || 0}</strong>名
          </span>
          <span data-testid="working-count">
            出勤中: <strong className="text-working">{stats?.working || 0}</strong>名
          </span>
          <span data-testid="checked-out-count">
            退勤済: <strong className="text-blue-600">{stats?.checkedOut || 0}</strong>名
          </span>
        </div>
        <div data-testid="last-update">
          <span>最終更新: </span>
          <span>{lastUpdateString}</span>
        </div>
      </div>
    </footer>
  );
}
