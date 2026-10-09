import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, ArrowLeftRight, Wallet, ChartPie } from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const TAB_BAR_HEIGHT = 60;

export default function TabLayout() {
  const { theme } = useTheme();
  // Android 15+ es edge-to-edge: la barra de navegación del sistema queda encima de la app,
  // así que hay que sumar su altura para que no tape las pestañas.
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Spacing.sm);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: Colors.primary[600],
        tabBarInactiveTintColor: theme.textFaint,
        sceneStyle: { backgroundColor: theme.background },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter-Medium',
        },
        tabBarStyle: {
          backgroundColor: theme.tabBg,
          borderTopColor: theme.tabBorder,
          borderTopWidth: 1,
          elevation: 0,
          height: TAB_BAR_HEIGHT + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: Spacing.xs + 2,
          paddingHorizontal: Spacing.sm,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Movimientos',
          tabBarIcon: ({ color }) => <ArrowLeftRight size={22} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Estadísticas',
          tabBarIcon: ({ color }) => <ChartPie size={22} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Cuentas',
          tabBarIcon: ({ color }) => <Wallet size={22} color={color} strokeWidth={2.2} />,
        }}
      />
    </Tabs>
  );
}
