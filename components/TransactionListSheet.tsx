import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency, formatDateLabel, groupByDate, sumByType } from '@/lib/finance';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { TransactionItem } from '@/components/TransactionItem';
import type { Transaction } from '@/types/finance';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  transactions: Transaction[];
  emptyText?: string;
}

// Lista de solo lectura que se abre al tocar una gráfica (un día, una categoría...).
export function TransactionListSheet({ visible, onClose, title, transactions, emptyText = 'Sin movimientos' }: Props) {
  const { theme } = useTheme();
  const groups = useMemo(() => groupByDate(transactions), [transactions]);
  const income = useMemo(() => sumByType(transactions, 'income'), [transactions]);
  const expense = useMemo(() => sumByType(transactions, 'expense'), [transactions]);
  const showDates = groups.length > 1;

  const totals = [
    { label: 'Gastos', value: expense, color: Colors.expense },
    { label: 'Ingresos', value: income, color: Colors.income },
  ].filter((t) => t.value > 0);

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title={title}>
      {totals.length > 0 && (
        <View style={styles.totalsRow}>
          {totals.map((t) => (
            <View key={t.label} style={[styles.totalBox, { backgroundColor: t.color + '12' }]}>
              <Text style={[styles.totalLabel, { color: theme.textMuted }]}>{t.label}</Text>
              <Text style={[styles.totalValue, { color: t.color }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(t.value)}
              </Text>
            </View>
          ))}
        </View>
      )}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {transactions.length === 0 && (
          <Text style={[styles.empty, { color: theme.textFaint }]}>{emptyText}</Text>
        )}
        {groups.map((g) => (
          <View key={g.date}>
            {showDates && (
              <Text style={[styles.dateHeader, { color: theme.textMuted }]}>{formatDateLabel(g.date)}</Text>
            )}
            <View style={styles.list}>
              {g.items.map((tx) => (
                <TransactionItem key={tx.id} transaction={tx} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  totalsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  totalBox: { flex: 1, borderRadius: Radius.md, paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.md, gap: 2 },
  totalLabel: { fontSize: 12, fontFamily: FontFamily.medium },
  totalValue: { fontSize: 18, fontFamily: FontFamily.bold },
  scroll: { flexGrow: 0, flexShrink: 1 },
  list: { marginHorizontal: -Spacing.md },
  dateHeader: { fontSize: 13, fontFamily: FontFamily.semibold, marginTop: Spacing.md, marginBottom: 2 },
  empty: { fontSize: 14, fontFamily: FontFamily.medium, textAlign: 'center', paddingVertical: Spacing.xl },
});
