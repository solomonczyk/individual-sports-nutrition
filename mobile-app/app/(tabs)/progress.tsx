import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import i18n from '../../src/i18n'

export default function ProgressScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView className="flex-1">
        <View className="px-6 py-4">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Progress
          </Text>
          <Text className="text-gray-600 mb-8">
            Track your fitness and nutrition progress
          </Text>

          {/* Placeholder for progress charts */}
          <View className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Coming Soon
            </Text>
            <Text className="text-gray-600">
              Progress tracking and charts will be available here
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

