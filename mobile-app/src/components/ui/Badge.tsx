import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { DesignTokens } from '../../constants/DesignTokens';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'primary',
  size = 'md',
  style,
  icon,
}) => {
  return (
    <View style={[styles.base, styles[variant], styles[`size_${size}`], style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: DesignTokens.borderRadius.full,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: 4,
  },
  // Variants
  primary: {
    backgroundColor: `${DesignTokens.colors.primary}20`,
  },
  secondary: {
    backgroundColor: `${DesignTokens.colors.secondary}20`,
  },
  success: {
    backgroundColor: `${DesignTokens.colors.success}20`,
  },
  warning: {
    backgroundColor: `${DesignTokens.colors.warning}20`,
  },
  error: {
    backgroundColor: `${DesignTokens.colors.error}20`,
  },
  info: {
    backgroundColor: `${DesignTokens.colors.textSecondary}20`,
  },
  // Sizes
  size_sm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  size_md: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  size_lg: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  // Text styles
  text: {
    fontWeight: '600',
  },
  text_primary: {
    color: DesignTokens.colors.primary,
  },
  text_secondary: {
    color: DesignTokens.colors.secondary,
  },
  text_success: {
    color: DesignTokens.colors.success,
  },
  text_warning: {
    color: DesignTokens.colors.warning,
  },
  text_error: {
    color: DesignTokens.colors.error,
  },
  text_info: {
    color: DesignTokens.colors.textSecondary,
  },
  // Text sizes
  textSize_sm: {
    fontSize: 10,
  },
  textSize_md: {
    fontSize: 12,
  },
  textSize_lg: {
    fontSize: 14,
  },
});
