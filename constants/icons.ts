import type { ComponentType } from 'react';
import {
  ArrowLeftRight,
  Banknote,
  Briefcase,
  Car,
  Circle,
  CircleMinus,
  CirclePlus,
  CreditCard,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Laptop,
  PiggyBank,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react-native';

type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

// Solo se importan los iconos que usa la app; `import *` metía toda la librería en el bundle.
// Las claves son los nombres guardados en los datos (incluye los nombres antiguos de lucide).
const ICONS: Record<string, IconComponent> = {
  ArrowLeftRight,
  Banknote,
  Briefcase,
  Car,
  Circle,
  CreditCard,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home: House,
  Landmark,
  Laptop,
  MinusCircle: CircleMinus,
  PiggyBank,
  PlusCircle: CirclePlus,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
};

export function getIcon(name: string, fallback: IconComponent = Circle): IconComponent {
  return ICONS[name] ?? fallback;
}
