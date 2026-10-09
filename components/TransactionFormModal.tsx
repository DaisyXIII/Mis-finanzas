import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { Check, Trash2, ArrowDownLeft, ArrowUpRight, Calendar } from 'lucide-react-native';
import type { Transaction, Account, CategoryDef } from '@/types/finance';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';
import { getIcon } from '@/constants/icons';
import { useTheme } from '@/hooks/useTheme';
import { todayISO, formatDateLabel } from '@/lib/finance';
import { BottomSheetModal } from '@/components/BottomSheetModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onDelete?: (id: string) => void;
  editing?: Transaction | null;
  accounts: Account[];
  incomeCategories: CategoryDef[];
  expenseCategories: CategoryDef[];
}

function parseAmount(value: string): number {
  return parseFloat(value.replace(',', '.'));
}

export function TransactionFormModal({
  visible,
  onClose,
  onSave,
  onDelete,
  editing,
  accounts,
  incomeCategories,
  expenseCategories,
}: Props) {
  const { theme } = useTheme();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());

  useEffect(() => {
    if (visible) {
      if (editing) {
        setType(editing.type);
        setAmount(String(editing.amount).replace('.', ','));
        setCategory(editing.category);
        setAccount(editing.account);
        setNote(editing.note);
        setDate(editing.date);
      } else {
        setType('expense');
        setAmount('');
        setCategory('');
        setAccount(accounts[0]?.id ?? '');
        setNote('');
        setDate(todayISO());
      }
    }
    // Solo se reinicia el formulario al abrirlo, no cada vez que cambian las cuentas.
  }, [visible, editing]);

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const canSave = useMemo(() => {
    const amt = parseAmount(amount);
    return !isNaN(amt) && amt > 0 && category.length > 0 && account.length > 0;
  }, [amount, category, account]);

  // El teclado decimal de Android puede mostrar "," o "." según el idioma; se acepta solo un separador.
  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.,]/g, '');
    const sepIndex = cleaned.search(/[.,]/);
    if (sepIndex === -1) {
      setAmount(cleaned);
      return;
    }
    const intPart = cleaned.slice(0, sepIndex);
    const decPart = cleaned.slice(sepIndex + 1).replace(/[.,]/g, '').slice(0, 2);
    setAmount(`${intPart},${decPart}`);
  };

  const openDatePicker = () => {
    DateTimePickerAndroid.open({
      value: parseISO(date),
      mode: 'date',
      onChange: (event, selected) => {
        if (event.type === 'set' && selected) setDate(format(selected, 'yyyy-MM-dd'));
      },
    });
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      type,
      amount: Math.round(parseAmount(amount) * 100) / 100,
      category,
      account,
      note: note.trim(),
      date,
    });
    onClose();
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={editing ? 'Editar movimiento' : 'Nuevo movimiento'}
    >
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[
            styles.typeBtn,
            { backgroundColor: theme.chipBg, borderColor: theme.chipBorder },
            type === 'expense' && styles.typeBtnExpense,
          ]}
          onPress={() => { setType('expense'); setCategory(''); }}
        >
          <ArrowUpRight size={18} color={type === 'expense' ? '#fff' : theme.textMuted} strokeWidth={2.5} />
          <Text style={[styles.typeText, { color: theme.textMuted }, type === 'expense' && styles.typeTextActive]}>Gasto</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeBtn,
            { backgroundColor: theme.chipBg, borderColor: theme.chipBorder },
            type === 'income' && styles.typeBtnIncome,
          ]}
          onPress={() => { setType('income'); setCategory(''); }}
        >
          <ArrowDownLeft size={18} color={type === 'income' ? '#fff' : theme.textMuted} strokeWidth={2.5} />
          <Text style={[styles.typeText, { color: theme.textMuted }, type === 'income' && styles.typeTextActive]}>Ingreso</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.amountWrap}>
        <Text style={[styles.amountCurrency, { color: theme.placeholder }]}>€</Text>
        <TextInput
          style={[styles.amountInput, { color: theme.text }]}
          placeholder="0,00"
          placeholderTextColor={theme.placeholder}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={handleAmountChange}
          autoFocus={!editing}
          maxLength={12}
        />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Categoría</Text>
        <View style={styles.chipRow}>
          {categories.map((cat) => {
            const Icon = getIcon(cat.icon);
            const selected = category === cat.name;
            return (
              <TouchableOpacity
                key={cat.name}
                style={[
                  styles.chip,
                  { backgroundColor: theme.chipBg, borderColor: theme.chipBorder },
                  selected && { backgroundColor: cat.color + '20', borderColor: cat.color },
                ]}
                onPress={() => setCategory(cat.name)}
              >
                <Icon size={16} color={cat.color} strokeWidth={2.2} />
                <Text style={[styles.chipText, { color: theme.textSecondary }, selected && { color: cat.color, fontFamily: FontFamily.semibold }]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Cuenta</Text>
        {accounts.length === 0 ? (
          <Text style={[styles.hint, { color: theme.textFaint }]}>Crea una cuenta en la pestaña Cuentas para poder guardar.</Text>
        ) : (
          <View style={styles.chipRow}>
            {accounts.map((acc) => {
              const selected = account === acc.id;
              return (
                <TouchableOpacity
                  key={acc.id}
                  style={[
                    styles.chip,
                    { backgroundColor: theme.chipBg, borderColor: theme.chipBorder },
                    selected && { backgroundColor: acc.color + '20', borderColor: acc.color },
                  ]}
                  onPress={() => setAccount(acc.id)}
                >
                  <View style={[styles.accDot, { backgroundColor: acc.color }]} />
                  <Text style={[styles.chipText, { color: theme.textSecondary }, selected && { color: acc.color, fontFamily: FontFamily.semibold }]}>
                    {acc.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Fecha</Text>
        <TouchableOpacity
          style={[styles.dateInput, { borderColor: theme.border }]}
          onPress={openDatePicker}
          activeOpacity={0.7}
        >
          <Calendar size={18} color={theme.textMuted} strokeWidth={2.2} />
          <Text style={[styles.dateText, { color: theme.text }]}>{formatDateLabel(date)}</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Nota (opcional)</Text>
        <TextInput
          style={[styles.noteInput, { borderColor: theme.border, color: theme.text }]}
          placeholder="Añade una descripción..."
          placeholderTextColor={theme.placeholder}
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={100}
        />
      </ScrollView>

      <View style={styles.actionRow}>
        {editing && onDelete && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(editing.id)}>
            <Trash2 size={18} color={Colors.error} strokeWidth={2.2} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && { backgroundColor: theme.border }]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Check size={18} color="#fff" strokeWidth={2.5} />
          <Text style={styles.saveBtnText}>
            {editing ? 'Guardar cambios' : 'Añadir'}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs + 2, paddingVertical: Spacing.sm + 2, borderRadius: Radius.md, borderWidth: 1.5,
  },
  typeBtnExpense: { backgroundColor: Colors.expense, borderColor: Colors.expense },
  typeBtnIncome: { backgroundColor: Colors.income, borderColor: Colors.income },
  typeText: { fontSize: 15, fontFamily: FontFamily.medium },
  typeTextActive: { color: '#fff', fontFamily: FontFamily.semibold },
  amountWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  amountCurrency: { fontSize: 28, fontFamily: FontFamily.bold },
  amountInput: { fontSize: 32, fontFamily: FontFamily.bold, minWidth: 120, textAlign: 'center', paddingVertical: Spacing.xs },
  scroll: { flexGrow: 0, flexShrink: 1 },
  sectionLabel: {
    fontSize: 13, fontFamily: FontFamily.semibold, marginTop: Spacing.md, marginBottom: Spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  hint: { fontSize: 14, fontFamily: FontFamily.regular },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full, borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontFamily: FontFamily.medium },
  accDot: { width: 8, height: 8, borderRadius: 4 },
  dateInput: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4,
  },
  dateText: { fontSize: 15, fontFamily: FontFamily.medium },
  noteInput: {
    borderWidth: 1.5, borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2, fontSize: 15, fontFamily: FontFamily.regular,
    minHeight: 48, textAlignVertical: 'top',
  },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  deleteBtn: { width: 48, borderRadius: Radius.md, backgroundColor: Colors.error + '12', alignItems: 'center', justifyContent: 'center' },
  saveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs + 2,
    paddingVertical: Spacing.sm + 2, borderRadius: Radius.md, backgroundColor: Colors.primary[600],
  },
  saveBtnText: { fontSize: 16, fontFamily: FontFamily.semibold, color: '#fff' },
});
