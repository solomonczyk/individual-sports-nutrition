import React from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../src/store/auth-store'
import { useLanguageStore } from '../../src/store/language-store'
import i18n from '../../src/i18n'

export default function SettingsScreen() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { language, setLanguage } = useLanguageStore()

  const handleLogout = () => {
    logout()
    router.replace('/(onboarding)/welcome')
  }

  const languages: Array<{ code: string; name: string; nativeName: string }> = [
    { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
    { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
    { code: 'ro', name: 'Romanian', nativeName: 'Română' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'ua', name: 'Ukrainian', nativeName: 'Українська' },
  ]

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView className="flex-1">
        <View className="px-6 py-4">
          <Text className="text-3xl font-bold text-gray-900 mb-8">
            Settings
          </Text>

          {/* Language Selection */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              {i18n.t('language', { defaultValue: 'Language' })}
            </Text>
            <View className="bg-gray-50 rounded-lg">
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => {
                    setLanguage(lang.code as any)
                    i18n.locale = lang.code
                  }}
                  className={`
                    flex-row items-center justify-between px-4 py-4 border-b border-gray-200
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

          {/* Account Info */}
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
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex-row items-center justify-center"
          >
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            <Text className="text-red-600 font-semibold ml-2">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

