export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  account: string;
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
