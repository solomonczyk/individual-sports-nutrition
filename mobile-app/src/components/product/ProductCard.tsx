import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Product } from '../../types/product'
import { Button } from '../ui/Button'
import { cn } from '../utils/cn'

interface ProductCardProps {
  product: Product
  score?: number
  dosage?: string
  onPress?: () => void
  onBuyPress?: () => void
  className?: string
}

export function ProductCard({ product, score, dosage, onPress, onBuyPress, className }: ProductCardProps) {
  const productName = product.name || product.name_key
  const brandName = product.brand?.name || 'Unknown brand'

  return (
    <TouchableOpacity
      onPress={onPress}
      className={cn(
        'bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200',
        className
      )}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={2}>
            {productName}
          </Text>
          <Text className="text-sm text-gray-500">{brandName}</Text>
        </View>
        {score !== undefined && (
          <View className="bg-blue-100 px-2 py-1 rounded">
            <Text className="text-xs font-semibold text-blue-700">{score}%</Text>
          </View>
        )}
      </View>

      {/* Type */}
      <View className="mb-3">
        <Text className="text-xs font-medium text-gray-400 uppercase">
          {product.type.replace('_', ' ')}
        </Text>
      </View>

      {/* Macros */}
      <View className="flex-row gap-4 mb-3">
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Protein</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {product.macros.protein}g
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Carbs</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {product.macros.carbs}g
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Fats</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {product.macros.fats}g
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">Calories</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {product.macros.calories}
          </Text>
        </View>
      </View>

      {/* Dosage */}
      {dosage && (
        <View className="bg-gray-50 rounded-lg p-2 mb-3">
          <Text className="text-xs text-gray-600">
            <Text className="font-semibold">Recommended:</Text> {dosage}
          </Text>
        </View>
      )}

      {/* Price */}
      {product.price && (
        <View className="mb-3">
          <Text className="text-base font-bold text-gray-900">
            {product.price} RSD
          </Text>
        </View>
      )}

      {/* Actions */}
      {onBuyPress && (
        <Button
          title="Buy"
          onPress={onBuyPress}
          variant="primary"
          className="mt-2"
        />
      )}
    </TouchableOpacity>
  )
}

