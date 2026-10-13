import React from 'react';
import {
  StyleSheet, View, Text, Platform, Pressable, TouchableOpacity, type GestureResponderEvent,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ChevronRight } from 'lucide-react-native';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useLayout } from '@/hooks/useLayout';
import { formatCurrency } from '@/lib/finance';

interface Segment {
  category: string;
  amount: number;
  pct: number;
  color: string;
}

interface Props {
  segments: Segment[];
  total: number;
  type: 'income' | 'expense';
  onSelectCategory?: (category: string) => void;
}

const SIZE = 160;
const STROKE = 24;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export function DonutChart({ segments, total, type, onSelectCategory }: Props) {
  const { theme } = useTheme();
  const { cardPadding } = useLayout();
  let offset = 0;

  // Traduce el punto tocado a un ángulo (0° arriba, sentido horario, igual que se dibujan
  // los segmentos) y busca qué segmento cubre ese ángulo.
  const handleDonutPress = (e: GestureResponderEvent) => {
    if (!onSelectCategory || total <= 0) return;
    const dx = e.nativeEvent.locationX - SIZE / 2;
    const dy = e.nativeEvent.locationY - SIZE / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < R - STROKE / 2 - 8 || dist > R + STROKE / 2 + 8) return;
    const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;
    let acc = 0;
    for (const seg of segments) {
      acc += seg.pct * 3.6;
      if (angle <= acc) {
        onSelectCategory(seg.category);
        return;
      }
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          padding: cardPadding,
          ...Platform.select({
            ios: { shadowColor: theme.shadowColor, shadowOpacity: theme.shadowOpacity, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
            android: { elevation: 3 },
          }),
        },
      ]}
    >
      <View style={styles.chartRow}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={theme.borderLight}
            strokeWidth={STROKE}
            fill="none"
          />
          {total > 0 &&
            segments.map((seg, i) => {
              const dash = (seg.pct / 100) * CIRC;
              const circle = (
                <Circle
                  key={i}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  stroke={seg.color}
                  strokeWidth={STROKE}
                  fill="none"
                  strokeDasharray={`${dash} ${CIRC - dash}`}
                  strokeDashoffset={-offset}
                  rotation={-90}
                  origin={`${SIZE / 2}, ${SIZE / 2}`}
                  strokeLinecap="butt"
                />
              );
              offset += dash;
              return circle;
            })}
        </Svg>
        <View style={styles.centerLabel} pointerEvents="none">
          <Text style={[styles.centerTop, { color: theme.textFaint }]}>{type === 'income' ? 'Ingresos' : 'Gastos'}</Text>
          <Text style={[styles.centerAmount, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(total)}
          </Text>
        </View>
        {onSelectCategory && <Pressable style={styles.donutTouch} onPress={handleDonutPress} />}
      </View>
      <View style={styles.legend}>
        {segments.length === 0 && (
          <Text style={[styles.emptyText, { color: theme.textFaint }]}>Sin datos para mostrar</Text>
        )}
        {segments.map((seg, i) => (
          <TouchableOpacity
            key={i}
            style={styles.legendItem}
            onPress={() => onSelectCategory?.(seg.category)}
            disabled={!onSelectCategory}
            activeOpacity={0.6}
          >
            <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
            <Text style={[styles.legendCategory, { color: theme.textSecondary }]} numberOfLines={1}>{seg.category}</Text>
            <Text style={[styles.legendAmount, { color: theme.text }]} numberOfLines={1}>{formatCurrency(seg.amount)}</Text>
            <Text style={[styles.legendPct, { color: theme.textFaint }]}>{seg.pct.toFixed(0)}%</Text>
            {onSelectCategory && <ChevronRight size={16} color={theme.textFaint} strokeWidth={2} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  chartRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    maxWidth: SIZE - STROKE * 2 - 8,
  },
  donutTouch: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
  },
  centerTop: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  centerAmount: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    marginTop: 2,
  },
  legend: {
    marginTop: Spacing.md,
    gap: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs + 1,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendCategory: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
  legendAmount: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  legendPct: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    width: 40,
    textAlign: 'right',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: FontFamily.medium,
    paddingVertical: Spacing.md,
  },
});
