import React from 'react'
import { View, ActivityIndicator, Text } from 'react-native'
import { cn } from '../utils/cn'

interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  message?: string
  className?: string
}

export function LoadingSpinner({ size = 'large', message, className }: LoadingSpinnerProps) {
  return (
    <View className={cn('flex-1 items-center justify-center p-6', className)}>
      <ActivityIndicator size={size} color="#3B82F6" />
      {message && (
        <Text className="mt-4 text-gray-600 text-base">{message}</Text>
      )}
    </View>
  )
}

