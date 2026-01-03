import React, { useState } from 'react'
import { View, Text, ScrollView, RefreshControl, StyleSheet, Platform, TouchableOpacity } from 'react-native'
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
import { ModernButton } from '../../src/components/ui/ModernButton'
import { DesignTokens } from '../../src/constants/DesignTokens'
import { GlassCard } from '../../src/components/ui/GlassCard'
import i18n from '../../src/i18n'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

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
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DesignTokens.colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>
              {i18n.t('welcome')},
            </Text>
            <Text style={styles.userNameText}>
              {user?.email?.split('@')[0]}
            </Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={DesignTokens.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Nutrition Plan Summary - Bento Style */}
        {nutritionPlanData?.data && (
          <View style={styles.bentoContainer}>
            <GlassCard style={styles.mainBento}>
              <Text style={styles.bentoLabel}>{i18n.t('daily_target')}</Text>
              <Text style={styles.bentoMainValue}>
                {Math.round(nutritionPlanData.data.calories)}
                <Text style={styles.bentoUnit}> kcal</Text>
              </Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '65%' }]} />
              </View>
            </GlassCard>

            <View style={styles.bentoRow}>
              <GlassCard style={styles.smallBento}>
                <Text style={styles.bentoLabel}>{i18n.t('protein')}</Text>
                <Text style={styles.bentoValue}>{Math.round(nutritionPlanData.data.protein)}g</Text>
              </GlassCard>
              <GlassCard style={styles.smallBento}>
                <Text style={styles.bentoLabel}>{i18n.t('carbs')}</Text>
                <Text style={styles.bentoValue}>{Math.round(nutritionPlanData.data.carbs)}g</Text>
              </GlassCard>
              <GlassCard style={styles.smallBento}>
                <Text style={styles.bentoLabel}>{i18n.t('fats')}</Text>
                <Text style={styles.bentoValue}>{Math.round(nutritionPlanData.data.fats)}g</Text>
              </GlassCard>
            </View>
          </View>
        )}

        {/* Meal Plan Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{i18n.t('todays_fuel')}</Text>
            <TouchableOpacity onPress={() => router.push('/meal')}>
              <Text style={styles.seeAllText}>{i18n.t('see_plan')}</Text>
            </TouchableOpacity>
          </View>

          {mealPlanLoading ? (
            <LoadingSpinner message={i18n.t('optimizing_meals')} />
          ) : mealPlanData?.data ? (
            <DailyMealPlan
              mealPlan={mealPlanData.data}
              onMealPress={(mealId) => {
                router.push(`/meal/${mealId}`)
              }}
            />
          ) : (
            <GlassCard style={styles.emptyPlanCard}>
              <Ionicons name="restaurant-outline" size={40} color={DesignTokens.colors.textTertiary} />
              <Text style={styles.emptyPlanTitle}>{i18n.t('no_active_plan')}</Text>
              <Text style={styles.emptyPlanDesc}>{i18n.t('no_active_plan_desc')}</Text>
              <ModernButton
                title={i18n.t('generate_evolution_plan')}
                onPress={handleGenerateMealPlan}
                style={styles.generateButton}
              />
            </GlassCard>
          )}
        </View>

        {/* Recommendations Section */}
        <View style={[styles.section, { marginBottom: 120 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{i18n.t('performance_stack')}</Text>
          </View>
          {recommendationsLoading || dosagesLoading ? (
            <LoadingSpinner message={i18n.t('analyzing_data')} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingTop: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.md,
  },
  welcomeText: {
    fontSize: 16,
    color: DesignTokens.colors.textSecondary,
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 28,
    fontWeight: '900',
    color: DesignTokens.colors.textPrimary,
    letterSpacing: -0.5,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DesignTokens.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DesignTokens.colors.glassBorder,
  },
  bentoContainer: {
    paddingHorizontal: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.xl,
  },
  mainBento: {
    padding: DesignTokens.spacing.lg,
    backgroundColor: `${DesignTokens.colors.primary}10`,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
  },
  smallBento: {
    flex: 1,
    padding: DesignTokens.spacing.md,
    alignItems: 'center',
  },
  bentoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: DesignTokens.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  bentoMainValue: {
    fontSize: 36,
    fontWeight: '900',
    color: DesignTokens.colors.textPrimary,
  },
  bentoUnit: {
    fontSize: 14,
    color: DesignTokens.colors.textTertiary,
  },
  bentoValue: {
    fontSize: 18,
    fontWeight: '800',
    color: DesignTokens.colors.textPrimary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: DesignTokens.colors.surfaceElevated,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: DesignTokens.colors.primary,
    borderRadius: 3,
  },
  section: {
    paddingHorizontal: DesignTokens.spacing.lg,
    marginTop: DesignTokens.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: DesignTokens.colors.textPrimary,
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 14,
    color: DesignTokens.colors.primary,
    fontWeight: '600',
  },
  emptyPlanCard: {
    alignItems: 'center',
    padding: DesignTokens.spacing.xl,
    gap: 8,
  },
  emptyPlanTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DesignTokens.colors.textPrimary,
    marginTop: 8,
  },
  emptyPlanDesc: {
    fontSize: 14,
    color: DesignTokens.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  generateButton: {
    width: '100%',
  }
})
