import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { DesignTokens } from '../../constants/DesignTokens';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../../i18n';

interface GoalsStepProps {
  control: Control<any>;
}

const goals = [
  { value: 'mass', label: 'Gain Mass', desc: 'Build muscle and strength', icon: 'trending-up-outline', color: DesignTokens.colors.success },
  { value: 'cut', label: 'Lose Weight', desc: 'Reduce body fat', icon: 'trending-down-outline', color: DesignTokens.colors.warning },
  { value: 'maintain', label: 'Maintain', desc: 'Keep current physique', icon: 'remove-outline', color: DesignTokens.colors.primary },
  { value: 'endurance', label: 'Endurance', desc: 'Improve stamina', icon: 'pulse-outline', color: DesignTokens.colors.secondary },
];

export const GoalsStep: React.FC<GoalsStepProps> = ({ control }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('your_goal')}</Text>
      <Text style={styles.subtitle}>{i18n.t('your_goal_desc')}</Text>

      <Controller
        control={control}
        name="goal"
        render={({ field: { onChange, value } }) => (
          <View style={styles.grid}>
            {goals.map((goal) => (
              <TouchableOpacity
                key={goal.value}
                style={[styles.card, value === goal.value && styles.cardSelected, value === goal.value && { borderColor: goal.color }]}
                onPress={() => onChange(goal.value)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: `${goal.color}20` }]}>
                  <Ionicons name={goal.icon as any} size={32} color={goal.color} />
                </View>
                <Text style={[styles.cardLabel, value === goal.value && { color: goal.color }]}>{goal.label}</Text>
                <Text style={styles.cardDesc}>{goal.desc}</Text>
                {value === goal.value && (
                  <View style={[styles.checkBadge, { backgroundColor: goal.color }]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '48%', padding: 20, borderRadius: DesignTokens.borderRadius.large,
    backgroundColor: DesignTokens.colors.surface, borderWidth: 2, borderColor: DesignTokens.colors.glassBorder,
    alignItems: 'center', position: 'relative',
  },
  cardSelected: { backgroundColor: `${DesignTokens.colors.primary}08` },
  iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 16, fontWeight: '700', color: DesignTokens.colors.textPrimary, textAlign: 'center' },
  cardDesc: { fontSize: 12, color: DesignTokens.colors.textSecondary, textAlign: 'center', marginTop: 4 },
  checkBadge: { position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
