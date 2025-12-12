import React from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { ProductRecommendation, Dosage } from '../../types/recommendation'
import { ProductCard } from '../product/ProductCard'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { EmptyState } from '../ui/EmptyState'
import { cn } from '../utils/cn'

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
      return `${dosage.daily_servings} serving(s) per day`
    }
    if (dosage.daily_grams > 0) {
      return `${dosage.daily_grams}g per day`
    }
    return undefined
  }

  if (loading) {
    return <LoadingSpinner message="Loading recommendations..." />
  }

  if (recommendations.length === 0) {
    return (
      <EmptyState
        title="No recommendations"
        message="Complete your health profile to get personalized product recommendations"
      />
    )
  }

  return (
    <View className={cn('flex-1', className)}>
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Recommended Products
        </Text>
        <Text className="text-gray-600 mb-4">
          Personalized recommendations based on your goals
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

