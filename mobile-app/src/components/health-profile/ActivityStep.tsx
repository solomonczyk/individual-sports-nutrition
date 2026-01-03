import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { DesignTokens } from '../../constants/DesignTokens';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../../i18n';

interface ActivityStepProps {
  control: Control<any>;
}

const activityLevels = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise', icon: 'bed-outline' },
  { value: 'light', label: 'Light', desc: 'Exercise 1-3 days/week', icon: 'walk-outline' },
  { value: 'moderate', label: 'Moderate', desc: 'Exercise 3-5 days/week', icon: 'bicycle-outline' },
  { value: 'high', label: 'High', desc: 'Exercise 6-7 days/week', icon: 'barbell-outline' },
  { value: 'very_high', label: 'Very High', desc: 'Intense daily training', icon: 'flame-outline' },
];

export const ActivityStep: React.FC<ActivityStepProps> = ({ control }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('activity_level')}</Text>
      <Text style={styles.subtitle}>{i18n.t('activity_level_desc')}</Text>

      <Controller
        control={control}
        name="activity_level"
        render={({ field: { onChange, value } }) => (
          <View style={styles.options}>
            {activityLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[styles.option, value === level.value && styles.optionSelected]}
                onPress={() => onChange(level.value)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, value === level.value && styles.iconContainerSelected]}>
                  <Ionicons
                    name={level.icon as any}
                    size={24}
                    color={value === level.value ? DesignTokens.colors.primary : DesignTokens.colors.textSecondary}
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.optionLabel, value === level.value && styles.optionLabelSelected]}>
                    {level.label}
                  </Text>
                  <Text style={styles.optionDesc}>{level.desc}</Text>
                </View>
                {value === level.value && (
                  <Ionicons name="checkmark-circle" size={24} color={DesignTokens.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
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
  options: { gap: 12 },
  option: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: DesignTokens.borderRadius.medium,
    backgroundColor: DesignTokens.colors.surface, borderWidth: 1, borderColor: DesignTokens.colors.glassBorder,
  },
  optionSelected: { borderColor: DesignTokens.colors.primary, backgroundColor: `${DesignTokens.colors.primary}10` },
  iconContainer: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: DesignTokens.colors.surfaceElevated,
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  iconContainerSelected: { backgroundColor: `${DesignTokens.colors.primary}20` },
  textContainer: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: '700', color: DesignTokens.colors.textPrimary },
  optionLabelSelected: { color: DesignTokens.colors.primary },
  optionDesc: { fontSize: 14, color: DesignTokens.colors.textSecondary, marginTop: 2 },
});
