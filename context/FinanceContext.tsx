import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import type { FinanceData, Transaction, Account } from '@/types/finance';
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
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<FinanceData>({
    transactions: [],
    accounts: [],
    incomeCategories: [],
    expenseCategories: [],
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
