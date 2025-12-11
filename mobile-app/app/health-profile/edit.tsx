import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Picker } from '@react-native-picker/picker'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../src/components/ui/Button'
import { Input } from '../../src/components/ui/Input'
import { healthProfileService } from '../../src/services/health-profile-service'
import i18n from '../../src/i18n'

const healthProfileSchema = z.object({
  age: z.number().min(12, 'Age must be at least 12').max(100, 'Age must be less than 100'),
  gender: z.enum(['male', 'female', 'other']),
  weight: z.number().min(30, 'Weight must be at least 30kg').max(300, 'Weight must be less than 300kg'),
  height: z.number().min(100, 'Height must be at least 100cm').max(250, 'Height must be less than 250cm'),
  activity_level: z.enum(['low', 'moderate', 'high', 'very_high']),
  goal: z.enum(['mass', 'cut', 'maintain', 'endurance']),
})

type HealthProfileForm = z.infer<typeof healthProfileSchema>

export default function EditHealthProfileScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: profileData } = useQuery({
    queryKey: ['healthProfile'],
    queryFn: () => healthProfileService.get(),
  })

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HealthProfileForm>({
    resolver: zodResolver(healthProfileSchema),
  })

  useEffect(() => {
    if (profileData?.data) {
      reset({
        age: profileData.data.age,
        gender: profileData.data.gender,
        weight: profileData.data.weight,
        height: profileData.data.height,
        activity_level: profileData.data.activity_level,
        goal: profileData.data.goal,
      })
    }
  }, [profileData, reset])

  const onSubmit = async (data: HealthProfileForm) => {
    setLoading(true)
    setError(null)

    try {
      await healthProfileService.update(data)
      router.back()
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!profileData?.data) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text>Loading...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" contentContainerClassName="px-6 py-8">
          <View className="mb-6">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Edit Health Profile
            </Text>
            <Text className="text-gray-600">
              Update your health information
            </Text>
          </View>

          {error && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="age"
            render={({ field: { onChange, value } }) => (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Age</Text>
                <Input
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(parseInt(text) || 0)}
                  placeholder="25"
                  keyboardType="numeric"
                  error={errors.age?.message}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Gender</Text>
                <View className="border border-gray-300 rounded-lg">
                  <Picker selectedValue={value} onValueChange={onChange}>
                    <Picker.Item label="Male" value="male" />
                    <Picker.Item label="Female" value="female" />
                    <Picker.Item label="Other" value="other" />
                  </Picker>
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="weight"
            render={({ field: { onChange, value } }) => (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Weight (kg)</Text>
                <Input
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(parseFloat(text) || 0)}
                  placeholder="70"
                  keyboardType="numeric"
                  error={errors.weight?.message}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="height"
            render={({ field: { onChange, value } }) => (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Height (cm)</Text>
                <Input
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(parseFloat(text) || 0)}
                  placeholder="175"
                  keyboardType="numeric"
                  error={errors.height?.message}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="activity_level"
            render={({ field: { onChange, value } }) => (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Activity Level</Text>
                <View className="border border-gray-300 rounded-lg">
                  <Picker selectedValue={value} onValueChange={onChange}>
                    <Picker.Item label="Low (sedentary)" value="low" />
                    <Picker.Item label="Moderate (light exercise)" value="moderate" />
                    <Picker.Item label="High (regular exercise)" value="high" />
                    <Picker.Item label="Very High (intensive training)" value="very_high" />
                  </Picker>
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="goal"
            render={({ field: { onChange, value } }) => (
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">Goal</Text>
                <View className="border border-gray-300 rounded-lg">
                  <Picker selectedValue={value} onValueChange={onChange}>
                    <Picker.Item label="Gain Mass" value="mass" />
                    <Picker.Item label="Cut Weight" value="cut" />
                    <Picker.Item label="Maintain" value="maintain" />
                    <Picker.Item label="Endurance" value="endurance" />
                  </Picker>
                </View>
              </View>
            )}
          />

          <Button
            title="Save Changes"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

