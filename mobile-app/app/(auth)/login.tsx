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
import i18n from '../../src/i18n'

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
                {i18n.t('login')}
              </Text>
              <Text className="text-gray-600">
                Welcome back! Please sign in to continue
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

            <Button
              title={i18n.t('login')}
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              disabled={loading}
              className="mt-4"
            />

            <View className="mt-6 flex-row justify-center">
              <Text className="text-gray-600">Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <Text className="text-blue-600 font-semibold">
                  {i18n.t('register')}
                </Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

