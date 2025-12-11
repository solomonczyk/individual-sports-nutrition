import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useAuthStore } from '../../src/store/auth-store'
import i18n from '../../src/i18n'

export default function HomeScreen() {
  const { user } = useAuthStore()

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView className="flex-1">
        <View className="px-6 py-4">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {i18n.t('welcome')}, {user?.email?.split('@')[0]}
          </Text>
          <Text className="text-gray-600 mb-8">
            Your personalized nutrition plan
          </Text>

          {/* Placeholder for nutrition plan */}
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Today's Plan
            </Text>
            <Text className="text-gray-600">
              Complete your health profile to get personalized recommendations
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

