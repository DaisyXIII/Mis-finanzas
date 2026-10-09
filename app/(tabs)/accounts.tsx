import React, { useState, useMemo } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Wallet, Pen } from 'lucide-react-native';
import { useFinance } from '@/context/FinanceContext';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';
import { getIcon } from '@/constants/icons';
import { useTheme } from '@/hooks/useTheme';
import {
  accountBalance, totalBalance, formatCurrency, filterByMonth, accountMonthSummary,
} from '@/lib/finance';
import { useMonthNavigator } from '@/hooks/useMonthNavigator';
import { MonthSelector } from '@/components/MonthSelector';
import { AccountFormModal } from '@/components/AccountFormModal';
import type { Account } from '@/types/finance';

export default function AccountsScreen() {
  const { data, addAccount, updateAccount, deleteAccount } = useFinance();
  const { theme } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const accountsWithBalance = useMemo(() => {
    return data.accounts.map((acc) => ({ ...acc, balance: accountBalance(data.transactions, acc.id) }));
  }, [data.accounts, data.transactions]);

  const total = useMemo(() => totalBalance(data.transactions), [data.transactions]);

  const { currentMonth, goPrev, goNext, canGoNext } = useMonthNavigator();
  const monthSummaries = useMemo(() => {
    const monthTx = filterByMonth(data.transactions, currentMonth);
    return data.accounts.map((acc) => ({ acc, ...accountMonthSummary(monthTx, acc.id) }));
  }, [data.accounts, data.transactions, currentMonth]);

  const handleEdit = (acc: Account) => { setEditing(acc); setShowForm(true); };
  const handleNew = () => { setEditing(null); setShowForm(true); };
  const handleSave = (a: Omit<Account, 'id' | 'createdAt'>) => {
    if (editing) updateAccount(editing.id, a);
    else addAccount(a);
    setEditing(null);
  };
  const handleClose = () => { setShowForm(false); setEditing(null); };
  const handleDelete = (id: string) => {
    Alert.alert(
      'Eliminar cuenta',
      'Los movimientos de esta cuenta se conservarán, pero quedarán sin cuenta asignada.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => { deleteAccount(id); handleClose(); } },
      ]
    );
  };

  const cardShadow = Platform.select({
    ios: { shadowColor: theme.shadowColor, shadowOpacity: theme.shadowOpacity, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
    android: { elevation: 3 },
  });

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.headerBar}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Cuentas</Text>
        <TouchableOpacity style={styles.fab} onPress={handleNew}>
          <Plus size={22} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <View style={[
        styles.totalCard, { backgroundColor: theme.totalCardBg },
        Platform.select({
          ios: { shadowColor: theme.shadowColor, shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
          android: { elevation: 5 },
        }),
      ]}>
        <Text style={[styles.totalLabel, { color: theme.totalCardSub }]}>Balance total</Text>
        <Text style={[styles.totalAmount, { color: total >= 0 ? '#fff' : Colors.error }]} numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(total)}
        </Text>
        <Text style={[styles.totalSub, { color: theme.totalCardSub }]}>
          {accountsWithBalance.length} {accountsWithBalance.length === 1 ? 'cuenta' : 'cuentas'}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {accountsWithBalance.length === 0 && (
          <View style={styles.emptyState}>
            <Wallet size={48} color={theme.textFaint} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>Sin cuentas</Text>
            <Text style={[styles.emptySub, { color: theme.textFaint }]}>Crea tu primera cuenta para empezar a registrar movimientos.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={handleNew}>
              <Plus size={18} color="#fff" strokeWidth={2.5} />
              <Text style={styles.emptyBtnText}>Crear cuenta</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.accountGrid}>
          {accountsWithBalance.map((acc) => {
            const Icon = getIcon(acc.icon, Wallet);
            return (
              <TouchableOpacity
                key={acc.id}
                style={[styles.accountCard, { backgroundColor: theme.card }, cardShadow]}
                onPress={() => handleEdit(acc)}
                activeOpacity={0.7}
              >
                <View style={styles.accountCardTop}>
                  <View style={[styles.accIcon, { backgroundColor: acc.color + '18' }]}>
                    <Icon size={20} color={acc.color} strokeWidth={2.2} />
                  </View>
                  <Pen size={14} color={theme.textFaint} strokeWidth={2} />
                </View>
                <Text style={[styles.accName, { color: theme.textMuted }]} numberOfLines={1}>{acc.name}</Text>
                <Text
                  style={[styles.accBalance, { color: acc.balance >= 0 ? theme.text : Colors.error }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(acc.balance)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {accountsWithBalance.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Movimiento del mes</Text>
            <MonthSelector monthKey={currentMonth} onPrev={goPrev} onNext={goNext} canGoNext={canGoNext} />
            <View style={{ height: Spacing.md }} />
            <View style={{ gap: Spacing.md }}>
              {monthSummaries.map(({ acc, income, expense, transfersIn, transfersOut, net }) => {
                const rows: { label: string; value: number; color: string; sign: string }[] = [
                  { label: 'Ingresos', value: income, color: Colors.income, sign: '+' },
                  { label: 'Gastos', value: expense, color: Colors.expense, sign: '−' },
                  { label: 'Transferencias recibidas', value: transfersIn, color: Colors.transfer, sign: '+' },
                  { label: 'Transferencias enviadas', value: transfersOut, color: Colors.transfer, sign: '−' },
                ];
                return (
                  <View key={acc.id} style={[styles.summaryCard, { backgroundColor: theme.card }, cardShadow]}>
                    <View style={styles.summaryHeader}>
                      <View style={[styles.summaryDot, { backgroundColor: acc.color }]} />
                      <Text style={[styles.summaryName, { color: theme.text }]} numberOfLines={1}>{acc.name}</Text>
                      <Text style={[styles.summaryNet, { color: net >= 0 ? Colors.income : Colors.error }]}>
                        {net > 0 ? '+' : ''}{formatCurrency(net)}
                      </Text>
                    </View>
                    {rows.filter((r) => r.value > 0).map((r) => (
                      <View key={r.label} style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{r.label}</Text>
                        <Text style={[styles.summaryValue, { color: r.color }]}>{r.sign}{formatCurrency(r.value)}</Text>
                      </View>
                    ))}
                    {income + expense + transfersIn + transfersOut === 0 && (
                      <Text style={[styles.summaryLabel, { color: theme.textFaint }]}>Sin movimientos este mes</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <AccountFormModal
        visible={showForm}
        onClose={handleClose}
        onSave={handleSave}
        onDelete={handleDelete}
        editing={editing}
        balance={editing ? accountBalance(data.transactions, editing.id) : 0}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
  totalCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, borderRadius: Radius.xl, padding: Spacing.lg },
  totalLabel: { fontSize: 13, fontFamily: FontFamily.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalAmount: { fontSize: 32, fontFamily: FontFamily.bold, marginTop: 4 },
  totalSub: { fontSize: 13, fontFamily: FontFamily.medium, marginTop: 4 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  accountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  accountCard: { flexBasis: '47%', flexGrow: 1, flexShrink: 0, minWidth: 140, borderRadius: Radius.xl, padding: Spacing.lg },
  accountCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  accIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  accName: { fontSize: 14, fontFamily: FontFamily.medium, marginBottom: 4 },
  accBalance: { fontSize: 20, fontFamily: FontFamily.bold },
  sectionTitle: { fontSize: 18, fontFamily: FontFamily.bold, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  summaryCard: { borderRadius: Radius.xl, padding: Spacing.md, gap: 6 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
  summaryDot: { width: 10, height: 10, borderRadius: 5 },
  summaryName: { flex: 1, fontSize: 15, fontFamily: FontFamily.semibold },
  summaryNet: { fontSize: 15, fontFamily: FontFamily.bold },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, fontFamily: FontFamily.regular },
  summaryValue: { fontSize: 13, fontFamily: FontFamily.semibold },
  emptyState: { alignItems: 'center', paddingTop: Spacing.xxl, paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  emptyTitle: { fontSize: 18, fontFamily: FontFamily.bold, marginTop: Spacing.md },
  emptySub: { fontSize: 14, fontFamily: FontFamily.regular, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs + 2, marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, borderRadius: Radius.full, backgroundColor: Colors.primary[600],
  },
  emptyBtnText: { fontSize: 15, fontFamily: FontFamily.semibold, color: '#fff' },
});
