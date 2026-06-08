// 한국 공휴일 — https://date.nager.at (무료, 키 불필요, 대체공휴일 포함)
const CACHE_PREFIX = 'cubridge_holidays_';

function cacheKey(year: number) {
  return `${CACHE_PREFIX}${year}`;
}

function readCache(year: number): Set<string> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(cacheKey(year));
    if (!raw) return null;
    const { dates, cachedAt } = JSON.parse(raw) as { dates: string[]; cachedAt: number };
    // 30일 캐시
    if (Date.now() - cachedAt > 30 * 24 * 60 * 60 * 1000) return null;
    return new Set(dates);
  } catch {
    return null;
  }
}

function writeCache(year: number, dates: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(cacheKey(year), JSON.stringify({ dates, cachedAt: Date.now() }));
  } catch {}
}

/** 연도별 공휴일 Set을 반환 (캐시 → API 순서로 시도) */
export async function fetchHolidays(year: number): Promise<Set<string>> {
  const cached = readCache(year);
  if (cached) return cached;

  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/KR`);
    if (!res.ok) throw new Error('fetch failed');
    const data: { date: string }[] = await res.json();
    const dates = data.map((d) => d.date);
    writeCache(year, dates);
    return new Set(dates);
  } catch {
    // 네트워크 실패 시 빈 Set (색상 미표시)
    return new Set();
  }
}

/** Set을 받아 해당 날짜가 공휴일인지 확인 */
export function isHoliday(dateKey: string, holidays: Set<string>): boolean {
  return holidays.has(dateKey);
}
