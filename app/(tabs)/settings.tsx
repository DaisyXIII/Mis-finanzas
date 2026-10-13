import React, { useState, useMemo } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Alert,
} from 'react-native';
import {
  LayoutDashboard, ReceiptText, Plus, Pen, CircleCheck, Circle, Sun, Moon, Smartphone, ShieldCheck,
} from 'lucide-react-native';
import { useFinance } from '@/context/FinanceContext';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';
import { getIcon } from '@/constants/icons';
import { useTheme } from '@/hooks/useTheme';
import { useLayout } from '@/hooks/useLayout';
import { Screen } from '@/components/Screen';
import { CategoryFormModal } from '@/components/CategoryFormModal';
import type { AppMode, CategoryDef, CategoryType, ThemePreference } from '@/types/finance';

const MODES: { mode: AppMode; title: string; description: string; Icon: typeof LayoutDashboard }[] = [
  {
    mode: 'full',
    title: 'Completa',
    description: 'Cuentas, ingresos, gastos, transferencias y balances.',
    Icon: LayoutDashboard,
  },
  {
    mode: 'expenses',
    title: 'Solo control de gastos',
    description: 'Las mismas pestañas, con gastos y transferencias: sin ingresos, saldos ni balances.',
    Icon: ReceiptText,
  },
];

const THEMES: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'Sistema', Icon: Smartphone },
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'dark', label: 'Oscuro', Icon: Moon },
];

export default function SettingsScreen() {
  const { data, updateSettings, addCategory, updateCategory, deleteCategory } = useFinance();
  const { theme } = useTheme();
  const { gutter, cardPadding } = useLayout();
  const mode = data.settings.mode;
  const [catTab, setCatTab] = useState<CategoryType>('expense');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CategoryDef | null>(null);

  // En el modo "solo gastos" no se registran ingresos, así que solo se gestionan las de gasto.
  const activeTab: CategoryType = mode === 'expenses' ? 'expense' : catTab;
  const categories = activeTab === 'income' ? data.incomeCategories : data.expenseCategories;

  const usage = useMemo(() => {
    const map = new Map<string, number>();
    data.transactions.forEach((t) => {
      if (t.type !== activeTab) return;
      map.set(t.category, (map.get(t.category) ?? 0) + 1);
    });
    return map;
  }, [data.transactions, activeTab]);

  // Resumen de lo que queda guardado (y oculto) en el modo "solo gastos".
  const stored = useMemo(
    () => ({
      total: data.transactions.length,
      income: data.transactions.filter((t) => t.type === 'income').length,
    }),
    [data.transactions]
  );

  // Cambiar de modo solo cambia lo que se muestra: nunca se borran movimientos ni cuentas.
  const handleModeChange = (m: AppMode) => {
    if (m === mode) return;
    if (m === 'full') {
      updateSettings({ mode: m });
      return;
    }
    Alert.alert(
      'Cambiar a solo control de gastos',
      'No se borra nada. Tus ingresos y saldos se quedan guardados y vuelven a aparecer tal cual al volver al modo completo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cambiar', onPress: () => updateSettings({ mode: m }) },
      ]
    );
  };

  const handleNew = () => { setEditing(null); setShowForm(true); };
  const handleEdit = (c: CategoryDef) => { setEditing(c); setShowForm(true); };
  const handleClose = () => { setShowForm(false); setEditing(null); };
  const handleSave = (c: CategoryDef) => {
    if (editing) updateCategory(activeTab, editing.name, c);
    else addCategory(activeTab, c);
    setEditing(null);
  };
  const handleDelete = (name: string) => {
    if (categories.length <= 1) {
      Alert.alert('No se puede eliminar', 'Debe quedar al menos una categoría.');
      return;
    }
    const count = usage.get(name) ?? 0;
    Alert.alert(
      'Eliminar categoría',
      count > 0
        ? `Hay ${count} ${count === 1 ? 'movimiento' : 'movimientos'} en «${name}». Se conservarán con ese nombre, pero ya no podrás elegirla para nuevos movimientos.`
        : `¿Seguro que quieres eliminar «${name}»?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => { deleteCategory(activeTab, name); handleClose(); } },
      ]
    );
  };

  const cardShadow = Platform.select({
    ios: { shadowColor: theme.shadowColor, shadowOpacity: theme.shadowOpacity, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
    android: { elevation: 3 },
  });

  return (
    <Screen>
      <View style={[styles.headerBar, { paddingHorizontal: gutter }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Ajustes</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: gutter }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Modo de la aplicación</Text>
        <Text style={[styles.sectionSub, { color: theme.textMuted }]}>Elige qué quieres ver en la pantalla principal.</Text>
        <View style={styles.modeList}>
          {MODES.map(({ mode: m, title, description, Icon }) => {
            const selected = mode === m;
            return (
              <TouchableOpacity
                key={m}
                style={[
                  styles.modeCard,
                  { backgroundColor: theme.card, borderColor: selected ? Colors.primary[600] : 'transparent' },
                  cardShadow,
                ]}
                onPress={() => handleModeChange(m)}
                activeOpacity={0.7}
              >
                <View style={[styles.modeIcon, { backgroundColor: Colors.primary[600] + '18' }]}>
                  <Icon size={20} color={Colors.primary[600]} strokeWidth={2.2} />
                </View>
                <View style={styles.modeText}>
                  <Text style={[styles.modeTitle, { color: theme.text }]} numberOfLines={2}>{title}</Text>
                  <Text style={[styles.modeDesc, { color: theme.textMuted }]}>{description}</Text>
                </View>
                {selected ? (
                  <CircleCheck size={22} color={Colors.primary[600]} strokeWidth={2.2} />
                ) : (
                  <Circle size={22} color={theme.placeholder} strokeWidth={2} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={[styles.safeNote, { backgroundColor: Colors.success + '14' }]}>
          <ShieldCheck size={18} color={Colors.success} strokeWidth={2.2} />
          <Text style={[styles.safeNoteText, { color: theme.textSecondary }]}>
            {mode === 'expenses'
              ? `Tienes guardados ${stored.total} movimientos` +
                (stored.income > 0
                  ? ` (${stored.income} ${stored.income === 1 ? 'ingreso oculto' : 'ingresos ocultos'} en este modo).`
                  : '.') +
                ' Al volver al modo completo aparecerá todo tal cual.'
              : 'Cambiar de modo no borra nada: solo cambia lo que se muestra.'}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.xl }]}>Apariencia</Text>
        <Text style={[styles.sectionSub, { color: theme.textMuted }]}>Tema de la aplicación.</Text>
        <View style={[styles.toggleRow, { backgroundColor: theme.toggleBg }]}>
          {THEMES.map(({ value, label, Icon }) => {
            const selected = data.settings.theme === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.themeBtn, selected && { backgroundColor: Colors.primary[600] }]}
                onPress={() => updateSettings({ theme: value })}
              >
                <Icon size={16} color={selected ? '#fff' : theme.textMuted} strokeWidth={2.2} />
                <Text
                  style={[styles.toggleText, { color: theme.textMuted }, selected && styles.toggleTextActive]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.catHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Categorías</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleNew}>
            <Plus size={16} color="#fff" strokeWidth={2.5} />
            <Text style={styles.addBtnText}>Añadir</Text>
          </TouchableOpacity>
        </View>

        {mode === 'full' && (
          <View style={[styles.toggleRow, { backgroundColor: theme.toggleBg }]}>
            <TouchableOpacity
              style={[styles.toggleBtn, catTab === 'expense' && styles.toggleExpense]}
              onPress={() => setCatTab('expense')}
            >
              <Text style={[styles.toggleText, { color: theme.textMuted }, catTab === 'expense' && styles.toggleTextActive]}>Gastos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, catTab === 'income' && styles.toggleIncome]}
              onPress={() => setCatTab('income')}
            >
              <Text style={[styles.toggleText, { color: theme.textMuted }, catTab === 'income' && styles.toggleTextActive]}>Ingresos</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.catCard, { backgroundColor: theme.card, paddingHorizontal: cardPadding }, cardShadow]}>
          {categories.map((c, i) => {
            const Icon = getIcon(c.icon);
            const count = usage.get(c.name) ?? 0;
            return (
              <TouchableOpacity
                key={c.name}
                style={[styles.catRow, i > 0 && { borderTopWidth: 1, borderTopColor: theme.borderLight }]}
                onPress={() => handleEdit(c)}
                activeOpacity={0.6}
              >
                <View style={[styles.catIcon, { backgroundColor: c.color + '18' }]}>
                  <Icon size={18} color={c.color} strokeWidth={2.2} />
                </View>
                <View style={styles.catText}>
                  <Text style={[styles.catName, { color: theme.text }]} numberOfLines={1}>{c.name}</Text>
                  <Text style={[styles.catCount, { color: theme.textFaint }]}>
                    {count === 0 ? 'Sin movimientos' : `${count} ${count === 1 ? 'movimiento' : 'movimientos'}`}
                  </Text>
                </View>
                <Pen size={14} color={theme.textFaint} strokeWidth={2} />
              </TouchableOpacity>
            );
          })}
          {categories.length === 0 && (
            <Text style={[styles.catCount, { color: theme.textFaint, textAlign: 'center', paddingVertical: Spacing.md }]}>
              No hay categorías
            </Text>
          )}
        </View>
      </ScrollView>

      <CategoryFormModal
        visible={showForm}
        onClose={handleClose}
        onSave={handleSave}
        onDelete={handleDelete}
        editing={editing}
        type={activeTab}
        existingNames={categories.map((c) => c.name)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: 28, fontFamily: FontFamily.bold },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  sectionTitle: { fontSize: 18, fontFamily: FontFamily.bold, marginBottom: 4 },
  sectionSub: { fontSize: 14, fontFamily: FontFamily.regular, marginBottom: Spacing.md },
  modeList: { gap: Spacing.sm + 2 },
  modeCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 2, padding: Spacing.md,
  },
  modeIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  modeText: { flex: 1, gap: 2 },
  modeTitle: { fontSize: 15, fontFamily: FontFamily.semibold },
  modeDesc: { fontSize: 13, fontFamily: FontFamily.regular },
  safeNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    borderRadius: Radius.md, padding: Spacing.sm + 4, marginTop: Spacing.md,
  },
  safeNoteText: { flex: 1, fontSize: 13, fontFamily: FontFamily.regular, lineHeight: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 3,
    borderRadius: Radius.full, borderWidth: 1.5,
  },
  chipText: { fontSize: 14, fontFamily: FontFamily.medium, flexShrink: 1 },
  themeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.xs, borderRadius: Radius.sm,
  },
  catHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.xl, marginBottom: Spacing.md,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full, backgroundColor: Colors.primary[600],
  },
  addBtnText: { fontSize: 14, fontFamily: FontFamily.semibold, color: '#fff' },
  toggleRow: { flexDirection: 'row', borderRadius: Radius.md, padding: 4, marginBottom: Spacing.md },
  toggleBtn: { flex: 1, paddingVertical: Spacing.sm + 2, borderRadius: Radius.sm, alignItems: 'center' },
  toggleExpense: { backgroundColor: Colors.expense },
  toggleIncome: { backgroundColor: Colors.income },
  toggleText: { flexShrink: 1, fontSize: 15, fontFamily: FontFamily.medium },
  toggleTextActive: { color: '#fff', fontFamily: FontFamily.semibold },
  catCard: { borderRadius: Radius.xl, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 2, paddingVertical: Spacing.sm + 2 },
  catIcon: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  catText: { flex: 1, gap: 2 },
  catName: { fontSize: 15, fontFamily: FontFamily.medium },
  catCount: { fontSize: 12, fontFamily: FontFamily.regular },
});
