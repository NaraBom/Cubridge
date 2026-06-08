import { useEffect, useState } from 'react';
import { fetchHolidays } from '@/lib/holidays';

/** 주어진 연도들의 공휴일 날짜를 합친 Set을 반환 */
export function useHolidays(years: number[]): Set<string> {
  const [holidays, setHolidays] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (years.length === 0) return;
    Promise.all(years.map(fetchHolidays)).then((sets) => {
      const merged = new Set<string>();
      for (const s of sets) s.forEach((d) => merged.add(d));
      setHolidays(merged);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years.join(',')]);

  return holidays;
}
