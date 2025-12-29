import { useEffect, useState } from "react";

interface AttendanceStats {
  total: number;
  working: number;
  checkedOut: number;
  notCheckedIn: number;
}

interface AttendanceHeaderProps {
  stats?: AttendanceStats;
}

export default function AttendanceHeader({ stats }: AttendanceHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  const timeString = currentTime.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4" data-testid="attendance-header">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900" data-testid="title">
          勤怠管理システム
        </h1>
        <div className="mt-2 flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2" data-testid="legend-not-checked-in">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span>未出勤</span>
          </div>
          <div className="flex items-center gap-2" data-testid="legend-working">
            <div className="w-3 h-3 bg-working rounded-full"></div>
            <span>勤務中</span>
          </div>
          <div className="flex items-center gap-2" data-testid="legend-checked-out">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>退勤済</span>
          </div>
          <div className="ml-auto">
            <span className="font-medium" data-testid="current-date">{today}</span>
            <span className="ml-2" data-testid="current-time">{timeString}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
