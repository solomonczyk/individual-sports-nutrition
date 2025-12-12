import React from 'react'
import { View, Text } from 'react-native'
import { cn } from '../utils/cn'

interface EmptyStateProps {
  title: string
  message?: string
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({ title, message, icon, className }: EmptyStateProps) {
  return (
    <View className={cn('flex-1 items-center justify-center p-8', className)}>
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="text-xl font-bold text-gray-900 mb-2 text-center">{title}</Text>
      {message && (
        <Text className="text-gray-600 text-base text-center">{message}</Text>
      )}
    </View>
  )
}

