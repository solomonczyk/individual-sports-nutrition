import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../src/store/auth-store'
import { useLanguageStore } from '../../src/store/language-store'
import { useQuery } from '@tanstack/react-query'
import { healthProfileService } from '../../src/services/health-profile-service'
import i18n from '../../src/i18n'

export default function SettingsScreen() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { language, setLanguage } = useLanguageStore()

  // Fetch health profile for display
  const { data: healthProfileData } = useQuery({
    queryKey: ['healthProfile'],
    queryFn: () => healthProfileService.get(),
    enabled: !!user,
  })

  const healthProfile = healthProfileData?.data

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout()
            router.replace('/(onboarding)/welcome')
          },
        },
      ]
    )
  }

  const languages: Array<{ code: string; name: string; nativeName: string }> = [
    { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
    { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
    { code: 'ro', name: 'Romanian', nativeName: 'Română' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'ua', name: 'Ukrainian', nativeName: 'Українська' },
  ]

  const getGoalLabel = (goal?: string) => {
    const goals: Record<string, string> = {
      mass: 'Mass Gain',
      cut: 'Weight Loss',
      maintain: 'Maintenance',
      endurance: 'Endurance',
    }
    return goal ? goals[goal] || goal : 'Not set'
  }

  const getActivityLabel = (activity?: string) => {
    const activities: Record<string, string> = {
      low: 'Low',
      moderate: 'Moderate',
      high: 'High',
      very_high: 'Very High',
    }
    return activity ? activities[activity] || activity : 'Not set'
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView className="flex-1">
        <View className="px-6 py-4">
          <Text className="text-3xl font-bold text-gray-900 mb-8">
            Settings
          </Text>

          {/* Profile Section */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Profile
            </Text>
            <View className="bg-gray-50 rounded-lg overflow-hidden">
              {/* Edit Health Profile */}
              <TouchableOpacity
                onPress={() => router.push('/health-profile/edit')}
                className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200"
              >
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    Health Profile
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {healthProfile
                      ? `${healthProfile.age} years, ${getGoalLabel(healthProfile.goal)}`
                      : 'Not set'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>

              {/* Current Goal */}
              {healthProfile && (
                <View className="px-4 py-3 border-b border-gray-200">
                  <Text className="text-sm text-gray-500 mb-1">Current Goal</Text>
                  <Text className="text-base font-semibold text-gray-900">
                    {getGoalLabel(healthProfile.goal)}
                  </Text>
                </View>
              )}

              {/* Activity Level */}
              {healthProfile && (
                <View className="px-4 py-3 border-b border-gray-200">
                  <Text className="text-sm text-gray-500 mb-1">Activity Level</Text>
                  <Text className="text-base font-semibold text-gray-900">
                    {getActivityLabel(healthProfile.activity_level)}
                  </Text>
                </View>
              )}

              {/* Weight & Height */}
              {healthProfile && (
                <View className="px-4 py-3">
                  <View className="flex-row justify-between">
                    <View className="flex-1">
                      <Text className="text-sm text-gray-500 mb-1">Weight</Text>
                      <Text className="text-base font-semibold text-gray-900">
                        {healthProfile.weight} kg
                      </Text>
                    </View>
                    <View className="flex-1 ml-4">
                      <Text className="text-sm text-gray-500 mb-1">Height</Text>
                      <Text className="text-base font-semibold text-gray-900">
                        {healthProfile.height} cm
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Preferences Section */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Preferences
            </Text>
            <View className="bg-gray-50 rounded-lg overflow-hidden">
              {/* Language Selection */}
              <View>
                <View className="px-4 py-3 border-b border-gray-200">
                  <Text className="text-base font-semibold text-gray-900 mb-3">
                    {i18n.t('language', { defaultValue: 'Language' })}
                  </Text>
                </View>
                {languages.map((lang, index) => (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => {
                      setLanguage(lang.code as any)
                      i18n.locale = lang.code
                    }}
                    className={`
                      flex-row items-center justify-between px-4 py-4
                      ${index < languages.length - 1 ? 'border-b border-gray-200' : ''}
                      ${language === lang.code ? 'bg-blue-50' : ''}
                    `}
                  >
                    <View>
                      <Text className="text-base font-semibold text-gray-900">
                        {lang.nativeName}
                      </Text>
                      <Text className="text-sm text-gray-500">{lang.name}</Text>
                    </View>
                    {language === lang.code && (
                      <Ionicons name="checkmark" size={24} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Notifications Section */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Notifications
            </Text>
            <View className="bg-gray-50 rounded-lg overflow-hidden">
              <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    Meal Reminders
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    Get reminded about meals
                  </Text>
                </View>
                <Switch
                  value={false} // TODO: Implement notifications settings
                  onValueChange={() => {
                    // TODO: Save notification preference
                  }}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    Supplement Reminders
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    Get reminded about supplements
                  </Text>
                </View>
                <Switch
                  value={false} // TODO: Implement notifications settings
                  onValueChange={() => {
                    // TODO: Save notification preference
                  }}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View className="flex-row items-center justify-between px-4 py-4">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    Progress Updates
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    Weekly progress summary
                  </Text>
                </View>
                <Switch
                  value={false} // TODO: Implement notifications settings
                  onValueChange={() => {
                    // TODO: Save notification preference
                  }}
                  trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>

          {/* Account Section */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Account
            </Text>
            <View className="bg-gray-50 rounded-lg p-4">
              <Text className="text-gray-600 mb-1">Email</Text>
              <Text className="text-base font-semibold text-gray-900">{user?.email}</Text>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex-row items-center justify-center mb-8"
          >
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            <Text className="text-red-600 font-semibold ml-2">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
