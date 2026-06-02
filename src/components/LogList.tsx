'use client';

import { ConsumptionLog } from '@/types';
import { Trash2, UtensilsCrossed } from 'lucide-react';

interface MergedLog extends ConsumptionLog {
  _ids: string[];
}

interface Props {
  selectedLogs: MergedLog[];
  selectedDateLabel: string;
  onAddClick: () => void;
  onDeleteClick: (log: MergedLog) => void;
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function LogList({ selectedLogs, selectedDateLabel, onAddClick, onDeleteClick }: Props) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-700">{selectedDateLabel}</h2>
        {selectedLogs.length > 0 && (
          <span className="text-xs text-gray-400">총 {selectedLogs.reduce((s, l) => s + l.quantity, 0)}큐브</span>
        )}
      </div>

      {selectedLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300 bg-white rounded-2xl border border-[var(--border)]">
          <UtensilsCrossed size={36} className="mb-3" />
          <p className="text-sm">이날 기록이 없어요</p>
          <button onClick={onAddClick} className="mt-3 text-xs text-[var(--primary)] hover:underline">
            기록 추가하기
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--border)] divide-y divide-gray-100">
          {selectedLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-12 flex-shrink-0">
                  {formatTime(log.logged_at)}
                </span>
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] flex-shrink-0" />
                <span className="font-semibold text-gray-800">{log.cube_name}</span>
                {log.notes && (
                  <span className="text-xs text-gray-400 truncate max-w-32">{log.notes}</span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-bold text-gray-700">{log.quantity}개</span>
                <button
                  onClick={() => onDeleteClick(log)}
                  className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
