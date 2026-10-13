import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import type {
  FinanceData, Transaction, Account, AppSettings, CategoryDef, CategoryType,
} from '@/types/finance';
import { DEFAULT_SETTINGS } from '@/constants/finance';
import { loadData, saveData, makeTransaction, makeAccount } from '@/lib/storage';

interface FinanceContextValue {
  data: FinanceData;
  loading: boolean;
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (a: Omit<Account, 'id' | 'createdAt'>) => void;
  updateAccount: (id: string, a: Omit<Account, 'id' | 'createdAt'>) => void;
  deleteAccount: (id: string) => void;
  addCategory: (type: CategoryType, c: CategoryDef) => void;
  updateCategory: (type: CategoryType, oldName: string, c: CategoryDef) => void;
  deleteCategory: (type: CategoryType, name: string) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
}

function categoryKey(type: CategoryType): 'incomeCategories' | 'expenseCategories' {
  return type === 'income' ? 'incomeCategories' : 'expenseCategories';
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<FinanceData>({
    transactions: [],
    accounts: [],
    incomeCategories: [],
    expenseCategories: [],
    settings: { ...DEFAULT_SETTINGS },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const loaded = await loadData();
      setData(loaded);
      setLoading(false);
    })();
  }, []);

  // Se guarda en cada cambio (sin debounce) para no perder datos si Android cierra la app.
  useEffect(() => {
    if (loading) return;
    saveData(data).catch(() => {});
  }, [data, loading]);

  const addTransaction = useCallback(
    (t: Omit<Transaction, 'id' | 'createdAt'>) => {
      setData((prev) => ({
        ...prev,
        transactions: [...prev.transactions, makeTransaction(t)],
      }));
    },
    []
  );

  const updateTransaction = useCallback(
    (id: string, t: Omit<Transaction, 'id' | 'createdAt'>) => {
      setData((prev) => ({
        ...prev,
        transactions: prev.transactions.map((existing) =>
          existing.id === id ? makeTransaction({ ...t, id, createdAt: existing.createdAt }) : existing
        ),
      }));
    },
    []
  );

  const deleteTransaction = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  }, []);

  const addAccount = useCallback((a: Omit<Account, 'id' | 'createdAt'>) => {
    setData((prev) => ({ ...prev, accounts: [...prev.accounts, makeAccount(a)] }));
  }, []);

  const updateAccount = useCallback((id: string, a: Omit<Account, 'id' | 'createdAt'>) => {
    setData((prev) => ({
      ...prev,
      accounts: prev.accounts.map((existing) =>
        existing.id === id ? makeAccount({ ...a, id, createdAt: existing.createdAt }) : existing
      ),
    }));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((a) => a.id !== id),
      transactions: prev.transactions.map((t) => ({
        ...t,
        account: t.account === id ? '' : t.account,
        ...(t.toAccount === id ? { toAccount: '' } : {}),
      })),
    }));
  }, []);

  const addCategory = useCallback((type: CategoryType, c: CategoryDef) => {
    const key = categoryKey(type);
    setData((prev) => ({ ...prev, [key]: [...prev[key], c] }));
  }, []);

  // Los movimientos guardan el nombre de la categoría, así que al renombrarla se actualizan también.
  const updateCategory = useCallback((type: CategoryType, oldName: string, c: CategoryDef) => {
    const key = categoryKey(type);
    setData((prev) => ({
      ...prev,
      [key]: prev[key].map((existing) => (existing.name === oldName ? c : existing)),
      transactions:
        oldName === c.name
          ? prev.transactions
          : prev.transactions.map((t) =>
              t.type === type && t.category === oldName ? { ...t, category: c.name } : t
            ),
    }));
  }, []);

  // Los movimientos de una categoría borrada conservan su nombre (se muestran con icono genérico).
  const deleteCategory = useCallback((type: CategoryType, name: string) => {
    const key = categoryKey(type);
    setData((prev) => ({ ...prev, [key]: prev[key].filter((c) => c.name !== name) }));
  }, []);

  const updateSettings = useCallback((s: Partial<AppSettings>) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, ...s } }));
  }, []);

  return (
    <FinanceContext.Provider
      value={{
        data,
        loading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addAccount,
        updateAccount,
        deleteAccount,
        addCategory,
        updateCategory,
        deleteCategory,
        updateSettings,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
