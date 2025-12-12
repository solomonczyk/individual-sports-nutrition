import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { DailyMealPlanItem } from '../../types/meal-plan'
import { cn } from '../utils/cn'

interface MealCardProps {
  mealItem: DailyMealPlanItem
  onPress?: () => void
  className?: string
}

export function MealCard({ mealItem, onPress, className }: MealCardProps) {
  const meal = mealItem.meal
  const mealName = meal.name || meal.name_key
  const time = mealItem.scheduled_time || ''

  const getMealTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack',
    }
    return labels[type] || type
  }

  const getMealTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      breakfast: 'bg-yellow-100 text-yellow-800',
      lunch: 'bg-orange-100 text-orange-800',
      dinner: 'bg-purple-100 text-purple-800',
      snack: 'bg-green-100 text-green-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const content = (
    <View
      className={cn(
        'bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200',
        className
      )}
    >
      {/* Header */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={2}>
            {mealName}
          </Text>
          {time && (
            <Text className="text-sm text-gray-500">⏰ {time}</Text>
          )}
        </View>
        <View className={`px-3 py-1 rounded-full ${getMealTypeColor(mealItem.meal_type)}`}>
          <Text className="text-xs font-semibold">
            {getMealTypeLabel(mealItem.meal_type)}
          </Text>
        </View>
      </View>

      {/* Servings */}
      {mealItem.servings > 1 && (
        <View className="mb-3">
          <Text className="text-xs text-gray-500">
            {mealItem.servings} servings
          </Text>
        </View>
      )}

      {/* Macros */}
      <View className="flex-row gap-4">
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Calories</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {mealItem.calories || meal.total_macros.calories}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Protein</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {mealItem.protein || meal.total_macros.protein}g
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Carbs</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {mealItem.carbs || meal.total_macros.carbs}g
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Fats</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {mealItem.fats || meal.total_macros.fats}g
          </Text>
        </View>
      </View>

      {/* Cooking time */}
      {meal.cooking_time_minutes && (
        <View className="mt-3 pt-3 border-t border-gray-100">
          <Text className="text-xs text-gray-500">
            ⏱️ {meal.cooking_time_minutes} min
          </Text>
        </View>
      )}
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    )
  }

  return content
}

