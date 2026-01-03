import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { DesignTokens } from '../../constants/DesignTokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
  onPress,
}) => {
  const cardStyle = [
    styles.base,
    styles[variant],
    styles[`padding_${padding}`],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: DesignTokens.borderRadius.large,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: DesignTokens.colors.surface,
  },
  elevated: {
    backgroundColor: DesignTokens.colors.surfaceElevated,
    ...DesignTokens.shadows.soft,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DesignTokens.colors.glassBorder,
  },
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: DesignTokens.spacing.sm,
  },
  padding_md: {
    padding: DesignTokens.spacing.md,
  },
  padding_lg: {
    padding: DesignTokens.spacing.lg,
  },
});
