import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { DailyMealPlan } from '../../types/meal-plan'
import { cn } from '../utils/cn'

interface DailyProgressCardProps {
  date: string
  mealPlan?: DailyMealPlan | null
  targetCalories?: number
  targetProtein?: number
  targetCarbs?: number
  targetFats?: number
  weight?: number
  onPress?: () => void
  className?: string
}

export function DailyProgressCard({
  date,
  mealPlan,
  targetCalories = 0,
  targetProtein = 0,
  targetCarbs = 0,
  targetFats = 0,
  weight,
  onPress,
  className,
}: DailyProgressCardProps) {
  const consumedCalories = mealPlan?.total_calories || 0
  const consumedProtein = mealPlan?.total_protein || 0
  const consumedCarbs = mealPlan?.total_carbs || 0
  const consumedFats = mealPlan?.total_fats || 0

  const caloriesProgress = targetCalories > 0 ? (consumedCalories / targetCalories) * 100 : 0
  const proteinProgress = targetProtein > 0 ? (consumedProtein / targetProtein) * 100 : 0
  const carbsProgress = targetCarbs > 0 ? (consumedCarbs / targetCarbs) * 100 : 0
  const fatsProgress = targetFats > 0 ? (consumedFats / targetFats) * 100 : 0

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 80) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const content = (
    <View
      className={cn(
        'bg-white rounded-xl p-4 shadow-sm border border-gray-200',
        className
      )}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-lg font-bold text-gray-900">{formatDate(date)}</Text>
          {weight && (
            <Text className="text-sm text-gray-500">Weight: {weight} kg</Text>
          )}
        </View>
        <View className="items-end">
          <Text className="text-2xl font-bold text-gray-900">
            {Math.round(consumedCalories)}
          </Text>
          <Text className="text-xs text-gray-500">/ {Math.round(targetCalories)} kcal</Text>
        </View>
      </View>

      {/* Calories Progress Bar */}
      <View className="mb-4">
        <View className="flex-row justify-between mb-1">
          <Text className="text-xs text-gray-600">Calories</Text>
          <Text className="text-xs font-semibold text-gray-900">
            {Math.round(caloriesProgress)}%
          </Text>
        </View>
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            className={`h-full ${getProgressColor(caloriesProgress)}`}
            style={{ width: `${Math.min(caloriesProgress, 100)}%` }}
          />
        </View>
      </View>

      {/* Macros */}
      <View className="flex-row gap-4">
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Protein</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {Math.round(consumedProtein)}g
          </Text>
          <Text className="text-xs text-gray-400">/ {Math.round(targetProtein)}g</Text>
          <View className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <View
              className={`h-full ${getProgressColor(proteinProgress)}`}
              style={{ width: `${Math.min(proteinProgress, 100)}%` }}
            />
          </View>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Carbs</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {Math.round(consumedCarbs)}g
          </Text>
          <Text className="text-xs text-gray-400">/ {Math.round(targetCarbs)}g</Text>
          <View className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <View
              className={`h-full ${getProgressColor(carbsProgress)}`}
              style={{ width: `${Math.min(carbsProgress, 100)}%` }}
            />
          </View>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Fats</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {Math.round(consumedFats)}g
          </Text>
          <Text className="text-xs text-gray-400">/ {Math.round(targetFats)}g</Text>
          <View className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <View
              className={`h-full ${getProgressColor(fatsProgress)}`}
              style={{ width: `${Math.min(fatsProgress, 100)}%` }}
            />
          </View>
        </View>
      </View>
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

