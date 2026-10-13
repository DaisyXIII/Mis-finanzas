import React from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Modal, Pressable, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { MAX_CONTENT_WIDTH, useLayout } from '@/hooks/useLayout';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheetModal({ visible, onClose, title, children }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { gutter } = useLayout();

  return (
    // Con edge-to-edge (Android 15+) la ventana ya no se redimensiona al abrir el teclado,
    // así que KeyboardAvoidingView empuja la hoja hacia arriba; los insets evitan que la
    // barra de navegación del sistema tape los botones.
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView behavior="padding" style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.card,
              paddingBottom: Spacing.lg + insets.bottom,
              paddingHorizontal: gutter,
              maxHeight: '92%',
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>{title}</Text>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.borderLight }]}
              onPress={onClose}
              hitSlop={8}
            >
              <X size={20} color={theme.textMuted} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: Radius.xl + 4,
    borderTopRightRadius: Radius.xl + 4,
    paddingTop: Spacing.sm,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  title: { flexShrink: 1, fontSize: 18, fontFamily: FontFamily.bold },
  closeBtn: { width: 32, height: 32, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
});
