import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { ModernInput } from '../ui/ModernInput';
import { GlassCard } from '../ui/GlassCard';
import { DesignTokens } from '../../constants/DesignTokens';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../../i18n';

interface BasicInfoStepProps {
  control: Control<any>;
  errors: any;
}

const genderOptions = [
  { value: 'male', label: 'Male', icon: 'male' },
  { value: 'female', label: 'Female', icon: 'female' },
  { value: 'other', label: 'Other', icon: 'person' },
];

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ control, errors }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('basic_info')}</Text>
      <Text style={styles.subtitle}>{i18n.t('basic_info_desc')}</Text>

      <Controller
        control={control}
        name="gender"
        render={({ field: { onChange, value } }) => (
          <View style={styles.genderContainer}>
            <Text style={styles.label}>{i18n.t('gender')}</Text>
            <View style={styles.genderOptions}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.genderOption, value === option.value && styles.genderOptionSelected]}
                  onPress={() => onChange(option.value)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={value === option.value ? DesignTokens.colors.primary : DesignTokens.colors.textSecondary}
                  />
                  <Text style={[styles.genderLabel, value === option.value && styles.genderLabelSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      />

      <Controller
        control={control}
        name="age"
        render={({ field: { onChange, value } }) => (
          <ModernInput
            label={i18n.t('age')}
            value={value?.toString() || ''}
            onChangeText={(text) => onChange(parseInt(text) || 0)}
            placeholder="25"
            keyboardType="numeric"
            error={errors.age?.message}
            icon="calendar-outline"
          />
        )}
      />

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Controller
            control={control}
            name="height"
            render={({ field: { onChange, value } }) => (
              <ModernInput
                label={`${i18n.t('height')} (cm)`}
                value={value?.toString() || ''}
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                placeholder="175"
                keyboardType="numeric"
                error={errors.height?.message}
                icon="resize-outline"
              />
            )}
          />
        </View>
        <View style={styles.halfWidth}>
          <Controller
            control={control}
            name="weight"
            render={({ field: { onChange, value } }) => (
              <ModernInput
                label={`${i18n.t('weight')} (kg)`}
                value={value?.toString() || ''}
                onChangeText={(text) => onChange(parseFloat(text) || 0)}
                placeholder="70"
                keyboardType="numeric"
                error={errors.weight?.message}
                icon="fitness-outline"
              />
            )}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', color: DesignTokens.colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 16, color: DesignTokens.colors.textSecondary, marginBottom: 24, lineHeight: 22 },
  label: { fontSize: 12, fontWeight: '700', color: DesignTokens.colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  genderContainer: { marginBottom: 24 },
  genderOptions: { flexDirection: 'row', gap: 12 },
  genderOption: {
    flex: 1, alignItems: 'center', padding: 16, borderRadius: DesignTokens.borderRadius.medium,
    backgroundColor: DesignTokens.colors.surface, borderWidth: 1, borderColor: DesignTokens.colors.glassBorder,
  },
  genderOptionSelected: { borderColor: DesignTokens.colors.primary, backgroundColor: `${DesignTokens.colors.primary}15` },
  genderLabel: { fontSize: 14, fontWeight: '600', color: DesignTokens.colors.textSecondary, marginTop: 8 },
  genderLabelSelected: { color: DesignTokens.colors.primary },
  row: { flexDirection: 'row', gap: 12 },
  halfWidth: { flex: 1 },
});
