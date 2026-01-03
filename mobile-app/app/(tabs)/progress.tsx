import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../src/store/auth-store'
import { mealPlanService } from '../../src/services/meal-plan-service'
import { nutritionPlanService } from '../../src/services/nutrition-plan-service'
import { ProgressChart, LineChart, ChartDataPoint } from '../../src/components/progress/ProgressChart'
import { ProgressHistory } from '../../src/components/progress/ProgressHistory'
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner'
import { EmptyState } from '../../src/components/ui/EmptyState'
import i18n from '../../src/i18n'
import { useRouter } from 'expo-router'

export default function ProgressScreen() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  // Fetch nutrition plan for targets
  const { data: nutritionPlanData } = useQuery({
    queryKey: ['nutritionPlan'],
    queryFn: () => nutritionPlanService.get(),
    enabled: !!user,
  })

  // Calculate date range
  const dateRange = useMemo(() => {
    const endDate = new Date()
    const startDate = new Date()

    switch (selectedPeriod) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
    }

    return { startDate, endDate }
  }, [selectedPeriod])

  // Fetch meal plans for the period
  const { data: mealPlansData, isLoading, refetch } = useQuery({
    queryKey: ['mealPlans', 'progress', selectedPeriod],
    queryFn: async () => {
      const { startDate, endDate } = dateRange
      const plans = []

      // Fetch meal plans for each day in the range
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        try {
          const result = await mealPlanService.getDaily(dateStr)
          plans.push({ date: dateStr, mealPlan: result.data })
        } catch (error) {
          // If meal plan doesn't exist for this day, still include it
          plans.push({ date: dateStr, mealPlan: null })
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }

      return plans
    },
    enabled: !!user,
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  // Prepare chart data
  const caloriesChartData: ChartDataPoint[] = useMemo(() => {
    if (!mealPlansData || mealPlansData.length === 0) return []

    return mealPlansData
      .filter((p) => p.mealPlan)
      .map(({ date, mealPlan }) => {
        const dateObj = new Date(date)
        const label = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`
        return {
          label,
          value: mealPlan?.total_calories || 0,
          date,
        }
      })
      .slice(-14) // Last 14 days
  }, [mealPlansData])

  const macrosChartData = useMemo(() => {
    if (!mealPlansData || mealPlansData.length === 0) return null

    const last14Days = mealPlansData.filter((p) => p.mealPlan).slice(-14)

    return {
      protein: last14Days.map(({ date, mealPlan }) => {
        const dateObj = new Date(date)
        return {
          label: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
          value: mealPlan?.total_protein || 0,
          date,
        }
      }),
      carbs: last14Days.map(({ date, mealPlan }) => {
        const dateObj = new Date(date)
        return {
          label: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
          value: mealPlan?.total_carbs || 0,
          date,
        }
      }),
      fats: last14Days.map(({ date, mealPlan }) => {
        const dateObj = new Date(date)
        return {
          label: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
          value: mealPlan?.total_fats || 0,
          date,
        }
      }),
    }
  }, [mealPlansData])

  const targetCalories = nutritionPlanData?.data?.calories || 0
  const targetProtein = nutritionPlanData?.data?.protein || 0
  const targetCarbs = nutritionPlanData?.data?.carbs || 0
  const targetFats = nutritionPlanData?.data?.fats || 0

  // Calculate statistics
  const stats = useMemo(() => {
    if (!mealPlansData || mealPlansData.length === 0) {
      return {
        avgCalories: 0,
        avgProtein: 0,
        avgCarbs: 0,
        avgFats: 0,
        daysTracked: 0,
      }
    }

    const trackedDays = mealPlansData.filter((p) => p.mealPlan)
    const totalCalories = trackedDays.reduce((sum, p) => sum + (p.mealPlan?.total_calories || 0), 0)
    const totalProtein = trackedDays.reduce((sum, p) => sum + (p.mealPlan?.total_protein || 0), 0)
    const totalCarbs = trackedDays.reduce((sum, p) => sum + (p.mealPlan?.total_carbs || 0), 0)
    const totalFats = trackedDays.reduce((sum, p) => sum + (p.mealPlan?.total_fats || 0), 0)

    return {
      avgCalories: trackedDays.length > 0 ? totalCalories / trackedDays.length : 0,
      avgProtein: trackedDays.length > 0 ? totalProtein / trackedDays.length : 0,
      avgCarbs: trackedDays.length > 0 ? totalCarbs / trackedDays.length : 0,
      avgFats: trackedDays.length > 0 ? totalFats / trackedDays.length : 0,
      daysTracked: trackedDays.length,
    }
  }, [mealPlansData])

  if (isLoading && !mealPlansData) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <LoadingSpinner message={i18n.t('loading_progress')} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <Text className="text-2xl font-bold text-gray-900 mb-4">{i18n.t('tab_progress')}</Text>

          {/* Period selector */}
          <View className="flex-row gap-2">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg ${selectedPeriod === period ? 'bg-blue-600' : 'bg-white border border-gray-300'
                  }`}
              >
                <Text
                  className={`text-sm font-semibold ${selectedPeriod === period ? 'text-white' : 'text-gray-700'
                    }`}
                >
                  {period === '7d' ? i18n.t('seven_days') : period === '30d' ? i18n.t('thirty_days') : i18n.t('ninety_days')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Statistics Summary */}
        <View className="px-6 py-4 bg-white border-b border-gray-200">
          <Text className="text-lg font-semibold text-gray-900 mb-3">{i18n.t('statistics')}</Text>
          <View className="flex-row gap-4 mb-3">
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">{i18n.t('avg_calories')}</Text>
              <Text className="text-lg font-bold text-gray-900">
                {Math.round(stats.avgCalories)}
              </Text>
              <Text className="text-xs text-gray-400">/ {Math.round(targetCalories)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">{i18n.t('avg_protein')}</Text>
              <Text className="text-lg font-bold text-gray-900">
                {Math.round(stats.avgProtein)}g
              </Text>
              <Text className="text-xs text-gray-400">/ {Math.round(targetProtein)}g</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">{i18n.t('days_tracked')}</Text>
              <Text className="text-lg font-bold text-gray-900">{stats.daysTracked}</Text>
            </View>
          </View>
        </View>

        {/* Charts */}
        {caloriesChartData.length > 0 && (
          <View className="px-6 py-4">
            <LineChart
              title={i18n.t('calories_over_time')}
              data={caloriesChartData}
              unit=" kcal"
              color="#3B82F6"
              height={200}
            />
          </View>
        )}

        {macrosChartData && (
          <View className="px-6 py-4">
            <ProgressChart
              title={i18n.t('macros_last_14_days')}
              data={macrosChartData.protein}
              unit="g"
              color="#EF4444"
              height={150}
            />
          </View>
        )}

        {/* Progress History */}
        {mealPlansData && mealPlansData.length > 0 ? (
          <ProgressHistory
            mealPlans={mealPlansData}
            targetCalories={targetCalories}
            targetProtein={targetProtein}
            targetCarbs={targetCarbs}
            targetFats={targetFats}
            onDayPress={(date) => {
              // Navigate to meal plan for that day
              router.push(`/meal-plan/${date}`)
            }}
          />
        ) : (
          <View className="px-6 py-8">
            <EmptyState
              title={i18n.t('no_progress_data')}
              message={i18n.t('start_tracking_desc')}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
