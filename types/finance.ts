export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string; // vacío en las transferencias
  account: string; // cuenta de origen en las transferencias
  toAccount?: string; // cuenta de destino (solo transferencias)
  note: string;
  date: string; // ISO yyyy-mm-dd
  createdAt: number;
}

export interface Account {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: number;
}

export interface CategoryDef {
  name: string;
  icon: string;
  color: string;
}

export interface FinanceData {
  transactions: Transaction[];
  accounts: Account[];
  incomeCategories: CategoryDef[];
  expenseCategories: CategoryDef[];
}
