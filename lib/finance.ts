import type { Transaction, Account } from '@/types/finance';
import { format, parseISO, isSameMonth, getYear, getMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function monthKey(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return `${getYear(d)}-${String(getMonth(d) + 1).padStart(2, '0')}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return format(d, 'MMMM yyyy', { locale: es });
}

export function filterByMonth(transactions: Transaction[], key: string): Transaction[] {
  return transactions.filter((t) => monthKey(t.date) === key);
}

export function sumByType(transactions: Transaction[], type: 'income' | 'expense'): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((acc, t) => acc + t.amount, 0);
}

export function balanceFor(transactions: Transaction[]): number {
  return sumByType(transactions, 'income') - sumByType(transactions, 'expense');
}

export function accountBalance(
  transactions: Transaction[],
  accountId: string
): number {
  return transactions.reduce((acc, t) => {
    if (t.account !== accountId) return acc;
    return acc + (t.type === 'income' ? t.amount : -t.amount);
  }, 0);
}

export function totalBalance(transactions: Transaction[]): number {
  return transactions.reduce(
    (acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount),
    0
  );
}

export function categoryBreakdown(
  transactions: Transaction[],
  type: 'income' | 'expense'
): { category: string; amount: number; pct: number }[] {
  const filtered = transactions.filter((t) => t.type === type);
  const total = filtered.reduce((acc, t) => acc + t.amount, 0);
  const map = new Map<string, number>();
  filtered.forEach((t) => {
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  });
  return Array.from(map.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      pct: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function last6MonthsData(
  transactions: Transaction[]
): { key: string; label: string; income: number; expense: number }[] {
  const result: { key: string; label: string; income: number; expense: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    const label = format(d, 'MMM', { locale: es });
    const monthTx = filterByMonth(transactions, key);
    result.push({
      key,
      label,
      income: sumByType(monthTx, 'income'),
      expense: sumByType(monthTx, 'expense'),
    });
  }
  return result;
}

export function dailySpending(transactions: Transaction[], key: string): number[] {
  const [y, m] = key.split('-');
  const year = Number(y);
  const month = Number(m) - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const result = new Array(daysInMonth).fill(0);
  transactions
    .filter((t) => t.type === 'expense' && monthKey(t.date) === key)
    .forEach((t) => {
      const d = parseISO(t.date);
      const day = d.getDate() - 1;
      result[day] += t.amount;
    });
  return result;
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function sortByDateDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
}

export function groupByDate(
  transactions: Transaction[]
): { date: string; items: Transaction[] }[] {
  const sorted = sortByDateDesc(transactions);
  const map = new Map<string, Transaction[]>();
  sorted.forEach((t) => {
    const arr = map.get(t.date) ?? [];
    arr.push(t);
    map.set(t.date, arr);
  });
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

export function formatDateLabel(iso: string): string {
  try {
    return format(parseISO(iso), "d 'de' MMMM, yyyy", { locale: es });
  } catch {
    return iso;
  }
}

export function getAccountName(accounts: Account[], id: string): string {
  return accounts.find((a) => a.id === id)?.name ?? 'Sin cuenta';
}

export function getAccountColor(accounts: Account[], id: string): string {
  return accounts.find((a) => a.id === id)?.color ?? '#64748B';
}
