import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FinanceData, Transaction, Account } from '@/types/finance';
import {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_ACCOUNTS,
} from '@/constants/finance';

const STORAGE_KEY = 'finance_data_v1';

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function defaultData(): FinanceData {
  return {
    transactions: [],
    accounts: [...DEFAULT_ACCOUNTS],
    incomeCategories: [...DEFAULT_INCOME_CATEGORIES],
    expenseCategories: [...DEFAULT_EXPENSE_CATEGORIES],
  };
}

export async function loadData(): Promise<FinanceData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw) as Partial<FinanceData>;
    return {
      transactions: parsed.transactions ?? [],
      accounts: parsed.accounts?.length ? parsed.accounts : [...DEFAULT_ACCOUNTS],
      incomeCategories: parsed.incomeCategories ?? [...DEFAULT_INCOME_CATEGORIES],
      expenseCategories: parsed.expenseCategories ?? [...DEFAULT_EXPENSE_CATEGORIES],
    };
  } catch {
    return defaultData();
  }
}

export async function saveData(data: FinanceData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function makeTransaction(
  partial: Omit<Transaction, 'id' | 'createdAt'> & { id?: string; createdAt?: number }
): Transaction {
  return {
    id: partial.id ?? uid(),
    type: partial.type,
    amount: partial.amount,
    category: partial.category,
    account: partial.account,
    ...(partial.type === 'transfer' ? { toAccount: partial.toAccount ?? '' } : {}),
    note: partial.note,
    date: partial.date,
    createdAt: partial.createdAt ?? Date.now(),
  };
}

export function makeAccount(
  partial: Omit<Account, 'id' | 'createdAt'> & { id?: string; createdAt?: number }
): Account {
  return {
    id: partial.id ?? uid(),
    name: partial.name,
    color: partial.color,
    icon: partial.icon,
    createdAt: partial.createdAt ?? Date.now(),
  };
}
