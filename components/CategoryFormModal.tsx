import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput,
} from 'react-native';
import { Check, Trash2 } from 'lucide-react-native';
import type { CategoryDef, CategoryType } from '@/types/finance';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';
import { getIcon } from '@/constants/icons';
import { useTheme } from '@/hooks/useTheme';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/constants/finance';
import { BottomSheetModal } from '@/components/BottomSheetModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (c: CategoryDef) => void;
  onDelete?: (name: string) => void;
  editing?: CategoryDef | null;
  type: CategoryType;
  // Nombres ya usados en este tipo, para no permitir duplicados.
  existingNames: string[];
}

export function CategoryFormModal({ visible, onClose, onSave, onDelete, editing, type, existingNames }: Props) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState(CATEGORY_ICONS[0]);

  useEffect(() => {
    if (visible) {
      if (editing) {
        setName(editing.name); setColor(editing.color); setIcon(editing.icon);
      } else {
        setName('');
        setColor(type === 'income' ? Colors.income : CATEGORY_COLORS[0]);
        setIcon(type === 'income' ? 'Coins' : 'Tag');
      }
    }
  }, [visible, editing, type]);

  const trimmed = name.trim();
  const duplicate = existingNames.some(
    (n) => n.toLowerCase() === trimmed.toLowerCase() && n !== editing?.name
  );
  const canSave = trimmed.length > 0 && !duplicate;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ name: trimmed, color, icon });
    onClose();
  };

  const PreviewIcon = getIcon(icon);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={editing ? 'Editar categoría' : type === 'income' ? 'Nueva categoría de ingreso' : 'Nueva categoría de gasto'}
    >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Nombre</Text>
        <View style={styles.nameRow}>
          <View style={[styles.preview, { backgroundColor: color + '20' }]}>
            <PreviewIcon size={20} color={color} strokeWidth={2.2} />
          </View>
          <TextInput
            style={[styles.nameInput, { borderColor: duplicate ? Colors.error : theme.border, color: theme.text }]}
            placeholder="Nombre de la categoría"
            placeholderTextColor={theme.placeholder}
            value={name}
            onChangeText={setName}
            autoFocus={!editing}
            maxLength={30}
            returnKeyType="done"
          />
        </View>
        {duplicate && (
          <Text style={[styles.hint, { color: Colors.error }]}>Ya existe una categoría con ese nombre.</Text>
        )}

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Icono</Text>
        <View style={styles.iconRow}>
          {CATEGORY_ICONS.map((ic) => {
            const Icon = getIcon(ic);
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
                <Icon size={20} color={selected ? color : theme.textMuted} strokeWidth={2.2} />
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Color</Text>
        <View style={styles.colorRow}>
          {CATEGORY_COLORS.map((c) => (
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
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(editing.name)}>
            <Trash2 size={18} color={Colors.error} strokeWidth={2.2} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && { backgroundColor: theme.border }]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Check size={18} color="#fff" strokeWidth={2.5} />
          <Text style={styles.saveBtnText}>{editing ? 'Guardar' : 'Crear categoría'}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 1 },
  sectionLabel: {
    fontSize: 13, fontFamily: FontFamily.semibold, marginTop: Spacing.md, marginBottom: Spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  hint: { fontSize: 13, fontFamily: FontFamily.regular, marginTop: Spacing.xs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  preview: { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  nameInput: {
    flex: 1, borderWidth: 1.5, borderRadius: Radius.md, paddingHorizontal: Spacing.md,
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
