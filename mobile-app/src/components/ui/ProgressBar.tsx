import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { DesignTokens } from '../../constants/DesignTokens';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  style?: ViewStyle;
  animated?: boolean;
  showSteps?: boolean;
  steps?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = DesignTokens.colors.primary,
  backgroundColor = DesignTokens.colors.surface,
  height = 8,
  style,
  animated = true,
  showSteps = false,
  steps = 5,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  useEffect(() => {
    if (animated) {
      Animated.spring(animatedWidth, {
        toValue: percentage,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }).start();
    } else {
      animatedWidth.setValue(percentage);
    }
  }, [percentage, animated]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { height, backgroundColor }, style]}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: widthInterpolated,
            backgroundColor: color,
            height,
          },
        ]}
      />
      {showSteps && (
        <View style={styles.stepsContainer}>
          {Array.from({ length: steps - 1 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepDivider,
                { left: `${((index + 1) / steps) * 100}%` },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: DesignTokens.borderRadius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    borderRadius: DesignTokens.borderRadius.full,
  },
  stepsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  stepDivider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: DesignTokens.colors.background,
  },
});
