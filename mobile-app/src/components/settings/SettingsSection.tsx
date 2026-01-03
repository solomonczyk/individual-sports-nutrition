import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { DesignTokens } from '../../constants/DesignTokens';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <GlassCard style={styles.card}>{children}</GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: DesignTokens.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: { padding: 0, overflow: 'hidden' },
});
