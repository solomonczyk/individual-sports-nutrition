import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { DesignTokens } from '../../constants/DesignTokens';

type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  variant?: SkeletonVariant;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  variant = 'text',
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const getBorderRadius = () => {
    switch (variant) {
      case 'circular': return typeof width === 'number' ? width / 2 : 50;
      case 'rectangular': return 0;
      case 'rounded': return DesignTokens.borderRadius.medium;
      default: return DesignTokens.borderRadius.small;
    }
  };

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height: variant === 'circular' ? width : height, borderRadius: getBorderRadius(), opacity },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  base: { backgroundColor: DesignTokens.colors.surfaceElevated },
});
