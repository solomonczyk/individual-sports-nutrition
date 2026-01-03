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
      i18n.t('logout'),
      i18n.t('logout_confirm'),
      [
        { text: i18n.t('cancel'), style: 'cancel' },
        {
          text: i18n.t('logout'),
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
      mass: i18n.t('mass_gain'),
      cut: i18n.t('weight_loss'),
      maintain: i18n.t('maintenance'),
      endurance: i18n.t('endurance'),
    }
    return goal ? goals[goal] || goal : i18n.t('not_set')
  }

  const getActivityLabel = (activity?: string) => {
    const activities: Record<string, string> = {
      low: i18n.t('low'),
      moderate: i18n.t('moderate'),
      high: i18n.t('high'),
      very_high: i18n.t('very_high'),
    }
    return activity ? activities[activity] || activity : i18n.t('not_set')
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView className="flex-1">
        <View className="px-6 py-4">
          <Text className="text-3xl font-bold text-gray-900 mb-8">
            {i18n.t('tab_settings')}
          </Text>

          {/* Profile Section */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              {i18n.t('tab_profile')}
            </Text>
            <View className="bg-gray-50 rounded-lg overflow-hidden">
              {/* Edit Health Profile */}
              <TouchableOpacity
                onPress={() => router.push('/health-profile/edit')}
                className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200"
              >
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    {i18n.t('health_profile')}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {healthProfile
                      ? `${healthProfile.age} ${i18n.t('years')}, ${getGoalLabel(healthProfile.goal)}`
                      : i18n.t('not_set')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>

              {/* Current Goal */}
              {healthProfile && (
                <View className="px-4 py-3 border-b border-gray-200">
                  <Text className="text-sm text-gray-500 mb-1">{i18n.t('current_goal')}</Text>
                  <Text className="text-base font-semibold text-gray-900">
                    {getGoalLabel(healthProfile.goal)}
                  </Text>
                </View>
              )}

              {/* Activity Level */}
              {healthProfile && (
                <View className="px-4 py-3 border-b border-gray-200">
                  <Text className="text-sm text-gray-500 mb-1">{i18n.t('activity_level')}</Text>
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
                      <Text className="text-sm text-gray-500 mb-1">{i18n.t('weight')}</Text>
                      <Text className="text-base font-semibold text-gray-900">
                        {healthProfile.weight} kg
                      </Text>
                    </View>
                    <View className="flex-1 ml-4">
                      <Text className="text-sm text-gray-500 mb-1">{i18n.t('height')}</Text>
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
              {i18n.t('preferences')}
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
              {i18n.t('notifications')}
            </Text>
            <View className="bg-gray-50 rounded-lg overflow-hidden">
              <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    {i18n.t('meal_reminders')}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {i18n.t('meal_reminders_desc')}
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
                    {i18n.t('supplement_reminders')}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {i18n.t('supplement_reminders_desc')}
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
                    {i18n.t('progress_updates')}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {i18n.t('progress_updates_desc')}
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
              {i18n.t('account')}
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
            <Text className="text-red-600 font-semibold ml-2">{i18n.t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
