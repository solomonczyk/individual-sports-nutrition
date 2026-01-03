import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { ModernInput } from '../ui/ModernInput';
import { DesignTokens } from '../../constants/DesignTokens';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../../i18n';

interface HealthConditionsStepProps {
  control: Control<any>;
}

const commonConditions = [
  'Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'Thyroid Disorder',
  'Kidney Disease', 'Liver Disease', 'Arthritis', 'Osteoporosis', 'None',
];

const commonAllergies = [
  'Lactose', 'Gluten', 'Soy', 'Nuts', 'Shellfish', 'Eggs', 'None',
];

export const HealthConditionsStep: React.FC<HealthConditionsStepProps> = ({ control }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('health_conditions')}</Text>
      <Text style={styles.subtitle}>{i18n.t('health_conditions_desc')}</Text>

      <Controller
        control={control}
        name="medical_conditions"
        render={({ field: { onChange, value = [] } }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('medical_conditions')}</Text>
            <View style={styles.chips}>
              {commonConditions.map((condition) => {
                const isSelected = value.includes(condition);
                return (
                  <TouchableOpacity
                    key={condition}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => {
                      if (condition === 'None') {
                        onChange(['None']);
                      } else {
                        const newValue = isSelected
                          ? value.filter((v: string) => v !== condition)
                          : [...value.filter((v: string) => v !== 'None'), condition];
                        onChange(newValue);
                      }
                    }}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{condition}</Text>
                    {isSelected && <Ionicons name="checkmark" size={16} color={DesignTokens.colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      />

      <Controller
        control={control}
        name="allergies"
        render={({ field: { onChange, value = [] } }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('allergies')}</Text>
            <View style={styles.chips}>
              {commonAllergies.map((allergy) => {
                const isSelected = value.includes(allergy);
                return (
                  <TouchableOpacity
                    key={allergy}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => {
                      if (allergy === 'None') {
                        onChange(['None']);
                      } else {
                        const newValue = isSelected
                          ? value.filter((v: string) => v !== allergy)
                          : [...value.filter((v: string) => v !== 'None'), allergy];
                        onChange(newValue);
                      }
                    }}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{allergy}</Text>
                    {isSelected && <Ionicons name="checkmark" size={16} color={DesignTokens.colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
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
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: DesignTokens.colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: DesignTokens.borderRadius.full, backgroundColor: DesignTokens.colors.surface,
    borderWidth: 1, borderColor: DesignTokens.colors.glassBorder, gap: 6,
  },
  chipSelected: { borderColor: DesignTokens.colors.primary, backgroundColor: `${DesignTokens.colors.primary}15` },
  chipText: { fontSize: 14, fontWeight: '600', color: DesignTokens.colors.textSecondary },
  chipTextSelected: { color: DesignTokens.colors.primary },
});
