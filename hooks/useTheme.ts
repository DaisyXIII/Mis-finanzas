import { useColorScheme } from 'react-native';
import { useFinance } from '@/context/FinanceContext';

export interface AppTheme {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  placeholder: string;
  border: string;
  borderLight: string;
  chipBg: string;
  chipBorder: string;
  overlay: string;
  shadowColor: string;
  shadowOpacity: number;
  tabBg: string;
  tabBorder: string;
  totalCardBg: string;
  totalCardSub: string;
  toggleBg: string;
  sectionHeaderBg: string;
}

const lightTheme: AppTheme = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  placeholder: '#CBD5E1',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  chipBg: '#F8FAFC',
  chipBorder: '#F1F5F9',
  overlay: 'rgba(0,0,0,0.4)',
  shadowColor: '#000',
  shadowOpacity: 0.06,
  tabBg: '#FFFFFF',
  tabBorder: '#F1F5F9',
  totalCardBg: '#0F172A',
  totalCardSub: '#94A3B8',
  toggleBg: '#F1F5F9',
  sectionHeaderBg: '#F8FAFC',
};

const darkTheme: AppTheme = {
  background: '#0F172A',
  card: '#1E293B',
  text: '#FFFFFF',
  textSecondary: '#E2E8F0',
  textMuted: '#94A3B8',
  textFaint: '#64748B',
  placeholder: '#475569',
  border: '#334155',
  borderLight: '#1E293B',
  chipBg: '#1E293B',
  chipBorder: '#334155',
  overlay: 'rgba(0,0,0,0.6)',
  shadowColor: '#000',
  shadowOpacity: 0.3,
  tabBg: '#0F172A',
  tabBorder: '#1E293B',
  totalCardBg: '#1E293B',
  totalCardSub: '#64748B',
  toggleBg: '#1E293B',
  sectionHeaderBg: '#0F172A',
};

export function useTheme(): { theme: AppTheme; isDark: boolean } {
  const scheme = useColorScheme();
  // El tema elegido en Ajustes manda; con 'system' se sigue el del teléfono.
  const preference = useFinance().data.settings.theme;
  const isDark = preference === 'system' ? scheme === 'dark' : preference === 'dark';
  return { theme: isDark ? darkTheme : lightTheme, isDark };
}
