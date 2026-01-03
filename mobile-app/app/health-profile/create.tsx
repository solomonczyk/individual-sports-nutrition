import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ModernButton } from '../../src/components/ui/ModernButton';
import { StepIndicator } from '../../src/components/ui/StepIndicator';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { useToast } from '../../src/components/ui/ToastProvider';
import { BasicInfoStep, ActivityStep, GoalsStep, HealthConditionsStep, MedicationsStep } from '../../src/components/health-profile';
import { DesignTokens } from '../../src/constants/DesignTokens';
import { healthProfileService } from '../../src/services/health-profile-service';
import i18n from '../../src/i18n';

const healthProfileSchema = z.object({
  age: z.number().min(12).max(100),
  gender: z.enum(['male', 'female', 'other']),
  weight: z.number().min(30).max(300),
  height: z.number().min(100).max(250),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'high', 'very_high']),
  goal: z.enum(['mass', 'cut', 'maintain', 'endurance']),
  medical_conditions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
});

type HealthProfileForm = z.infer<typeof healthProfileSchema>;

const STEPS = ['Basic Info', 'Activity', 'Goals', 'Health', 'Medications'];

export default function CreateHealthProfileScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors }, trigger } = useForm<HealthProfileForm>({
    resolver: zodResolver(healthProfileSchema),
    defaultValues: {
      age: 25, gender: 'male', weight: 70, height: 175,
      activity_level: 'moderate', goal: 'maintain',
      medical_conditions: [], allergies: [], medications: [],
    },
  });

  const validateStep = async () => {
    const fieldsToValidate: (keyof HealthProfileForm)[][] = [
      ['age', 'gender', 'weight', 'height'],
      ['activity_level'],
      ['goal'],
      ['medical_conditions', 'allergies'],
      ['medications'],
    ];
    return await trigger(fieldsToValidate[currentStep]);
  };

  const handleNext = async () => {
    const isValid = await validateStep();
    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (data: HealthProfileForm) => {
    setLoading(true);
    try {
      await healthProfileService.create(data);
      showToast(i18n.t('profile_created'), 'success');
      router.replace('/(tabs)/home');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to create profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <BasicInfoStep control={control} errors={errors} />;
      case 1: return <ActivityStep control={control} />;
      case 2: return <GoalsStep control={control} />;
      case 3: return <HealthConditionsStep control={control} />;
      case 4: return <MedicationsStep control={control} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <StepIndicator currentStep={currentStep} totalSteps={STEPS.length} labels={STEPS} />
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <GlassCard style={styles.card}>{renderStep()}</GlassCard>
        </ScrollView>
        <View style={styles.footer}>
          {currentStep > 0 && (
            <ModernButton title={i18n.t('back')} onPress={handleBack} variant="outline" style={styles.backButton} />
          )}
          {currentStep < STEPS.length - 1 ? (
            <ModernButton title={i18n.t('next')} onPress={handleNext} style={styles.nextButton} />
          ) : (
            <ModernButton title={i18n.t('complete')} onPress={handleSubmit(onSubmit)} loading={loading} style={styles.nextButton} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DesignTokens.colors.background },
  flex: { flex: 1 },
  scrollContent: { padding: DesignTokens.spacing.lg, paddingBottom: 120 },
  card: { padding: DesignTokens.spacing.lg },
  footer: {
    flexDirection: 'row', padding: DesignTokens.spacing.lg, gap: 12,
    borderTopWidth: 1, borderTopColor: DesignTokens.colors.glassBorder,
    backgroundColor: DesignTokens.colors.background,
  },
  backButton: { flex: 1 },
  nextButton: { flex: 2 },
});
