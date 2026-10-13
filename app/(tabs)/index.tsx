import React, { useState, useMemo } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { Plus, Wallet, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFinance } from '@/context/FinanceContext';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';
import { getIcon } from '@/constants/icons';
import { useTheme } from '@/hooks/useTheme';
import { useLayout } from '@/hooks/useLayout';
import { useMonthNavigator } from '@/hooks/useMonthNavigator';
import {
  filterByMonth, sumByType, balanceFor, totalBalance, accountBalance, categoryBreakdown,
  dailySpending, last6MonthsData, sortByDateDesc, formatCurrency, dayISO, shiftMonth, elapsedDays,
  monthKey,
} from '@/lib/finance';
import { Screen } from '@/components/Screen';
import { MonthSelector } from '@/components/MonthSelector';
import { BalanceCard } from '@/components/BalanceCard';
import { DailyBarChart } from '@/components/DailyBarChart';
import { DonutChart } from '@/components/DonutChart';
import { TransactionItem } from '@/components/TransactionItem';
import { TransactionFormModal } from '@/components/TransactionFormModal';
import { TransactionListSheet } from '@/components/TransactionListSheet';
import { MonthlyBarChart } from '@/components/MonthlyBarChart';
import type { Transaction } from '@/types/finance';

interface SheetContent {
  title: string;
  transactions: Transaction[];
  emptyText: string;
}

export default function DashboardScreen() {
  const { data, addTransaction } = useFinance();
  const { theme } = useTheme();
  const { gutter, cardPadding, isCompact } = useLayout();
  const router = useRouter();
  const { currentMonth, goPrev, goNext, canGoNext } = useMonthNavigator();
  const [showForm, setShowForm] = useState(false);
  // Día elegido en la gráfica diaria; se guarda junto a su mes para volver al valor por defecto al cambiar de mes.
  const [dayPick, setDayPick] = useState<{ month: string; index: number | null }>({ month: '', index: null });
  const [scrubbing, setScrubbing] = useState(false);
  // El contenido se conserva al cerrar para que no se vacíe durante la animación de salida.
  const [sheet, setSheet] = useState<SheetContent>({ title: '', transactions: [], emptyText: '' });
  const [sheetOpen, setSheetOpen] = useState(false);
  const expensesOnly = data.settings.mode === 'expenses';

  const monthTransactions = useMemo(() => filterByMonth(data.transactions, currentMonth), [data.transactions, currentMonth]);
  // En el modo "solo gastos" se ignoran ingresos y transferencias en toda la pantalla.
  const visibleTx = useMemo(
    () => (expensesOnly ? monthTransactions.filter((t) => t.type === 'expense') : monthTransactions),
    [monthTransactions, expensesOnly]
  );
  const income = useMemo(() => sumByType(monthTransactions, 'income'), [monthTransactions]);
  const expense = useMemo(() => sumByType(monthTransactions, 'expense'), [monthTransactions]);
  const balance = useMemo(() => balanceFor(monthTransactions), [monthTransactions]);
  const dailyData = useMemo(() => dailySpending(data.transactions, currentMonth), [data.transactions, currentMonth]);
  const sixMonths = useMemo(() => last6MonthsData(data.transactions), [data.transactions]);
  const totalBal = useMemo(() => totalBalance(data.transactions), [data.transactions]);
  const recentTx = useMemo(() => sortByDateDesc(visibleTx).slice(0, 5), [visibleTx]);
  const prevExpense = useMemo(
    () => sumByType(filterByMonth(data.transactions, shiftMonth(currentMonth, -1)), 'expense'),
    [data.transactions, currentMonth]
  );

  const categorySegments = useMemo(() => {
    return categoryBreakdown(monthTransactions, 'expense').map((b) => {
      const cat = data.expenseCategories.find((c) => c.name === b.category);
      return { ...b, color: cat?.color ?? theme.textFaint };
    });
  }, [monthTransactions, data.expenseCategories, theme.textFaint]);

  // En el modo "solo gastos" cada cuenta muestra lo gastado en el mes en vez de su saldo.
  const topAccounts = useMemo(() => {
    return data.accounts
      .map((acc) => ({
        ...acc,
        balance: expensesOnly
          ? sumByType(visibleTx.filter((t) => t.account === acc.id), 'expense')
          : accountBalance(data.transactions, acc.id),
      }))
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
      .slice(0, 3);
  }, [data.accounts, data.transactions, expensesOnly, visibleTx]);

  // En el mes en curso se parte de hoy; en meses pasados no hay día elegido hasta que se toque la gráfica.
  const lastDay = elapsedDays(currentMonth) - 1;
  const selectedDay =
    dayPick.month === currentMonth ? dayPick.index : currentMonth === monthKey(new Date()) ? lastDay : null;
  const selectDay = (index: number) => setDayPick({ month: currentMonth, index });
  const stepDay = (delta: number) => {
    if (selectedDay == null) selectDay(delta > 0 ? 0 : lastDay);
    else selectDay(Math.max(0, Math.min(selectedDay + delta, lastDay)));
  };
  const dayLabel = (index: number) => {
    const label = format(parseISO(dayISO(currentMonth, index)), "EEEE d 'de' MMMM", { locale: es });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };
  const dayTxCount = useMemo(() => {
    if (selectedDay == null) return 0;
    const date = dayISO(currentMonth, selectedDay);
    return visibleTx.filter((t) => t.date === date).length;
  }, [visibleTx, currentMonth, selectedDay]);

  const openDay = (index: number) => {
    const date = dayISO(currentMonth, index);
    setSheet({
      title: dayLabel(index),
      transactions: visibleTx.filter((t) => t.date === date),
      emptyText: expensesOnly ? 'Sin gastos este día' : 'Sin movimientos este día',
    });
    setSheetOpen(true);
  };

  const openCategory = (category: string) => {
    setSheet({
      title: category,
      transactions: monthTransactions.filter((t) => t.type === 'expense' && t.category === category),
      emptyText: 'Sin gastos en esta categoría',
    });
    setSheetOpen(true);
  };

  const closeSheet = () => setSheetOpen(false);

  const cardShadow = Platform.select({
    ios: { shadowColor: theme.shadowColor, shadowOpacity: theme.shadowOpacity, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
    android: { elevation: 3 },
  });

  const expenseDiff = prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : null;
  const dailyAvg = expense / Math.max(elapsedDays(currentMonth), 1);

  return (
    <Screen>
      <ScrollView scrollEnabled={!scrubbing} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { padding: gutter }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.greeting, { color: theme.textFaint }]}>
              {expensesOnly ? 'Gastado este mes' : 'Mi dinero'}
            </Text>
            <Text
              style={[styles.totalBalance, { color: expensesOnly ? Colors.expense : theme.text }, isCompact && { fontSize: 26 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(expensesOnly ? expense : totalBal)}
            </Text>
          </View>
          <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
            <Plus size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <MonthSelector monthKey={currentMonth} onPrev={goPrev} onNext={goNext} canGoNext={canGoNext} />
        <View style={{ height: Spacing.md }} />

        <View style={[styles.card, { backgroundColor: theme.card, padding: cardPadding }, cardShadow]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{expensesOnly ? 'Gastos por cuenta' : 'Cuentas'}</Text>
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
                  <Text
                    style={[
                      styles.accBalance,
                      { color: expensesOnly ? Colors.expense : acc.balance >= 0 ? theme.text : Colors.error },
                    ]}
                    numberOfLines={1}
                  >
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
        {expensesOnly ? (
          <View style={[styles.card, styles.statsRow, { backgroundColor: theme.card, padding: cardPadding }, cardShadow]}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textFaint }]}>Media diaria</Text>
              <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(dailyAvg)}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.borderLight }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textFaint }]}>Gastos</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{visibleTx.length}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.borderLight }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textFaint }]}>vs mes anterior</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: expenseDiff == null ? theme.textFaint : expenseDiff > 0 ? Colors.expense : Colors.income },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {expenseDiff == null ? '—' : `${expenseDiff > 0 ? '+' : ''}${expenseDiff.toFixed(0)}%`}
              </Text>
            </View>
          </View>
        ) : (
          <BalanceCard income={income} expense={expense} balance={balance} />
        )}

        <View style={{ height: Spacing.lg }} />
        <View style={[styles.card, { backgroundColor: theme.card, padding: cardPadding }, cardShadow]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Gastos diarios</Text>
            <Text style={[styles.cardSub, { color: theme.textFaint }]}>{formatCurrency(expense)} total</Text>
          </View>
          <View style={[styles.dayReadout, { backgroundColor: theme.toggleBg }]}>
            <TouchableOpacity
              style={styles.dayNav}
              onPress={() => stepDay(-1)}
              disabled={selectedDay === 0}
              hitSlop={6}
              accessibilityLabel="Día anterior"
            >
              <ChevronLeft size={22} color={selectedDay === 0 ? theme.placeholder : theme.textSecondary} strokeWidth={2.2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dayInfo}
              onPress={() => selectedDay != null && openDay(selectedDay)}
              disabled={selectedDay == null}
              activeOpacity={0.7}
            >
              {selectedDay == null ? (
                <Text style={[styles.dayLabel, { color: theme.textMuted }]}>Toca o desliza el dedo por la gráfica</Text>
              ) : (
                <>
                  <Text style={[styles.dayLabel, { color: theme.textMuted }]} numberOfLines={1}>{dayLabel(selectedDay)}</Text>
                  <Text style={[styles.dayAmount, { color: dailyData[selectedDay] > 0 ? Colors.expense : theme.textFaint }]} numberOfLines={1} adjustsFontSizeToFit>
                    {formatCurrency(dailyData[selectedDay] ?? 0)}
                  </Text>
                  <Text style={[styles.dayLink, { color: dayTxCount > 0 ? Colors.primary[600] : theme.textFaint }]} numberOfLines={1}>
                    {dayTxCount === 0
                      ? (expensesOnly ? 'Sin gastos' : 'Sin movimientos')
                      : `Ver ${dayTxCount} ${expensesOnly ? 'gasto' : 'movimiento'}${dayTxCount === 1 ? '' : 's'} ›`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dayNav}
              onPress={() => stepDay(1)}
              disabled={selectedDay === lastDay}
              hitSlop={6}
              accessibilityLabel="Día siguiente"
            >
              <ChevronRight size={22} color={selectedDay === lastDay ? theme.placeholder : theme.textSecondary} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
          <DailyBarChart
            data={dailyData}
            color={Colors.expense}
            selectedIndex={selectedDay}
            onSelectDay={selectDay}
            maxIndex={lastDay}
            onScrubChange={setScrubbing}
          />
        </View>

        {expensesOnly && (
          <>
            <View style={{ height: Spacing.lg }} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Por categoría</Text>
            <DonutChart segments={categorySegments} total={expense} type="expense" onSelectCategory={openCategory} />
          </>
        )}

        <View style={{ height: Spacing.lg }} />
        <MonthlyBarChart data={sixMonths} showIncome={!expensesOnly} />

        <View style={{ height: Spacing.lg }} />
        <View style={[styles.card, { backgroundColor: theme.card, padding: cardPadding }, cardShadow]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {expensesOnly ? 'Últimos gastos' : 'Movimientos recientes'}
            </Text>
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
                <Text style={[styles.emptyText, { color: theme.textFaint }]}>
                  {expensesOnly ? 'Sin gastos este mes' : 'Sin movimientos este mes'}
                </Text>
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

      <TransactionListSheet
        visible={sheetOpen}
        onClose={closeSheet}
        title={sheet.title}
        transactions={sheet.transactions}
        emptyText={sheet.emptyText}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm + 2 },
  cardTitle: { flexShrink: 1, fontSize: 16, fontFamily: FontFamily.semibold },
  cardSub: { fontSize: 13, fontFamily: FontFamily.medium },
  dayReadout: {
    flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs, marginBottom: Spacing.md,
  },
  dayNav: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dayInfo: { flex: 1, alignItems: 'center', gap: 2, minHeight: 58, justifyContent: 'center' },
  dayLabel: { fontSize: 13, fontFamily: FontFamily.medium, textAlign: 'center' },
  dayAmount: { fontSize: 22, fontFamily: FontFamily.bold },
  dayLink: { fontSize: 12, fontFamily: FontFamily.semibold },
  sectionTitle: { fontSize: 16, fontFamily: FontFamily.semibold, marginBottom: Spacing.sm },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.md },
  statItem: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: Spacing.xs },
  statDivider: { width: 1, marginVertical: 2 },
  statLabel: { fontSize: 11, fontFamily: FontFamily.medium, textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center' },
  statValue: { fontSize: 16, fontFamily: FontFamily.bold },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAll: { fontSize: 13, fontFamily: FontFamily.medium },
  accountList: { gap: 2 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 2, paddingVertical: Spacing.sm + 2 },
  accIcon: { width: 34, height: 34, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  accName: { flex: 1, fontSize: 15, fontFamily: FontFamily.medium },
  accBalance: { flexShrink: 0, maxWidth: '55%', fontSize: 15, fontFamily: FontFamily.semibold },
  txList: { marginHorizontal: -Spacing.md, marginVertical: -Spacing.sm - 2 },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyText: { fontSize: 14, fontFamily: FontFamily.medium },
  emptyBtn: { marginTop: Spacing.xs, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full },
  emptyBtnText: { fontSize: 14, fontFamily: FontFamily.semibold },
});
