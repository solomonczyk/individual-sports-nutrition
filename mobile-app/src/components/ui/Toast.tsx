import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignTokens } from '../../constants/DesignTokens';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
}

const iconMap: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  warning: 'warning',
  info: 'information-circle',
};

const colorMap: Record<ToastType, string> = {
  success: DesignTokens.colors.success,
  error: DesignTokens.colors.error,
  warning: DesignTokens.colors.warning,
  info: DesignTokens.colors.primary,
};

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(onHide, duration);
      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, duration]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
      <TouchableOpacity style={[styles.toast, { borderLeftColor: colorMap[type] }]} onPress={onHide} activeOpacity={0.9}>
        <Ionicons name={iconMap[type]} size={24} color={colorMap[type]} />
        <Text style={styles.message} numberOfLines={2}>{message}</Text>
        <TouchableOpacity onPress={onHide} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={20} color={DesignTokens.colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: DesignTokens.spacing.md,
    right: DesignTokens.spacing.md,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignTokens.colors.surfaceElevated,
    borderRadius: DesignTokens.borderRadius.medium,
    padding: DesignTokens.spacing.md,
    borderLeftWidth: 4,
    gap: 12,
    ...DesignTokens.shadows.premium,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: DesignTokens.colors.textPrimary,
  },
});
