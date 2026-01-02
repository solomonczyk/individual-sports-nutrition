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
import { DesignTokens } from '../../src/constants/DesignTokens'
import i18n from '../../src/i18n'
import { Ionicons } from '@expo/vector-icons'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginScreen() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError(null)

    try {
      const response = await authService.login(data)
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
      setError(err.response?.data?.error?.message || 'Login failed')
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
                <Ionicons name="flash" size={40} color={DesignTokens.colors.primary} />
              </View>
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>
                {i18n.t('login')}
              </Text>
              <Text style={styles.subtitle}>
                Welcome back! Elevate your performance
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

              <ModernButton
                title={i18n.t('login')}
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                disabled={loading}
                style={styles.button}
              />
            </GlassCard>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.linkText}>
                  {i18n.t('register')}
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

