import React, { useState, useMemo } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, SectionList, ScrollView, Platform, Alert,
} from 'react-native';
import { Plus, Wallet } from 'lucide-react-native';
import { useFinance } from '@/context/FinanceContext';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useLayout } from '@/hooks/useLayout';
import { useMonthNavigator } from '@/hooks/useMonthNavigator';
import {
  filterByMonth, sumByType, balanceFor, groupByDate, formatDateLabel, formatCurrency, accountBalance,
} from '@/lib/finance';
import { Screen } from '@/components/Screen';
import { MonthSelector } from '@/components/MonthSelector';
import { TransactionItem } from '@/components/TransactionItem';
import { TransactionFormModal } from '@/components/TransactionFormModal';
import type { Transaction } from '@/types/finance';

// Valor del filtro para los movimientos cuya cuenta se borró.
const NO_ACCOUNT = '__none__';

export default function TransactionsScreen() {
  const { data, addTransaction, updateTransaction, deleteTransaction } = useFinance();
  const { theme } = useTheme();
  const { gutter } = useLayout();
  const { currentMonth, goPrev, goNext, canGoNext } = useMonthNavigator();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const expensesOnly = data.settings.mode === 'expenses';

  const accountIds = useMemo(() => new Set(data.accounts.map((a) => a.id)), [data.accounts]);
  // En el modo "solo gastos" se listan gastos y transferencias (los ingresos quedan ocultos).
  const baseTransactions = useMemo(
    () => (expensesOnly ? data.transactions.filter((t) => t.type !== 'income') : data.transactions),
    [data.transactions, expensesOnly]
  );
  const hasOrphans = useMemo(
    () => baseTransactions.some((t) => !accountIds.has(t.account) || (t.type === 'transfer' && !accountIds.has(t.toAccount ?? ''))),
    [baseTransactions, accountIds]
  );

  // El filtro se ignora si la cuenta ya no existe.
  const activeFilter =
    accountFilter == null
      ? null
      : accountFilter === NO_ACCOUNT
        ? (hasOrphans ? NO_ACCOUNT : null)
        : (accountIds.has(accountFilter) ? accountFilter : null);

  const monthTransactions = useMemo(() => {
    const all = filterByMonth(baseTransactions, currentMonth);
    if (activeFilter === NO_ACCOUNT) {
      return all.filter((t) => !accountIds.has(t.account) || (t.type === 'transfer' && !accountIds.has(t.toAccount ?? '')));
    }
    if (activeFilter) return all.filter((t) => t.account === activeFilter || t.toAccount === activeFilter);
    return all;
  }, [baseTransactions, currentMonth, activeFilter, accountIds]);
  const income = useMemo(() => sumByType(monthTransactions, 'income'), [monthTransactions]);
  const expense = useMemo(() => sumByType(monthTransactions, 'expense'), [monthTransactions]);
  const balance = useMemo(() => balanceFor(monthTransactions), [monthTransactions]);
  const expenseCount = useMemo(() => monthTransactions.filter((t) => t.type === 'expense').length, [monthTransactions]);

  const filteredAccount = data.accounts.find((a) => a.id === activeFilter);
  const filteredAccountBalance = useMemo(
    () => (filteredAccount ? accountBalance(data.transactions, filteredAccount.id) : 0),
    [filteredAccount, data.transactions]
  );

  const sections = useMemo(() => {
    return groupByDate(monthTransactions).map((group) => ({
      title: formatDateLabel(group.date),
      data: group.items,
    }));
  }, [monthTransactions]);

  const handleEdit = (tx: Transaction) => { setEditing(tx); setShowForm(true); };
  const handleNew = () => { setEditing(null); setShowForm(true); };
  const handleSave = (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editing) updateTransaction(editing.id, t);
    else addTransaction(t);
    setEditing(null);
  };
  const handleClose = () => { setShowForm(false); setEditing(null); };
  const handleDelete = (id: string) => {
    Alert.alert('Eliminar movimiento', '¿Seguro que quieres eliminar este movimiento?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { deleteTransaction(id); handleClose(); } },
    ]);
  };

  const filterChips: { id: string | null; label: string; color?: string }[] = [
    { id: null, label: 'Todas' },
    ...data.accounts.map((a) => ({ id: a.id, label: a.name, color: a.color })),
    ...(hasOrphans ? [{ id: NO_ACCOUNT, label: 'Sin cuenta', color: theme.textFaint }] : []),
  ];

  const emptyTitle = 'Sin movimientos';
  const noun = 'movimientos';
  const emptySub = filteredAccount
    ? `No hay ${noun} en «${filteredAccount.name}» este mes.`
    : activeFilter === NO_ACCOUNT
      ? `No hay ${noun} sin cuenta este mes.`
      : 'No has registrado ningún movimiento este mes.';

  return (
    <Screen>
      <View style={[styles.headerBar, { paddingHorizontal: gutter }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
          Movimientos
        </Text>
        <TouchableOpacity style={styles.fab} onPress={handleNew}>
          <Plus size={22} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: gutter }}>
        <MonthSelector monthKey={currentMonth} onPrev={goPrev} onNext={goNext} canGoNext={canGoNext} />
      </View>

      {data.accounts.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={[styles.filterRow, { paddingHorizontal: gutter }]}
        >
          {filterChips.map((chip) => {
            const selected = activeFilter === chip.id;
            const accent = chip.color ?? Colors.primary[600];
            return (
              <TouchableOpacity
                key={chip.id ?? 'all'}
                style={[
                  styles.filterChip,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  selected && { backgroundColor: accent + '20', borderColor: accent },
                ]}
                onPress={() => setAccountFilter(chip.id)}
                activeOpacity={0.7}
              >
                {chip.color && <View style={[styles.filterDot, { backgroundColor: chip.color }]} />}
                <Text
                  style={[
                    styles.filterText,
                    { color: theme.textSecondary },
                    selected && { color: accent, fontFamily: FontFamily.semibold },
                  ]}
                  numberOfLines={1}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={[
        styles.summaryRow, { backgroundColor: theme.card, marginHorizontal: gutter },
        data.accounts.length === 0 && { marginTop: Spacing.md },
        Platform.select({
          ios: { shadowColor: theme.shadowColor, shadowOpacity: theme.shadowOpacity, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
          android: { elevation: 2 },
        }),
      ]}>
        {expensesOnly ? (
          <>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textFaint }]} numberOfLines={1}>Total gastado</Text>
              <Text style={[styles.summaryValue, { color: Colors.expense }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(expense)}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.borderLight }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textFaint }]} numberOfLines={1}>Nº de gastos</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>{expenseCount}</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textFaint }]} numberOfLines={1}>Ingresos</Text>
              <Text style={[styles.summaryValue, { color: Colors.income }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(income)}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.borderLight }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textFaint }]} numberOfLines={1}>Gastos</Text>
              <Text style={[styles.summaryValue, { color: Colors.expense }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(expense)}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.borderLight }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textFaint }]} numberOfLines={1}>Balance</Text>
              <Text style={[styles.summaryValue, { color: balance >= 0 ? Colors.income : Colors.error }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(balance)}</Text>
            </View>
          </>
        )}
      </View>
      {/* En "solo gastos" no se muestran saldos. */}
      {filteredAccount && !expensesOnly && (
        <Text style={[styles.accountBalance, { color: theme.textMuted, paddingHorizontal: gutter }]} numberOfLines={1}>
          Saldo actual de {filteredAccount.name}:{' '}
          <Text style={{ color: filteredAccountBalance >= 0 ? theme.text : Colors.error, fontFamily: FontFamily.semibold }}>
            {formatCurrency(filteredAccountBalance)}
          </Text>
        </Text>
      )}

      {sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Wallet size={48} color={theme.textFaint} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>{emptyTitle}</Text>
          <Text style={[styles.emptySub, { color: theme.textFaint }]}>{emptySub}</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={handleNew}>
            <Plus size={18} color="#fff" strokeWidth={2.5} />
            <Text style={styles.emptyBtnText}>{expensesOnly ? 'Añadir gasto' : 'Añadir movimiento'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section: { title } }) => (
            <View style={[styles.sectionHeader, { backgroundColor: theme.sectionHeaderBg }]}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TransactionItem transaction={item} onPress={handleEdit} perspectiveAccount={activeFilter ?? undefined} />
          )}
          contentContainerStyle={[styles.listContent, { paddingHorizontal: gutter }]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      <TransactionFormModal
        visible={showForm}
        onClose={handleClose}
        onSave={handleSave}
        onDelete={handleDelete}
        editing={editing}
        accounts={data.accounts}
        incomeCategories={data.incomeCategories}
        expenseCategories={data.expenseCategories}
        defaultAccount={filteredAccount?.id}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.md,
    paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerTitle: { flexShrink: 1, fontSize: 28, fontFamily: FontFamily.bold },
  fab: {
    width: 48, height: 48, borderRadius: Radius.full, backgroundColor: Colors.primary[600],
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: Colors.primary[600], shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  // ScrollView trae flexShrink: 1 por defecto: sin flexShrink: 0 la fila de chips se aplasta
  // cuando el resto de la pantalla (estado vacío, línea de saldo) necesita más alto.
  filterScroll: { flexGrow: 0, flexShrink: 0, marginTop: Spacing.md },
  filterRow: { gap: Spacing.sm, alignItems: 'center' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 180,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 3,
    borderRadius: Radius.full, borderWidth: 1.5,
  },
  filterDot: { width: 8, height: 8, borderRadius: 4 },
  filterText: { fontSize: 13, fontFamily: FontFamily.medium, flexShrink: 1 },
  summaryRow: {
    flexDirection: 'row', marginTop: Spacing.sm + 2, marginBottom: Spacing.sm,
    borderRadius: Radius.lg, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xs,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: Spacing.xs },
  summaryDivider: { width: 1, marginVertical: 2 },
  summaryLabel: { fontSize: 11, fontFamily: FontFamily.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 15, fontFamily: FontFamily.bold },
  accountBalance: { fontSize: 13, fontFamily: FontFamily.regular, marginBottom: Spacing.xs },
  listContent: { paddingBottom: Spacing.xl },
  sectionHeader: { paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  sectionTitle: { fontSize: 13, fontFamily: FontFamily.semibold },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  emptyTitle: { fontSize: 18, fontFamily: FontFamily.bold, marginTop: Spacing.md },
  emptySub: { fontSize: 14, fontFamily: FontFamily.regular, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs + 2, marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, borderRadius: Radius.full, backgroundColor: Colors.primary[600],
  },
  emptyBtnText: { fontSize: 15, fontFamily: FontFamily.semibold, color: '#fff' },
});
