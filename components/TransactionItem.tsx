import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import type { Transaction } from '@/types/finance';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';
import { getIcon } from '@/constants/icons';
import { useTheme } from '@/hooks/useTheme';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, getAccountName, getAccountColor } from '@/lib/finance';

interface Props {
  transaction: Transaction;
  onPress?: (t: Transaction) => void;
}

export function TransactionItem({ transaction, onPress }: Props) {
  const { theme } = useTheme();
  const { data } = useFinance();
  const isIncome = transaction.type === 'income';
  const categories = isIncome ? data.incomeCategories : data.expenseCategories;
  const catInfo = categories.find((c) => c.name === transaction.category) ?? {
    icon: isIncome ? 'PlusCircle' : 'MinusCircle',
    color: isIncome ? Colors.income : Colors.expense,
  };
  const IconComp = getIcon(catInfo.icon);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(transaction)}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: catInfo.color + '18' }]}>
        <IconComp size={18} color={catInfo.color} strokeWidth={2.2} />
      </View>
      <View style={styles.middle}>
        <Text style={[styles.category, { color: theme.text }]} numberOfLines={1}>
          {transaction.category}
        </Text>
        <View style={styles.subRow}>
          <View style={[styles.accountDot, { backgroundColor: getAccountColor(data.accounts, transaction.account) }]} />
          <Text style={[styles.account, { color: theme.textFaint }]} numberOfLines={1}>
            {getAccountName(data.accounts, transaction.account)}
          </Text>
          {transaction.note ? (
            <>
              <Text style={[styles.dotSep, { color: theme.textFaint }]}>·</Text>
              <Text style={[styles.note, { color: theme.textFaint }]} numberOfLines={1}>{transaction.note}</Text>
            </>
          ) : null}
        </View>
      </View>
      <Text style={[styles.amount, { color: isIncome ? Colors.income : Colors.expense }]}>
        {isIncome ? '+' : '−'}
        {formatCurrency(transaction.amount)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm + 2,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
    gap: 2,
  },
  category: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accountDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  account: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    flexShrink: 1,
  },
  dotSep: {
    fontSize: 12,
  },
  note: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    flex: 1,
  },
  amount: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },
});
