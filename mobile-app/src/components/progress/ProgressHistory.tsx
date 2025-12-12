import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { DailyMealPlan } from '../../types/meal-plan'
import { DailyProgressCard } from './DailyProgressCard'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { EmptyState } from '../ui/EmptyState'
import { cn } from '../utils/cn'

interface MealPlanData {
  date: string
  mealPlan: DailyMealPlan | null
}

interface ProgressHistoryProps {
  mealPlans: MealPlanData[]
  targetCalories?: number
  targetProtein?: number
  targetCarbs?: number
  targetFats?: number
  loading?: boolean
  onDayPress?: (date: string) => void
  className?: string
}

export function ProgressHistory({
  mealPlans,
  targetCalories = 0,
  targetProtein = 0,
  targetCarbs = 0,
  targetFats = 0,
  loading,
  onDayPress,
  className,
}: ProgressHistoryProps) {
  if (loading) {
    return <LoadingSpinner message="Loading progress history..." />
  }

  if (mealPlans.length === 0) {
    return (
      <EmptyState
        title="No progress data"
        message="Start tracking your meals to see progress history"
      />
    )
  }

  return (
    <View className={cn('flex-1', className)}>
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Progress History
        </Text>
        <Text className="text-gray-600 mb-4">
          Track your daily nutrition progress
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {mealPlans.map(({ date, mealPlan }) => (
          <DailyProgressCard
            key={date}
            date={date}
            mealPlan={mealPlan}
            targetCalories={targetCalories}
            targetProtein={targetProtein}
            targetCarbs={targetCarbs}
            targetFats={targetFats}
            onPress={() => onDayPress?.(date)}
          />
        ))}
      </ScrollView>
    </View>
  )
}

