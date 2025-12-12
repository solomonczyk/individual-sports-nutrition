import React from 'react'
import { View, Text } from 'react-native'
import { cn } from '../utils/cn'

export interface ChartDataPoint {
  label: string
  value: number
  date?: string
}

interface ProgressChartProps {
  title: string
  data: ChartDataPoint[]
  unit?: string
  color?: string
  height?: number
  className?: string
}

export function ProgressChart({
  title,
  data,
  unit = '',
  color = '#3B82F6',
  height = 200,
  className,
}: ProgressChartProps) {
  if (!data || data.length === 0) {
    return (
      <View className={cn('bg-white rounded-xl p-4 shadow-sm border border-gray-200', className)}>
        <Text className="text-lg font-semibold text-gray-900 mb-4">{title}</Text>
        <View className="h-48 items-center justify-center">
          <Text className="text-gray-500">No data available</Text>
        </View>
      </View>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value))
  const minValue = Math.min(...data.map((d) => d.value))
  const range = maxValue - minValue || 1

  // Calculate bar positions
  const chartData = data.map((point, index) => {
    const normalizedValue = (point.value - minValue) / range
    return {
      ...point,
      height: normalizedValue * (height - 60), // Leave space for labels
      x: (index * 100) / data.length,
    }
  })

  return (
    <View className={cn('bg-white rounded-xl p-4 shadow-sm border border-gray-200', className)}>
      <Text className="text-lg font-semibold text-gray-900 mb-4">{title}</Text>
      
      <View className="relative" style={{ height: height }}>
        {/* Y-axis labels */}
        <View className="absolute left-0 top-0 bottom-10 justify-between">
          <Text className="text-xs text-gray-500">{maxValue.toFixed(1)}{unit}</Text>
          <Text className="text-xs text-gray-500">{(maxValue + minValue) / 2}{unit}</Text>
          <Text className="text-xs text-gray-500">{minValue.toFixed(1)}{unit}</Text>
        </View>

        {/* Chart area */}
        <View className="ml-12 mr-2 flex-1 flex-row items-end justify-between">
          {chartData.map((point, index) => (
            <View key={index} className="flex-1 items-center justify-end mx-0.5">
              <View
                style={{
                  width: '90%',
                  height: point.height,
                  backgroundColor: color,
                  borderRadius: 4,
                  opacity: 0.8,
                }}
              />
            </View>
          ))}
        </View>

        {/* X-axis labels */}
        <View className="ml-12 mr-2 mt-2 flex-row justify-between">
          {data.map((point, index) => (
            <Text
              key={index}
              className="text-xs text-gray-500"
              style={{ flex: 1, textAlign: 'center' }}
              numberOfLines={1}
            >
              {point.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  )
}

// Line chart component
interface LineChartProps {
  title: string
  data: ChartDataPoint[]
  unit?: string
  color?: string
  height?: number
  className?: string
}

export function LineChart({
  title,
  data,
  unit = '',
  color = '#3B82F6',
  height = 200,
  className,
}: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <View className={cn('bg-white rounded-xl p-4 shadow-sm border border-gray-200', className)}>
        <Text className="text-lg font-semibold text-gray-900 mb-4">{title}</Text>
        <View className="h-48 items-center justify-center">
          <Text className="text-gray-500">No data available</Text>
        </View>
      </View>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value))
  const minValue = Math.min(...data.map((d) => d.value))
  const range = maxValue - minValue || 1

  // Calculate point positions
  const points = data.map((point, index) => {
    const normalizedValue = (point.value - minValue) / range
    return {
      x: (index * (100 - 10)) / (data.length - 1 || 1) + 5, // 5% margin on sides
      y: 100 - normalizedValue * 80, // 80% of height for chart, 10% top/bottom
      value: point.value,
      label: point.label,
    }
  })

  // Create path for line
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}%`).join(' ')

  return (
    <View className={cn('bg-white rounded-xl p-4 shadow-sm border border-gray-200', className)}>
      <Text className="text-lg font-semibold text-gray-900 mb-4">{title}</Text>
      
      <View className="relative" style={{ height: height }}>
        {/* Y-axis labels */}
        <View className="absolute left-0 top-0 bottom-10 justify-between">
          <Text className="text-xs text-gray-500">{maxValue.toFixed(1)}{unit}</Text>
          <Text className="text-xs text-gray-500">{(maxValue + minValue) / 2}{unit}</Text>
          <Text className="text-xs text-gray-500">{minValue.toFixed(1)}{unit}</Text>
        </View>

        {/* Chart area with grid lines */}
        <View className="ml-12 mr-2 flex-1">
          {/* Grid lines */}
          <View className="absolute inset-0 justify-between">
            {[0, 0.5, 1].map((ratio) => (
              <View
                key={ratio}
                className="border-t border-gray-100"
                style={{ marginTop: ratio === 1 ? 0 : undefined }}
              />
            ))}
          </View>

          {/* Line chart using View components */}
          <View className="absolute inset-4">
            {points.map((point, index) => {
              if (index === 0) return null
              const prevPoint = points[index - 1]
              
              // Calculate line between points
              const deltaX = point.x - prevPoint.x
              const deltaY = point.y - prevPoint.y
              const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
              const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
              
              return (
                <View
                  key={index}
                  className="absolute"
                  style={{
                    left: `${prevPoint.x}%`,
                    top: `${prevPoint.y}%`,
                    width: `${distance}%`,
                    height: 2,
                    backgroundColor: color,
                    transform: [{ rotate: `${angle}deg` }],
                    transformOrigin: 'left center',
                  }}
                />
              )
            })}
            
            {/* Data points */}
            {points.map((point, index) => (
              <View
                key={index}
                className="absolute rounded-full"
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  width: 8,
                  height: 8,
                  backgroundColor: color,
                  marginLeft: -4,
                  marginTop: -4,
                }}
              />
            ))}
          </View>
        </View>

        {/* X-axis labels */}
        <View className="ml-12 mr-2 mt-2 flex-row justify-between">
          {data.map((point, index) => (
            <Text
              key={index}
              className="text-xs text-gray-500"
              style={{ flex: 1, textAlign: 'center' }}
              numberOfLines={1}
            >
              {point.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  )
}

