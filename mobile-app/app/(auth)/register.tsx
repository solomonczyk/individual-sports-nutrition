import React, { useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Link, useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../../src/components/ui/Button'
import { Input } from '../../src/components/ui/Input'
import { authService } from '../../src/services/auth-service'
import { useAuthStore } from '../../src/store/auth-store'
import { useLanguageStore } from '../../src/store/language-store'
import i18n from '../../src/i18n'

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
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" contentContainerClassName="flex-grow">
          <View className="flex-1 justify-center px-6 py-8">
            <View className="mb-8">
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                {i18n.t('register')}
              </Text>
              <Text className="text-gray-600">
                Create an account to get personalized recommendations
              </Text>
            </View>

            {error && (
              <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            )}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
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
                <Input
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
                <Input
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

            <Button
              title={i18n.t('register')}
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              disabled={loading}
              className="mt-4"
            />

            <View className="mt-6 flex-row justify-center">
              <Text className="text-gray-600">Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <Text className="text-blue-600 font-semibold">
                  {i18n.t('login')}
                </Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

