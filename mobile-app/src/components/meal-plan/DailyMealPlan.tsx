import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { DailyMealPlan as DailyMealPlanType } from '../../types/meal-plan'
import { MealCard } from '../meal/MealCard'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { EmptyState } from '../ui/EmptyState'
import { cn } from '../utils/cn'

interface DailyMealPlanProps {
  mealPlan: DailyMealPlanType | null
  loading?: boolean
  onMealPress?: (mealId: string) => void
  className?: string
}

export function DailyMealPlan({
  mealPlan,
  loading,
  onMealPress,
  className,
}: DailyMealPlanProps) {
  if (loading) {
    return <LoadingSpinner message="Loading meal plan..." />
  }

  if (!mealPlan) {
    return (
      <EmptyState
        title="No meal plan"
        message="Generate a meal plan to see your daily meals"
      />
    )
  }

  // Sort meals by scheduled time
  const sortedMeals = [...mealPlan.meals].sort((a, b) => {
    if (!a.scheduled_time) return 1
    if (!b.scheduled_time) return -1
    return a.scheduled_time.localeCompare(b.scheduled_time)
  })

  // Group meals by type
  const mealsByType = {
    breakfast: sortedMeals.filter((m) => m.meal_type === 'breakfast'),
    lunch: sortedMeals.filter((m) => m.meal_type === 'lunch'),
    dinner: sortedMeals.filter((m) => m.meal_type === 'dinner'),
    snack: sortedMeals.filter((m) => m.meal_type === 'snack'),
  }

  const date = new Date(mealPlan.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const totalMacros = {
    calories: mealPlan.total_calories || 0,
    protein: mealPlan.total_protein || 0,
    carbs: mealPlan.total_carbs || 0,
    fats: mealPlan.total_fats || 0,
  }

  return (
    <View className={cn('flex-1', className)}>
      {/* Header */}
      <View className="px-6 py-4 bg-blue-50">
        <Text className="text-2xl font-bold text-gray-900 mb-1">
          Today's Meal Plan
        </Text>
        <Text className="text-gray-600">{date}</Text>
      </View>

      {/* Total Macros Summary */}
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-900 mb-3">
          Daily Totals
        </Text>
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">Calories</Text>
            <Text className="text-lg font-bold text-gray-900">
              {Math.round(totalMacros.calories)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">Protein</Text>
            <Text className="text-lg font-bold text-gray-900">
              {Math.round(totalMacros.protein)}g
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">Carbs</Text>
            <Text className="text-lg font-bold text-gray-900">
              {Math.round(totalMacros.carbs)}g
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">Fats</Text>
            <Text className="text-lg font-bold text-gray-900">
              {Math.round(totalMacros.fats)}g
            </Text>
          </View>
        </View>
      </View>

      {/* Meals */}
      <ScrollView className="flex-1 px-6 py-4">
        {/* Breakfast */}
        {mealsByType.breakfast.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-3">
              Breakfast
            </Text>
            {mealsByType.breakfast.map((mealItem) => (
              <MealCard
                key={mealItem.id}
                mealItem={mealItem}
                onPress={() => onMealPress?.(mealItem.meal_id)}
              />
            ))}
          </View>
        )}

        {/* Lunch */}
        {mealsByType.lunch.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-3">
              Lunch
            </Text>
            {mealsByType.lunch.map((mealItem) => (
              <MealCard
                key={mealItem.id}
                mealItem={mealItem}
                onPress={() => onMealPress?.(mealItem.meal_id)}
              />
            ))}
          </View>
        )}

        {/* Dinner */}
        {mealsByType.dinner.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-3">
              Dinner
            </Text>
            {mealsByType.dinner.map((mealItem) => (
              <MealCard
                key={mealItem.id}
                mealItem={mealItem}
                onPress={() => onMealPress?.(mealItem.meal_id)}
              />
            ))}
          </View>
        )}

        {/* Snacks */}
        {mealsByType.snack.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-3">
              Snacks
            </Text>
            {mealsByType.snack.map((mealItem) => (
              <MealCard
                key={mealItem.id}
                mealItem={mealItem}
                onPress={() => onMealPress?.(mealItem.meal_id)}
              />
            ))}
          </View>
        )}

        {/* Supplements */}
        {mealPlan.supplements.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-3">
              Supplements
            </Text>
            {mealPlan.supplements.map((supplement) => (
              <View
                key={supplement.id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200"
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {supplement.product?.name || 'Supplement'}
                    </Text>
                    {supplement.dosage_grams && (
                      <Text className="text-sm text-gray-600 mt-1">
                        {supplement.dosage_grams}g
                      </Text>
                    )}
                  </View>
                  {supplement.scheduled_time && (
                    <Text className="text-sm text-gray-500">
                      {supplement.scheduled_time}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

