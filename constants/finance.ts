import type { CategoryDef, Account } from '@/types/finance';

export const DEFAULT_INCOME_CATEGORIES: CategoryDef[] = [
  { name: 'Salario', icon: 'Briefcase', color: '#10B981' },
  { name: 'Freelance', icon: 'Laptop', color: '#06B6D4' },
  { name: 'Inversiones', icon: 'TrendingUp', color: '#8B5CF6' },
  { name: 'Ventas', icon: 'ShoppingBag', color: '#F59E0B' },
  { name: 'Regalos', icon: 'Gift', color: '#EC4899' },
  { name: 'Otros ingresos', icon: 'PlusCircle', color: '#64748B' },
];

export const DEFAULT_EXPENSE_CATEGORIES: CategoryDef[] = [
  { name: 'Comida', icon: 'UtensilsCrossed', color: '#EF4444' },
  { name: 'Transporte', icon: 'Car', color: '#F97316' },
  { name: 'Vivienda', icon: 'Home', color: '#3B82F6' },
  { name: 'Ocio', icon: 'Gamepad2', color: '#8B5CF6' },
  { name: 'Salud', icon: 'HeartPulse', color: '#EC4899' },
  { name: 'Compras', icon: 'ShoppingCart', color: '#F59E0B' },
  { name: 'Servicios', icon: 'ReceiptText', color: '#14B8A6' },
  { name: 'Educación', icon: 'GraduationCap', color: '#6366F1' },
  { name: 'Otros gastos', icon: 'MinusCircle', color: '#64748B' },
];

export const ACCOUNT_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#EF4444',
  '#64748B',
];

export const ACCOUNT_ICONS = [
  'Wallet',
  'CreditCard',
  'PiggyBank',
  'Landmark',
  'Banknote',
  'Smartphone',
];

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc-default-cash', name: 'Efectivo', color: '#10B981', icon: 'Wallet', createdAt: Date.now() },
  { id: 'acc-default-bank', name: 'Cuenta bancaria', color: '#3B82F6', icon: 'Landmark', createdAt: Date.now() },
];
