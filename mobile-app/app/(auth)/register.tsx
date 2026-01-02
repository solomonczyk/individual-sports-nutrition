import React, { useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Link, useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ModernButton } from '../../src/components/ui/ModernButton'
import { ModernInput } from '../../src/components/ui/ModernInput'
import { GlassCard } from '../../src/components/ui/GlassCard'
import { authService } from '../../src/services/auth-service'
import { useAuthStore } from '../../src/store/auth-store'
import { useLanguageStore } from '../../src/store/language-store'
import { DesignTokens } from '../../src/constants/DesignTokens'
import i18n from '../../src/i18n'
import { Ionicons } from '@expo/vector-icons'

const registerSchema = z
  .object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterScreen() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const { language } = useLanguageStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    setError(null)

    try {
      const response = await authService.register({
        email: data.email,
        password: data.password,
        preferred_language: language,
      })

      if (response.success && response.data) {
        setUser({
          id: response.data.user.id,
          email: response.data.user.email,
          language: response.data.user.preferred_language,
          token: response.data.token,
        })
        router.replace('/(tabs)/home')
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="fitness" size={40} color={DesignTokens.colors.primary} />
              </View>
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>
                {i18n.t('register')}
              </Text>
              <Text style={styles.subtitle}>
                Start your evolution with personalized support
              </Text>
            </View>

            <GlassCard style={styles.formCard}>
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={DesignTokens.colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ModernInput
                    label={i18n.t('email')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="your@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ModernInput
                    label={i18n.t('password')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="••••••••"
                    secureTextEntry
                    error={errors.password?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ModernInput
                    label={i18n.t('confirm_password')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="••••••••"
                    secureTextEntry
                    error={errors.confirmPassword?.message}
                  />
                )}
              />

              <ModernButton
                title={i18n.t('register')}
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                disabled={loading}
                style={styles.button}
              />
            </GlassCard>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.linkText}>
                  {i18n.t('login')}
                </Text>
              </TouchableOpacity>
            </View>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: DesignTokens.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${DesignTokens.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${DesignTokens.colors.primary}30`,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: DesignTokens.colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: DesignTokens.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  formCard: {
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  button: {
    marginTop: 12,
  },
  footer: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: DesignTokens.colors.textSecondary,
    fontSize: 16,
  },
  linkText: {
    color: DesignTokens.colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${DesignTokens.colors.error}15`,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${DesignTokens.colors.error}30`,
  },
  errorText: {
    color: DesignTokens.colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
})

