import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { MAX_CONTENT_WIDTH } from '@/hooks/useLayout';

// Contenedor común de las pestañas: respeta la zona segura superior y centra el contenido
// con un ancho máximo para que en pantallas grandes no quede estirado.
export function Screen({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  inner: { flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
});
