import React, { useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Picker } from '@react-native-picker/picker'
import { ModernButton } from '../../src/components/ui/ModernButton'
import { ModernInput } from '../../src/components/ui/ModernInput'
import { GlassCard } from '../../src/components/ui/GlassCard'
import { DesignTokens } from '../../src/constants/DesignTokens'
import { healthProfileService } from '../../src/services/health-profile-service'
import { Ionicons } from '@expo/vector-icons'

const healthProfileSchema = z.object({
  age: z.number().min(12, 'Age must be at least 12').max(100, 'Age must be less than 100'),
  gender: z.enum(['male', 'female', 'other']),
  weight: z.number().min(30, 'Weight must be at least 30kg').max(300, 'Weight must be less than 300kg'),
  height: z.number().min(100, 'Height must be at least 100cm').max(250, 'Height must be less than 250cm'),
  activity_level: z.enum(['low', 'moderate', 'high', 'very_high']),
  goal: z.enum(['mass', 'cut', 'maintain', 'endurance']),
})

type HealthProfileForm = z.infer<typeof healthProfileSchema>

export default function CreateHealthProfileScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<HealthProfileForm>({
    resolver: zodResolver(healthProfileSchema),
    defaultValues: {
      age: 25,
      gender: 'male',
      weight: 70,
      height: 175,
      activity_level: 'moderate',
      goal: 'maintain',
    },
  })

  const onSubmit = async (data: HealthProfileForm) => {
    setLoading(true)
    setError(null)

    try {
      await healthProfileService.create(data)
      router.replace('/(tabs)/home')
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Health Profile</Text>
            <Text style={styles.subtitle}>
              Tell us about yourself to get personalized recommendations
            </Text>
          </View>

          {error && (
            <GlassCard style={styles.errorCard}>
              <View style={styles.errorContent}>
                <Ionicons name="alert-circle" size={20} color={DesignTokens.colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </GlassCard>
          )}

          <GlassCard style={styles.formCard}>
            <Controller
              control={control}
              name="age"
              render={({ field: { onChange, value } }) => (
                <ModernInput
                  label="Age"
                  value={value.toString()}
                  onChangeText={(text) => onChange(parseInt(text) || 0)}
                  placeholder="25"
                  keyboardType="numeric"
                  error={errors.age?.message}
                  icon="calendar-outline"
                />
              )}
            />

            <Controller
              control={control}
              name="gender"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      style={styles.picker}
                      dropdownIconColor={DesignTokens.colors.primary}
                    >
                      <Picker.Item label="Male" value="male" color="#FFF" />
                      <Picker.Item label="Female" value="female" color="#FFF" />
                      <Picker.Item label="Other" value="other" color="#FFF" />
                    </Picker>
                  </View>
                </View>
              )}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Controller
                  control={control}
                  name="weight"
                  render={({ field: { onChange, value } }) => (
                    <ModernInput
                      label="Weight (kg)"
                      value={value.toString()}
                      onChangeText={(text) => onChange(parseFloat(text) || 0)}
                      placeholder="70"
                      keyboardType="numeric"
                      error={errors.weight?.message}
                      icon="fitness-outline"
                    />
                  )}
                />
              </View>
              <View style={styles.halfWidth}>
                <Controller
                  control={control}
                  name="height"
                  render={({ field: { onChange, value } }) => (
                    <ModernInput
                      label="Height (cm)"
                      value={value.toString()}
                      onChangeText={(text) => onChange(parseFloat(text) || 0)}
                      placeholder="175"
                      keyboardType="numeric"
                      error={errors.height?.message}
                      icon="resize-outline"
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="activity_level"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Activity Level</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      style={styles.picker}
                      dropdownIconColor={DesignTokens.colors.primary}
                    >
                      <Picker.Item label="Low (sedentary)" value="low" color="#FFF" />
                      <Picker.Item label="Moderate (light exercise)" value="moderate" color="#FFF" />
                      <Picker.Item label="High (regular exercise)" value="high" color="#FFF" />
                      <Picker.Item label="Very High (intensive)" value="very_high" color="#FFF" />
                    </Picker>
                  </View>
                </View>
              )}
            />

            <Controller
              control={control}
              name="goal"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Nutrition Goal</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      style={styles.picker}
                      dropdownIconColor={DesignTokens.colors.primary}
                    >
                      <Picker.Item label="Gain Mass" value="mass" color="#FFF" />
                      <Picker.Item label="Cut Weight" value="cut" color="#FFF" />
                      <Picker.Item label="Maintain" value="maintain" color="#FFF" />
                      <Picker.Item label="Endurance" value="endurance" color="#FFF" />
                    </Picker>
                  </View>
                </View>
              )}
            />
          </GlassCard>

          <View style={styles.footer}>
            <ModernButton
              title="Create Profile"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.xxl,
  },
  header: {
    marginBottom: DesignTokens.spacing.xl,
    marginTop: DesignTokens.spacing.md,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: DesignTokens.colors.textPrimary,
    letterSpacing: -1,
    marginBottom: DesignTokens.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: DesignTokens.colors.textSecondary,
    lineHeight: 22,
  },
  formCard: {
    padding: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.xl,
  },
  fieldGroup: {
    marginBottom: DesignTokens.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignTokens.colors.textSecondary,
    marginBottom: DesignTokens.spacing.sm,
    marginLeft: 4,
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: DesignTokens.borderRadius.medium,
    borderWidth: 1,
    borderColor: DesignTokens.colors.glassBorder,
    overflow: 'hidden',
  },
  picker: {
    color: DesignTokens.colors.textPrimary,
    backgroundColor: 'transparent',
    height: Platform.OS === 'ios' ? 200 : 56,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: DesignTokens.spacing.xs,
  },
  halfWidth: {
    width: '48%',
  },
  footer: {
    marginTop: DesignTokens.spacing.md,
  },
  errorCard: {
    marginBottom: DesignTokens.spacing.lg,
    borderColor: DesignTokens.colors.error + '40',
    backgroundColor: DesignTokens.colors.error + '10',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  errorText: {
    color: DesignTokens.colors.error,
    fontSize: 14,
    flex: 1,
  },
})

