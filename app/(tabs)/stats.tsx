import React, { useState, useMemo } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFinance } from '@/context/FinanceContext';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useMonthNavigator } from '@/hooks/useMonthNavigator';
import {
  filterByMonth, sumByType, categoryBreakdown, formatCurrency, last6MonthsData,
} from '@/lib/finance';
import { MonthSelector } from '@/components/MonthSelector';
import { DonutChart } from '@/components/DonutChart';
import { MonthlyBarChart } from '@/components/MonthlyBarChart';

type TabType = 'expense' | 'income';

export default function StatsScreen() {
  const { data } = useFinance();
  const { theme } = useTheme();
  const { currentMonth, goPrev, goNext, canGoNext } = useMonthNavigator();
  const [tab, setTab] = useState<TabType>('expense');

  const monthTransactions = useMemo(() => filterByMonth(data.transactions, currentMonth), [data.transactions, currentMonth]);
  const incomeTotal = useMemo(() => sumByType(monthTransactions, 'income'), [monthTransactions]);
  const expenseTotal = useMemo(() => sumByType(monthTransactions, 'expense'), [monthTransactions]);
  const sixMonths = useMemo(() => last6MonthsData(data.transactions), [data.transactions]);

  const segments = useMemo(() => {
    const catList = tab === 'expense' ? data.expenseCategories : data.incomeCategories;
    return categoryBreakdown(monthTransactions, tab).map((b) => {
      const cat = catList.find((c) => c.name === b.category);
      return { category: b.category, amount: b.amount, pct: b.pct, color: cat?.color ?? theme.textFaint };
    });
  }, [tab, monthTransactions, data.expenseCategories, data.incomeCategories, theme.textFaint]);

  const currentTotal = tab === 'expense' ? expenseTotal : incomeTotal;

  const cardShadow = Platform.select({
    ios: { shadowColor: theme.shadowColor, shadowOpacity: theme.shadowOpacity, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
    android: { elevation: 3 },
  });

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.headerBar}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Estadísticas</Text>
      </View>

      <View style={styles.padding}>
        <MonthSelector monthKey={currentMonth} onPrev={goPrev} onNext={goNext} canGoNext={canGoNext} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.toggleRow, { backgroundColor: theme.toggleBg }]}>
          <TouchableOpacity
            style={[styles.toggleBtn, tab === 'expense' && styles.toggleExpense]}
            onPress={() => setTab('expense')}
          >
            <Text style={[styles.toggleText, { color: theme.textMuted }, tab === 'expense' && styles.toggleTextActive]}>Gastos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, tab === 'income' && styles.toggleIncome]}
            onPress={() => setTab('income')}
          >
            <Text style={[styles.toggleText, { color: theme.textMuted }, tab === 'income' && styles.toggleTextActive]}>Ingresos</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.lg }} />
        <DonutChart segments={segments} total={currentTotal} type={tab} />
        <View style={{ height: Spacing.lg }} />
        <MonthlyBarChart data={sixMonths} />

        <View style={{ height: Spacing.lg }} />
        <View style={[styles.summaryCard, { backgroundColor: theme.card }, cardShadow]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textFaint }]}>Ingresos del mes</Text>
              <Text style={[styles.summaryValue, { color: Colors.income }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(incomeTotal)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textFaint }]}>Gastos del mes</Text>
              <Text style={[styles.summaryValue, { color: Colors.expense }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(expenseTotal)}</Text>
            </View>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: theme.borderLight }]} />
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Balance neto</Text>
            <Text style={[styles.balanceValue, { color: incomeTotal - expenseTotal >= 0 ? Colors.income : Colors.expense }]}>
              {formatCurrency(incomeTotal - expenseTotal)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  padding: { paddingHorizontal: Spacing.lg },
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: 28, fontFamily: FontFamily.bold },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xl },
  toggleRow: { flexDirection: 'row', borderRadius: Radius.md, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: Spacing.sm + 2, borderRadius: Radius.sm, alignItems: 'center' },
  toggleExpense: { backgroundColor: Colors.expense },
  toggleIncome: { backgroundColor: Colors.income },
  toggleText: { fontSize: 15, fontFamily: FontFamily.medium },
  toggleTextActive: { color: '#fff', fontFamily: FontFamily.semibold },
  summaryCard: { borderRadius: Radius.xl, padding: Spacing.lg },
  summaryRow: { flexDirection: 'row', gap: Spacing.md },
  summaryItem: { flex: 1, gap: 4 },
  summaryLabel: { fontSize: 13, fontFamily: FontFamily.medium },
  summaryValue: { fontSize: 18, fontFamily: FontFamily.bold },
  summaryDivider: { height: 1, marginVertical: Spacing.md },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: 15, fontFamily: FontFamily.semibold },
  balanceValue: { fontSize: 20, fontFamily: FontFamily.bold },
});
