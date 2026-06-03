'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cube, CATEGORIES, COLOR_TAGS, CATEGORY_EMOJIS } from '@/types';
import { addCube, updateCube, deleteCube } from '@/lib/storage';
import { Trash2, ChevronLeft } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import DateInput from '@/components/DateInput';

type FormData = Omit<Cube, 'id' | 'created_at' | 'updated_at'>;

interface Props {
  cube?: Cube;
}

export default function CubeForm({ cube }: Props) {
  const router = useRouter();
  const isEdit = !!cube;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dateError, setDateError] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: cube?.name ?? '',
    emoji: cube?.emoji ?? '🥦',
    category: cube?.category ?? '채소',
    color_tag: cube?.color_tag ?? COLOR_TAGS[0],
    quantity: cube?.quantity ?? 0,
    warning_threshold: cube?.warning_threshold ?? 5,
    danger_threshold: cube?.danger_threshold ?? 2,
    grams_per_cube: cube?.grams_per_cube ?? 30,
    expiry_date: cube?.expiry_date ?? null,
    photo_url: cube?.photo_url ?? null,
    notes: cube?.notes ?? null,
  });

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const thresholdError = form.warning_threshold <= form.danger_threshold
    ? '주의 기준은 부족 기준보다 커야 합니다'
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (thresholdError) return;
    if (isEdit && cube) {
      updateCube(cube.id, form);
    } else {
      addCube(form);
    }
    router.push('/cubes');
  }

  function handleDeleteConfirm() {
    if (!cube) return;
    deleteCube(cube.id);
    router.push('/cubes');
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 transition">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">{isEdit ? '큐브 수정' : '큐브 추가'}</h1>
        {isEdit && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="ml-auto p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="재료명 *">
          <input
            required
            value={form.name}
            onFocus={(e) => e.target.select()}
            onChange={(e) => set('name', e.target.value)}
            placeholder="예: 브로콜리"
            className="input"
          />
        </Field>

        <Field label="카테고리">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => {
                  setForm((prev) => {
                    const emojis = CATEGORY_EMOJIS[cat] ?? [];
                    const emoji = emojis.includes(prev.emoji) ? prev.emoji : (emojis[0] ?? prev.emoji);
                    return { ...prev, category: cat, emoji };
                  });
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  form.category === cat
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-orange-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </Field>

        <Field label="이모티콘">
          <div className="flex flex-wrap gap-1.5">
            {(CATEGORY_EMOJIS[form.category] ?? []).map((emoji, i) => (
              <button
                type="button"
                key={i}
                onClick={() => set('emoji', emoji)}
                className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-colors ${
                  form.emoji === emoji
                    ? 'bg-orange-100 ring-2 ring-[var(--primary)]'
                    : 'hover:bg-gray-100'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </Field>

        <Field label="색상 태그">
          <div className="flex gap-2 flex-wrap">
            {COLOR_TAGS.map((color) => (
              <button
                type="button"
                key={color}
                onClick={() => set('color_tag', color)}
                className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: color,
                  outline: form.color_tag === color ? `3px solid ${color}` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="현재 수량 (개)">
            <input type="number" min={0} value={form.quantity} onFocus={(e) => e.target.select()} onChange={(e) => set('quantity', Number(e.target.value))} className="input" />
          </Field>
          <Field label="주의 기준 (개)">
            <input type="number" min={0} value={form.warning_threshold} onFocus={(e) => e.target.select()} onChange={(e) => set('warning_threshold', Number(e.target.value))} className={`input ${thresholdError ? 'border-red-400' : ''}`} />
          </Field>
          <Field label="부족 기준 (개)">
            <input type="number" min={0} value={form.danger_threshold} onFocus={(e) => e.target.select()} onChange={(e) => set('danger_threshold', Number(e.target.value))} className={`input ${thresholdError ? 'border-red-400' : ''}`} />
          </Field>
        </div>
        {thresholdError && (
          <p className="text-xs text-red-500 -mt-2">{thresholdError}</p>
        )}

        <Field label="1큐브당 용량 (g)">
          <input type="number" min={1} value={form.grams_per_cube} onFocus={(e) => e.target.select()} onChange={(e) => set('grams_per_cube', Number(e.target.value))} className="input" />
        </Field>

        <Field label="유통기한 (선택)">
          <DateInput value={form.expiry_date} onChange={(v) => set('expiry_date', v)} onWarnChange={setDateError} />
        </Field>

        <Field label="메모 (선택)">
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value || null)}
            rows={2}
            placeholder="예: 유기농, 국내산 등"
            className="input resize-none"
          />
        </Field>

        <button
          type="submit"
          disabled={dateError}
          className="w-full py-3 bg-[var(--primary)] text-white font-semibold rounded-xl hover:opacity-90 transition mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isEdit ? '수정 완료' : '큐브 추가'}
        </button>
      </form>

      {showDeleteConfirm && cube && (
        <ConfirmModal
          title="큐브 삭제"
          message={`"${cube.name}" 큐브를 삭제할까요?\n소비 기록은 유지되지만 재고 관리가 불가능해져요.`}
          confirmLabel="삭제"
          danger
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}
