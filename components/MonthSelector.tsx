import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { monthLabel } from '@/lib/finance';

interface Props {
  monthKey: string;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
}

export function MonthSelector({ monthKey, onPrev, onNext, canGoNext }: Props) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          ...Platform.select({
            ios: { shadowColor: theme.shadowColor, shadowOpacity: theme.shadowOpacity, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
            android: { elevation: 2 },
          }),
        },
      ]}
    >
      <TouchableOpacity
        style={styles.btn}
        onPress={onPrev}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <ChevronLeft size={22} color={theme.textSecondary} strokeWidth={2.5} />
      </TouchableOpacity>
      <Text style={[styles.label, { color: theme.text }]}>{monthLabel(monthKey)}</Text>
      <TouchableOpacity
        style={[styles.btn, !canGoNext && styles.btnDisabled]}
        onPress={onNext}
        disabled={!canGoNext}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <ChevronRight
          size={22}
          color={canGoNext ? theme.textSecondary : theme.textFaint}
          strokeWidth={2.5}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    textTransform: 'capitalize',
  },
});
