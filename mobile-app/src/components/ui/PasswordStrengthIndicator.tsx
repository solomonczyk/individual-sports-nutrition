import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DesignTokens } from '../../constants/DesignTokens';

interface PasswordStrengthIndicatorProps {
  password: string;
}

type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

interface StrengthResult {
  level: StrengthLevel;
  score: number;
  label: string;
  color: string;
}

const calculateStrength = (password: string): StrengthResult => {
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return { level: 'weak', score: 1, label: 'Weak', color: DesignTokens.colors.error };
  } else if (score <= 3) {
    return { level: 'fair', score: 2, label: 'Fair', color: DesignTokens.colors.warning };
  } else if (score <= 4) {
    return { level: 'good', score: 3, label: 'Good', color: DesignTokens.colors.primary };
  } else {
    return { level: 'strong', score: 4, label: 'Strong', color: DesignTokens.colors.success };
  }
};

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const strength = useMemo(() => calculateStrength(password), [password]);

  if (!password) return null;

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {[1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={[styles.bar, { backgroundColor: level <= strength.score ? strength.color : DesignTokens.colors.surface }]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color: strength.color }]}>{strength.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 8 },
  barsContainer: { flexDirection: 'row', flex: 1, gap: 4 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 12, fontWeight: '600', marginLeft: 12 },
});
