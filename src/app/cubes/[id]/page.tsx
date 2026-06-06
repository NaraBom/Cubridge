'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getCubes } from '@/lib/storage';
import CubeForm from '@/components/CubeForm';

export default function CubeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const cube = useMemo(() => getCubes().find((c) => c.id === id) ?? null, [id]);

  if (cube === null) return <div className="p-6 text-gray-400">큐브를 찾을 수 없어요.</div>;

  return <CubeForm cube={cube} />;
}
