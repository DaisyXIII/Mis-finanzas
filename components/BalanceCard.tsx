import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react-native';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useLayout } from '@/hooks/useLayout';
import { formatCurrency } from '@/lib/finance';

interface Props {
  income: number;
  expense: number;
  balance: number;
}

export function BalanceCard({ income, expense, balance }: Props) {
  const { theme } = useTheme();
  const { cardPadding, isCompact } = useLayout();
  const isPositive = balance >= 0;
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
      <View style={styles.balanceRow}>
        <View style={styles.balanceLeft}>
          <View style={[styles.balanceIcon, { backgroundColor: isPositive ? Colors.success + '15' : Colors.error + '15' }]}>
            <Wallet size={20} color={isPositive ? Colors.success : Colors.error} strokeWidth={2.2} />
          </View>
          <Text style={[styles.balanceLabel, { color: theme.textMuted }]} numberOfLines={1}>Balance del mes</Text>
        </View>
        <Text
          style={[styles.balanceAmount, { color: isPositive ? Colors.success : Colors.error }, isCompact && { fontSize: 20 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatCurrency(balance)}
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
      <View style={styles.rowContainer}>
        <View style={styles.halfCard}>
          <View style={styles.statHeader}>
            <View style={[styles.statIcon, { backgroundColor: Colors.income + '15' }]}>
              <TrendingUp size={16} color={Colors.income} strokeWidth={2.2} />
            </View>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Ingresos</Text>
          </View>
          <Text style={[styles.statAmount, { color: Colors.income }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(income)}
          </Text>
        </View>
        <View style={[styles.separator, { backgroundColor: theme.borderLight }]}>
        </View>
        <View style={styles.halfCard}>
          <View style={styles.statHeader}>
            <View style={[styles.statIcon, { backgroundColor: Colors.expense + '15' }]}>
              <TrendingDown size={16} color={Colors.expense} strokeWidth={2.2} />
            </View>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Gastos</Text>
          </View>
          <Text style={[styles.statAmount, { color: Colors.expense }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(expense)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 1,
  },
  balanceIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    flexShrink: 1,
    fontSize: 15,
    fontFamily: FontFamily.medium,
  },
  balanceAmount: {
    flexShrink: 1,
    fontSize: 24,
    fontFamily: FontFamily.bold,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  halfCard: {
    flex: 1,
    gap: Spacing.xs + 2,
  },
  separator: {
    width: 1,
    height: 40,
    marginHorizontal: Spacing.md,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  statAmount: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    paddingLeft: Spacing.xs,
  },
});
