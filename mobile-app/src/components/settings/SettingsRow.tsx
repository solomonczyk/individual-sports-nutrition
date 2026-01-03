import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignTokens } from '../../constants/DesignTokens';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value?: string;
  onPress?: () => void;
  iconColor?: string;
  isLast?: boolean;
  showChevron?: boolean;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  title,
  value,
  onPress,
  iconColor = DesignTokens.colors.primary,
  isLast = false,
  showChevron = true,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container style={[styles.container, !isLast && styles.border]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {value && <Text style={styles.value}>{value}</Text>}
      </View>
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={20} color={DesignTokens.colors.textTertiary} />
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  border: { borderBottomWidth: 1, borderBottomColor: DesignTokens.colors.glassBorder },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: DesignTokens.colors.textPrimary },
  value: { fontSize: 13, color: DesignTokens.colors.textSecondary, marginTop: 2 },
});
