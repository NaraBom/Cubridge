'use client';

import { ConsumptionLog } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface Props {
  viewYear: number;
  viewMonth: number;
  selectedDate: string;
  todayKey: string;
  cells: (number | null)[];
  logsByDate: Record<string, ConsumptionLog[]>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (dateKey: string) => void;
  onGoToday: () => void;
}

export default function LogCalendar({
  viewYear, viewMonth, selectedDate, todayKey, cells, logsByDate,
  onPrevMonth, onNextMonth, onSelectDate, onGoToday,
}: Props) {
  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] p-6 xl:w-[560px] flex-shrink-0">
      <div className="flex items-center justify-between mb-5">
        <button onClick={onPrevMonth} className="p-2 rounded-xl hover:bg-gray-100 transition">
          <ChevronLeft size={22} />
        </button>
        <div className="flex items-center gap-3">
          <span className="font-bold text-xl text-gray-800">
            {viewYear}년 {viewMonth + 1}월
          </span>
          <button
            onClick={onGoToday}
            className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition ${
              selectedDate === todayKey
                ? 'bg-gray-100 text-gray-400 cursor-default'
                : 'bg-orange-50 text-[var(--primary)] hover:bg-orange-100'
            }`}
          >
            오늘
          </button>
        </div>
        <button onClick={onNextMonth} className="p-2 rounded-xl hover:bg-gray-100 transition">
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`text-center text-sm font-semibold py-2 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="h-16" />;
          const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayLogs = logsByDate[dateKey] ?? [];
          const logCount = dayLogs.reduce((s, l) => s + l.quantity, 0);
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDate;
          const weekday = i % 7;

          return (
            <button
              key={i}
              onClick={() => onSelectDate(dateKey)}
              className={`relative flex flex-col items-center justify-start pt-2.5 h-16 rounded-xl text-base transition-colors ${
                isSelected
                  ? 'bg-[var(--primary)] text-white font-bold'
                  : isToday
                  ? 'bg-orange-50 font-bold'
                  : 'hover:bg-gray-50'
              } ${!isSelected && weekday === 0 ? 'text-red-400' : ''} ${!isSelected && weekday === 6 ? 'text-blue-400' : ''} ${isToday && !isSelected ? 'text-[var(--primary)]' : ''}`}
            >
              <span>{day}</span>
              {logCount > 0 && (
                <span className={`text-[10px] font-semibold mt-0.5 leading-none ${isSelected ? 'text-white/80' : 'text-[var(--primary)]'}`}>
                  {logCount}개
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
        <span>이번달 기록일: {Object.keys(logsByDate).filter(k => k.startsWith(monthPrefix)).length}일</span>
        <span>
          총 {Object.entries(logsByDate)
            .filter(([k]) => k.startsWith(monthPrefix))
            .reduce((s, [, l]) => s + l.reduce((ss, ll) => ss + ll.quantity, 0), 0)}큐브
        </span>
      </div>
    </div>
  );
}
