'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Cube, getStockStatus, MEAL_TIMES } from '@/types';
import { getCubes, getLogs, getSampleCubes, addCube, getSettings } from '@/lib/storage';
import CubeRow from '@/components/CubeRow';
import { AlertCircle, Box, Plus } from 'lucide-react';

export default function DashboardPage() {
  const [cubes, setCubes] = useState<Cube[]>(() => {
    const stored = getCubes();
    if (stored.length === 0) {
      getSampleCubes().forEach((s) => addCube(s));
      return getCubes();
    }
    return stored;
  });
  const [logs] = useState(() => getLogs());
  const [expiryWarningDays] = useState(() => getSettings().expiryWarningDays);

  function refresh() {
    setCubes(getCubes());
  }

  const warnCubes = cubes.filter((c) => getStockStatus(c.quantity, c.warning_threshold, c.danger_threshold) === 'warning');
  const dangerCubes = cubes.filter((c) => getStockStatus(c.quantity, c.warning_threshold, c.danger_threshold) === 'danger');
  const alertCubes = [...dangerCubes, ...warnCubes];

  const today = new Date().toDateString();
  const todayLogs = logs.filter((l) => new Date(l.logged_at).toDateString() === today);
  const todayTotal = todayLogs.reduce((sum, l) => sum + l.quantity, 0);
  const recentLogs = logs.slice(0, 5);

  // 카테고리별 큐브 수 (전체 큐브 카드용)
  const categoryCount = cubes.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1;
    return acc;
  }, {});
  const categoryNames = Object.entries(categoryCount).map(([cat, cnt]) => `${cat} ${cnt}`).join(' · ');

  // 오늘 소비한 큐브 이름 (중복 제거)
  const todayCubeNames = [...new Set(todayLogs.map((l) => l.cube_name))].join(', ');

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">이유식 재고 현황</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="전체 큐브 종류" value={cubes.length} unit="종" color="text-blue-600" bg="bg-blue-50" sub={categoryNames} />
        <StatCard label="재고 주의" value={warnCubes.length} unit="종" color="text-yellow-600" bg="bg-yellow-50" sub={warnCubes.map(c => c.name).join(', ')} />
        <StatCard label="재고 부족" value={dangerCubes.length} unit="종" color="text-red-600" bg="bg-red-50" sub={dangerCubes.map(c => c.name).join(', ')} />
        <StatCard label="오늘 소비" value={todayTotal} unit="큐브" color="text-[var(--primary)]" bg="bg-orange-50" sub={todayCubeNames} />
      </div>

      {alertCubes.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" />
              재고 알림 ({alertCubes.length}종)
            </h2>
            <Link href="/cubes" className="text-sm text-[var(--primary)] hover:underline">전체 보기</Link>
          </div>
          <div className="bg-white rounded-2xl border border-[var(--border)] divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
            {alertCubes.map((cube) => (
              <CubeRow key={cube.id} cube={cube} expiryWarningDays={expiryWarningDays} onUpdate={refresh} onDelete={refresh} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <Box size={18} className="text-gray-500" />
            전체 큐브
          </h2>
          <div className="flex items-center gap-2">
            <Link href="/cubes/new" className="flex items-center gap-1 bg-[var(--primary)] text-white text-sm px-3 py-1.5 rounded-lg hover:opacity-90 transition">
              <Plus size={14} />
              큐브 추가
            </Link>
            <Link href="/cubes" className="text-sm text-[var(--primary)] hover:underline">전체 보기</Link>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[var(--border)] divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
          {[...cubes]
            .sort((a, b) => {
              const order = { danger: 0, warning: 1, ok: 2 };
              return order[getStockStatus(a.quantity, a.warning_threshold, a.danger_threshold)] -
                     order[getStockStatus(b.quantity, b.warning_threshold, b.danger_threshold)];
            })
            .map((cube) => (
              <CubeRow key={cube.id} cube={cube} expiryWarningDays={expiryWarningDays} onUpdate={refresh} onDelete={refresh} />
            ))}
        </div>
      </section>

      {recentLogs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">최근 소비 기록</h2>
            <Link href="/logs" className="text-sm text-[var(--primary)] hover:underline">전체 보기</Link>
          </div>
          <div className="bg-white rounded-2xl border border-[var(--border)] divide-y divide-gray-100">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="font-medium text-gray-800">{log.cube_name}</span>
                  <span className="ml-2 text-xs text-gray-400">{MEAL_TIMES[log.meal_time]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">{log.quantity}개</span>
                  <span className="text-xs text-gray-400">
                    {new Date(log.logged_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, unit, color, bg, sub }: { label: string; value: number; unit: string; color: string; bg: string; sub?: string }) {
  return (
    <div className={`${bg} rounded-2xl p-4 flex flex-col justify-between min-h-[96px]`}>
      <div>
        <div className={`text-2xl font-bold ${color}`}>{value}<span className="text-sm font-normal ml-1">{unit}</span></div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      </div>
      {sub && <div className="text-xs text-gray-400 mt-2 truncate">{sub}</div>}
    </div>
  );
}
