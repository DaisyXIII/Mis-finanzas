import { useCallback, useMemo, useState } from 'react';
import { monthKey } from '@/lib/finance';

// Navega por meses relativos al actual (0 = mes actual, -1 = mes anterior...).
export function useMonthNavigator() {
  const [offset, setOffset] = useState(0);

  const currentMonth = useMemo(() => {
    const now = new Date();
    return monthKey(new Date(now.getFullYear(), now.getMonth() + offset, 1));
  }, [offset]);

  const goPrev = useCallback(() => setOffset((o) => o - 1), []);
  const goNext = useCallback(() => setOffset((o) => Math.min(o + 1, 0)), []);

  return { currentMonth, goPrev, goNext, canGoNext: offset < 0 };
}
