import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { DesignTokens } from '../../constants/DesignTokens';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  style?: ViewStyle;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  labels,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.stepsRow}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          return (
            <React.Fragment key={index}>
              <View style={[styles.step, isCompleted && styles.stepCompleted, isCurrent && styles.stepCurrent]}>
                <Text style={[styles.stepText, (isCompleted || isCurrent) && styles.stepTextActive]}>
                  {index + 1}
                </Text>
              </View>
              {index < totalSteps - 1 && (
                <View style={[styles.connector, isCompleted && styles.connectorCompleted]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
      {labels && labels[currentStep] && (
        <Text style={styles.label}>{labels[currentStep]}</Text>
      )}
      <Text style={styles.progress}>
        {currentStep + 1} / {totalSteps}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: DesignTokens.spacing.md },
  stepsRow: { flexDirection: 'row', alignItems: 'center' },
  step: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: DesignTokens.colors.surface,
    borderWidth: 2, borderColor: DesignTokens.colors.glassBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  stepCompleted: { backgroundColor: DesignTokens.colors.primary, borderColor: DesignTokens.colors.primary },
  stepCurrent: { borderColor: DesignTokens.colors.primary, backgroundColor: `${DesignTokens.colors.primary}20` },
  stepText: { fontSize: 14, fontWeight: '700', color: DesignTokens.colors.textTertiary },
  stepTextActive: { color: DesignTokens.colors.textPrimary },
  connector: { width: 24, height: 2, backgroundColor: DesignTokens.colors.glassBorder },
  connectorCompleted: { backgroundColor: DesignTokens.colors.primary },
  label: { fontSize: 16, fontWeight: '600', color: DesignTokens.colors.textPrimary, marginTop: DesignTokens.spacing.md },
  progress: { fontSize: 12, color: DesignTokens.colors.textSecondary, marginTop: 4 },
});
