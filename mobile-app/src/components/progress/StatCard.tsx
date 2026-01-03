import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui/GlassCard';
import { DesignTokens } from '../../constants/DesignTokens';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  change,
  icon,
  color = DesignTokens.colors.primary,
}) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <GlassCard style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {change !== undefined && change !== 0 && (
        <View style={[styles.changeContainer, isPositive ? styles.positive : styles.negative]}>
          <Ionicons
            name={isPositive ? 'arrow-up' : 'arrow-down'}
            size={12}
            color={isPositive ? DesignTokens.colors.success : DesignTokens.colors.error}
          />
          <Text style={[styles.changeText, isPositive ? styles.positiveText : styles.negativeText]}>
            {Math.abs(change).toFixed(1)}
          </Text>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: { flex: 1, padding: 16, alignItems: 'center' },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 12, color: DesignTokens.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  value: { fontSize: 24, fontWeight: '800', color: DesignTokens.colors.textPrimary },
  unit: { fontSize: 14, color: DesignTokens.colors.textSecondary, marginLeft: 2 },
  changeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  positive: { backgroundColor: `${DesignTokens.colors.success}15` },
  negative: { backgroundColor: `${DesignTokens.colors.error}15` },
  changeText: { fontSize: 12, fontWeight: '600', marginLeft: 2 },
  positiveText: { color: DesignTokens.colors.success },
  negativeText: { color: DesignTokens.colors.error },
});
