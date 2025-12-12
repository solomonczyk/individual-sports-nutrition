import React, { useState } from 'react'
import { View, Text, ScrollView, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../src/store/auth-store'
import { recommendationsService } from '../../src/services/recommendations-service'
import { mealPlanService } from '../../src/services/meal-plan-service'
import { nutritionPlanService } from '../../src/services/nutrition-plan-service'
import { RecommendationList } from '../../src/components/recommendation/RecommendationList'
import { DailyMealPlan } from '../../src/components/meal-plan/DailyMealPlan'
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner'
import { Button } from '../../src/components/ui/Button'
import i18n from '../../src/i18n'
import { useRouter } from 'expo-router'

export default function HomeScreen() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  // Fetch recommendations
  const {
    data: recommendationsData,
    isLoading: recommendationsLoading,
    refetch: refetchRecommendations,
  } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => recommendationsService.get({ maxProducts: 10 }),
    enabled: !!user,
  })

  // Fetch dosages
  const {
    data: dosagesData,
    isLoading: dosagesLoading,
  } = useQuery({
    queryKey: ['dosages'],
    queryFn: () => recommendationsService.getDosages(30),
    enabled: !!user && !!recommendationsData?.data,
  })

  // Fetch today's meal plan
  const {
    data: mealPlanData,
    isLoading: mealPlanLoading,
    refetch: refetchMealPlan,
  } = useQuery({
    queryKey: ['mealPlan', 'today'],
    queryFn: () => mealPlanService.getToday(),
    enabled: !!user,
  })

  // Fetch nutrition plan for summary
  const {
    data: nutritionPlanData,
    isLoading: nutritionPlanLoading,
  } = useQuery({
    queryKey: ['nutritionPlan'],
    queryFn: () => nutritionPlanService.get(),
    enabled: !!user,
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      refetchRecommendations(),
      refetchMealPlan(),
    ])
    setRefreshing(false)
  }

  const handleGenerateMealPlan = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      await mealPlanService.generate({ date: today })
      refetchMealPlan()
    } catch (error) {
      console.error('Error generating meal plan:', error)
    }
  }

  const isLoading = recommendationsLoading || mealPlanLoading || nutritionPlanLoading

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <Text className="text-2xl font-bold text-gray-900 mb-1">
            {i18n.t('welcome')}, {user?.email?.split('@')[0]}
          </Text>
          {nutritionPlanData?.data && (
            <Text className="text-gray-600">
              Daily goal: {Math.round(nutritionPlanData.data.calories)} kcal
            </Text>
          )}
        </View>

        {/* Nutrition Plan Summary */}
        {nutritionPlanData?.data && (
          <View className="px-6 py-4 bg-white border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Your Nutrition Plan
            </Text>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Protein</Text>
                <Text className="text-base font-bold text-gray-900">
                  {Math.round(nutritionPlanData.data.protein)}g
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Carbs</Text>
                <Text className="text-base font-bold text-gray-900">
                  {Math.round(nutritionPlanData.data.carbs)}g
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Fats</Text>
                <Text className="text-base font-bold text-gray-900">
                  {Math.round(nutritionPlanData.data.fats)}g
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Meal Plan Section */}
        <View className="mb-6">
          {mealPlanLoading ? (
            <LoadingSpinner message="Loading meal plan..." />
          ) : mealPlanData?.data ? (
            <DailyMealPlan
              mealPlan={mealPlanData.data}
              onMealPress={(mealId) => {
                router.push(`/meal/${mealId}`)
              }}
            />
          ) : (
            <View className="px-6 py-8">
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                No meal plan for today
              </Text>
              <Text className="text-gray-600 mb-4">
                Generate a personalized meal plan based on your goals
              </Text>
              <Button
                title="Generate Meal Plan"
                onPress={handleGenerateMealPlan}
                variant="primary"
              />
            </View>
          )}
        </View>

        {/* Recommendations Section */}
        <View className="mb-6">
          {recommendationsLoading || dosagesLoading ? (
            <LoadingSpinner message="Loading recommendations..." />
          ) : (
            <RecommendationList
              recommendations={recommendationsData?.data || []}
              dosages={dosagesData?.data.dosages}
              onProductPress={(productId) => {
                router.push(`/product/${productId}`)
              }}
              onBuyPress={(productId) => {
                router.push(`/shopping/${productId}`)
              }}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
