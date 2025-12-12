import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { apiClient } from '../../src/services/api-client'
import { API_ENDPOINTS } from '../../src/config/api'
import { recommendationsService } from '../../src/services/recommendations-service'
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner'
import { EmptyState } from '../../src/components/ui/EmptyState'
import { Button } from '../../src/components/ui/Button'
import { Product } from '../../src/types/product'

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  // Fetch product details
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Product }>(
        `${API_ENDPOINTS.products}/${id}`
      )
      return response
    },
    enabled: !!id,
  })

  // Fetch compatibility check
  const { data: compatibilityData } = useQuery({
    queryKey: ['productCompatibility', id],
    queryFn: () => recommendationsService.checkCompatibility(id!),
    enabled: !!id,
  })

  // Fetch price comparison
  const { data: pricesData, isLoading: pricesLoading } = useQuery({
    queryKey: ['productPrices', id],
    queryFn: async () => {
      const response = await apiClient.get(`${API_ENDPOINTS.dosage.products}/${id}/prices`)
      return response
    },
    enabled: !!id,
  })

  const product = productData?.data
  const compatibility = compatibilityData?.data
  const prices = pricesData?.data

  if (productLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <LoadingSpinner message="Loading product details..." />
      </SafeAreaView>
    )
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <EmptyState title="Product not found" message="The product you're looking for doesn't exist" />
      </SafeAreaView>
    )
  }

  const productName = product.name || product.name_key
  const brandName = product.brand?.name || 'Unknown brand'

  const handleBuyPress = () => {
    router.push(`/shopping/${id}`)
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 flex-1">Product Details</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Product Info */}
        <View className="px-6 py-4">
          <Text className="text-2xl font-bold text-gray-900 mb-2">{productName}</Text>
          <Text className="text-base text-gray-600 mb-4">{brandName}</Text>

          {/* Type */}
          <View className="mb-6">
            <Text className="text-xs font-medium text-gray-400 uppercase mb-2">
              Type
            </Text>
            <Text className="text-base text-gray-900">
              {product.type.replace('_', ' ')}
            </Text>
          </View>

          {/* Compatibility */}
          {compatibility && (
            <View className={`mb-6 p-4 rounded-lg ${compatibility.compatible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name={compatibility.compatible ? 'checkmark-circle' : 'alert-circle'}
                  size={20}
                  color={compatibility.compatible ? '#10B981' : '#EF4444'}
                />
                <Text className={`ml-2 font-semibold ${compatibility.compatible ? 'text-green-800' : 'text-red-800'}`}>
                  {compatibility.compatible ? 'Compatible' : 'Not Recommended'}
                </Text>
              </View>
              {compatibility.warnings.length > 0 && (
                <View className="mt-2">
                  {compatibility.warnings.map((warning, index) => (
                    <Text key={index} className="text-sm text-gray-700 mt-1">
                      • {warning}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Macros */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Nutritional Info</Text>
            <View className="bg-gray-50 rounded-lg p-4">
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-600">Calories</Text>
                <Text className="font-semibold text-gray-900">{product.macros.calories}</Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-600">Protein</Text>
                <Text className="font-semibold text-gray-900">{product.macros.protein}g</Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-600">Carbohydrates</Text>
                <Text className="font-semibold text-gray-900">{product.macros.carbs}g</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Fats</Text>
                <Text className="font-semibold text-gray-900">{product.macros.fats}g</Text>
              </View>
              {product.serving_size && (
                <View className="mt-3 pt-3 border-t border-gray-200">
                  <Text className="text-sm text-gray-500">Serving Size: {product.serving_size}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Price Comparison */}
          {prices && prices.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Available in Stores</Text>
              <View className="space-y-3">
                {prices.slice(0, 5).map((price: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => price.store_url && Linking.openURL(price.store_url)}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-900">{price.store_name}</Text>
                        {price.package_name && (
                          <Text className="text-sm text-gray-500 mt-1">{price.package_name}</Text>
                        )}
                      </View>
                      <View className="items-end">
                        <Text className="text-lg font-bold text-gray-900">
                          {price.price} RSD
                        </Text>
                        {price.delivery_fee > 0 && (
                          <Text className="text-xs text-gray-500">+ {price.delivery_fee} RSD delivery</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Buy Button */}
          <Button
            title="View Shopping Options"
            onPress={handleBuyPress}
            variant="primary"
            className="mb-6"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

