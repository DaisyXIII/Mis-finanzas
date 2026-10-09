import React from 'react';
import { StyleSheet, View, Text, Platform, ScrollView } from 'react-native';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface BarItem {
  label: string;
  income: number;
  expense: number;
}

interface Props {
  data: BarItem[];
}

const BAR_W = 16;
const GROUP_GAP = 24;

export function MonthlyBarChart({ data }: Props) {
  const { theme } = useTheme();
  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1);
  const chartHeight = 160;
  const labelArea = 28;
  const groupW = BAR_W * 2 + 4;
  const totalW = data.length * groupW + (data.length - 1) * GROUP_GAP;

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
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Últimos 6 meses</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.income }]} />
            <Text style={[styles.legendText, { color: theme.textMuted }]}>Ingresos</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.expense }]} />
            <Text style={[styles.legendText, { color: theme.textMuted }]}>Gastos</Text>
          </View>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} style={styles.chartScroll}>
        <Svg width={totalW + 20} height={chartHeight + labelArea}>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <Rect
              key={f}
              x={0}
              y={chartHeight * (1 - f)}
              width={totalW + 20}
              height={1}
              fill={theme.borderLight}
            />
          ))}
          {data.map((item, i) => {
            const x = i * (groupW + GROUP_GAP);
            const incomeH = (item.income / maxVal) * chartHeight;
            const expenseH = (item.expense / maxVal) * chartHeight;
            return (
              <G key={i}>
                <Rect
                  x={x}
                  y={chartHeight - incomeH}
                  width={BAR_W}
                  height={incomeH}
                  rx={4}
                  fill={Colors.income}
                />
                <Rect
                  x={x + BAR_W + 4}
                  y={chartHeight - expenseH}
                  width={BAR_W}
                  height={expenseH}
                  rx={4}
                  fill={Colors.expense}
                />
                <SvgText
                  x={x + groupW / 2}
                  y={chartHeight + 18}
                  fontSize={11}
                  fill={theme.textMuted}
                  fontFamily={FontFamily.medium}
                  textAnchor="middle"
                >
                  {item.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
  },
  legendRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  chartScroll: {
    flexDirection: 'row',
  },
});
