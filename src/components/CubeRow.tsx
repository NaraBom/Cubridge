'use client';

import Link from 'next/link';
import { Cube, getStockStatus } from '@/types';
import { Minus, Plus } from 'lucide-react';
import { updateCube, getSettings } from '@/lib/storage';

interface Props {
  cube: Cube;
  onUpdate?: (cube: Cube) => void;
}

const STATUS_CONFIG = {
  ok:      { bar: 'bg-green-400',  text: 'text-green-600',  label: '충분' },
  warning: { bar: 'bg-yellow-400', text: 'text-yellow-600', label: '주의' },
  danger:  { bar: 'bg-red-400',    text: 'text-red-500',    label: '부족' },
};

export default function CubeRow({ cube, onUpdate }: Props) {
  const status = getStockStatus(cube.quantity, cube.warning_threshold, cube.danger_threshold);
  const { bar, text, label } = STATUS_CONFIG[status];

  const { expiryWarningDays } = getSettings();
  const msUntilExpiry = cube.expiry_date
    ? new Date(cube.expiry_date).getTime() - Date.now()
    : null;
  const isExpired     = msUntilExpiry !== null && msUntilExpiry < 0;
  const isExpiringSoon = msUntilExpiry !== null && msUntilExpiry >= 0 && msUntilExpiry < expiryWarningDays * 24 * 60 * 60 * 1000;

  function adjustQuantity(delta: number) {
    const updated = updateCube(cube.id, { quantity: Math.max(0, cube.quantity + delta) });
    if (updated && onUpdate) onUpdate(updated);
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
      {/* 상태 바 */}
      <div className={`w-1 h-8 rounded-full flex-shrink-0 ${bar}`} />

      {/* 색상 점 + 이름 */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cube.color_tag }} />
        <Link
          href={`/cubes/${cube.id}`}
          className="font-medium text-gray-800 hover:text-[var(--primary)] transition-colors truncate text-sm"
        >
          {cube.name}
        </Link>
      </div>

      {/* 유통기한 경고 */}
      <div className="hidden sm:block w-36 text-xs flex-shrink-0">
        {isExpired && cube.expiry_date && (
          <span className="text-red-500 font-medium">🚫 만료 ({cube.expiry_date})</span>
        )}
        {isExpiringSoon && !isExpired && cube.expiry_date && (
          <span className="text-orange-500 font-medium">⚠ 임박 ({cube.expiry_date})</span>
        )}
      </div>

      {/* g 표기 */}
      <span className="hidden sm:block text-xs text-gray-400 w-16 text-right flex-shrink-0">
        {cube.grams_per_cube}g/개
      </span>

      {/* 수량 + 상태 */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`text-xs font-medium ${text} w-8 text-right`}>{label}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => adjustQuantity(-1)}
            className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-transform"
          >
            <Minus size={12} />
          </button>
          <span className="text-sm font-bold text-gray-800 w-8 text-center">{cube.quantity}<span className="text-xs font-normal text-gray-400">개</span></span>
          <button
            onClick={() => adjustQuantity(1)}
            className="w-7 h-7 rounded-full bg-[var(--primary)] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-transform"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
