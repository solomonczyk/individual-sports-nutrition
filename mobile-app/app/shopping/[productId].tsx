import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, Linking, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { apiClient } from '../../src/services/api-client'
import { API_ENDPOINTS } from '../../src/config/api'
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner'
import { EmptyState } from '../../src/components/ui/EmptyState'

interface ShoppingOption {
  store_id: string
  store_name: string
  store_url?: string
  total_price: number
  delivery_fee: number
  total_with_delivery: number
  products: Array<{
    product_id: string
    product_name: string
    package_id: string
    package_name: string
    quantity: number
    unit_price: number
    total_price: number
  }>
}

interface ShoppingOptionsResponse {
  options: ShoppingOption[]
  duration_days: number
  requirements: Array<{
    product_id: string
    product_name: string
    daily_grams: number
    duration_days: number
    frequency_per_week: number
  }>
}

export default function ShoppingOptionsScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  // Fetch shopping options
  const { data: shoppingData, isLoading, refetch } = useQuery({
    queryKey: ['shoppingOptions', productId],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: ShoppingOptionsResponse }>(
        `${API_ENDPOINTS.dosage.shoppingOptions}?duration_days=30`
      )
      return response
    },
    enabled: !!productId,
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <LoadingSpinner message="Loading shopping options..." />
      </SafeAreaView>
    )
  }

  const options = shoppingData?.data?.options || []

  if (options.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <EmptyState
          title="No shopping options"
          message="Shopping options for this product are not available at the moment"
        />
      </SafeAreaView>
    )
  }

  // Sort by total price (cheapest first)
  const sortedOptions = [...options].sort(
    (a, b) => a.total_with_delivery - b.total_with_delivery
  )

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 flex-1">Shopping Options</Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-6 py-4">
          <Text className="text-gray-600 mb-4">
            Best shopping options for 30 days supply
          </Text>

          {/* Shopping Options */}
          <View className="space-y-4">
            {sortedOptions.map((option, index) => (
              <View
                key={option.store_id}
                className={`bg-white rounded-xl p-4 border-2 ${
                  index === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
              >
                {index === 0 && (
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="trophy" size={20} color="#10B981" />
                    <Text className="ml-2 font-semibold text-green-700">Best Price</Text>
                  </View>
                )}

                {/* Store Info */}
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900">
                      {option.store_name}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-2xl font-bold text-gray-900">
                      {option.total_with_delivery} RSD
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {option.total_price} RSD + {option.delivery_fee} RSD delivery
                    </Text>
                  </View>
                </View>

                {/* Products in this option */}
                {option.products.length > 0 && (
                  <View className="mb-3 pt-3 border-t border-gray-200">
                    {option.products.map((product, pIndex) => (
                      <View key={pIndex} className="mb-2">
                        <Text className="text-sm font-semibold text-gray-900">
                          {product.product_name}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {product.package_name} × {product.quantity} = {product.total_price} RSD
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Buy Button */}
                {option.store_url && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(option.store_url!)}
                    className={`mt-3 py-3 rounded-lg flex-row items-center justify-center ${
                      index === 0 ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                  >
                    <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
                    <Text className="text-white font-semibold ml-2">Buy from {option.store_name}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

