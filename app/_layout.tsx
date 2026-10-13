import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { FinanceProvider, useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/hooks/useTheme';

SplashScreen.preventAutoHideAsync();

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { loading, data } = useFinance();
  const { theme, isDark } = useTheme();
  const ready = fontsReady && !loading;
  const themePreference = data.settings.theme;

  // Fuerza también el modo de los componentes nativos (selector de fecha, alertas...).
  useEffect(() => {
    if (loading) return;
    Appearance.setColorScheme(themePreference === 'system' ? null : themePreference);
  }, [themePreference, loading]);

  // Fondo de la ventana nativa: evita destellos blancos en modo oscuro (teclado, transiciones).
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.background);
  }, [theme.background]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  return (
    <FinanceProvider>
      <RootNavigator fontsReady={fontsLoaded || !!fontError} />
    </FinanceProvider>
  );
}
