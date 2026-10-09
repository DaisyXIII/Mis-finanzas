import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function NotFoundScreen() {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>Esta pantalla no existe.</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Volver al inicio</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  text: { fontSize: 20, fontFamily: FontFamily.semibold },
  link: { marginTop: Spacing.md, paddingVertical: Spacing.md },
  linkText: { fontSize: 16, fontFamily: FontFamily.semibold, color: Colors.primary[600] },
});
