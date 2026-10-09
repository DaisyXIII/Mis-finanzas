import React, { useState, useMemo } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Wallet, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFinance } from '@/context/FinanceContext';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';
import { getIcon } from '@/constants/icons';
import { useTheme } from '@/hooks/useTheme';
import { useMonthNavigator } from '@/hooks/useMonthNavigator';
import {
  filterByMonth, sumByType, balanceFor, totalBalance, accountBalance,
  dailySpending, last6MonthsData, sortByDateDesc, formatCurrency,
} from '@/lib/finance';
import { MonthSelector } from '@/components/MonthSelector';
import { BalanceCard } from '@/components/BalanceCard';
import { LineChartMini } from '@/components/LineChartMini';
import { TransactionItem } from '@/components/TransactionItem';
import { TransactionFormModal } from '@/components/TransactionFormModal';
import { MonthlyBarChart } from '@/components/MonthlyBarChart';

export default function DashboardScreen() {
  const { data, addTransaction } = useFinance();
  const { theme } = useTheme();
  const router = useRouter();
  const { currentMonth, goPrev, goNext, canGoNext } = useMonthNavigator();
  const [showForm, setShowForm] = useState(false);

  const monthTransactions = useMemo(() => filterByMonth(data.transactions, currentMonth), [data.transactions, currentMonth]);
  const income = useMemo(() => sumByType(monthTransactions, 'income'), [monthTransactions]);
  const expense = useMemo(() => sumByType(monthTransactions, 'expense'), [monthTransactions]);
  const balance = useMemo(() => balanceFor(monthTransactions), [monthTransactions]);
  const dailyData = useMemo(() => dailySpending(data.transactions, currentMonth), [data.transactions, currentMonth]);
  const sixMonths = useMemo(() => last6MonthsData(data.transactions), [data.transactions]);
  const totalBal = useMemo(() => totalBalance(data.transactions), [data.transactions]);
  const recentTx = useMemo(() => sortByDateDesc(monthTransactions).slice(0, 5), [monthTransactions]);

  const topAccounts = useMemo(() => {
    return data.accounts
      .map((acc) => ({ ...acc, balance: accountBalance(data.transactions, acc.id) }))
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
      .slice(0, 3);
  }, [data.accounts, data.transactions]);

  const cardShadow = Platform.select({
    ios: { shadowColor: theme.shadowColor, shadowOpacity: theme.shadowOpacity, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
    android: { elevation: 3 },
  });

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.greeting, { color: theme.textFaint }]}>Mi dinero</Text>
            <Text style={[styles.totalBalance, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(totalBal)}
            </Text>
          </View>
          <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
            <Plus size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <MonthSelector monthKey={currentMonth} onPrev={goPrev} onNext={goNext} canGoNext={canGoNext} />
        <View style={{ height: Spacing.md }} />

        <View style={[styles.card, { backgroundColor: theme.card }, cardShadow]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Cuentas</Text>
            <TouchableOpacity onPress={() => router.navigate('/accounts')} hitSlop={8}>
              <View style={styles.seeAllRow}>
                <Text style={[styles.seeAll, { color: Colors.primary[600] }]}>Ver todas</Text>
                <ArrowRight size={14} color={Colors.primary[600]} strokeWidth={2.2} />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.accountList}>
            {topAccounts.map((acc) => {
              const Icon = getIcon(acc.icon, Wallet);
              return (
                <View key={acc.id} style={styles.accountRow}>
                  <View style={[styles.accIcon, { backgroundColor: acc.color + '18' }]}>
                    <Icon size={16} color={acc.color} strokeWidth={2.2} />
                  </View>
                  <Text style={[styles.accName, { color: theme.textSecondary }]} numberOfLines={1}>{acc.name}</Text>
                  <Text style={[styles.accBalance, { color: acc.balance >= 0 ? theme.text : Colors.error }]}>
                    {formatCurrency(acc.balance)}
                  </Text>
                </View>
              );
            })}
            {topAccounts.length === 0 && (
              <Text style={[styles.emptyText, { color: theme.textFaint }]}>No hay cuentas configuradas</Text>
            )}
          </View>
        </View>

        <View style={{ height: Spacing.lg }} />
        <BalanceCard income={income} expense={expense} balance={balance} />

        <View style={{ height: Spacing.lg }} />
        <View style={[styles.card, { backgroundColor: theme.card }, cardShadow]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Gastos diarios</Text>
            <Text style={[styles.cardSub, { color: theme.textFaint }]}>{formatCurrency(expense)} total</Text>
          </View>
          <View style={{ height: Spacing.sm }} />
          <LineChartMini data={dailyData} color={Colors.expense} />
        </View>

        <View style={{ height: Spacing.lg }} />
        <MonthlyBarChart data={sixMonths} />

        <View style={{ height: Spacing.lg }} />
        <View style={[styles.card, { backgroundColor: theme.card }, cardShadow]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Movimientos recientes</Text>
            <TouchableOpacity onPress={() => router.navigate('/transactions')} hitSlop={8}>
              <View style={styles.seeAllRow}>
                <Text style={[styles.seeAll, { color: Colors.primary[600] }]}>Ver todos</Text>
                <ArrowRight size={14} color={Colors.primary[600]} strokeWidth={2.2} />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.txList}>
            {recentTx.length === 0 && (
              <View style={styles.emptyState}>
                <Wallet size={32} color={theme.textFaint} strokeWidth={1.5} />
                <Text style={[styles.emptyText, { color: theme.textFaint }]}>Sin movimientos este mes</Text>
                <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: Colors.primary[50] }]} onPress={() => setShowForm(true)}>
                  <Text style={[styles.emptyBtnText, { color: Colors.primary[600] }]}>Añadir el primero</Text>
                </TouchableOpacity>
              </View>
            )}
            {recentTx.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))}
          </View>
        </View>
      </ScrollView>

      <TransactionFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={addTransaction}
        accounts={data.accounts}
        incomeCategories={data.incomeCategories}
        expenseCategories={data.expenseCategories}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg, gap: Spacing.md },
  headerText: { flex: 1 },
  greeting: { fontSize: 14, fontFamily: FontFamily.medium, marginBottom: 4 },
  totalBalance: { fontSize: 30, fontFamily: FontFamily.bold },
  fab: {
    width: 48, height: 48, borderRadius: Radius.full, backgroundColor: Colors.primary[600],
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: Colors.primary[600], shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  card: { borderRadius: Radius.xl, padding: Spacing.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm + 2 },
  cardTitle: { fontSize: 16, fontFamily: FontFamily.semibold },
  cardSub: { fontSize: 13, fontFamily: FontFamily.medium },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAll: { fontSize: 13, fontFamily: FontFamily.medium },
  accountList: { gap: 2 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 2, paddingVertical: Spacing.sm + 2 },
  accIcon: { width: 34, height: 34, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  accName: { flex: 1, fontSize: 15, fontFamily: FontFamily.medium },
  accBalance: { fontSize: 15, fontFamily: FontFamily.semibold },
  txList: { marginHorizontal: -Spacing.md, marginVertical: -Spacing.sm - 2 },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyText: { fontSize: 14, fontFamily: FontFamily.medium },
  emptyBtn: { marginTop: Spacing.xs, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full },
  emptyBtnText: { fontSize: 14, fontFamily: FontFamily.semibold },
});
