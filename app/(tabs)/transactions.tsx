import React, { useState, useMemo } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, SectionList, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Wallet } from 'lucide-react-native';
import { useFinance } from '@/context/FinanceContext';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useMonthNavigator } from '@/hooks/useMonthNavigator';
import {
  filterByMonth, sumByType, balanceFor, groupByDate, formatDateLabel, formatCurrency,
} from '@/lib/finance';
import { MonthSelector } from '@/components/MonthSelector';
import { TransactionItem } from '@/components/TransactionItem';
import { TransactionFormModal } from '@/components/TransactionFormModal';
import type { Transaction } from '@/types/finance';

export default function TransactionsScreen() {
  const { data, addTransaction, updateTransaction, deleteTransaction } = useFinance();
  const { theme } = useTheme();
  const { currentMonth, goPrev, goNext, canGoNext } = useMonthNavigator();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const monthTransactions = useMemo(() => filterByMonth(data.transactions, currentMonth), [data.transactions, currentMonth]);
  const income = useMemo(() => sumByType(monthTransactions, 'income'), [monthTransactions]);
  const expense = useMemo(() => sumByType(monthTransactions, 'expense'), [monthTransactions]);
  const balance = useMemo(() => balanceFor(monthTransactions), [monthTransactions]);

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

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.headerBar}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Movimientos</Text>
        <TouchableOpacity style={styles.fab} onPress={handleNew}>
          <Plus size={22} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <View style={styles.padding}>
        <MonthSelector monthKey={currentMonth} onPrev={goPrev} onNext={goNext} canGoNext={canGoNext} />
      </View>

      <View style={[
        styles.summaryRow, { backgroundColor: theme.card },
        Platform.select({
          ios: { shadowColor: theme.shadowColor, shadowOpacity: theme.shadowOpacity, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
          android: { elevation: 2 },
        }),
      ]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textFaint }]}>Ingresos</Text>
          <Text style={[styles.summaryValue, { color: Colors.income }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(income)}</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: theme.borderLight }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textFaint }]}>Gastos</Text>
          <Text style={[styles.summaryValue, { color: Colors.expense }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(expense)}</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: theme.borderLight }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textFaint }]}>Balance</Text>
          <Text style={[styles.summaryValue, { color: balance >= 0 ? Colors.income : Colors.error }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(balance)}</Text>
        </View>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Wallet size={48} color={theme.textFaint} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>Sin movimientos</Text>
          <Text style={[styles.emptySub, { color: theme.textFaint }]}>No has registrado ningún movimiento este mes.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={handleNew}>
            <Plus size={18} color="#fff" strokeWidth={2.5} />
            <Text style={styles.emptyBtnText}>Añadir movimiento</Text>
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
          renderItem={({ item }) => <TransactionItem transaction={item} onPress={handleEdit} />}
          contentContainerStyle={styles.listContent}
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
      />
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
  fab: {
    width: 48, height: 48, borderRadius: Radius.full, backgroundColor: Colors.primary[600],
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: Colors.primary[600], shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  summaryRow: {
    flexDirection: 'row', marginHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.sm,
    borderRadius: Radius.lg, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xs,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: Spacing.xs },
  summaryDivider: { width: 1, marginVertical: 2 },
  summaryLabel: { fontSize: 11, fontFamily: FontFamily.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 15, fontFamily: FontFamily.bold },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
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
