import React, { useState } from 'react';
import {
  StyleSheet, View, Text, Platform, Pressable, type GestureResponderEvent,
} from 'react-native';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useLayout } from '@/hooks/useLayout';
import { formatCompact, formatCurrency, monthLabel, niceMax } from '@/lib/finance';

interface BarItem {
  key: string; // yyyy-mm
  label: string;
  income: number;
  expense: number;
}

interface Props {
  data: BarItem[];
  // En el modo "solo gastos" se dibuja una única barra por mes.
  showIncome?: boolean;
}

const CHART_H = 160;
const TOP_PAD = 16; // hueco para la etiqueta de valor sobre la barra más alta
const Y_AXIS_W = 34;
const MONTH_LABEL_H = 24;
const STACKED_VALUES_H = 26; // dos líneas de importes bajo el mes cuando no caben encima

export function MonthlyBarChart({ data, showIncome = true }: Props) {
  const { theme } = useTheme();
  const { contentWidth, gutter, cardPadding } = useLayout();
  const [width, setWidth] = useState(Math.max(contentWidth - (gutter + cardPadding) * 2, 200));
  const [selected, setSelected] = useState(data.length - 1);

  const maxVal = niceMax(Math.max(...data.map((d) => (showIncome ? Math.max(d.income, d.expense) : d.expense))));
  const plotW = width - Y_AXIS_W;
  const plotH = CHART_H - TOP_PAD;
  const slot = plotW / Math.max(data.length, 1);
  const barW = showIncome ? Math.min(16, (slot - 12) / 2) : Math.min(26, slot - 16);
  const barGap = 3;
  const groupW = showIncome ? barW * 2 + barGap : barW;
  // En pantallas estrechas las cifras de dos barras contiguas se pisarían: se muestran
  // apiladas debajo del nombre del mes.
  const labelsAbove = !showIncome || barW + barGap >= 22;
  const labelArea = MONTH_LABEL_H + (labelsAbove ? 0 : STACKED_VALUES_H);

  const sel = data[Math.min(selected, data.length - 1)];

  const handlePress = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX - Y_AXIS_W;
    if (x < 0) return;
    setSelected(Math.min(Math.floor(x / slot), data.length - 1));
  };

  const renderBar = (value: number, x: number, color: string) => {
    const h = value > 0 ? Math.max((value / maxVal) * plotH, 2) : 0;
    return (
      <>
        {h > 0 && <Rect x={x} y={CHART_H - h} width={barW} height={h} rx={4} fill={color} />}
        {labelsAbove && value > 0 && (
          <SvgText
            x={x + barW / 2}
            y={CHART_H - h - 4}
            fontSize={9}
            fill={theme.textMuted}
            fontFamily={FontFamily.semibold}
            textAnchor="middle"
          >
            {formatCompact(value)}
          </SvgText>
        )}
      </>
    );
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Últimos 6 meses</Text>
        {showIncome && (
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
        )}
      </View>

      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <Svg width={width} height={CHART_H + labelArea}>
          {[0, 0.5, 1].map((f) => {
            const y = TOP_PAD + plotH * (1 - f);
            return (
              <G key={f}>
                <Rect x={Y_AXIS_W} y={y} width={plotW} height={1} fill={theme.borderLight} />
                <SvgText
                  x={Y_AXIS_W - 6}
                  y={y + 3.5}
                  fontSize={10}
                  fill={theme.textFaint}
                  fontFamily={FontFamily.medium}
                  textAnchor="end"
                >
                  {formatCompact(maxVal * f)}
                </SvgText>
              </G>
            );
          })}
          {data.map((item, i) => {
            const slotX = Y_AXIS_W + i * slot;
            const x = slotX + (slot - groupW) / 2;
            const isSel = i === selected;
            return (
              <G key={item.key}>
                {isSel && (
                  <Rect x={slotX + 2} y={0} width={slot - 4} height={CHART_H + labelArea} rx={8} fill={theme.borderLight} />
                )}
                {showIncome && renderBar(item.income, x, Colors.income)}
                {renderBar(item.expense, showIncome ? x + barW + barGap : x, Colors.expense)}
                <SvgText
                  x={slotX + slot / 2}
                  y={CHART_H + 16}
                  fontSize={11}
                  fill={isSel ? theme.text : theme.textMuted}
                  fontFamily={isSel ? FontFamily.semibold : FontFamily.medium}
                  textAnchor="middle"
                >
                  {item.label}
                </SvgText>
                {!labelsAbove && (
                  <>
                    <SvgText
                      x={slotX + slot / 2}
                      y={CHART_H + 30}
                      fontSize={9}
                      fill={Colors.income}
                      fontFamily={FontFamily.semibold}
                      textAnchor="middle"
                    >
                      {formatCompact(item.income)}
                    </SvgText>
                    <SvgText
                      x={slotX + slot / 2}
                      y={CHART_H + 42}
                      fontSize={9}
                      fill={Colors.expense}
                      fontFamily={FontFamily.semibold}
                      textAnchor="middle"
                    >
                      {formatCompact(item.expense)}
                    </SvgText>
                  </>
                )}
              </G>
            );
          })}
        </Svg>
        <Pressable style={StyleSheet.absoluteFill} onPress={handlePress} />
      </View>

      {sel && (
        <View style={[styles.detail, { borderTopColor: theme.borderLight }]}>
          <Text style={[styles.detailMonth, { color: theme.textMuted }]}>{monthLabel(sel.key)}</Text>
          <View style={styles.detailRow}>
            {showIncome && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.textFaint }]}>Ingresos</Text>
                <Text style={[styles.detailValue, { color: Colors.income }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(sel.income)}
                </Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textFaint }]}>Gastos</Text>
              <Text style={[styles.detailValue, { color: Colors.expense }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(sel.expense)}
              </Text>
            </View>
            {showIncome && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.textFaint }]}>Balance</Text>
                <Text
                  style={[styles.detailValue, { color: sel.income - sel.expense >= 0 ? Colors.income : Colors.error }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(sel.income - sel.expense)}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
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
  detail: {
    borderTopWidth: 1,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  detailMonth: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    textTransform: 'capitalize',
  },
  detailRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  detailItem: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },
});
