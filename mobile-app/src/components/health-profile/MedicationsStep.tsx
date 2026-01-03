import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { ModernInput } from '../ui/ModernInput';
import { ModernButton } from '../ui/ModernButton';
import { DesignTokens } from '../../constants/DesignTokens';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../../i18n';

interface MedicationsStepProps {
  control: Control<any>;
}

export const MedicationsStep: React.FC<MedicationsStepProps> = ({ control }) => {
  const [newMedication, setNewMedication] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('medications')}</Text>
      <Text style={styles.subtitle}>{i18n.t('medications_desc')}</Text>

      <Controller
        control={control}
        name="medications"
        render={({ field: { onChange, value = [] } }) => (
          <View style={styles.content}>
            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <ModernInput
                  placeholder={i18n.t('medication_name')}
                  value={newMedication}
                  onChangeText={setNewMedication}
                  icon="medical-outline"
                />
              </View>
              <TouchableOpacity
                style={[styles.addButton, !newMedication.trim() && styles.addButtonDisabled]}
                onPress={() => {
                  if (newMedication.trim()) {
                    onChange([...value, newMedication.trim()]);
                    setNewMedication('');
                  }
                }}
                disabled={!newMedication.trim()}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {value.length > 0 ? (
              <View style={styles.list}>
                {value.map((med: string, index: number) => (
                  <View key={index} style={styles.medicationItem}>
                    <Ionicons name="medical" size={20} color={DesignTokens.colors.primary} />
                    <Text style={styles.medicationText}>{med}</Text>
                    <TouchableOpacity
                      onPress={() => onChange(value.filter((_: string, i: number) => i !== index))}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle" size={22} color={DesignTokens.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="medical-outline" size={48} color={DesignTokens.colors.textTertiary} />
                <Text style={styles.emptyText}>{i18n.t('no_medications')}</Text>
                <Text style={styles.emptySubtext}>{i18n.t('skip_if_none')}</Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', color: DesignTokens.colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 16, color: DesignTokens.colors.textSecondary, marginBottom: 24, lineHeight: 22 },
  content: { flex: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 24 },
  inputWrapper: { flex: 1 },
  addButton: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: DesignTokens.colors.primary,
    justifyContent: 'center', alignItems: 'center', marginTop: 28,
  },
  addButtonDisabled: { backgroundColor: DesignTokens.colors.surfaceElevated },
  list: { gap: 12 },
  medicationItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: DesignTokens.borderRadius.medium,
    backgroundColor: DesignTokens.colors.surface, borderWidth: 1, borderColor: DesignTokens.colors.glassBorder, gap: 12,
  },
  medicationText: { flex: 1, fontSize: 16, fontWeight: '600', color: DesignTokens.colors.textPrimary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 18, fontWeight: '600', color: DesignTokens.colors.textSecondary, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: DesignTokens.colors.textTertiary, marginTop: 4 },
});
