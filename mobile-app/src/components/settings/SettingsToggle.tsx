import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignTokens } from '../../constants/DesignTokens';

interface SettingsToggleProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  iconColor?: string;
  isLast?: boolean;
}

export const SettingsToggle: React.FC<SettingsToggleProps> = ({
  icon,
  title,
  description,
  value,
  onValueChange,
  iconColor = DesignTokens.colors.primary,
  isLast = false,
}) => {
  return (
    <View style={[styles.container, !isLast && styles.border]}>
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: DesignTokens.colors.surface, true: `${DesignTokens.colors.primary}80` }}
        thumbColor={value ? DesignTokens.colors.primary : DesignTokens.colors.textTertiary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  border: { borderBottomWidth: 1, borderBottomColor: DesignTokens.colors.glassBorder },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: DesignTokens.colors.textPrimary },
  description: { fontSize: 13, color: DesignTokens.colors.textSecondary, marginTop: 2 },
});
