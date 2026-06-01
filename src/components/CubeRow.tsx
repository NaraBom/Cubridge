'use client';

import { useState, useRef, useEffect } from 'react';
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
  const isExpired      = msUntilExpiry !== null && msUntilExpiry < 0;
  const isExpiringSoon = msUntilExpiry !== null && msUntilExpiry >= 0 && msUntilExpiry < expiryWarningDays * 24 * 60 * 60 * 1000;

  // 인라인 편집 상태
  const [editingExpiry, setEditingExpiry] = useState(false);
  const [editingGrams, setEditingGrams]   = useState(false);
  const [gramsDraft, setGramsDraft]       = useState(String(cube.grams_per_cube));
  const gramsRef = useRef<HTMLInputElement>(null);

  // 날짜 세 칸 분리
  const parsedDate = cube.expiry_date ? cube.expiry_date.split('-') : ['', '', ''];
  const [yyyy, setYyyy] = useState(parsedDate[0] ?? '');
  const [mm,   setMm]   = useState(parsedDate[1] ?? '');
  const [dd,   setDd]   = useState(parsedDate[2] ?? '');
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingExpiry) {
      const p = cube.expiry_date ? cube.expiry_date.split('-') : ['', '', ''];
      setYyyy(p[0] ?? ''); setMm(p[1] ?? ''); setDd(p[2] ?? '');
    }
  }, [editingExpiry, cube.expiry_date]);

  function saveExpiry() {
    const value = yyyy && mm && dd ? `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}` : null;
    const updated = updateCube(cube.id, { expiry_date: value });
    if (updated && onUpdate) onUpdate(updated);
    setEditingExpiry(false);
  }

  function cancelExpiry() {
    setEditingExpiry(false);
  }

  function saveGrams() {
    const num = parseInt(gramsDraft, 10);
    const valid = isNaN(num) || num < 1 ? cube.grams_per_cube : num;
    setGramsDraft(String(valid));
    const updated = updateCube(cube.id, { grams_per_cube: valid });
    if (updated && onUpdate) onUpdate(updated);
    setEditingGrams(false);
  }

  function adjustQuantity(delta: number) {
    const updated = updateCube(cube.id, { quantity: Math.max(0, cube.quantity + delta) });
    if (updated && onUpdate) onUpdate(updated);
  }

  const quantity = cube.quantity;

  return (
    <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
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

        {/* 유통기한 — 클릭 시 date input */}
        <div className="hidden sm:block w-36 text-xs flex-shrink-0">
          {editingExpiry ? (
            <div className="flex items-center gap-0.5 text-xs">
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                placeholder="YYYY"
                maxLength={4}
                value={yyyy}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '');
                  setYyyy(v);
                  if (v.length === 4) monthRef.current?.focus();
                }}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => { if (e.key === 'Enter') saveExpiry(); if (e.key === 'Escape') cancelExpiry(); }}
                className="w-12 text-center border border-[var(--primary)] rounded-md py-0.5 focus:outline-none"
              />
              <span className="text-gray-400">-</span>
              <input
                ref={monthRef}
                type="text"
                inputMode="numeric"
                placeholder="MM"
                maxLength={2}
                value={mm}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '');
                  setMm(v);
                  if (v.length === 2) dayRef.current?.focus();
                }}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => { if (e.key === 'Enter') saveExpiry(); if (e.key === 'Escape') cancelExpiry(); }}
                className="w-8 text-center border border-[var(--primary)] rounded-md py-0.5 focus:outline-none"
              />
              <span className="text-gray-400">-</span>
              <input
                ref={dayRef}
                type="text"
                inputMode="numeric"
                placeholder="DD"
                maxLength={2}
                value={dd}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '');
                  setDd(v);
                }}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => { if (e.key === 'Enter') saveExpiry(); if (e.key === 'Escape') cancelExpiry(); }}
                onBlur={saveExpiry}
                className="w-8 text-center border border-[var(--primary)] rounded-md py-0.5 focus:outline-none"
              />
            </div>
          ) : (
            <button
              onClick={() => setEditingExpiry(true)}
              className="text-left w-full hover:underline decoration-dashed underline-offset-2"
            >
              {isExpired && cube.expiry_date && (
                <span className="text-red-500 font-medium">🚫 만료 ({cube.expiry_date})</span>
              )}
              {isExpiringSoon && !isExpired && cube.expiry_date && (
                <span className="text-orange-500 font-medium">⚠ 임박 ({cube.expiry_date})</span>
              )}
              {!isExpired && !isExpiringSoon && (
                <span className="text-gray-500">{cube.expiry_date ?? '기한 없음'}</span>
              )}
            </button>
          )}
        </div>

        {/* g 표기 — 클릭 시 number input */}
        <div className="hidden sm:block w-16 text-right flex-shrink-0">
          {editingGrams ? (
            <input
              ref={gramsRef}
              type="text"
              inputMode="numeric"
              autoFocus
              value={gramsDraft}
              onChange={(e) => setGramsDraft(e.target.value.replace(/[^0-9]/g, ''))}
              onFocus={(e) => e.target.select()}
              onBlur={saveGrams}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveGrams();
                if (e.key === 'Escape') { setGramsDraft(String(cube.grams_per_cube)); setEditingGrams(false); }
              }}
              className="w-full text-right border border-[var(--primary)] rounded-md px-1.5 py-0.5 text-xs focus:outline-none"
            />
          ) : (
            <button
              onClick={() => { setGramsDraft(String(cube.grams_per_cube)); setEditingGrams(true); }}
              className="text-xs text-gray-400 hover:underline decoration-dashed underline-offset-2 w-full text-right"
            >
              {cube.grams_per_cube}g/개
            </button>
          )}
        </div>

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
            <span className="text-sm font-bold text-gray-800 w-8 text-center">
              {cube.quantity}<span className="text-xs font-normal text-gray-400">개</span>
            </span>
            <button
              onClick={() => adjustQuantity(1)}
              className="w-7 h-7 rounded-full bg-[var(--primary)] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-transform"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* 수량 도트 표시 */}
      <div className="flex items-center gap-0.5 mt-1.5 pl-4">
        {quantity === 0 ? (
          <span className="text-xs text-gray-300">-</span>
        ) : (
          Array.from({ length: quantity }).map((_, i) => (
            <span key={i} className="flex items-center gap-0.5">
              {i > 0 && i % 10 === 0 && (
                <span className="text-xs leading-none text-gray-400 mx-0.5">/</span>
              )}
              <span className="leading-none" style={{ fontSize: '20px', color: cube.color_tag }}>●</span>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
