import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
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
}

const SIZE = 160;
const STROKE = 24;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export function DonutChart({ segments, total, type }: Props) {
  const { theme } = useTheme();
  let offset = 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
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
        <View style={styles.centerLabel}>
          <Text style={[styles.centerTop, { color: theme.textFaint }]}>{type === 'income' ? 'Ingresos' : 'Gastos'}</Text>
          <Text style={[styles.centerAmount, { color: theme.text }]}>{formatCurrency(total)}</Text>
        </View>
      </View>
      <View style={styles.legend}>
        {segments.length === 0 && (
          <Text style={[styles.emptyText, { color: theme.textFaint }]}>Sin datos para mostrar</Text>
        )}
        {segments.map((seg, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
            <Text style={[styles.legendCategory, { color: theme.textSecondary }]}>{seg.category}</Text>
            <Text style={[styles.legendAmount, { color: theme.text }]}>{formatCurrency(seg.amount)}</Text>
            <Text style={[styles.legendPct, { color: theme.textFaint }]}>{seg.pct.toFixed(0)}%</Text>
          </View>
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
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
