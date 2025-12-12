import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Meal } from '../../src/types/meal-plan'

// This is a placeholder - in real app, we'd fetch meal details from API
// For now, we'll just show a basic structure
export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  // TODO: Fetch meal details from API
  // const { data: mealData, isLoading } = useQuery({
  //   queryKey: ['meal', id],
  //   queryFn: () => mealService.getById(id!),
  //   enabled: !!id,
  // })

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 flex-1">Meal Details</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="px-6 py-4">
          <Text className="text-lg text-gray-600">
            Meal details will be available here. Meal ID: {id}
          </Text>
          {/* TODO: Add meal details display */}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

