import React from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { ProductRecommendation, Dosage } from '../../types/recommendation'
import { ProductCard } from '../product/ProductCard'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { EmptyState } from '../ui/EmptyState'
import { cn } from '../utils/cn'
import i18n from '../../i18n'

interface RecommendationListProps {
  recommendations: ProductRecommendation[]
  dosages?: Dosage[]
  loading?: boolean
  onProductPress?: (productId: string) => void
  onBuyPress?: (productId: string) => void
  className?: string
}

export function RecommendationList({
  recommendations,
  dosages,
  loading,
  onProductPress,
  onBuyPress,
  className,
}: RecommendationListProps) {
  const getDosageForProduct = (productId: string): string | undefined => {
    const dosage = dosages?.find((d) => d.product_id === productId)
    if (!dosage) return undefined

    if (dosage.daily_servings > 0) {
      return `${dosage.daily_servings} ${i18n.t('servings_per_day')}`
    }
    if (dosage.daily_grams > 0) {
      return `${dosage.daily_grams}${i18n.t('grams_per_day')}`
    }
    return undefined
  }

  if (loading) {
    return <LoadingSpinner message={i18n.t('loading_recommendations')} />
  }

  if (recommendations.length === 0) {
    return (
      <EmptyState
        title={i18n.t('no_recommendations')}
        message={i18n.t('complete_profile_desc')}
      />
    )
  }

  return (
    <View className={cn('flex-1', className)}>
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          {i18n.t('recommended_products')}
        </Text>
        <Text className="text-gray-600 mb-4">
          {i18n.t('recommendations_goal_desc')}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {recommendations.map((recommendation) => (
          <ProductCard
            key={recommendation.product.id}
            product={recommendation.product}
            score={Math.round(recommendation.score)}
            dosage={getDosageForProduct(recommendation.product.id)}
            onPress={() => onProductPress?.(recommendation.product.id)}
            onBuyPress={() => onBuyPress?.(recommendation.product.id)}
          />
        ))}
      </ScrollView>
    </View>
  )
}

