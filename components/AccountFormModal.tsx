import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput,
} from 'react-native';
import { Check, Trash2, Wallet } from 'lucide-react-native';
import type { Account } from '@/types/finance';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';
import { getIcon } from '@/constants/icons';
import { useTheme } from '@/hooks/useTheme';
import { ACCOUNT_COLORS, ACCOUNT_ICONS } from '@/constants/finance';
import { formatCurrency } from '@/lib/finance';
import { BottomSheetModal } from '@/components/BottomSheetModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (a: Omit<Account, 'id' | 'createdAt'>) => void;
  onDelete?: (id: string) => void;
  editing?: Account | null;
  balance: number;
}

export function AccountFormModal({ visible, onClose, onSave, onDelete, editing, balance }: Props) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);
  const [icon, setIcon] = useState(ACCOUNT_ICONS[0]);

  useEffect(() => {
    if (visible) {
      if (editing) {
        setName(editing.name); setColor(editing.color); setIcon(editing.icon);
      } else {
        setName(''); setColor(ACCOUNT_COLORS[0]); setIcon(ACCOUNT_ICONS[0]);
      }
    }
  }, [visible, editing]);

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ name: name.trim(), color, icon });
    onClose();
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={editing ? 'Editar cuenta' : 'Nueva cuenta'}
    >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {editing && (
          <View style={[styles.balanceBanner, { backgroundColor: theme.borderLight }]}>
            <Text style={[styles.balanceLabel, { color: theme.textMuted }]}>Balance actual</Text>
            <Text style={[styles.balanceAmount, { color: balance >= 0 ? Colors.income : Colors.error }]}>
              {formatCurrency(balance)}
            </Text>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Nombre</Text>
        <TextInput
          style={[styles.nameInput, { borderColor: theme.border, color: theme.text }]}
          placeholder="Nombre de la cuenta"
          placeholderTextColor={theme.placeholder}
          value={name}
          onChangeText={setName}
          autoFocus={!editing}
          maxLength={40}
          returnKeyType="done"
        />

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Icono</Text>
        <View style={styles.iconRow}>
          {ACCOUNT_ICONS.map((ic) => {
            const Icon = getIcon(ic, Wallet);
            const selected = icon === ic;
            return (
              <TouchableOpacity
                key={ic}
                style={[
                  styles.iconBtn,
                  { backgroundColor: theme.chipBg, borderColor: theme.chipBorder },
                  selected && { backgroundColor: color + '20', borderColor: color },
                ]}
                onPress={() => setIcon(ic)}
              >
                <Icon size={20} color={color} strokeWidth={2.2} />
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Color</Text>
        <View style={styles.colorRow}>
          {ACCOUNT_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorDot, { backgroundColor: c }, color === c && { borderColor: theme.text, borderWidth: 3 }]}
              onPress={() => setColor(c)}
            >
              {color === c && <Check size={14} color="#fff" strokeWidth={3} />}
            </TouchableOpacity>
          ))}
        </View>
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
          <Text style={styles.saveBtnText}>{editing ? 'Guardar' : 'Crear cuenta'}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 1 },
  balanceBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: Radius.md, paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
  },
  balanceLabel: { fontSize: 14, fontFamily: FontFamily.medium },
  balanceAmount: { fontSize: 18, fontFamily: FontFamily.bold },
  sectionLabel: {
    fontSize: 13, fontFamily: FontFamily.semibold, marginTop: Spacing.md, marginBottom: Spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  nameInput: {
    borderWidth: 1.5, borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2, fontSize: 16, fontFamily: FontFamily.medium,
  },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  iconBtn: {
    width: 44, height: 44, borderRadius: Radius.md, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm + 2 },
  colorDot: { width: 36, height: 36, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl },
  deleteBtn: { width: 48, borderRadius: Radius.md, backgroundColor: Colors.error + '12', alignItems: 'center', justifyContent: 'center' },
  saveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs + 2,
    paddingVertical: Spacing.sm + 2, borderRadius: Radius.md, backgroundColor: Colors.primary[600],
  },
  saveBtnText: { fontSize: 16, fontFamily: FontFamily.semibold, color: '#fff' },
});
