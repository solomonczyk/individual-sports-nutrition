import React from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Link, useRouter } from 'expo-router'
import { useLanguageStore } from '../../src/store/language-store'
import { Language } from '../../src/i18n'
import { Button } from '../../src/components/ui/Button'
import i18n from '../../src/i18n'

const languages: Array<{ code: Language; name: string; nativeName: string }> = [
  { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ua', name: 'Ukrainian', nativeName: 'Українська' },
]

export default function LanguageScreen() {
  const { language, setLanguage } = useLanguageStore()
  const router = useRouter()

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang)
    i18n.locale = lang
  }

  const handleNext = () => {
    router.push('/(onboarding)/intro')
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView className="flex-1 px-6">
        <View className="py-8">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {i18n.t('select_language')}
          </Text>
          <Text className="text-gray-600 mb-8">
            Одаберите језик / Select your language
          </Text>

          <View className="space-y-3">
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleLanguageSelect(lang.code)}
                className={`
                  border-2 rounded-lg p-4 flex-row items-center justify-between
                  ${language === lang.code ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}
                `}
              >
                <View>
                  <Text className="text-lg font-semibold text-gray-900">
                    {lang.nativeName}
                  </Text>
                  <Text className="text-sm text-gray-500">{lang.name}</Text>
                </View>
                {language === lang.code && (
                  <View className="w-6 h-6 bg-blue-600 rounded-full items-center justify-center">
                    <Text className="text-white text-xs">✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="px-6 pb-8 pt-4 border-t border-gray-200">
        <Button title={i18n.t('next')} onPress={handleNext} />
      </View>
    </SafeAreaView>
  )
}

