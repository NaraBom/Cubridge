'use client';

import { useEffect, useState } from 'react';
import { Cube, ConsumptionLog } from '@/types';
import { getCubes, getLogs, addLog, deleteLog, deleteCube } from '@/lib/storage';
import { Plus, Trash2, UtensilsCrossed, ChevronLeft, ChevronRight, X } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import DateInput from '@/components/DateInput';

type MealTime = ConsumptionLog['meal_time'];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// 끼니 -> 기본 시간 매핑 (폼 초기값용)
const MEAL_DEFAULT_TIMES: Record<MealTime, string> = {
  breakfast: '08:00',
  lunch: '12:00',
  dinner: '18:00',
  snack: '15:00',
};

export default function LogsPage() {
  const [cubes, setCubes] = useState<Cube[]>([]);
  const [logs, setLogs] = useState<ConsumptionLog[]>([]);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(toDateKey(today));

  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<(ConsumptionLog & { _ids: string[] }) | null>(null);
  const [depleted, setDepleted] = useState<Cube | null>(null);
  const [formDate, setFormDate] = useState(toDateKey(today));
  const [formTime, setFormTime] = useState('12:00');
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState<{ cubeId: string; quantity: number }[]>([{ cubeId: '', quantity: 1 }]);

  useEffect(() => {
    setCubes(getCubes());
    setLogs(getLogs());
  }, []);

  const logsByDate: Record<string, ConsumptionLog[]> = {};
  for (const log of logs) {
    const key = toDateKey(new Date(log.logged_at));
    if (!logsByDate[key]) logsByDate[key] = [];
    logsByDate[key].push(log);
  }

  // 달력 셀 계산
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startOffset = firstDay.getDay();
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const day = i - startOffset + 1;
    return day >= 1 && day <= lastDay.getDate() ? day : null;
  });

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function openForm() {
    setFormDate(selectedDate);
    setFormTime('12:00');
    setNotes('');
    setEntries([{ cubeId: '', quantity: 1 }]);
    setShowForm(true);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();

    const hour = parseInt(formTime.split(':')[0]);
    let mealTime: MealTime = 'snack';
    if (hour >= 6 && hour < 10) mealTime = 'breakfast';
    else if (hour >= 11 && hour < 14) mealTime = 'lunch';
    else if (hour >= 17 && hour < 21) mealTime = 'dinner';
    const loggedAt = new Date(`${formDate}T${formTime}:00`).toISOString();

    // 재고 검증 (전체 먼저)
    for (const entry of entries) {
      if (!entry.cubeId) continue;
      const cube = cubes.find((c) => c.id === entry.cubeId);
      if (!cube) continue;
      if (entry.quantity > cube.quantity) {
        alert(`재고가 부족합니다.\n[${cube.name}] 재고: ${cube.quantity}개 / 입력: ${entry.quantity}개`);
        return;
      }
    }

    let firstDepleted: Cube | null = null;
    for (const entry of entries) {
      if (!entry.cubeId) continue;
      const cube = cubes.find((c) => c.id === entry.cubeId);
      if (!cube) continue;
      addLog({ cube_id: entry.cubeId, cube_name: cube.name, quantity: entry.quantity, meal_time: mealTime, logged_at: loggedAt, notes: notes || null });
      // addLog이 스토리지를 업데이트하므로 최신 수량을 직접 조회
      const updatedCube = getCubes().find((c) => c.id === entry.cubeId);
      if (!firstDepleted && updatedCube && updatedCube.quantity === 0) firstDepleted = updatedCube;
    }

    setLogs(getLogs());
    setCubes(getCubes());
    setShowForm(false);
    setEntries([{ cubeId: '', quantity: 1 }]);
    setNotes('');

    if (firstDepleted) setDepleted(firstDepleted);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteTarget._ids.forEach((id) => deleteLog(id));
    setLogs(getLogs());
    setDeleteTarget(null);
  }

  const selectedLogs = (() => {
    const sorted = (logsByDate[selectedDate] ?? []).sort(
      (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
    );
    const merged: (ConsumptionLog & { _ids: string[] })[] = [];
    for (const log of sorted) {
      const key = `${log.logged_at}__${log.cube_name}`;
      const existing = merged.find(m => `${m.logged_at}__${m.cube_name}` === key);
      if (existing) {
        existing.quantity += log.quantity;
        existing._ids.push(log.id);
      } else {
        merged.push({ ...log, _ids: [log.id] });
      }
    }
    return merged;
  })();
  const selectedDateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short',
  });
  const todayKey = toDateKey(today);
  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">소비 기록</h1>
        <button
          onClick={openForm}
          className="flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-xl hover:opacity-90 transition text-sm font-medium"
        >
          <Plus size={16} />
          기록 추가
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-5">
        {/* 달력 */}
        <div className="bg-white rounded-2xl border border-[var(--border)] p-6 xl:w-[560px] flex-shrink-0">
          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 transition">
              <ChevronLeft size={22} />
            </button>
            <div className="flex items-center gap-3">
              <span className="font-bold text-xl text-gray-800">
                {viewYear}년 {viewMonth + 1}월
              </span>
              <button
                onClick={() => {
                  setViewYear(today.getFullYear());
                  setViewMonth(today.getMonth());
                  setSelectedDate(toDateKey(today));
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition ${
                  selectedDate === todayKey && viewYear === today.getFullYear() && viewMonth === today.getMonth()
                    ? 'bg-gray-100 text-gray-400 cursor-default'
                    : 'bg-orange-50 text-[var(--primary)] hover:bg-orange-100'
                }`}
              >
                오늘
              </button>
            </div>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 transition">
              <ChevronRight size={22} />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d, i) => (
              <div key={d} className={`text-center text-sm font-semibold py-2 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
                {d}
              </div>
            ))}
          </div>

          {/* 날짜 셀 */}
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
                  onClick={() => setSelectedDate(dateKey)}
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

          {/* 이번달 요약 */}
          <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
            <span>이번달 기록일: {Object.keys(logsByDate).filter(k => k.startsWith(monthPrefix)).length}일</span>
            <span>
              총 {Object.entries(logsByDate)
                .filter(([k]) => k.startsWith(monthPrefix))
                .reduce((s, [, l]) => s + l.reduce((ss, ll) => ss + ll.quantity, 0), 0)}큐브
            </span>
          </div>
        </div>

        {/* 선택 날짜 기록 */}
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
              <button onClick={openForm} className="mt-3 text-xs text-[var(--primary)] hover:underline">
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
                      onClick={() => setDeleteTarget(log)}
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
      </div>

      {/* 기록 추가 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 overflow-y-auto p-4">
          <form
            onSubmit={handleAdd}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4 mx-auto my-auto overflow-hidden"
            style={{ marginTop: 'max(1rem, 10vh)', marginBottom: 'max(1rem, 10vh)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">소비 기록 추가</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {/* 날짜 + 시간 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">날짜</label>
                <DateInput
                  value={formDate}
                  onChange={(v) => setFormDate(v ?? toDateKey(today))}
                  placeholder={false}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">시간</label>
                <input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>

            {/* 큐브 항목 목록 */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-500">큐브 *</label>
              {entries.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    required
                    value={entry.cubeId}
                    onChange={(e) => {
                      const next = [...entries];
                      next[idx] = { ...next[idx], cubeId: e.target.value };
                      setEntries(next);
                    }}
                    className="input min-w-0 flex-1"
                    style={{ width: 0 }}
                  >
                    <option value="">큐브 선택</option>
                    {cubes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.quantity}개)</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...entries];
                      next[idx] = { ...next[idx], quantity: Math.max(1, next[idx].quantity - 1) };
                      setEntries(next);
                    }}
                    className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-base hover:bg-gray-50 transition flex-shrink-0"
                  >−</button>
                  <input
                    type="number"
                    required
                    min={1}
                    max={10}
                    value={entry.quantity}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const next = [...entries];
                      next[idx] = { ...next[idx], quantity: Math.min(10, Math.max(1, Number(e.target.value))) };
                      setEntries(next);
                    }}
                    className="input text-center flex-shrink-0"
                    style={{ width: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...entries];
                      next[idx] = { ...next[idx], quantity: Math.min(10, next[idx].quantity + 1) };
                      setEntries(next);
                    }}
                    className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-base hover:opacity-90 transition flex-shrink-0"
                  >+</button>
                  {entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setEntries(entries.filter((_, i) => i !== idx))}
                      className="w-7 h-7 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-400 flex items-center justify-center transition flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              {entries.length < 10 && (
                <button
                  type="button"
                  onClick={() => setEntries([...entries, { cubeId: '', quantity: 1 }])}
                  className="flex items-center gap-1.5 text-xs text-[var(--primary)] hover:underline self-start mt-0.5"
                >
                  <Plus size={13} />
                  큐브 추가 ({entries.length}/10)
                </button>
              )}
            </div>

            {/* 메모 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">메모 (선택)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="예: 잘 먹었어요"
                rows={3}
                className="input w-full resize-none"
              />
            </div>

            <div className="flex gap-2 mt-1">
              <button type="submit" className="flex-1 py-2.5 bg-[var(--primary)] text-white rounded-xl font-medium hover:opacity-90 transition text-sm">
                저장
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition text-sm">
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <ConfirmModal
          title="소비 기록 삭제"
          message={`"${deleteTarget.cube_name}" ${deleteTarget.quantity}개 기록을 삭제할까요?`}
          confirmLabel="삭제"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {depleted && (
        <ConfirmModal
          title="🎉 큐브 소진 완료!"
          message={`'${depleted.name}' 큐브가 모두 소진되었습니다.\n큐브 목록에서 삭제할까요?`}
          confirmLabel="삭제"
          cancelLabel="유지"
          danger
          onConfirm={() => {
            deleteCube(depleted.id);
            setCubes(getCubes());
            setDepleted(null);
          }}
          onCancel={() => setDepleted(null)}
        />
      )}

      <style jsx>{`
        .input {
          padding: 9px 12px;
          border-radius: 10px;
          border: 1.5px solid var(--border);
          background: white;
          font-size: 13px;
          outline: none;
        }
        .input:focus {
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
}
